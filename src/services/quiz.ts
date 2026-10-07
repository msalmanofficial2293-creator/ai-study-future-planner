import "server-only";

import { isSkillLevel, type SkillLevel } from "@/features/onboarding/options";
import { decodeQuizTitle, encodeQuizTitle } from "@/features/quiz/record";
import type {
  MockQuiz,
  QuizDashboard,
  QuizDifficulty,
  QuizHistoryItem,
  QuizPageData,
  QuizPlay,
  QuizResult,
  QuizReviewItem,
  QuizSummary,
} from "@/features/quiz/types";
import { decodeMilestoneDescription } from "@/features/roadmap/record";
import { currentStage, todayIso } from "@/features/study-plan/schedule";
import { decodeTaskDetails } from "@/features/study-plan/record";
import type { StudyTaskStatus } from "@/features/study-plan/types";
import { profileIsComplete } from "@/services/onboarding-status";
import { createQuizGenerator } from "@/services/quiz-generator";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

const TOPIC_LIMIT = 3;
const PLACEHOLDER_SKILL = "Skill details are not available.";

export type QuizMutation =
  | { ok: true; attemptId?: string }
  | {
      ok: false;
      reason: "unauthenticated" | "missing-roadmap" | "missing-plan" | "missing-quiz" | "invalid" | "failed";
    };

export async function loadQuizPage(attemptId: string | null): Promise<QuizPageData> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  if (attemptId) {
    return loadAttempt(user.id, attemptId);
  }

  return loadDashboard(user.id);
}

export async function preparePracticeQuizzes(userId: string): Promise<QuizMutation> {
  const context = await loadQuizContext(userId);

  if (!context.ok) {
    if (context.reason === "incomplete") {
      return { ok: false, reason: "failed" };
    }

    return { ok: false, reason: context.reason };
  }

  const existing = await loadPlanQuizzes(userId, context.planId);

  if (!existing.ok) {
    return { ok: false, reason: "failed" };
  }

  const covered = new Set(existing.quizzes.map((quiz) => quiz.skill));
  const pending = context.skills.filter((skill) => !covered.has(skill));

  if (pending.length === 0) {
    return { ok: true };
  }

  const generator = createQuizGenerator();

  for (const skill of pending) {
    const draft = generator.generate({
      skill,
      field: context.field,
      goal: context.goalTitle,
      difficulty: difficultyFor(context.skillLevel),
    });
    const saved = await insertQuiz(userId, context.planId, context.taskIdBySkill.get(skill) ?? null, draft);

    if (!saved) {
      return { ok: false, reason: "failed" };
    }
  }

  return { ok: true };
}

export async function startQuizAttempt(userId: string, quizId: string): Promise<QuizMutation> {
  const supabase = await createSupabaseServerClient();
  const quizResult = await supabase
    .from("quizzes")
    .select("id, status")
    .eq("user_id", userId)
    .eq("id", quizId)
    .maybeSingle();

  if (quizResult.error) {
    logQuizDiagnostic("load-quiz", quizResult.error);
    return { ok: false, reason: "failed" };
  }

  const quiz = asRecord(quizResult.data);

  if (readString(quiz, "status") !== "ready") {
    return { ok: false, reason: "missing-quiz" };
  }

  const openResult = await supabase
    .from("quiz_attempts")
    .select("id")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openResult.error) {
    logQuizDiagnostic("load-open-attempt", openResult.error);
    return { ok: false, reason: "failed" };
  }

  const openId = readString(asRecord(openResult.data), "id");

  if (openId) {
    return { ok: true, attemptId: openId };
  }

  const inserted = await supabase
    .from("quiz_attempts")
    .insert({ user_id: userId, quiz_id: quizId })
    .select("id")
    .single();

  if (inserted.error || !inserted.data) {
    logQuizDiagnostic("insert-attempt", inserted.error);
    return { ok: false, reason: "failed" };
  }

  const attemptId = readString(asRecord(inserted.data), "id");

  if (!attemptId) {
    return { ok: false, reason: "failed" };
  }

  return { ok: true, attemptId };
}

export async function submitQuizAttempt(
  userId: string,
  attemptId: string,
  selections: Map<string, number>,
): Promise<QuizMutation> {
  const supabase = await createSupabaseServerClient();
  const attemptResult = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, status")
    .eq("user_id", userId)
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptResult.error) {
    logQuizDiagnostic("load-submit-attempt", attemptResult.error);
    return { ok: false, reason: "failed" };
  }

  const attempt = asRecord(attemptResult.data);
  const quizId = readString(attempt, "quiz_id");
  const status = readString(attempt, "status");

  if (!quizId) {
    return { ok: false, reason: "missing-quiz" };
  }

  if (status === "submitted") {
    return { ok: true, attemptId };
  }

  if (status !== "in_progress") {
    return { ok: false, reason: "invalid" };
  }

  const questions = await loadQuestionRows(userId, quizId);

  if (!questions) {
    return { ok: false, reason: "failed" };
  }

  if (questions.length === 0 || selections.size !== questions.length) {
    return { ok: false, reason: "invalid" };
  }

  const answers = questions.map((question) => {
    const selected = selections.get(question.id);
    return {
      questionId: question.id,
      selectedIndex: selected ?? -1,
      correct: selected === question.correctIndex,
    };
  });

  if (answers.some((answer) => answer.selectedIndex < 0)) {
    return { ok: false, reason: "invalid" };
  }

  const inserted = await supabase.from("quiz_answers").insert(
    answers.map((answer) => ({
      user_id: userId,
      attempt_id: attemptId,
      question_id: answer.questionId,
      selected_index: answer.selectedIndex,
      is_correct: answer.correct,
    })),
  );

  if (inserted.error) {
    logQuizDiagnostic("insert-answers", inserted.error);
    return { ok: false, reason: "failed" };
  }

  const correctCount = answers.filter((answer) => answer.correct).length;
  const percentage = roundScore((correctCount / questions.length) * 100);
  const submitted = await supabase
    .from("quiz_attempts")
    .update({
      status: "submitted",
      score: percentage,
      submitted_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", attemptId)
    .eq("status", "in_progress");

  if (submitted.error) {
    logQuizDiagnostic("submit-attempt", submitted.error);
    return { ok: false, reason: "failed" };
  }

  await recordPerformance(userId, quizId, percentage);
  return { ok: true, attemptId };
}

async function loadDashboard(userId: string): Promise<QuizPageData> {
  const context = await loadQuizContext(userId);

  if (!context.ok && context.reason === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  if (!context.ok && context.reason === "incomplete") {
    return { status: "incomplete" };
  }

  if (!context.ok && context.reason === "failed") {
    return { status: "unavailable" };
  }

  if (!context.ok && context.reason === "missing-roadmap") {
    return { status: "no-roadmap" };
  }

  if (!context.ok) {
    return { status: "no-plan" };
  }

  const quizzes = await loadPlanQuizzes(userId, context.planId);

  if (!quizzes.ok) {
    return { status: "unavailable" };
  }

  const history = await loadHistory(userId, quizzes.quizzes);

  if (!history) {
    return { status: "unavailable" };
  }

  const covered = new Set(quizzes.quizzes.map((quiz) => quiz.skill));
  const dashboard: QuizDashboard = {
    roadmapTitle: context.roadmapTitle,
    quizzes: quizzes.quizzes,
    history,
    canPrepare: context.skills.some((skill) => !covered.has(skill)),
  };

  return { status: "ready", dashboard };
}

async function loadAttempt(userId: string, attemptId: string): Promise<QuizPageData> {
  const supabase = await createSupabaseServerClient();
  const attemptResult = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, status, score")
    .eq("user_id", userId)
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptResult.error) {
    logQuizDiagnostic("load-attempt", attemptResult.error);
    return { status: "unavailable" };
  }

  const attempt = asRecord(attemptResult.data);
  const quizId = readString(attempt, "quiz_id");
  const status = readString(attempt, "status");

  if (!quizId || (status !== "in_progress" && status !== "submitted")) {
    return { status: "missing-attempt" };
  }

  const quizResult = await supabase
    .from("quizzes")
    .select("title")
    .eq("user_id", userId)
    .eq("id", quizId)
    .maybeSingle();

  if (quizResult.error) {
    logQuizDiagnostic("load-attempt-quiz", quizResult.error);
    return { status: "unavailable" };
  }

  const stored = decodeQuizTitle(readString(asRecord(quizResult.data), "title"));
  const questions = await loadQuestionRows(userId, quizId);

  if (!questions) {
    return { status: "unavailable" };
  }

  if (status === "in_progress") {
    const quiz: QuizPlay = {
      attemptId,
      title: stored.title,
      skill: stored.skill,
      difficulty: stored.difficulty,
      questions: questions.map((question) => ({
        id: question.id,
        position: question.position,
        prompt: question.prompt,
        choices: question.choices,
      })),
    };
    return { status: "playing", quiz };
  }

  const answerResult = await supabase
    .from("quiz_answers")
    .select("question_id, selected_index, is_correct")
    .eq("user_id", userId)
    .eq("attempt_id", attemptId);

  if (answerResult.error) {
    logQuizDiagnostic("load-answers", answerResult.error);
    return { status: "unavailable" };
  }

  const answers = new Map(
    (answerResult.data ?? []).flatMap((row) => {
      const record = asRecord(row);
      const questionId = readString(record, "question_id");
      const selectedIndex = readNumber(record, "selected_index");

      if (!questionId || selectedIndex === null) {
        return [];
      }

      return [[questionId, { selectedIndex, correct: record?.is_correct === true }] as const];
    }),
  );
  const review: QuizReviewItem[] = [];

  for (const question of questions) {
    const answer = answers.get(question.id);

    if (!answer) {
      return { status: "unavailable" };
    }

    review.push({
      position: question.position,
      prompt: question.prompt,
      choices: question.choices,
      selectedIndex: answer.selectedIndex,
      correctIndex: question.correctIndex,
      correct: answer.correct,
      explanation: question.explanation,
    });
  }

  const correctCount = review.filter((item) => item.correct).length;
  const result: QuizResult = {
    attemptId,
    title: stored.title,
    skill: stored.skill,
    difficulty: stored.difficulty,
    correctCount,
    incorrectCount: review.length - correctCount,
    total: review.length,
    percentage: readScore(attempt?.score) ?? roundScore(review.length === 0 ? 0 : (correctCount / review.length) * 100),
    review,
  };

  return { status: "result", result };
}

type QuestionRow = {
  id: string;
  position: number;
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

async function loadQuestionRows(userId: string, quizId: string): Promise<QuestionRow[] | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("quiz_questions")
    .select("id, position, prompt, choices, correct_index, explanation")
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  if (result.error) {
    logQuizDiagnostic("load-questions", result.error);
    return null;
  }

  return (result.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const position = readNumber(record, "position");
    const prompt = readString(record, "prompt");
    const choices = readChoices(record?.choices);
    const correctIndex = readNumber(record, "correct_index");

    if (!id || position === null || !prompt || !choices || correctIndex === null || correctIndex >= choices.length) {
      return [];
    }

    return [
      {
        id,
        position,
        prompt,
        choices,
        correctIndex,
        explanation: readString(record, "explanation"),
      },
    ];
  });
}

type PlanQuizzes = {
  ok: true;
  quizzes: QuizSummary[];
};

async function loadPlanQuizzes(userId: string, planId: string): Promise<PlanQuizzes | { ok: false }> {
  const supabase = await createSupabaseServerClient();
  const quizResult = await supabase
    .from("quizzes")
    .select("id, title, status, created_at")
    .eq("user_id", userId)
    .eq("study_plan_id", planId)
    .eq("status", "ready")
    .order("created_at", { ascending: true });

  if (quizResult.error) {
    logQuizDiagnostic("load-quizzes", quizResult.error);
    return { ok: false };
  }

  const questionResult = await supabase
    .from("quiz_questions")
    .select("quiz_id")
    .eq("user_id", userId);

  if (questionResult.error) {
    logQuizDiagnostic("count-questions", questionResult.error);
    return { ok: false };
  }

  const counts = new Map<string, number>();

  for (const row of questionResult.data ?? []) {
    const quizId = readString(asRecord(row), "quiz_id");

    if (quizId) {
      counts.set(quizId, (counts.get(quizId) ?? 0) + 1);
    }
  }

  const attemptResult = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, started_at")
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false });

  if (attemptResult.error) {
    logQuizDiagnostic("load-open-attempts", attemptResult.error);
    return { ok: false };
  }

  const openAttempts = new Map<string, string>();

  for (const row of attemptResult.data ?? []) {
    const record = asRecord(row);
    const quizId = readString(record, "quiz_id");
    const id = readString(record, "id");

    if (quizId && id && !openAttempts.has(quizId)) {
      openAttempts.set(quizId, id);
    }
  }

  const quizzes = (quizResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");

    if (!id) {
      return [];
    }

    const stored = decodeQuizTitle(readString(record, "title"));
    return [
      {
        id,
        title: stored.title,
        skill: stored.skill,
        difficulty: stored.difficulty,
        questionCount: counts.get(id) ?? 0,
        continueAttemptId: openAttempts.get(id) ?? null,
      },
    ];
  });

  return { ok: true, quizzes };
}

async function loadHistory(userId: string, quizzes: QuizSummary[]): Promise<QuizHistoryItem[] | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("quiz_attempts")
    .select("id, quiz_id, score, submitted_at")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .order("submitted_at", { ascending: false });

  if (result.error) {
    logQuizDiagnostic("load-history", result.error);
    return null;
  }

  const titles = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

  return (result.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const attemptId = readString(record, "id");
    const quizId = readString(record, "quiz_id");
    const submittedAt = readString(record, "submitted_at");
    const percentage = readScore(record?.score);
    const quiz = quizId ? titles.get(quizId) : undefined;

    if (!attemptId || !submittedAt || percentage === null || !quiz) {
      return [];
    }

    return [
      {
        attemptId,
        quizTitle: quiz.title,
        skill: quiz.skill,
        percentage,
        submittedAt,
      },
    ];
  });
}

type QuizContext = {
  ok: true;
  planId: string;
  roadmapTitle: string;
  goalId: string;
  goalTitle: string;
  field: string;
  skillLevel: SkillLevel;
  skills: string[];
  taskIdBySkill: Map<string, string>;
};

type QuizContextFailure = {
  ok: false;
  reason: "unauthenticated" | "incomplete" | "missing-roadmap" | "missing-plan" | "failed";
};

async function loadQuizContext(userId: string): Promise<QuizContext | QuizContextFailure> {
  const supabase = await createSupabaseServerClient();
  const profileResult = await supabase
    .from("profiles")
    .select("field_of_study, skill_level, onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (profileResult.error) {
    logQuizDiagnostic("load-profile", profileResult.error);
    return { ok: false, reason: "failed" };
  }

  if (!profileIsComplete(profileResult.data)) {
    return { ok: false, reason: "incomplete" };
  }

  const goalResult = await supabase
    .from("goals")
    .select("id, title")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (goalResult.error) {
    logQuizDiagnostic("load-goal", goalResult.error);
    return { ok: false, reason: "failed" };
  }

  const goal = asRecord(goalResult.data);
  const goalId = readString(goal, "id");
  const goalTitle = readString(goal, "title");

  if (!goalId || !goalTitle) {
    return { ok: false, reason: "missing-roadmap" };
  }

  const roadmapResult = await supabase
    .from("roadmaps")
    .select("id, title")
    .eq("user_id", userId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (roadmapResult.error) {
    logQuizDiagnostic("load-roadmap", roadmapResult.error);
    return { ok: false, reason: "failed" };
  }

  const roadmap = asRecord(roadmapResult.data);
  const roadmapId = readString(roadmap, "id");

  if (!roadmapId) {
    return { ok: false, reason: "missing-roadmap" };
  }

  const milestoneResult = await supabase
    .from("roadmap_milestones")
    .select("id, position, title, description")
    .eq("user_id", userId)
    .eq("roadmap_id", roadmapId)
    .order("position", { ascending: true });

  if (milestoneResult.error) {
    logQuizDiagnostic("load-milestones", milestoneResult.error);
    return { ok: false, reason: "failed" };
  }

  const stages = (milestoneResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const title = readString(record, "title");
    const position = readNumber(record, "position");

    if (!id || !title || position === null) {
      return [];
    }

    return [
      {
        id,
        title,
        position,
        skills: decodeMilestoneDescription(readString(record, "description")).skills,
      },
    ];
  });

  const planResult = await supabase
    .from("study_plans")
    .select("id")
    .eq("user_id", userId)
    .eq("roadmap_id", roadmapId)
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planResult.error) {
    logQuizDiagnostic("load-plan", planResult.error);
    return { ok: false, reason: "failed" };
  }

  const planId = readString(asRecord(planResult.data), "id");

  if (!planId) {
    return { ok: false, reason: "missing-plan" };
  }

  const taskResult = await supabase
    .from("study_tasks")
    .select("id, milestone_id, status, details")
    .eq("user_id", userId)
    .eq("study_plan_id", planId);

  if (taskResult.error) {
    logQuizDiagnostic("load-tasks", taskResult.error);
    return { ok: false, reason: "failed" };
  }

  const tasks = (taskResult.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const status = readString(record, "status");

    if (!id || !isTaskStatus(status)) {
      return [];
    }

    return [
      {
        id,
        milestoneId: readString(record, "milestone_id"),
        status,
        skill: decodeTaskDetails(readString(record, "details")).skill,
      },
    ];
  });
  const stage = currentStage(
    stages,
    tasks.map((task) => ({ milestoneId: task.milestoneId, status: task.status })),
  );
  const stageSkills = stages.find((item) => item.id === stage?.id)?.skills ?? [];
  const profile = asRecord(profileResult.data);
  const skillCode = readString(profile, "skill_level");
  const skills = collectSkills(stageSkills, tasks.map((task) => task.skill), readString(profile, "field_of_study"), goalTitle);
  const taskIdBySkill = new Map<string, string>();

  for (const task of tasks) {
    if (task.skill && !taskIdBySkill.has(task.skill)) {
      taskIdBySkill.set(task.skill, task.id);
    }
  }

  return {
    ok: true,
    planId,
    roadmapTitle: readString(roadmap, "title") || "Your roadmap",
    goalId,
    goalTitle,
    field: readString(profile, "field_of_study") || "your field",
    skillLevel: isSkillLevel(skillCode) ? skillCode : "intermediate",
    skills,
    taskIdBySkill,
  };
}

async function insertQuiz(
  userId: string,
  planId: string,
  taskId: string | null,
  draft: MockQuiz,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const inserted = await supabase
    .from("quizzes")
    .insert({
      user_id: userId,
      study_plan_id: planId,
      study_task_id: taskId,
      title: encodeQuizTitle({
        title: draft.title,
        skill: draft.skill,
        difficulty: draft.difficulty,
      }),
      status: "ready",
    })
    .select("id")
    .single();

  if (inserted.error || !inserted.data) {
    logQuizDiagnostic("insert-quiz", inserted.error);
    return false;
  }

  const quizId = readString(asRecord(inserted.data), "id");

  if (!quizId) {
    return false;
  }

  const questions = await supabase.from("quiz_questions").insert(
    draft.questions.map((question, index) => ({
      user_id: userId,
      quiz_id: quizId,
      position: index + 1,
      prompt: question.prompt,
      choices: question.choices,
      correct_index: question.correctIndex,
      explanation: question.explanation,
    })),
  );

  if (questions.error) {
    logQuizDiagnostic("insert-questions", questions.error);
    await supabase.from("quizzes").delete().eq("user_id", userId).eq("id", quizId);
    return false;
  }

  return true;
}

async function recordPerformance(userId: string, quizId: string, percentage: number): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const quizResult = await supabase
    .from("quizzes")
    .select("study_plan_id, title")
    .eq("user_id", userId)
    .eq("id", quizId)
    .maybeSingle();

  if (quizResult.error) {
    logQuizDiagnostic("performance-quiz", quizResult.error);
    return;
  }

  const quiz = asRecord(quizResult.data);
  const planId = readString(quiz, "study_plan_id");
  const stored = decodeQuizTitle(readString(quiz, "title"));

  if (!planId) {
    return;
  }

  const planResult = await supabase
    .from("study_plans")
    .select("roadmap_id")
    .eq("user_id", userId)
    .eq("id", planId)
    .maybeSingle();

  if (planResult.error) {
    logQuizDiagnostic("performance-plan", planResult.error);
    return;
  }

  const roadmapId = readString(asRecord(planResult.data), "roadmap_id");

  if (!roadmapId) {
    return;
  }

  const roadmapResult = await supabase
    .from("roadmaps")
    .select("goal_id")
    .eq("user_id", userId)
    .eq("id", roadmapId)
    .maybeSingle();

  if (roadmapResult.error) {
    logQuizDiagnostic("performance-roadmap", roadmapResult.error);
    return;
  }

  const goalId = readString(asRecord(roadmapResult.data), "goal_id");

  if (!goalId) {
    return;
  }

  const taskResult = await supabase
    .from("study_tasks")
    .select("status")
    .eq("user_id", userId)
    .eq("study_plan_id", planId);

  if (taskResult.error) {
    logQuizDiagnostic("performance-tasks", taskResult.error);
    return;
  }

  const statuses = (taskResult.data ?? []).flatMap((row) => {
    const status = readString(asRecord(row), "status");
    return status ? [status] : [];
  });
  const tasksTotal = statuses.length;
  const tasksCompleted = statuses.filter((status) => status === "completed").length;
  const scoreResult = await supabase
    .from("quiz_attempts")
    .select("score")
    .eq("user_id", userId)
    .eq("status", "submitted");

  if (scoreResult.error) {
    logQuizDiagnostic("performance-scores", scoreResult.error);
    return;
  }

  const scores = (scoreResult.data ?? []).flatMap((row) => {
    const score = readScore(asRecord(row)?.score);
    return score === null ? [] : [score];
  });
  const average = scores.length === 0 ? percentage : roundScore(scores.reduce((total, score) => total + score, 0) / scores.length);
  const saved = await supabase.from("performance_records").insert({
    user_id: userId,
    goal_id: goalId,
    study_plan_id: planId,
    recorded_on: todayIso(),
    tasks_completed: tasksCompleted,
    tasks_total: tasksTotal,
    quizzes_taken: scores.length,
    average_score: average,
    summary: `Scored ${formatStoredPercent(percentage)} on "${stored.title}".`,
    consistency_note: consistencyNote(percentage),
  });

  if (saved.error) {
    logQuizDiagnostic("insert-performance", saved.error);
  }
}

function collectSkills(stageSkills: string[], taskSkills: string[], field: string, goal: string): string[] {
  const skills: string[] = [];

  for (const skill of [...stageSkills, ...taskSkills]) {
    const cleaned = skill.trim();

    if (!cleaned || cleaned === PLACEHOLDER_SKILL || cleaned === "General" || skills.includes(cleaned)) {
      continue;
    }

    skills.push(cleaned);

    if (skills.length === TOPIC_LIMIT) {
      return skills;
    }
  }

  if (skills.length === 0) {
    skills.push(field.trim() || goal.trim() || "Your current study");
  }

  return skills;
}

function isTaskStatus(value: string): value is StudyTaskStatus {
  return value === "pending" || value === "completed";
}

function difficultyFor(level: SkillLevel): QuizDifficulty {
  if (level === "beginner") {
    return "Foundation";
  }

  if (level === "advanced") {
    return "Challenge";
  }

  return "Practice";
}

function consistencyNote(percentage: number): string {
  if (percentage >= 80) {
    return "This sitting was steady.";
  }

  if (percentage >= 50) {
    return "Review the missed items before the next sitting.";
  }

  return "Repeat this skill before adding a new topic.";
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatStoredPercent(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function readChoices(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 2) {
    return null;
  }

  const choices: string[] = [];

  for (const item of value) {
    if (typeof item !== "string" || item.trim().length === 0) {
      return null;
    }

    choices.push(item);
  }

  return choices;
}

function readScore(value: unknown): number | null {
  const score = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return null;
  }

  return score;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown> | null, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function readNumber(record: Record<string, unknown> | null, key: string): number | null {
  const value = record?.[key];
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isInteger(number) ? number : null;
}

function logQuizDiagnostic(step: string, error: { message: string; code?: string } | null) {
  if (process.env.NODE_ENV === "production" || !error) {
    return;
  }

  console.error(`[quiz:${step}] ${error.code ?? "none"}: ${error.message}`);
}

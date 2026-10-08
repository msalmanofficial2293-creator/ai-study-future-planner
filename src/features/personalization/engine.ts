import type { LearningStyle, SkillLevel, WeeklyStudyTime } from "@/features/onboarding/options";
import type {
  DifficultyRecommendation,
  PersonalizedRecommendation,
  PersonalizedSkillArea,
  PersonalizationActionTask,
  PersonalizationProfile,
  PersonalizationResult,
  ScoreBand,
  TaskTypeRecommendation,
} from "@/features/personalization/types";

/** Match Adaptive Study Plan bands so scoring stays consistent. */
export const SCORE_HIGH_PERCENT = 80;
export const SCORE_MEDIUM_PERCENT = 50;
const TASK_MINUTES = 45;
const PLACEHOLDER_SKILL = "Skill details are not available.";

type MilestoneInput = {
  id: string;
  title: string;
  position: number;
  skills: string[];
};

type TaskInput = {
  title: string;
  skill: string;
  status: string;
  scheduledOn: string;
  durationMinutes: number;
};

type SkillInput = {
  skill: string;
  correct: number;
  total: number;
};

type DecisionMap = Map<string, "applied" | "dismissed">;

export function buildPersonalization(input: {
  today: string;
  profile: PersonalizationProfile;
  planTitle: string;
  roadmapTitle: string;
  stageTitle: string | null;
  milestones: MilestoneInput[];
  tasks: TaskInput[];
  skills: SkillInput[];
  decisions: DecisionMap;
}): PersonalizationResult {
  const areas = scoreAreas(input.skills);
  const strongAreas = areas.filter((area) => area.band === "high");
  const weakAreas = areas.filter((area) => area.band !== "high");
  const orderedSkills = orderedRoadmapSkills(input.milestones);
  const scored = new Map(areas.map((area) => [area.skill, area.band]));
  const pending = input.tasks.filter((task) => task.status === "pending");
  const completed = input.tasks.filter((task) => task.status === "completed");
  const todayPending = pending.filter((task) => task.scheduledOn <= input.today);
  const overdue = pending.filter((task) => task.scheduledOn < input.today);
  const weekMinutes = pending
    .concat(completed)
    .filter((task) => task.scheduledOn >= weekStart(input.today) && task.scheduledOn <= weekEnd(input.today))
    .reduce((sum, task) => sum + task.durationMinutes, 0);
  const dominantBand = dominantScoreBand(areas);
  const recommendedDifficulty = difficultyFor(dominantBand, input.profile.skillLevel);
  const recommendedTaskType = taskTypeFor(dominantBand, weakAreas, strongAreas, todayPending);
  const learningApproach = approachFor(input.profile.learningStyle);
  const currentFocus =
    weakAreas[0]?.skill ??
    todayPending[0]?.skill ??
    input.stageTitle ??
    input.profile.field ??
    "Your saved study plan";
  const nextSkill = strongAreas[0]
    ? nextRoadmapSkill(strongAreas[0].skill, orderedSkills, scored)
    : orderedSkills.find((skill) => !scored.has(skill)) ?? null;
  const recommendedPriority = priorityLine(dominantBand, weakAreas, nextSkill, todayPending);
  const recommendedNextStep = nextStepLine({
    band: dominantBand,
    weak: weakAreas[0] ?? null,
    nextSkill,
    todayTask: todayPending[0] ?? null,
    learningApproach,
  });
  const revisionFrequency = revisionLine(dominantBand, overdue.length);
  const careerAlignment = careerLine(input.profile, currentFocus);
  const statusSummary = statusLine({
    tasksCompleted: completed.length,
    tasksTotal: input.tasks.length,
    quizzes: areas.length,
    stageTitle: input.stageTitle,
    weekMinutes,
    weeklyStudyTime: input.profile.weeklyStudyTime,
  });
  const reasoning = buildReasoning({
    areas,
    weakAreas,
    strongAreas,
    dominantBand,
    recommendedDifficulty,
    learningApproach,
    careerAlignment,
    overdueCount: overdue.length,
    weekMinutes,
    weeklyStudyTime: input.profile.weeklyStudyTime,
    todayPending,
  });
  const recommendations = buildRecommendations({
    today: input.today,
    areas,
    weakAreas,
    strongAreas,
    orderedSkills,
    scored,
    milestones: input.milestones,
    tasks: input.tasks,
    todayPending,
    overdueCount: overdue.length,
    weekMinutes,
    weeklyStudyTime: input.profile.weeklyStudyTime,
    recommendedDifficulty,
    learningApproach,
    decisions: input.decisions,
  });

  return {
    currentFocus,
    strongAreas,
    weakAreas,
    recommendedPriority,
    recommendedDifficulty,
    recommendedLearningApproach: learningApproach,
    recommendedNextStep,
    careerAlignment,
    revisionFrequency,
    recommendedTaskType,
    quizDifficultyHint: recommendedDifficulty,
    statusSummary,
    reasoning,
    recommendations,
  };
}

function buildRecommendations(input: {
  today: string;
  areas: PersonalizedSkillArea[];
  weakAreas: PersonalizedSkillArea[];
  strongAreas: PersonalizedSkillArea[];
  orderedSkills: string[];
  scored: Map<string, ScoreBand>;
  milestones: MilestoneInput[];
  tasks: TaskInput[];
  todayPending: TaskInput[];
  overdueCount: number;
  weekMinutes: number;
  weeklyStudyTime: WeeklyStudyTime | null;
  recommendedDifficulty: DifficultyRecommendation;
  learningApproach: string;
  decisions: DecisionMap;
}): PersonalizedRecommendation[] {
  const items: PersonalizedRecommendation[] = [];
  const seen = new Set<string>();

  for (const area of input.weakAreas) {
    if (area.band === "low") {
      const revision = makeTask({
        kind: "Revise",
        skill: area.skill,
        description: `Quiz score ${area.percent}% is low. Review explanations, then try an easier practice pass.`,
        today: input.today,
        milestones: input.milestones,
        existing: input.tasks,
      });
      addRecommendation(items, seen, input.decisions, {
        fingerprint: `revision:${slug(area.skill)}`,
        kind: "revision",
        title: `Revise ${area.skill}`,
        summary: "Prioritize revision before harder work.",
        reasoning: `Your quiz performance in ${area.skill} is ${area.percent}% (${area.correct} of ${area.total} correct), below ${SCORE_MEDIUM_PERCENT}%. Revision and easier practice are recommended before raising difficulty.`,
        skill: area.skill,
        difficulty: "beginner",
        alreadyOnPlan: revision.alreadyOnPlan,
        task: revision.task,
      });
      addRecommendation(items, seen, input.decisions, {
        fingerprint: `quiz-easy:${slug(area.skill)}`,
        kind: "quiz",
        title: `Easier quiz practice for ${area.skill}`,
        summary: "Use beginner quiz difficulty on this weak topic.",
        reasoning: `Saved answers for ${area.skill} are below ${SCORE_MEDIUM_PERCENT}%. Recommended quiz difficulty stays at beginner until this skill improves.`,
        skill: area.skill,
        difficulty: "beginner",
        alreadyOnPlan: false,
        task: null,
      });
      continue;
    }

    const practice = makeTask({
      kind: "Practice",
      skill: area.skill,
      description: `Quiz score ${area.percent}% is in the middle. Keep this topic and practice one focused example.`,
      today: input.today,
      milestones: input.milestones,
      existing: input.tasks,
    });
    addRecommendation(items, seen, input.decisions, {
      fingerprint: `practice:${slug(area.skill)}`,
      kind: "practice",
      title: `Targeted practice for ${area.skill}`,
      summary: "Keep the topic and practice one focused example.",
      reasoning: `Your quiz performance in ${area.skill} is ${area.percent}% (${area.correct} of ${area.total} correct), between ${SCORE_MEDIUM_PERCENT}% and ${SCORE_HIGH_PERCENT - 1}%. Targeted practice at the current difficulty is recommended.`,
      skill: area.skill,
      difficulty: "practice",
      alreadyOnPlan: practice.alreadyOnPlan,
      task: practice.task,
    });
  }

  for (const area of input.strongAreas) {
    const nextSkill = nextRoadmapSkill(area.skill, input.orderedSkills, input.scored);

    if (!nextSkill) {
      continue;
    }

    const next = makeTask({
      kind: "Next",
      skill: nextSkill,
      description: `Quiz score ${area.percent}% on "${area.skill}" is high. Practice the next roadmap skill instead of repeating that one.`,
      today: input.today,
      milestones: input.milestones,
      existing: input.tasks,
    });
    addRecommendation(items, seen, input.decisions, {
      fingerprint: `next:${slug(nextSkill)}`,
      kind: "next_skill",
      title: `Move on to ${nextSkill}`,
      summary: "Skip another repeat of a mastered skill.",
      reasoning: `Your quiz performance in ${area.skill} is ${area.percent}% (${area.correct} of ${area.total} correct), at or above ${SCORE_HIGH_PERCENT}%. The next roadmap skill is ${nextSkill}.`,
      skill: nextSkill,
      difficulty: "advanced",
      alreadyOnPlan: next.alreadyOnPlan,
      task: next.task,
    });
  }

  if (input.todayPending[0]) {
    const task = input.todayPending[0];
    addRecommendation(items, seen, input.decisions, {
      fingerprint: `today:${slug(task.title)}`,
      kind: "review",
      title: `Finish today's task: ${task.title}`,
      summary: "Use the pending work already on your plan.",
      reasoning: `A pending task "${task.title}" is scheduled for ${task.scheduledOn}. Personalization keeps that saved task as the immediate study focus.`,
      skill: task.skill,
      difficulty: input.recommendedDifficulty,
      alreadyOnPlan: true,
      task: null,
    });
  }

  if (input.overdueCount > 0) {
    addRecommendation(items, seen, input.decisions, {
      fingerprint: "plan:reduce-overdue",
      kind: "review",
      title: "Clear overdue tasks before adding more",
      summary: "Reduce overload by finishing delayed work first.",
      reasoning: `${input.overdueCount} pending ${input.overdueCount === 1 ? "task is" : "tasks are"} scheduled before today. Adding more work now would overload the current plan.`,
      skill: null,
      difficulty: input.recommendedDifficulty,
      alreadyOnPlan: false,
      task: null,
    });
  }

  if (isOverloaded(input.weekMinutes, input.weeklyStudyTime)) {
    addRecommendation(items, seen, input.decisions, {
      fingerprint: "plan:reduce-load",
      kind: "review",
      title: "Protect weekly study capacity",
      summary: "Planned time is already high for your weekly limit.",
      reasoning: `About ${formatMinutes(input.weekMinutes)} are already on this week's plan, and your weekly study time is ${weeklyCapLabel(input.weeklyStudyTime)}. Prefer finishing existing tasks over adding more.`,
      skill: null,
      difficulty: input.recommendedDifficulty,
      alreadyOnPlan: false,
      task: null,
    });
  }

  addRecommendation(items, seen, input.decisions, {
    fingerprint: `style:${slug(input.learningApproach)}`,
    kind: "new_concept",
    title: "Match sessions to your learning style",
    summary: input.learningApproach,
    reasoning: `Your saved learning style shapes how new concepts should be practiced: ${input.learningApproach}`,
    skill: null,
    difficulty: input.recommendedDifficulty,
    alreadyOnPlan: false,
    task: null,
  });

  return items;
}

function addRecommendation(
  items: PersonalizedRecommendation[],
  seen: Set<string>,
  decisions: DecisionMap,
  draft: Omit<PersonalizedRecommendation, "status">,
): void {
  if (seen.has(draft.fingerprint)) {
    return;
  }

  seen.add(draft.fingerprint);
  items.push({
    ...draft,
    status: decisions.get(draft.fingerprint) ?? "open",
  });
}

function makeTask(input: {
  kind: "Revise" | "Practice" | "Next";
  skill: string;
  description: string;
  today: string;
  milestones: MilestoneInput[];
  existing: TaskInput[];
}): { task: PersonalizationActionTask; alreadyOnPlan: boolean } {
  const milestone = milestoneFor(input.skill, input.milestones);
  const title = clip(`${input.kind}: ${input.skill}`, 140);

  return {
    alreadyOnPlan: covered(input.existing, input.skill, title, input.kind === "Next"),
    task: {
      title,
      skill: input.skill,
      description: input.description,
      milestoneId: milestone?.id ?? "",
      scheduledOn: input.today,
      durationMinutes: TASK_MINUTES,
    },
  };
}

function scoreAreas(skills: SkillInput[]): PersonalizedSkillArea[] {
  return skills
    .flatMap((skill) => {
      const percent = percentOf(skill.correct, skill.total);
      if (percent === null || !usableSkill(skill.skill)) {
        return [];
      }

      return [{
        skill: skill.skill,
        percent,
        correct: skill.correct,
        total: skill.total,
        band: bandFor(percent),
      }];
    })
    .sort((left, right) => bandRank(left.band) - bandRank(right.band) || left.percent - right.percent);
}

export function bandFor(percent: number): ScoreBand {
  if (percent >= SCORE_HIGH_PERCENT) {
    return "high";
  }

  if (percent >= SCORE_MEDIUM_PERCENT) {
    return "medium";
  }

  return "low";
}

function dominantScoreBand(areas: PersonalizedSkillArea[]): ScoreBand {
  if (areas.some((area) => area.band === "low")) {
    return "low";
  }

  if (areas.some((area) => area.band === "medium")) {
    return "medium";
  }

  return "high";
}

function difficultyFor(band: ScoreBand, skillLevel: SkillLevel | null): DifficultyRecommendation {
  if (band === "low") {
    return "beginner";
  }

  if (band === "medium") {
    return "practice";
  }

  if (skillLevel === "beginner") {
    return "practice";
  }

  return "advanced";
}

function taskTypeFor(
  band: ScoreBand,
  weakAreas: PersonalizedSkillArea[],
  strongAreas: PersonalizedSkillArea[],
  todayPending: TaskInput[],
): TaskTypeRecommendation {
  if (band === "low" || weakAreas[0]?.band === "low") {
    return "revision";
  }

  if (band === "medium") {
    return "practice";
  }

  if (strongAreas.length > 0) {
    return "next_skill";
  }

  if (todayPending.length > 0) {
    return "review";
  }

  return "quiz";
}

function approachFor(style: LearningStyle | null): string {
  switch (style) {
    case "reading":
      return "Use structured notes, short written explanations, and documentation-style review.";
    case "practice":
      return "Use hands-on exercises, short projects, and practice tasks.";
    case "video":
      return "Use short lecture or demo review, then restate the idea in your own words.";
    case "mixed":
      return "Combine a short note, one example, and one practice attempt in the same session.";
    default:
      return "Your learning style is not saved yet, so keep sessions short and concrete.";
  }
}

function priorityLine(
  band: ScoreBand,
  weakAreas: PersonalizedSkillArea[],
  nextSkill: string | null,
  todayPending: TaskInput[],
): string {
  if (band === "low" && weakAreas[0]) {
    return `Revise ${weakAreas[0].skill} before adding new topics.`;
  }

  if (band === "medium" && weakAreas[0]) {
    return `Practice ${weakAreas[0].skill} with targeted examples.`;
  }

  if (nextSkill) {
    return `Progress to ${nextSkill} and reduce repeats of mastered skills.`;
  }

  if (todayPending[0]) {
    return `Complete "${todayPending[0].title}" on your current plan.`;
  }

  return "Maintain the current plan and gather another quiz result.";
}

function nextStepLine(input: {
  band: ScoreBand;
  weak: PersonalizedSkillArea | null;
  nextSkill: string | null;
  todayTask: TaskInput | null;
  learningApproach: string;
}): string {
  if (input.band === "low" && input.weak) {
    return `Review explanations for ${input.weak.skill}, then try easier practice. ${input.learningApproach}`;
  }

  if (input.band === "medium" && input.weak) {
    return `Keep ${input.weak.skill} at current difficulty and complete one focused practice task.`;
  }

  if (input.nextSkill) {
    return `Start the next skill "${input.nextSkill}" instead of repeating a high-scoring topic.`;
  }

  if (input.todayTask) {
    return `Finish the pending task "${input.todayTask.title}".`;
  }

  return "Submit another quiz so the next step can use fresh evidence.";
}

function revisionLine(band: ScoreBand, overdueCount: number): string {
  if (band === "low") {
    return "Increase revision frequency until low scores move above 50%.";
  }

  if (overdueCount > 0) {
    return "Keep a short revision pass while clearing overdue tasks.";
  }

  if (band === "medium") {
    return "Keep a moderate revision cadence on improving topics.";
  }

  return "Reduce revision of mastered topics and revise only when a new gap appears.";
}

function careerLine(profile: PersonalizationProfile, focus: string): string {
  if (!profile.goalTitle) {
    return "No career goal is saved yet, so recommendations stay on the current roadmap.";
  }

  const field = profile.field ? ` in ${profile.field}` : "";
  const outcome = profile.targetOutcome ? ` toward ${profile.targetOutcome}` : "";
  return `Keep work on "${focus}" aligned with ${profile.goalTitle}${field}${outcome}.`;
}

function statusLine(input: {
  tasksCompleted: number;
  tasksTotal: number;
  quizzes: number;
  stageTitle: string | null;
  weekMinutes: number;
  weeklyStudyTime: WeeklyStudyTime | null;
}): string {
  const tasks = input.tasksTotal === 0
    ? "No study tasks are saved yet."
    : `${input.tasksCompleted} of ${input.tasksTotal} study ${input.tasksTotal === 1 ? "task is" : "tasks are"} complete.`;
  const quizzes = `${input.quizzes} scored ${input.quizzes === 1 ? "skill is" : "skills are"} available from submitted quizzes.`;
  const stage = input.stageTitle ? ` Current stage: ${input.stageTitle}.` : "";
  const week = ` About ${formatMinutes(input.weekMinutes)} are on this week's plan${input.weeklyStudyTime ? ` against a weekly target of ${weeklyCapLabel(input.weeklyStudyTime)}` : ""}.`;
  return `${tasks} ${quizzes}${stage}${week}`;
}

function buildReasoning(input: {
  areas: PersonalizedSkillArea[];
  weakAreas: PersonalizedSkillArea[];
  strongAreas: PersonalizedSkillArea[];
  dominantBand: ScoreBand;
  recommendedDifficulty: DifficultyRecommendation;
  learningApproach: string;
  careerAlignment: string;
  overdueCount: number;
  weekMinutes: number;
  weeklyStudyTime: WeeklyStudyTime | null;
  todayPending: TaskInput[];
}): string[] {
  const lines: string[] = [];

  for (const area of input.weakAreas.slice(0, 3)) {
    lines.push(
      `Your quiz performance in ${area.skill} is ${area.percent}% (${area.correct} of ${area.total} correct), so ${
        area.band === "low" ? "revision and easier practice" : "targeted practice at the current difficulty"
      } are recommended before moving to advanced topics.`,
    );
  }

  for (const area of input.strongAreas.slice(0, 2)) {
    lines.push(
      `${area.skill} is at ${area.percent}% (${area.correct} of ${area.total} correct), so another repeat is not the priority.`,
    );
  }

  lines.push(`Recommended quiz and task difficulty is ${labelDifficulty(input.recommendedDifficulty)} because overall scored work is ${input.dominantBand}.`);
  lines.push(input.learningApproach);
  lines.push(input.careerAlignment);

  if (input.todayPending[0]) {
    lines.push(`A pending task "${input.todayPending[0].title}" remains on the plan, so recommendations stay tied to that saved work.`);
  }

  if (input.overdueCount > 0) {
    lines.push(`${input.overdueCount} overdue ${input.overdueCount === 1 ? "task was" : "tasks were"} found, so new work should wait.`);
  }

  if (isOverloaded(input.weekMinutes, input.weeklyStudyTime)) {
    lines.push(`Planned weekly time (${formatMinutes(input.weekMinutes)}) is already high for your saved weekly study limit.`);
  }

  return lines;
}

function nextRoadmapSkill(
  skill: string,
  ordered: string[],
  scored: Map<string, ScoreBand>,
): string | null {
  const index = ordered.indexOf(skill);
  const start = index < 0 ? 0 : index + 1;

  for (let position = start; position < ordered.length; position += 1) {
    const candidate = ordered[position];

    if (!candidate || candidate === skill) {
      continue;
    }

    const band = scored.get(candidate);
    if (band === "low" || band === "medium" || band === "high") {
      continue;
    }

    return candidate;
  }

  return null;
}

function orderedRoadmapSkills(milestones: MilestoneInput[]): string[] {
  const skills: string[] = [];

  for (const milestone of [...milestones].sort((left, right) => left.position - right.position)) {
    for (const skill of milestone.skills) {
      if (!usableSkill(skill) || skills.includes(skill)) {
        continue;
      }

      skills.push(skill);
    }
  }

  return skills;
}

function milestoneFor(skill: string, milestones: MilestoneInput[]): MilestoneInput | null {
  return [...milestones]
    .sort((left, right) => left.position - right.position)
    .find((milestone) => milestone.skills.includes(skill)) ?? null;
}

function covered(tasks: TaskInput[], skill: string, title: string, anyMatchingSkill: boolean): boolean {
  return tasks.some((task) => {
    if (task.status !== "pending" && task.status !== "completed") {
      return false;
    }

    if (task.title === title) {
      return true;
    }

    return anyMatchingSkill && task.skill.toLowerCase() === skill.toLowerCase();
  });
}

function isOverloaded(weekMinutes: number, weekly: WeeklyStudyTime | null): boolean {
  if (!weekly) {
    return false;
  }

  const cap = weeklyCapMinutes(weekly);
  return cap !== null && weekMinutes > cap;
}

function weeklyCapMinutes(weekly: WeeklyStudyTime): number | null {
  switch (weekly) {
    case "under_5":
      return 5 * 60;
    case "5_to_10":
      return 10 * 60;
    case "10_to_20":
      return 20 * 60;
    case "over_20":
      return null;
    default:
      return null;
  }
}

function weeklyCapLabel(weekly: WeeklyStudyTime | null): string {
  switch (weekly) {
    case "under_5":
      return "under 5 hours";
    case "5_to_10":
      return "5 to 10 hours";
    case "10_to_20":
      return "10 to 20 hours";
    case "over_20":
      return "more than 20 hours";
    default:
      return "your saved weekly limit";
  }
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function labelDifficulty(value: DifficultyRecommendation): string {
  if (value === "beginner") {
    return "beginner";
  }

  if (value === "practice") {
    return "practice";
  }

  return "advanced";
}

function bandRank(band: ScoreBand): number {
  if (band === "low") {
    return 0;
  }

  if (band === "medium") {
    return 1;
  }

  return 2;
}

function percentOf(correct: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }

  return Math.round((correct / total) * 100);
}

function usableSkill(skill: string): boolean {
  const cleaned = skill.trim();
  return cleaned.length > 0 && cleaned !== "General" && cleaned !== PLACEHOLDER_SKILL;
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function clip(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  return value.slice(0, max - 1).trimEnd();
}

function weekStart(today: string): string {
  const date = utcDate(today);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  return isoFromUtc(date);
}

function weekEnd(today: string): string {
  const start = utcDate(weekStart(today));
  start.setUTCDate(start.getUTCDate() + 6);
  return isoFromUtc(start);
}

function utcDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1));
}

function isoFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

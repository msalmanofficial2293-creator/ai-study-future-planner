import type { Recommendation, RecommendedTask, ScoreBand } from "@/features/adaptive-plan/types";

const HIGH_PERCENT = 80;
const MEDIUM_PERCENT = 50;
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
};

type SkillInput = {
  skill: string;
  correct: number;
  total: number;
};

export function buildRecommendation(input: {
  today: string;
  planTitle: string;
  stageTitle: string;
  tasksCompleted: number;
  tasksTotal: number;
  quizAverage: number | null;
  quizzesCompleted: number;
  milestones: MilestoneInput[];
  tasks: TaskInput[];
  skills: SkillInput[];
}): Recommendation {
  const areas = input.skills
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
  const orderedSkills = orderedRoadmapSkills(input.milestones);
  const scored = new Map(areas.map((area) => [area.skill, area.band]));
  const changes: string[] = [];
  const priorities: string[] = [];
  const tasks: RecommendedTask[] = [];
  const seenTitles = new Set<string>();

  for (const area of areas) {
    if (area.band === "low") {
      const task = makeTask({
        kind: "Revise",
        skill: area.skill,
        description: `Quiz score ${area.percent}% is low. Review this skill, then practice it again.`,
        today: input.today,
        milestones: input.milestones,
        existing: input.tasks,
      });
      changes.push(`Low score on "${area.skill}" (${area.percent}%). Add a revision task before moving on.`);
      priorities.push(`Revise ${area.skill}`);
      pushTask(tasks, seenTitles, task);
      continue;
    }

    if (area.band === "medium") {
      const task = makeTask({
        kind: "Practice",
        skill: area.skill,
        description: `Quiz score ${area.percent}% is in the middle. Keep this topic and practice one focused example.`,
        today: input.today,
        milestones: input.milestones,
        existing: input.tasks,
      });
      changes.push(`Middle score on "${area.skill}" (${area.percent}%). Keep the topic and add targeted practice.`);
      priorities.push(`Practice ${area.skill}`);
      pushTask(tasks, seenTitles, task);
      continue;
    }

    const nextSkill = nextRoadmapSkill(area.skill, orderedSkills, scored);
    if (!nextSkill) {
      changes.push(`High score on "${area.skill}" (${area.percent}%). Skip another repeat. No later roadmap skill is waiting.`);
      priorities.push(`Leave ${area.skill} without another repeat`);
      continue;
    }

    const task = makeTask({
      kind: "Next",
      skill: nextSkill,
      description: `Quiz score ${area.percent}% on "${area.skill}" is high. Practice the next roadmap skill instead of repeating that one.`,
      today: input.today,
      milestones: input.milestones,
      existing: input.tasks,
    });
    changes.push(`High score on "${area.skill}" (${area.percent}%). Skip another repeat and take the next skill: ${nextSkill}.`);
    priorities.push(`Move on to ${nextSkill}`);
    pushTask(tasks, seenTitles, task);
  }

  const statusSummary = statusLine(input);
  const rationale = [
    "Rule-based update from saved quiz answers. No paid model was called.",
    statusSummary,
    "",
    "Changes:",
    ...changes.map((change) => `- ${change}`),
    "",
    "Priorities:",
    ...priorities.map((priority, index) => `${index + 1}. ${priority}`),
    "",
    "Next tasks:",
    ...(tasks.length === 0
      ? ["- No new task."]
      : tasks.map((task) => `- ${task.title} (${task.scheduledOn}, ${task.durationMinutes} min)`)),
  ].join("\n");

  return {
    statusSummary,
    stageTitle: input.stageTitle,
    strongAreas: areas.filter((area) => area.band === "high"),
    weakAreas: areas.filter((area) => area.band !== "high"),
    changes,
    priorities,
    tasks,
    rationale: rationale.slice(0, 4000),
  };
}

function makeTask(input: {
  kind: "Revise" | "Practice" | "Next";
  skill: string;
  description: string;
  today: string;
  milestones: MilestoneInput[];
  existing: TaskInput[];
}): RecommendedTask {
  const milestone = milestoneFor(input.skill, input.milestones);
  const title = clip(`${input.kind}: ${input.skill}`, 140);

  return {
    title,
    skill: input.skill,
    description: input.description,
    milestoneId: milestone?.id ?? "",
    milestoneTitle: milestone?.title ?? "Current study plan",
    scheduledOn: input.today,
    durationMinutes: TASK_MINUTES,
    alreadyOnPlan: covered(input.existing, input.skill, title, input.kind === "Next"),
  };
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

function statusLine(input: {
  tasksCompleted: number;
  tasksTotal: number;
  quizAverage: number | null;
  quizzesCompleted: number;
  stageTitle: string;
}): string {
  const tasks = input.tasksTotal === 0
    ? "No study tasks are saved yet."
    : `${input.tasksCompleted} of ${input.tasksTotal} study ${input.tasksTotal === 1 ? "task is" : "tasks are"} complete.`;
  const quizzes = input.quizzesCompleted === 0 || input.quizAverage === null
    ? "No quiz score is saved."
    : `${input.quizzesCompleted} ${input.quizzesCompleted === 1 ? "quiz is" : "quizzes are"} submitted, with an average score of ${input.quizAverage}%.`;
  const stage = input.stageTitle ? ` Current stage: ${input.stageTitle}.` : "";
  return `${tasks} ${quizzes}${stage}`;
}

function bandFor(percent: number): ScoreBand {
  if (percent >= HIGH_PERCENT) {
    return "high";
  }

  if (percent >= MEDIUM_PERCENT) {
    return "medium";
  }

  return "low";
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

function pushTask(tasks: RecommendedTask[], seen: Set<string>, task: RecommendedTask): void {
  if (seen.has(task.title)) {
    return;
  }

  seen.add(task.title);
  tasks.push(task);
}

function clip(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }

  return value.slice(0, max - 1).trimEnd();
}

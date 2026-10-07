import type {
  RoadmapDraft,
  RoadmapLearnerInput,
  RoadmapLearningStyle,
  RoadmapSkillLevel,
  RoadmapStage,
  RoadmapWeeklyTime,
} from "@/features/roadmap/types";

const TIME_WEEKS: Record<RoadmapWeeklyTime, number> = {
  under_5: 20,
  "5_to_10": 14,
  "10_to_20": 10,
  over_20: 8,
};

const SKILL_FACTOR: Record<RoadmapSkillLevel, number> = {
  beginner: 1.4,
  intermediate: 1,
  advanced: 0.75,
};

const TIME_LABEL: Record<RoadmapWeeklyTime, string> = {
  under_5: "under 5 hours a week",
  "5_to_10": "5 to 10 hours a week",
  "10_to_20": "10 to 20 hours a week",
  over_20: "more than 20 hours a week",
};

const SKILL_LABEL: Record<RoadmapSkillLevel, string> = {
  beginner: "a beginning level",
  intermediate: "a comfortable basic level",
  advanced: "an existing practice level",
};

export function generateMockRoadmap(input: RoadmapLearnerInput): RoadmapDraft {
  const field = clip(input.fieldOfStudy, 80) || "your field";
  const goal = clip(input.careerGoal, 120);
  const outcome = clip(input.targetOutcome, 180);
  const weeks = estimateWeeks(input.skillLevel, input.weeklyStudyTime);
  const practice = practiceLine(input.learningStyle);

  return {
    title: `Roadmap toward ${goal}`,
    overview: clip(
      `This path moves you from ${SKILL_LABEL[input.skillLevel]} toward ${goal}. It uses your ${input.educationLevel.toLowerCase()} background in ${field}, about ${TIME_LABEL[input.weeklyStudyTime]}, and ${practice}. Keep this outcome in view: ${outcome}`,
      680,
    ),
    timeline: `${weeks} weeks at ${TIME_LABEL[input.weeklyStudyTime]}`,
    stages: stagesFor(input.skillLevel, field, practice),
    nextSteps: [
      `Reserve ${TIME_LABEL[input.weeklyStudyTime]} before adding extra topics.`,
      "Finish the first stage milestone before starting the next stage.",
      `Use ${practice} for every study block in ${field}.`,
    ],
  };
}

function estimateWeeks(skill: RoadmapSkillLevel, time: RoadmapWeeklyTime): number {
  return Math.max(4, Math.round(TIME_WEEKS[time] * SKILL_FACTOR[skill]));
}

function practiceLine(style: RoadmapLearningStyle): string {
  if (style === "reading") {
    return "short reading followed by written notes";
  }

  if (style === "practice") {
    return "a small practice task in every session";
  }

  if (style === "video") {
    return "one short lesson, then a repeat in your own words";
  }

  return "a short lesson paired with a practice task";
}

function stagesFor(skill: RoadmapSkillLevel, field: string, practice: string): RoadmapStage[] {
  if (skill === "advanced") {
    return [
      stage(
        "Close the remaining gaps",
        [`Name the weak spots in ${field}`, "Compare your current work with the goal", "Pick one gap to close first"],
        `You can point to the gap in ${field} that most affects the goal, and you have a way to practice it.`,
      ),
      stage(
        "Deepen daily practice",
        ["Raise the difficulty of one recurring exercise", "Review mistakes from the last session", `Keep ${practice}`],
        "You can complete a harder practice set without restarting from the basics.",
      ),
      stage(
        "Build a public piece of work",
        [`Scope a small ${field} project tied to the goal`, "Finish a first version", "Write what you would improve next"],
        "A finished piece of work exists and you can explain the decisions in it.",
      ),
      stage(
        "Prepare to use the skill",
        ["Rehearse explaining the work", "List the evidence you can show", "Set the next month of practice"],
        "You can describe the goal, the work you finished, and the next month of practice.",
      ),
    ];
  }

  if (skill === "intermediate") {
    return [
      stage(
        "Strengthen the core",
        [`Restate the core ideas in ${field}`, "Find one idea you still mix up", `Practice it with ${practice}`],
        `You can explain the core of ${field} without notes and name the idea that still needs work.`,
      ),
      stage(
        "Apply it to a real task",
        ["Choose a task that matches the goal", "Do the task in one sitting", "Note what slowed you down"],
        "You have finished one realistic task and written down what to change next time.",
      ),
      stage(
        "Make a portfolio piece",
        [`Plan a small ${field} project`, "Build the smallest useful version", "Ask what a reviewer would question"],
        "The project is complete enough for someone else to understand the goal behind it.",
      ),
      stage(
        "Practice without a guide",
        ["Repeat the project pattern on a new prompt", "Check your own result", "Schedule the next two weeks"],
        "You can start and finish a similar task without a step-by-step guide.",
      ),
    ];
  }

  return [
    stage(
      "Learn the foundations",
      [`Learn the words used in ${field}`, "See one complete example from start to finish", `Capture it with ${practice}`],
      `You can explain a basic example in ${field} in your own words.`,
    ),
    stage(
      "Practice the core skill",
      ["Repeat the example with one change", "Check the result against the example", "Write the step you still skip"],
      "You can complete a guided exercise and identify the step that still fails.",
    ),
    stage(
      "Build a first project",
      [`Choose a tiny ${field} project linked to the goal`, "Finish a rough version", "List three improvements"],
      "A small project exists, and you can say what it does and what is still rough.",
    ),
    stage(
      "Get ready to continue",
      ["Review the project against the goal", "Pick the next skill to practice", "Set a weekly rhythm you can keep"],
      "You know the next skill to practice and the weekly time you will protect for it.",
    ),
  ];
}

function stage(title: string, skills: string[], milestone: string): RoadmapStage {
  return { title, skills, milestone };
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

import type { MockQuiz, MockQuizInput, MockQuizQuestion } from "@/features/quiz/types";

const CHOICE_COUNT = 4;

export function generateMockQuiz(input: MockQuizInput): MockQuiz {
  const skill = clip(input.skill, 120);
  const field = clip(input.field, 80) || "your field";
  const goal = clip(input.goal, 120) || "your goal";
  const seed = hash(skill);

  return {
    title: clip(`${input.difficulty} check: ${skill}`, 140),
    skill,
    difficulty: input.difficulty,
    questions: [
      question(
        `Which note shows that you understand "${skill}"?`,
        "A short restatement of the idea in your own words.",
        [
          "A copied heading with no explanation.",
          "A list of tools that were not part of this study.",
          "A reminder to skip this idea until later.",
        ],
        `Understanding "${skill}" means you can say the idea yourself. A copied heading, an unrelated tool list, or a delay does not show that.`,
        seed,
      ),
      question(
        `You have one focused hour for ${field}. What is the best use of it for "${skill}"?`,
        practiceChoice(input.difficulty, skill, field),
        [
          "Open several new topics and save them for later.",
          "Rewrite the whole roadmap before starting.",
          "Wait for a longer course to cover this idea.",
        ],
        `One hour is enough for a single pass on "${skill}" in ${field}. Collecting new topics, rewriting the roadmap, or waiting does not practice the idea.`,
        seed + 1,
      ),
      question(
        `How should "${skill}" support the goal "${goal}"?`,
        `It is one step you can demonstrate on the way to ${goal}.`,
        [
          "It replaces the goal.",
          "It only matters if a separate course assigns it.",
          "It can wait until every later stage is finished.",
        ],
        `"${skill}" belongs to the path toward ${goal}. It does not replace that goal, and it does not depend on an unrelated assignment.`,
        seed + 2,
      ),
      question(
        `Which result means this check on "${skill}" is solid?`,
        checkChoice(input.difficulty, skill),
        [
          "You picked the first choice quickly.",
          "You recognized one familiar word.",
          "You finished faster than last time and moved on.",
        ],
        `A solid check on "${skill}" is an explanation you can give again. Speed, the first choice, or one familiar word is not enough.`,
        seed + 3,
      ),
    ],
  };
}

function practiceChoice(difficulty: MockQuizInput["difficulty"], skill: string, field: string): string {
  if (difficulty === "Foundation") {
    return `Read one example of ${skill} in ${field}, then say it back in one sentence.`;
  }

  if (difficulty === "Challenge") {
    return `Apply ${skill} to a new ${field} example, then explain what would change if one detail changed.`;
  }

  return `Practice ${skill} once in ${field}, then check the result without looking at notes.`;
}

function checkChoice(difficulty: MockQuizInput["difficulty"], skill: string): string {
  if (difficulty === "Foundation") {
    return `You can point to the part of ${skill} that the question was asking about.`;
  }

  if (difficulty === "Challenge") {
    return `You can defend the answer for ${skill} if the example changes slightly.`;
  }

  return "You can explain the answer without reading the choices again.";
}

function question(
  prompt: string,
  correct: string,
  wrongs: string[],
  explanation: string,
  seed: number,
): MockQuizQuestion {
  const correctIndex = seed % CHOICE_COUNT;
  const choices = [...wrongs];
  choices.splice(correctIndex, 0, correct);

  return {
    prompt: clip(prompt, 500),
    choices: choices.map((choice) => clip(choice, 180)),
    correctIndex,
    explanation: clip(explanation, 400),
  };
}

function hash(value: string): number {
  let total = 0;

  for (let index = 0; index < value.length; index += 1) {
    total = (total + value.charCodeAt(index) * (index + 1)) % 997;
  }

  return total;
}

function clip(value: string, max: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= max) {
    return trimmed;
  }

  return trimmed.slice(0, max - 1).trimEnd();
}

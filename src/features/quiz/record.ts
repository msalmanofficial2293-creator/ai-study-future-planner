import { QUIZ_DIFFICULTIES, type QuizDifficulty } from "@/features/quiz/types";

export type StoredQuizTitle = {
  title: string;
  skill: string;
  difficulty: QuizDifficulty;
};

export function encodeQuizTitle(value: StoredQuizTitle): string {
  return `SKILL\n${value.skill}\n\nDIFFICULTY\n${value.difficulty}\n\nTITLE\n${value.title}`;
}

export function decodeQuizTitle(value: string): StoredQuizTitle {
  const skill = section(value, "SKILL", "DIFFICULTY");
  const difficultyText = section(value, "DIFFICULTY", "TITLE");
  const titleStart = value.indexOf("TITLE\n");
  const title = titleStart < 0 ? "" : value.slice(titleStart + "TITLE\n".length).trim();

  if (!skill || !title || !isDifficulty(difficultyText)) {
    return {
      title: value.trim() || "Practice quiz",
      skill: "General",
      difficulty: "Practice",
    };
  }

  return {
    title,
    skill,
    difficulty: difficultyText,
  };
}

function isDifficulty(value: string): value is QuizDifficulty {
  return QUIZ_DIFFICULTIES.some((difficulty) => difficulty === value);
}

function section(source: string, start: string, end: string): string {
  const startToken = `${start}\n`;
  const startIndex = source.indexOf(startToken);

  if (startIndex < 0) {
    return "";
  }

  const contentStart = startIndex + startToken.length;
  const endIndex = source.indexOf(`\n\n${end}\n`, contentStart);
  const content = endIndex < 0 ? source.slice(contentStart) : source.slice(contentStart, endIndex);
  return content.trim();
}

export type TutorReplyView = {
  explanation: string;
  points: string[];
  example: string;
  practice: string[];
  next: string;
};

export function formatTutorReply(parts: TutorReplyView): string {
  const lines = [
    "EXPLANATION",
    parts.explanation.trim(),
    "",
    "KEY POINTS",
    ...parts.points.map((point) => `- ${point.trim()}`),
    "",
    "EXAMPLE",
    parts.example.trim(),
    "",
    "PRACTICE",
    ...parts.practice.map((item) => `- ${item.trim()}`),
    "",
    "NEXT",
    parts.next.trim(),
  ];

  return lines.join("\n").slice(0, 3500);
}

export function parseTutorReply(content: string): TutorReplyView | null {
  const explanation = section(content, "EXPLANATION", "KEY POINTS");
  const pointsBlock = section(content, "KEY POINTS", "EXAMPLE");
  const example = section(content, "EXAMPLE", "PRACTICE");
  const practiceBlock = section(content, "PRACTICE", "NEXT");
  const next = section(content, "NEXT", null);

  if (!explanation || !next) {
    return null;
  }

  return {
    explanation,
    points: bullets(pointsBlock),
    example,
    practice: bullets(practiceBlock),
    next,
  };
}

function section(value: string, start: string, end: string | null): string {
  const startToken = `${start}\n`;
  const startIndex = value.indexOf(startToken);

  if (startIndex < 0) {
    return "";
  }

  const from = startIndex + startToken.length;
  const endIndex = end ? value.indexOf(`\n${end}\n`, from) : -1;
  const raw = endIndex < 0 ? value.slice(from) : value.slice(from, endIndex);
  return raw.trim();
}

function bullets(block: string): string[] {
  return block
    .split("\n")
    .map((line) => line.replace(/^- /, "").trim())
    .filter((line) => line.length > 0);
}

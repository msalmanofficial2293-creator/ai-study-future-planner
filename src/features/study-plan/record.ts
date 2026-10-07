export type TaskDetails = {
  skill: string;
  durationMinutes: number;
  description: string;
};

export function encodeTaskDetails(details: TaskDetails): string {
  return `SKILL\n${details.skill}\n\nDURATION\n${details.durationMinutes}\n\nNOTES\n${details.description}`;
}

export function decodeTaskDetails(value: string): TaskDetails {
  const skill = section(value, "SKILL", "DURATION");
  const durationText = section(value, "DURATION", "NOTES");
  const notesStart = value.indexOf("NOTES\n");
  const description = notesStart < 0 ? "" : value.slice(notesStart + "NOTES\n".length).trim();
  const duration = Number(durationText);

  if (!skill || !Number.isInteger(duration) || duration < 1) {
    return {
      skill: "General",
      durationMinutes: 30,
      description: value.trim(),
    };
  }

  return {
    skill,
    durationMinutes: duration,
    description,
  };
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

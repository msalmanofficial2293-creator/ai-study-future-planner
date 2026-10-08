import type { StudyTaskStatus } from "@/features/study-plan/types";

export type StageCandidate = {
  id: string;
  title: string;
  position: number;
};

export type StageTask = {
  milestoneId: string;
  status: StudyTaskStatus;
};

/** Calendar date in the server/runtime local timezone (YYYY-MM-DD). */
export function todayIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function weekRange(today: string): { start: string; end: string } {
  const date = utcDate(today);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(date);
  start.setUTCDate(date.getUTCDate() + mondayOffset);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start: isoFromUtc(start), end: isoFromUtc(end) };
}

export function currentStage(stages: StageCandidate[], tasks: StageTask[]): StageCandidate | null {
  const ordered = [...stages].sort((left, right) => left.position - right.position);

  if (ordered.length === 0) {
    return null;
  }

  const withPending = ordered.find((stage) =>
    tasks.some((task) => task.milestoneId === stage.id && task.status === "pending"),
  );

  if (withPending) {
    return withPending;
  }

  const untouched = ordered.find(
    (stage) => !tasks.some((task) => task.milestoneId === stage.id),
  );

  return untouched ?? ordered[ordered.length - 1] ?? null;
}

export function taskGroup(
  task: { scheduledOn: string; status: StudyTaskStatus },
  today: string,
): "today" | "upcoming" | "completed" {
  if (task.status === "completed") {
    return "completed";
  }

  if (task.scheduledOn <= today) {
    return "today";
  }

  return "upcoming";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (rest === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${hours} h ${rest} min`;
}

export function formatStudyHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  if (rest === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }

  return `${hours} h ${rest} min`;
}

function utcDate(isoDay: string): Date {
  const [year, month, day] = isoDay.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
}

function isoFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

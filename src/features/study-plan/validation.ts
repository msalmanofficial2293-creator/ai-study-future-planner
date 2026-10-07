import type { StudyTaskInput } from "@/features/study-plan/types";

export const TASK_TITLE_MAX = 160;
export const TASK_DESCRIPTION_MAX = 600;
export const TASK_SKILL_MAX = 120;
export const TASK_DURATION_MIN = 5;
export const TASK_DURATION_MAX = 480;

export type StudyTaskFieldErrors = {
  title?: string;
  description?: string;
  skill?: string;
  scheduledOn?: string;
  durationMinutes?: string;
  milestoneId?: string;
};

export type StudyTaskFormResult =
  | { ok: true; value: StudyTaskInput }
  | { ok: false; fieldErrors: StudyTaskFieldErrors; formError?: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function readStudyTaskForm(formData: FormData): StudyTaskFormResult {
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const skill = readText(formData, "skill");
  const scheduledOn = readText(formData, "scheduledOn");
  const durationText = readText(formData, "durationMinutes");
  const milestoneId = readText(formData, "milestoneId");
  const fieldErrors: StudyTaskFieldErrors = {};

  if (!title) {
    fieldErrors.title = "Enter a task title.";
  } else if (title.length > TASK_TITLE_MAX) {
    fieldErrors.title = `Use ${TASK_TITLE_MAX} characters or fewer.`;
  }

  if (description.length > TASK_DESCRIPTION_MAX) {
    fieldErrors.description = `Use ${TASK_DESCRIPTION_MAX} characters or fewer.`;
  }

  if (!skill) {
    fieldErrors.skill = "Enter a skill or subject.";
  } else if (skill.length > TASK_SKILL_MAX || skill.includes("\n")) {
    fieldErrors.skill = `Use ${TASK_SKILL_MAX} characters or fewer on one line.`;
  }

  if (!DATE_PATTERN.test(scheduledOn) || Number.isNaN(Date.parse(`${scheduledOn}T00:00:00Z`))) {
    fieldErrors.scheduledOn = "Choose a planned date.";
  }

  const durationMinutes = Number(durationText);

  if (!Number.isInteger(durationMinutes) || durationMinutes < TASK_DURATION_MIN || durationMinutes > TASK_DURATION_MAX) {
    fieldErrors.durationMinutes = `Use ${TASK_DURATION_MIN} to ${TASK_DURATION_MAX} minutes.`;
  }

  if (milestoneId && !/^[0-9a-f-]{36}$/i.test(milestoneId)) {
    fieldErrors.milestoneId = "Choose a milestone from your roadmap.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    value: {
      title,
      description,
      skill,
      scheduledOn,
      durationMinutes,
      milestoneId,
    },
  };
}

export function readTaskId(formData: FormData): string | null {
  const taskId = readText(formData, "taskId");
  return /^[0-9a-f-]{36}$/i.test(taskId) ? taskId : null;
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

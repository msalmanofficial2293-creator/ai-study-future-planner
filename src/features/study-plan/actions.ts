"use server";

import { redirect } from "next/navigation";
import { readStudyTaskForm, readTaskId } from "@/features/study-plan/validation";
import type { StudyTaskFieldErrors } from "@/features/study-plan/validation";
import {
  createStudyTask,
  deleteStudyTask,
  setStudyTaskStatus,
  updateStudyTask,
} from "@/services/study-plan";
import type { StudyPlanMutation } from "@/services/study-plan";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export type StudyTaskActionState = {
  formError?: string;
  fieldErrors?: StudyTaskFieldErrors;
  message?: string;
  savedAt?: number;
};

const addInFlight = new Map<string, Promise<StudyTaskActionState>>();
const updateInFlight = new Map<string, Promise<StudyTaskActionState>>();
const changeInFlight = new Map<string, Promise<StudyTaskActionState>>();

export async function addStudyTaskAction(
  _previous: StudyTaskActionState,
  formData: FormData,
): Promise<StudyTaskActionState> {
  return runTaskAction(addInFlight, formData, async (userId) => {
    const parsed = readStudyTaskForm(formData);

    if (!parsed.ok) {
      return { fieldErrors: parsed.fieldErrors, formError: parsed.formError };
    }

    return mutationState(await createStudyTask(userId, parsed.value), "Task saved.");
  });
}

export async function updateStudyTaskAction(
  _previous: StudyTaskActionState,
  formData: FormData,
): Promise<StudyTaskActionState> {
  return runTaskAction(updateInFlight, formData, async (userId) => {
    const taskId = readTaskId(formData);
    const parsed = readStudyTaskForm(formData);

    if (!taskId) {
      return { formError: "Something went wrong. Please try again." };
    }

    if (!parsed.ok) {
      return { fieldErrors: parsed.fieldErrors, formError: parsed.formError };
    }

    return mutationState(await updateStudyTask(userId, taskId, parsed.value), "Task updated.");
  });
}

export async function changeStudyTaskAction(
  _previous: StudyTaskActionState,
  formData: FormData,
): Promise<StudyTaskActionState> {
  return runTaskAction(changeInFlight, formData, async (userId) => {
    const taskId = readTaskId(formData);
    const intent = formData.get("intent");

    if (!taskId || (intent !== "complete" && intent !== "incomplete" && intent !== "delete")) {
      return { formError: "Something went wrong. Please try again." };
    }

    if (intent === "delete") {
      return mutationState(await deleteStudyTask(userId, taskId), "Task deleted.");
    }

    return mutationState(
      await setStudyTaskStatus(userId, taskId, intent === "complete" ? "completed" : "pending"),
      intent === "complete" ? "Task marked complete." : "Task marked incomplete.",
    );
  });
}

async function runTaskAction(
  inFlight: Map<string, Promise<StudyTaskActionState>>,
  formData: FormData,
  work: (userId: string) => Promise<StudyTaskActionState>,
): Promise<StudyTaskActionState> {
  if (!(formData instanceof FormData)) {
    return { formError: "Something went wrong. Please try again." };
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = inFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = work(user.id).finally(() => {
    inFlight.delete(user.id);
  });
  inFlight.set(user.id, outcome);
  return outcome;
}

function mutationState(result: StudyPlanMutation, message: string): StudyTaskActionState {
  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (!result.ok && result.reason === "missing-roadmap") {
    return { formError: "Generate a roadmap before adding a study task." };
  }

  if (!result.ok && result.reason === "invalid-milestone") {
    return { fieldErrors: { milestoneId: "Choose a milestone from your roadmap." } };
  }

  if (!result.ok && result.reason === "missing-task") {
    return { formError: "That task is no longer on your current study plan." };
  }

  if (!result.ok) {
    return { formError: "Something went wrong. Please try again." };
  }

  return { message, savedAt: Date.now() };
}

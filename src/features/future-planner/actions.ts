"use server";

import { redirect } from "next/navigation";
import {
  readGoalUpdate,
  validateGoalUpdate,
  type GoalFormState,
} from "@/features/future-planner/validation";
import { saveFuturePlannerGoal } from "@/services/future-planner";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const saveInFlight = new Map<string, Promise<GoalFormState>>();

export async function updateGoalAction(
  _previous: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = saveInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = persistGoal(user.id, formData).finally(() => {
    saveInFlight.delete(user.id);
  });
  saveInFlight.set(user.id, outcome);
  return outcome;
}

async function persistGoal(userId: string, formData: FormData): Promise<GoalFormState> {
  const { careerGoal, targetOutcome } = readGoalUpdate(formData);
  const fieldErrors = validateGoalUpdate(careerGoal, targetOutcome);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const result = await saveFuturePlannerGoal(userId, careerGoal, targetOutcome);

  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (!result.ok) {
    return { formError: "Something went wrong. Please try again." };
  }

  return { message: "Your goal is saved." };
}

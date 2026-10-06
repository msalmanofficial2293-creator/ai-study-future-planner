"use server";

import { redirect } from "next/navigation";
import {
  isEducationLevel,
  isLearningStyle,
  isSkillLevel,
  isWeeklyStudyTime,
} from "@/features/onboarding/options";
import {
  readText,
  validateOnboarding,
  type OnboardingFormState,
  type OnboardingInput,
} from "@/features/onboarding/validation";
import { saveOnboarding } from "@/services/onboarding";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const saveInFlight = new Map<string, Promise<OnboardingFormState>>();

export async function saveOnboardingAction(
  _previous: OnboardingFormState,
  formData: FormData,
): Promise<OnboardingFormState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = saveInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = persistOnboarding(user.id, formData).finally(() => {
    saveInFlight.delete(user.id);
  });
  saveInFlight.set(user.id, outcome);
  return outcome;
}

async function persistOnboarding(
  userId: string,
  formData: FormData,
): Promise<OnboardingFormState> {
  const input: OnboardingInput = {
    fullName: readText(formData, "fullName"),
    educationLevel: readText(formData, "educationLevel"),
    fieldOfStudy: readText(formData, "fieldOfStudy"),
    skillLevel: readText(formData, "skillLevel"),
    careerGoal: readText(formData, "careerGoal"),
    targetOutcome: readText(formData, "targetOutcome"),
    weeklyStudyTime: readText(formData, "weeklyStudyTime"),
    learningStyle: readText(formData, "learningStyle"),
  };
  const fieldErrors = validateOnboarding(input);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  if (
    !isEducationLevel(input.educationLevel) ||
    !isSkillLevel(input.skillLevel) ||
    !isWeeklyStudyTime(input.weeklyStudyTime) ||
    !isLearningStyle(input.learningStyle)
  ) {
    return { fieldErrors };
  }

  const result = await saveOnboarding(userId, {
    ...input,
    educationLevel: input.educationLevel,
    skillLevel: input.skillLevel,
    weeklyStudyTime: input.weeklyStudyTime,
    learningStyle: input.learningStyle,
  });

  if (result.ok || result.reason === "completed") {
    redirect("/app");
  }

  if (result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (result.reason === "missing-profile") {
    return {
      formError: "Your profile is not ready yet. Please try again in a moment.",
    };
  }

  return {
    formError: "Something went wrong. Please try again.",
  };
}

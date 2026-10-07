"use server";

import { redirect } from "next/navigation";
import {
  isEducationLevel,
  isLearningStyle,
  isSkillLevel,
  isWeeklyStudyTime,
} from "@/features/onboarding/options";
import {
  readProfileUpdate,
  validateProfileUpdate,
  type ProfileFormState,
} from "@/features/profile/validation";
import { saveProfile } from "@/services/profile";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const saveInFlight = new Map<string, Promise<ProfileFormState>>();

export async function saveProfileAction(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = saveInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = persistProfile(user.id, formData).finally(() => {
    saveInFlight.delete(user.id);
  });
  saveInFlight.set(user.id, outcome);
  return outcome;
}

async function persistProfile(userId: string, formData: FormData): Promise<ProfileFormState> {
  const input = readProfileUpdate(formData);
  const fieldErrors = validateProfileUpdate(input);

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

  const result = await saveProfile(userId, {
    fullName: input.fullName,
    educationLevel: input.educationLevel,
    fieldOfStudy: input.fieldOfStudy,
    skillLevel: input.skillLevel,
    weeklyStudyTime: input.weeklyStudyTime,
    learningStyle: input.learningStyle,
    username: input.username,
    bio: input.bio,
    careerGoal: input.careerGoal,
    targetOutcome: input.targetOutcome,
    interests: input.interests,
  });

  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (!result.ok && result.reason === "username-taken") {
    return { fieldErrors: { username: "That username is already taken." } };
  }

  if (!result.ok && result.reason === "missing") {
    return { formError: "Your profile is not ready yet. Please try again in a moment." };
  }

  if (!result.ok) {
    return { formError: "Something went wrong. Please try again." };
  }

  return { message: "Your profile is saved.", savedAt: Date.now() };
}

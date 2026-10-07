import { authMessages } from "@/features/auth/messages";
import {
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validateFullName,
  validatePassword,
} from "@/features/auth/validation";
import {
  CAREER_GOAL_MAX_LENGTH,
  FIELD_OF_STUDY_MAX_LENGTH,
  TARGET_OUTCOME_MAX_LENGTH,
  isEducationLevel,
  isLearningStyle,
  isSkillLevel,
  isWeeklyStudyTime,
} from "@/features/onboarding/options";
import { readText } from "@/features/onboarding/validation";

export const USERNAME_MAX_LENGTH = 30;
export const BIO_MAX_LENGTH = 280;
export const INTERESTS_MAX_LENGTH = 200;

const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export type ProfileFieldErrors = {
  fullName?: string;
  username?: string;
  bio?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  skillLevel?: string;
  weeklyStudyTime?: string;
  learningStyle?: string;
  careerGoal?: string;
  targetOutcome?: string;
  interests?: string;
};

export type PasswordFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export type PasswordFormState = {
  fieldErrors?: PasswordFieldErrors;
  formError?: string;
  message?: string;
  savedAt?: number;
};

export type ProfileFormState = {
  fieldErrors?: ProfileFieldErrors;
  formError?: string;
  message?: string;
  savedAt?: number;
};

export type ProfileFormInput = {
  fullName: string;
  username: string;
  bio: string;
  educationLevel: string;
  fieldOfStudy: string;
  skillLevel: string;
  weeklyStudyTime: string;
  learningStyle: string;
  careerGoal: string;
  targetOutcome: string;
  interests: string;
};

export function readProfileUpdate(formData: FormData): ProfileFormInput {
  return {
    fullName: readText(formData, "fullName"),
    username: readText(formData, "username").toLowerCase(),
    bio: readText(formData, "bio"),
    educationLevel: readText(formData, "educationLevel"),
    fieldOfStudy: readText(formData, "fieldOfStudy"),
    skillLevel: readText(formData, "skillLevel"),
    weeklyStudyTime: readText(formData, "weeklyStudyTime"),
    learningStyle: readText(formData, "learningStyle"),
    careerGoal: readText(formData, "careerGoal"),
    targetOutcome: readText(formData, "targetOutcome"),
    interests: readText(formData, "interests"),
  };
}

export function readChecked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export function validateProfileUpdate(input: ProfileFormInput): ProfileFieldErrors {
  return omitEmpty({
    fullName: validateFullName(input.fullName),
    username: validateUsername(input.username),
    bio: optionalBounded(input.bio, BIO_MAX_LENGTH, "Bio"),
    educationLevel: isEducationLevel(input.educationLevel)
      ? undefined
      : "Select your education level.",
    fieldOfStudy: bounded(input.fieldOfStudy, "Field or major is required.", FIELD_OF_STUDY_MAX_LENGTH, "Field or major"),
    skillLevel: isSkillLevel(input.skillLevel) ? undefined : "Select your current skill level.",
    weeklyStudyTime: isWeeklyStudyTime(input.weeklyStudyTime)
      ? undefined
      : "Select how much time you can study.",
    learningStyle: isLearningStyle(input.learningStyle)
      ? undefined
      : "Select a preferred learning style.",
    careerGoal: bounded(input.careerGoal, "Career goal is required.", CAREER_GOAL_MAX_LENGTH, "Career goal"),
    targetOutcome: bounded(
      input.targetOutcome,
      "Target outcome is required.",
      TARGET_OUTCOME_MAX_LENGTH,
      "Target outcome",
    ),
    interests: optionalBounded(input.interests, INTERESTS_MAX_LENGTH, "Interests"),
  });
}

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): PasswordFieldErrors {
  return omitEmpty({
    currentPassword: currentPassword ? undefined : "Current password is required.",
    newPassword: validatePassword(newPassword),
    confirmPassword: confirmPassword
      ? newPassword === confirmPassword
        ? undefined
        : authMessages.passwordMismatch
      : "Confirm your new password.",
  });
}

export function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? "Not set yet";
}

export function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export { FULL_NAME_MAX_LENGTH, FIELD_OF_STUDY_MAX_LENGTH, CAREER_GOAL_MAX_LENGTH, TARGET_OUTCOME_MAX_LENGTH, PASSWORD_MIN_LENGTH };

function validateUsername(value: string): string | undefined {
  if (!value) {
    return "Username is required.";
  }

  if (!USERNAME_PATTERN.test(value)) {
    return "Use 3 to 30 lowercase letters, numbers, or underscores.";
  }

  return undefined;
}

function optionalBounded(value: string, maxLength: number, label: string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (value.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }

  return undefined;
}

function bounded(value: string, requiredMessage: string, maxLength: number, label: string): string | undefined {
  if (!value) {
    return requiredMessage;
  }

  if (value.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }

  return undefined;
}

function omitEmpty<T extends Record<string, string | undefined>>(errors: T): T {
  return Object.fromEntries(Object.entries(errors).filter((entry) => entry[1])) as T;
}

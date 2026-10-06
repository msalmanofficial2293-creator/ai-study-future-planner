import { validateFullName } from "@/features/auth/validation";
import {
  CAREER_GOAL_MAX_LENGTH,
  FIELD_OF_STUDY_MAX_LENGTH,
  TARGET_OUTCOME_MAX_LENGTH,
  isEducationLevel,
  isLearningStyle,
  isSkillLevel,
  isWeeklyStudyTime,
} from "@/features/onboarding/options";

export type OnboardingFieldErrors = {
  fullName?: string;
  educationLevel?: string;
  fieldOfStudy?: string;
  skillLevel?: string;
  careerGoal?: string;
  targetOutcome?: string;
  weeklyStudyTime?: string;
  learningStyle?: string;
};

export type OnboardingFormState = {
  fieldErrors?: OnboardingFieldErrors;
  formError?: string;
};

export type OnboardingInput = {
  fullName: string;
  educationLevel: string;
  fieldOfStudy: string;
  skillLevel: string;
  careerGoal: string;
  targetOutcome: string;
  weeklyStudyTime: string;
  learningStyle: string;
};

export function readText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validateOnboarding(input: OnboardingInput): OnboardingFieldErrors {
  return omitEmpty({
    fullName: validateFullName(input.fullName),
    educationLevel: isEducationLevel(input.educationLevel)
      ? undefined
      : "Select your education level.",
    fieldOfStudy: validateFieldOfStudy(input.fieldOfStudy),
    skillLevel: isSkillLevel(input.skillLevel)
      ? undefined
      : "Select your current skill level.",
    careerGoal: validateBoundedText(
      input.careerGoal,
      "Career goal is required.",
      CAREER_GOAL_MAX_LENGTH,
      "Career goal",
    ),
    targetOutcome: validateBoundedText(
      input.targetOutcome,
      "Target outcome is required.",
      TARGET_OUTCOME_MAX_LENGTH,
      "Target outcome",
    ),
    weeklyStudyTime: isWeeklyStudyTime(input.weeklyStudyTime)
      ? undefined
      : "Select how much time you can study.",
    learningStyle: isLearningStyle(input.learningStyle)
      ? undefined
      : "Select a preferred learning style.",
  });
}

function validateFieldOfStudy(value: string): string | undefined {
  if (!value) {
    return "Field or major is required.";
  }

  if (value.length > FIELD_OF_STUDY_MAX_LENGTH) {
    return `Field or major must be ${FIELD_OF_STUDY_MAX_LENGTH} characters or fewer.`;
  }

  return undefined;
}

function validateBoundedText(
  value: string,
  requiredMessage: string,
  maxLength: number,
  label: string,
): string | undefined {
  if (!value) {
    return requiredMessage;
  }

  if (value.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }

  return undefined;
}

function omitEmpty(errors: OnboardingFieldErrors): OnboardingFieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter((entry) => entry[1]),
  ) as OnboardingFieldErrors;
}

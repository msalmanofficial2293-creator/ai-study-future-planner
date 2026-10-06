import { readText } from "@/features/onboarding/validation";
import {
  CAREER_GOAL_MAX_LENGTH,
  TARGET_OUTCOME_MAX_LENGTH,
} from "@/features/onboarding/options";

export type GoalFieldErrors = {
  careerGoal?: string;
  targetOutcome?: string;
};

export type GoalFormState = {
  fieldErrors?: GoalFieldErrors;
  formError?: string;
  message?: string;
};

export function readGoalUpdate(formData: FormData): {
  careerGoal: string;
  targetOutcome: string;
} {
  return {
    careerGoal: readText(formData, "careerGoal"),
    targetOutcome: readText(formData, "targetOutcome"),
  };
}

export function validateGoalUpdate(careerGoal: string, targetOutcome: string): GoalFieldErrors {
  return omitEmpty({
    careerGoal: validateBoundedText(
      careerGoal,
      "Career goal is required.",
      CAREER_GOAL_MAX_LENGTH,
      "Career goal",
    ),
    targetOutcome: validateBoundedText(
      targetOutcome,
      "Target outcome is required.",
      TARGET_OUTCOME_MAX_LENGTH,
      "Target outcome",
    ),
  });
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

function omitEmpty(errors: GoalFieldErrors): GoalFieldErrors {
  return Object.fromEntries(
    Object.entries(errors).filter((entry) => entry[1]),
  ) as GoalFieldErrors;
}

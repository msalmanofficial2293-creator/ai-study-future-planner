export const CAREER_GOAL_MAX_LENGTH = 160;
export const TARGET_OUTCOME_MAX_LENGTH = 600;
export const FIELD_OF_STUDY_MAX_LENGTH = 120;

export const EDUCATION_LEVELS = [
  { value: "secondary", label: "Secondary school" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
  { value: "bootcamp", label: "Bootcamp or certificate" },
  { value: "professional", label: "Working professional" },
  { value: "other", label: "Other" },
] as const;

export const SKILL_LEVELS = [
  { value: "beginner", label: "Beginning" },
  { value: "intermediate", label: "Comfortable with the basics" },
  { value: "advanced", label: "Already practicing in this field" },
] as const;

export const WEEKLY_STUDY_TIMES = [
  { value: "under_5", label: "Under 5 hours" },
  { value: "5_to_10", label: "5 to 10 hours" },
  { value: "10_to_20", label: "10 to 20 hours" },
  { value: "over_20", label: "More than 20 hours" },
] as const;

export const LEARNING_STYLES = [
  { value: "reading", label: "Reading and notes" },
  { value: "practice", label: "Practice and projects" },
  { value: "video", label: "Video and lectures" },
  { value: "mixed", label: "A mix of these" },
] as const;

export type EducationLevel = (typeof EDUCATION_LEVELS)[number]["value"];
export type SkillLevel = (typeof SKILL_LEVELS)[number]["value"];
export type WeeklyStudyTime = (typeof WEEKLY_STUDY_TIMES)[number]["value"];
export type LearningStyle = (typeof LEARNING_STYLES)[number]["value"];

export function isEducationLevel(value: string): value is EducationLevel {
  return EDUCATION_LEVELS.some((option) => option.value === value);
}

export function isSkillLevel(value: string): value is SkillLevel {
  return SKILL_LEVELS.some((option) => option.value === value);
}

export function isWeeklyStudyTime(value: string): value is WeeklyStudyTime {
  return WEEKLY_STUDY_TIMES.some((option) => option.value === value);
}

export function isLearningStyle(value: string): value is LearningStyle {
  return LEARNING_STYLES.some((option) => option.value === value);
}

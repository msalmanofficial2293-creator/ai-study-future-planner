"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { saveOnboardingAction } from "@/features/onboarding/actions";
import {
  CAREER_GOAL_MAX_LENGTH,
  EDUCATION_LEVELS,
  FIELD_OF_STUDY_MAX_LENGTH,
  LEARNING_STYLES,
  SKILL_LEVELS,
  TARGET_OUTCOME_MAX_LENGTH,
  WEEKLY_STUDY_TIMES,
} from "@/features/onboarding/options";
import {
  type OnboardingFormState,
  type OnboardingInput,
} from "@/features/onboarding/validation";

const initialState: OnboardingFormState = {};

type OnboardingFormProps = {
  draft: OnboardingInput;
};

export function OnboardingForm({ draft }: OnboardingFormProps) {
  const [state, formAction, pending] = useActionState(saveOnboardingAction, initialState);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!pending) {
      submitLock.current = false;
    }
  }, [pending]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current) {
      event.preventDefault();
      return;
    }

    submitLock.current = true;
  }

  return (
    <form
      action={formAction}
      className="grid gap-5 sm:grid-cols-2"
      aria-busy={pending}
      noValidate
      onSubmit={handleSubmit}
    >
      {state.formError ? (
        <p className="field-error sm:col-span-2" role="alert">
          Error: {state.formError}
        </p>
      ) : null}
      <Field id="full-name" label="Full name" error={state.fieldErrors?.fullName}>
        {(control) => (
          <Input
            {...control}
            name="fullName"
            type="text"
            autoComplete="name"
            defaultValue={draft.fullName}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="education-level"
        label="Education level"
        error={state.fieldErrors?.educationLevel}
      >
        {(control) => (
          <Select
            {...control}
            name="educationLevel"
            defaultValue={draft.educationLevel}
            required
            disabled={pending}
          >
            <option value="">Select education level</option>
            {EDUCATION_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        id="field-of-study"
        label="Field or major"
        error={state.fieldErrors?.fieldOfStudy}
      >
        {(control) => (
          <Input
            {...control}
            name="fieldOfStudy"
            type="text"
            autoComplete="organization-title"
            defaultValue={draft.fieldOfStudy}
            maxLength={FIELD_OF_STUDY_MAX_LENGTH}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="skill-level"
        label="Current skill level"
        error={state.fieldErrors?.skillLevel}
      >
        {(control) => (
          <Select
            {...control}
            name="skillLevel"
            defaultValue={draft.skillLevel}
            required
            disabled={pending}
          >
            <option value="">Select skill level</option>
            {SKILL_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        id="career-goal"
        label="Career goal"
        description="The future you are studying toward."
        error={state.fieldErrors?.careerGoal}
        className="sm:col-span-2"
      >
        {(control) => (
          <Input
            {...control}
            name="careerGoal"
            type="text"
            defaultValue={draft.careerGoal}
            maxLength={CAREER_GOAL_MAX_LENGTH}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="target-outcome"
        label="Target outcome"
        description="What you want to be able to do."
        error={state.fieldErrors?.targetOutcome}
        className="sm:col-span-2"
      >
        {(control) => (
          <Textarea
            {...control}
            name="targetOutcome"
            defaultValue={draft.targetOutcome}
            maxLength={TARGET_OUTCOME_MAX_LENGTH}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="weekly-study-time"
        label="Available study time"
        description="Hours you can study in a typical week."
        error={state.fieldErrors?.weeklyStudyTime}
      >
        {(control) => (
          <Select
            {...control}
            name="weeklyStudyTime"
            defaultValue={draft.weeklyStudyTime}
            required
            disabled={pending}
          >
            <option value="">Select study time</option>
            {WEEKLY_STUDY_TIMES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field
        id="learning-style"
        label="Preferred learning style"
        error={state.fieldErrors?.learningStyle}
      >
        {(control) => (
          <Select
            {...control}
            name="learningStyle"
            defaultValue={draft.learningStyle}
            required
            disabled={pending}
          >
            <option value="">Select learning style</option>
            {LEARNING_STYLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" loading={pending} disabled={pending}>
          {pending ? "Saving your goal" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}

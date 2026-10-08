"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form-controls";
import {
  LEARNING_STYLES,
  SKILL_LEVELS,
  WEEKLY_STUDY_TIMES,
} from "@/features/onboarding/options";
import { saveLearningPreferencesAction } from "@/features/profile/account-actions";
import type { ProfileFormState } from "@/features/profile/validation";
import type { ProfileRecord } from "@/services/profile";

const initialState: ProfileFormState = {};

type LearningPreferencesFormProps = {
  profile: ProfileRecord;
};

export function LearningPreferencesForm({ profile }: LearningPreferencesFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveLearningPreferencesAction, initialState);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!pending) {
      submitLock.current = false;
    }
  }, [pending]);

  useEffect(() => {
    if (!state.savedAt) {
      return;
    }

    router.refresh();
  }, [router, state.savedAt]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current || pending) {
      event.preventDefault();
      return;
    }

    submitLock.current = true;
  }

  return (
    <form
      key={`${profile.skillLevel}-${profile.learningStyle}-${profile.weeklyStudyTime}-${state.savedAt ?? 0}`}
      action={formAction}
      className="grid gap-5 sm:grid-cols-2"
      aria-busy={pending}
      onSubmit={handleSubmit}
    >
      {state.message ? (
        <p className="rounded-2xl bg-success-surface px-4 py-3 text-success sm:col-span-2" role="status">
          {state.message}
        </p>
      ) : null}
      {state.formError ? (
        <p className="field-error sm:col-span-2" role="alert">
          Error: {state.formError}
        </p>
      ) : null}

      <Field id="settings-skill-level" label="Preferred difficulty / skill level" error={state.fieldErrors?.skillLevel}>
        {(control) => (
          <Select {...control} name="skillLevel" defaultValue={profile.skillLevel} required disabled={pending}>
            <option value="">Select skill level</option>
            {SKILL_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field id="settings-learning-style" label="Learning style" error={state.fieldErrors?.learningStyle}>
        {(control) => (
          <Select
            {...control}
            name="learningStyle"
            defaultValue={profile.learningStyle}
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

      <Field
        id="settings-weekly-study-time"
        label="Weekly study time"
        error={state.fieldErrors?.weeklyStudyTime}
        className="sm:col-span-2"
      >
        {(control) => (
          <Select
            {...control}
            name="weeklyStudyTime"
            defaultValue={profile.weeklyStudyTime}
            required
            disabled={pending}
          >
            <option value="">Select weekly study time</option>
            {WEEKLY_STUDY_TIMES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <p className="body-secondary sm:col-span-2">
        These preferences can influence personalized recommendations and adaptive plan suggestions
        when personalization has enough study evidence.
      </p>

      <div className="sm:col-span-2">
        <Button type="submit" loading={pending} disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving" : "Save learning preferences"}
        </Button>
      </div>
    </form>
  );
}

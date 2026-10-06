"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { updateGoalAction } from "@/features/future-planner/actions";
import {
  CAREER_GOAL_MAX_LENGTH,
  TARGET_OUTCOME_MAX_LENGTH,
} from "@/features/onboarding/options";
import type { GoalFormState } from "@/features/future-planner/validation";

const initialState: GoalFormState = {};

type GoalFormProps = {
  careerGoal: string;
  targetOutcome: string;
};

export function GoalForm({ careerGoal, targetOutcome }: GoalFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateGoalAction, initialState);
  const submitLock = useRef(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (!pending) {
      submitLock.current = false;
    }
  }, [pending]);

  useEffect(() => {
    if (wasPending.current && !pending && state.message) {
      router.refresh();
    }

    wasPending.current = pending;
  }, [pending, router, state.message]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current) {
      event.preventDefault();
      return;
    }

    submitLock.current = true;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" aria-busy={pending} noValidate onSubmit={handleSubmit}>
      {state.formError ? (
        <p className="field-error" role="alert">
          Error: {state.formError}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
          {state.message}
        </p>
      ) : null}
      <Field
        id="career-goal"
        label="Career goal"
        description="The future you are studying toward."
        error={state.fieldErrors?.careerGoal}
      >
        {(control) => (
          <Input
            {...control}
            name="careerGoal"
            type="text"
            defaultValue={careerGoal}
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
      >
        {(control) => (
          <Textarea
            {...control}
            name="targetOutcome"
            defaultValue={targetOutcome}
            maxLength={TARGET_OUTCOME_MAX_LENGTH}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Button type="submit" loading={pending} disabled={pending}>
        {pending ? "Saving your goal" : "Save goal"}
      </Button>
    </form>
  );
}

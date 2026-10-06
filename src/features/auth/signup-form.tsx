"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { signupAction } from "@/features/auth/actions";
import { PASSWORD_MIN_LENGTH, type AuthFormState } from "@/features/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
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
      className="flex flex-col gap-5"
      aria-busy={pending}
      noValidate
      onSubmit={handleSubmit}
    >
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
      <Field id="full-name" label="Full name" error={state.fieldErrors?.fullName}>
        {(control) => (
          <Input
            {...control}
            name="fullName"
            type="text"
            autoComplete="name"
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field id="email" label="Email" error={state.fieldErrors?.email}>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="password"
        label="Password"
        description={`Use at least ${PASSWORD_MIN_LENGTH} characters.`}
        error={state.fieldErrors?.password}
      >
        {(control) => (
          <Input
            {...control}
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="confirm-password"
        label="Confirm password"
        error={state.fieldErrors?.confirmPassword}
      >
        {(control) => (
          <Input
            {...control}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Button type="submit" loading={pending} disabled={pending}>
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { resendVerificationAction } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

type ResendVerificationFormProps = {
  initialEmail?: string;
  compact?: boolean;
};

const initialState: AuthFormState = {};

export function ResendVerificationForm({
  initialEmail = "",
  compact = false,
}: ResendVerificationFormProps) {
  const [state, formAction, pending] = useActionState(resendVerificationAction, initialState);
  const submitLock = useRef(false);
  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    if (!pending) {
      submitLock.current = false;
    }
  }, [pending]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current || pending) {
      event.preventDefault();
      return;
    }

    if (!email.trim()) {
      event.preventDefault();
      return;
    }

    submitLock.current = true;
  }

  return (
    <form
      action={formAction}
      className={compact ? "mt-4 flex flex-col gap-3" : "flex flex-col gap-4"}
      aria-busy={pending}
      noValidate
      onSubmit={handleSubmit}
    >
      <p className="caption">
        Did not get the email? Enter the same address and resend the verification link.
      </p>
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
      <Field id="resend-email" label="Email" error={state.fieldErrors?.email}>
        {(control) => (
          <Input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
      </Field>
      <Button type="submit" variant="secondary" loading={pending} disabled={pending || !email.trim()}>
        {pending ? "Sending" : "Resend verification email"}
      </Button>
    </form>
  );
}

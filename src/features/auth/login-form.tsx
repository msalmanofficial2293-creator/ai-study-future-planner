"use client";

import { useActionState } from "react";
import { loginAction } from "@/features/auth/actions";
import { ResendVerificationForm } from "@/features/auth/resend-verification-form";
import type { AuthFormState } from "@/features/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

type LoginFormProps = {
  initialError?: string;
  showResend?: boolean;
};

export function LoginForm({ initialError, showResend = false }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    { formError: initialError },
  );

  const needsResend = showResend || Boolean(state.needsVerification);

  return (
    <div className="flex flex-col gap-5">
      <form action={formAction} className="flex flex-col gap-5" aria-busy={pending} noValidate>
        {state.formError ? (
          <p className="field-error" role="alert">
            Error: {state.formError}
          </p>
        ) : null}
        <Field id="email" label="Email" error={state.fieldErrors?.email}>
          {(control) => (
            <Input
              {...control}
              key={state.pendingEmail ? `email-${state.pendingEmail}` : "email"}
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
              defaultValue={state.pendingEmail}
            />
          )}
        </Field>
        <Field id="password" label="Password" error={state.fieldErrors?.password}>
          {(control) => (
            <Input
              {...control}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          )}
        </Field>
        <Button type="submit" loading={pending} disabled={pending}>
          {pending ? "Logging in" : "Log in"}
        </Button>
      </form>
      {needsResend ? (
        <div className="border-t border-border pt-5">
          <ResendVerificationForm
            key={state.pendingEmail ?? "resend"}
            initialEmail={state.pendingEmail ?? ""}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}

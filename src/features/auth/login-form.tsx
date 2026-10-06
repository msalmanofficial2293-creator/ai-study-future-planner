"use client";

import { useActionState } from "react";
import { loginAction } from "@/features/auth/actions";
import type { AuthFormState } from "@/features/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

type LoginFormProps = {
  initialError?: string;
};

export function LoginForm({ initialError }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    loginAction,
    { formError: initialError },
  );

  return (
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
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
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
  );
}

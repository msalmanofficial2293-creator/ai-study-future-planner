"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { changePasswordAction } from "@/features/profile/account-actions";
import {
  PASSWORD_MIN_LENGTH,
  type PasswordFormState,
} from "@/features/profile/validation";

const passwordInitial: PasswordFormState = {};

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, passwordInitial);
  const submitLock = useRef(false);

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

    submitLock.current = true;
  }

  return (
    <form
      key={state.savedAt ?? "password"}
      action={formAction}
      className="grid gap-5 md:grid-cols-2"
      aria-busy={pending}
      noValidate
      onSubmit={handleSubmit}
    >
      {state.message ? (
        <p className="rounded-2xl bg-success-surface px-4 py-3 text-success md:col-span-2" role="status">
          {state.message}
        </p>
      ) : null}
      {state.formError ? (
        <p className="field-error md:col-span-2" role="alert">
          Error: {state.formError}
        </p>
      ) : null}
      <Field id="settings-current-password" label="Current password" error={state.fieldErrors?.currentPassword}>
        {(control) => (
          <Input
            {...control}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="settings-new-password"
        label="New password"
        description={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        error={state.fieldErrors?.newPassword}
      >
        {(control) => (
          <Input
            {...control}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            disabled={pending}
          />
        )}
      </Field>
      <Field
        id="settings-confirm-password"
        label="Confirm new password"
        error={state.fieldErrors?.confirmPassword}
        className="md:col-span-2"
      >
        {(control) => (
          <Input
            {...control}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
          />
        )}
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" loading={pending} disabled={pending} className="w-full sm:w-auto">
          {pending ? "Updating password" : "Change password"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { signupAction } from "@/features/auth/actions";
import { PasswordRequirements } from "@/features/auth/password-requirements";
import { isPasswordPolicyMet } from "@/features/auth/password-policy";
import {
  validateEmail,
  validateFullName,
  validateSignup,
  type AuthFormState,
} from "@/features/auth/validation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

const initialState: AuthFormState = {};
const PASSWORD_REQUIREMENTS_ID = "password-requirements";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const submitLock = useRef(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<AuthFormState["fieldErrors"]>();

  useEffect(() => {
    if (!pending) {
      submitLock.current = false;
    }
  }, [pending]);

  const passwordValid = isPasswordPolicyMet(password);
  const requiredComplete =
    Boolean(fullName.trim()) &&
    !validateFullName(fullName.trim()) &&
    !validateEmail(email.trim()) &&
    passwordValid &&
    Boolean(confirmPassword) &&
    password === confirmPassword;
  const canSubmit = requiredComplete && !pending;

  const passwordError = clientErrors?.password ?? state.fieldErrors?.password;
  const confirmError = clientErrors?.confirmPassword ?? state.fieldErrors?.confirmPassword;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current) {
      event.preventDefault();
      return;
    }

    const fieldErrors = validateSignup(fullName.trim(), email.trim(), password, confirmPassword);

    if (Object.keys(fieldErrors).length > 0) {
      event.preventDefault();
      setClientErrors(fieldErrors);
      submitLock.current = false;
      return;
    }

    setClientErrors(undefined);
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
      <Field
        id="full-name"
        label="Full name"
        error={clientErrors?.fullName ?? state.fieldErrors?.fullName}
      >
        {(control) => (
          <Input
            {...control}
            name="fullName"
            type="text"
            autoComplete="name"
            required
            disabled={pending}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        )}
      </Field>
      <Field id="email" label="Email" error={clientErrors?.email ?? state.fieldErrors?.email}>
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
      <div>
        <Field id="password" label="Password" error={passwordError}>
          {(control) => (
            <Input
              {...control}
              name="password"
              type="password"
              autoComplete="new-password"
              required
              disabled={pending}
              value={password}
              describedBy={[control.describedBy, PASSWORD_REQUIREMENTS_ID]
                .filter(Boolean)
                .join(" ")}
              invalid={Boolean(passwordError) || (password.length > 0 && !passwordValid)}
              onChange={(event) => {
                setPassword(event.target.value);
                setClientErrors((current) =>
                  current ? { ...current, password: undefined } : current,
                );
              }}
            />
          )}
        </Field>
        <PasswordRequirements password={password} id={PASSWORD_REQUIREMENTS_ID} />
      </div>
      <Field id="confirm-password" label="Confirm password" error={confirmError}>
        {(control) => (
          <Input
            {...control}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
            value={confirmPassword}
            invalid={
              Boolean(confirmError) ||
              (confirmPassword.length > 0 && confirmPassword !== password)
            }
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setClientErrors((current) =>
                current ? { ...current, confirmPassword: undefined } : current,
              );
            }}
          />
        )}
      </Field>
      {confirmPassword.length > 0 && confirmPassword !== password ? (
        <p className="field-error -mt-3" role="status">
          Passwords do not match.
        </p>
      ) : null}
      <Button type="submit" loading={pending} disabled={!canSubmit}>
        {pending ? "Creating account" : "Create account"}
      </Button>
    </form>
  );
}

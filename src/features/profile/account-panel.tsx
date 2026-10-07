"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Field, Input } from "@/components/ui/form-controls";
import { LogoutButton } from "@/features/auth/logout-button";
import { changePasswordAction, saveNotificationsAction } from "@/features/profile/account-actions";
import {
  PASSWORD_MIN_LENGTH,
  type PasswordFormState,
  type ProfileFormState,
} from "@/features/profile/validation";
import type { ProfileRecord } from "@/services/profile";

const passwordInitial: PasswordFormState = {};
const notificationInitial: ProfileFormState = {};

type AccountPanelProps = {
  profile: ProfileRecord;
};

export function AccountPanel({ profile }: AccountPanelProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <section id="account" className="card card-raised scroll-mt-24">
      <h2 className="card-heading">Account</h2>
      <p className="caption">Password, notifications, and sign-in.</p>
      <PasswordForm />
      <NotificationForm profile={profile} />
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
        <LogoutButton />
        <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
          Delete account
        </Button>
      </div>
      <Dialog
        open={deleteOpen}
        title="Delete account"
        description="Account deletion is not available yet. Your profile, goals, and sign-in stay in place."
        onClose={() => setDeleteOpen(false)}
      />
    </section>
  );
}

function PasswordForm() {
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
      className="grid gap-5 border-t border-border pt-4 md:grid-cols-2"
      aria-busy={pending}
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="md:col-span-2">
        <h3 className="font-medium">Change password</h3>
      </div>
      {state.message ? <Status message={state.message} /> : null}
      {state.formError ? <FormAlert message={state.formError} /> : null}
      <Field id="current-password" label="Current password" error={state.fieldErrors?.currentPassword}>
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
        id="new-password"
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
        id="confirm-password"
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

function NotificationForm({ profile }: AccountPanelProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(saveNotificationsAction, notificationInitial);
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
      key={`${profile.notifyStudyReminders}-${profile.notifyProductUpdates}-${state.savedAt ?? 0}`}
      action={formAction}
      className="flex flex-col gap-4 border-t border-border pt-4"
      aria-busy={pending}
      onSubmit={handleSubmit}
    >
      <h3 className="font-medium">Notification preferences</h3>
      {state.message ? <Status message={state.message} /> : null}
      {state.formError ? <FormAlert message={state.formError} /> : null}
      <Checkbox
        id="study-reminders"
        name="notifyStudyReminders"
        label="Study reminders"
        defaultChecked={profile.notifyStudyReminders}
        disabled={pending}
      />
      <Checkbox
        id="product-updates"
        name="notifyProductUpdates"
        label="Product updates"
        defaultChecked={profile.notifyProductUpdates}
        disabled={pending}
      />
      <Button type="submit" variant="secondary" loading={pending} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving preferences" : "Save preferences"}
      </Button>
    </form>
  );
}

function Status({ message }: { message: string }) {
  return (
    <p className="rounded-2xl bg-success-surface px-4 py-3 text-success md:col-span-2" role="status">
      {message}
    </p>
  );
}

function FormAlert({ message }: { message: string }) {
  return (
    <p className="field-error md:col-span-2" role="alert">
      Error: {message}
    </p>
  );
}

"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/form-controls";
import { saveNotificationsAction } from "@/features/profile/account-actions";
import type { ProfileFormState } from "@/features/profile/validation";
import type { ProfileRecord } from "@/services/profile";

const notificationInitial: ProfileFormState = {};

type NotificationFormProps = {
  profile: ProfileRecord;
};

export function NotificationForm({ profile }: NotificationFormProps) {
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
      className="flex flex-col gap-4"
      aria-busy={pending}
      onSubmit={handleSubmit}
    >
      {state.message ? (
        <p className="rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
          {state.message}
        </p>
      ) : null}
      {state.formError ? (
        <p className="field-error" role="alert">
          Error: {state.formError}
        </p>
      ) : null}

      <div>
        <Checkbox
          id="settings-study-reminders"
          name="notifyStudyReminders"
          label="Learning and study reminders"
          defaultChecked={profile.notifyStudyReminders}
          disabled={pending}
        />
        <p className="caption mt-1 pl-7">Saved preference for future learning reminders.</p>
      </div>
      <div>
        <Checkbox
          id="settings-product-updates"
          name="notifyProductUpdates"
          label="Product updates"
          defaultChecked={profile.notifyProductUpdates}
          disabled={pending}
        />
        <p className="caption mt-1 pl-7">Saved preference for future product announcements.</p>
      </div>

      <fieldset className="rounded-2xl border border-dashed border-border bg-paper-raised px-4 py-3">
        <legend className="px-1 text-sm font-medium text-ink">Coming later</legend>
        <ul className="mt-2 flex flex-col gap-3">
          <li>
            <Checkbox id="settings-quiz-reminders" name="notifyQuizReminders" label="Quiz reminders" disabled />
            <p className="caption mt-1 pl-7">Not available yet. Delivery is not implemented.</p>
          </li>
          <li>
            <Checkbox id="settings-tutor-updates" name="notifyTutorUpdates" label="AI Tutor updates" disabled />
            <p className="caption mt-1 pl-7">Not available yet. Delivery is not implemented.</p>
          </li>
        </ul>
      </fieldset>

      <p className="body-secondary">
        Notification preferences will control future learning reminders. No reminder emails or push
        messages are sent yet.
      </p>

      <Button type="submit" variant="secondary" loading={pending} disabled={pending} className="w-full sm:w-auto">
        {pending ? "Saving" : "Save preferences"}
      </Button>
    </form>
  );
}

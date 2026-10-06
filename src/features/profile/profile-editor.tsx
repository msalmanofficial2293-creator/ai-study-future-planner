"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { saveProfileAction } from "@/features/profile/actions";
import {
  CAREER_GOAL_MAX_LENGTH,
  FIELD_OF_STUDY_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  TARGET_OUTCOME_MAX_LENGTH,
  optionLabel,
  profileInitials,
  type ProfileFormState,
} from "@/features/profile/validation";
import {
  EDUCATION_LEVELS,
  LEARNING_STYLES,
  SKILL_LEVELS,
  WEEKLY_STUDY_TIMES,
} from "@/features/onboarding/options";
import type { ProfileRecord } from "@/services/profile";

const initialState: ProfileFormState = {};

type ProfileEditorProps = {
  profile: ProfileRecord;
};

export function ProfileEditor({ profile }: ProfileEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [dismissedAt, setDismissedAt] = useState(0);
  const [state, formAction, pending] = useActionState(saveProfileAction, initialState);
  const submitLock = useRef(false);
  const saved = state.savedAt !== undefined && state.savedAt !== dismissedAt;
  const showForm = editing && !saved;

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

  function startEditing() {
    setDismissedAt(state.savedAt ?? 0);
    setFormKey((key) => key + 1);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current || pending) {
      event.preventDefault();
      return;
    }

    submitLock.current = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <ProfileIdentity name={profile.fullName} email={profile.email} />
      {saved && state.message ? (
        <p className="rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
          {state.message}
        </p>
      ) : null}
      {showForm ? (
        <form
          key={formKey}
          action={formAction}
          className="grid gap-5 sm:grid-cols-2"
          aria-busy={pending}
          noValidate
          onSubmit={handleSubmit}
        >
          {state.formError ? (
            <p className="field-error sm:col-span-2" role="alert">
              Error: {state.formError}
            </p>
          ) : null}
          <Field id="full-name" label="Full name" error={state.fieldErrors?.fullName}>
            {(control) => (
              <Input
                {...control}
                name="fullName"
                type="text"
                autoComplete="name"
                defaultValue={profile.fullName}
                maxLength={FULL_NAME_MAX_LENGTH}
                required
                disabled={pending}
              />
            )}
          </Field>
          <Field id="email" label="Email" description="Email is managed by your account and cannot be changed here.">
            {(control) => (
              <Input {...control} type="email" defaultValue={profile.email} readOnly />
            )}
          </Field>
          <Field id="education-level" label="Education level" error={state.fieldErrors?.educationLevel}>
            {(control) => (
              <Select
                {...control}
                name="educationLevel"
                defaultValue={profile.educationLevel}
                required
                disabled={pending}
              >
                <option value="">Select education level</option>
                {EDUCATION_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="field-of-study" label="Field of study" error={state.fieldErrors?.fieldOfStudy}>
            {(control) => (
              <Input
                {...control}
                name="fieldOfStudy"
                type="text"
                defaultValue={profile.fieldOfStudy}
                maxLength={FIELD_OF_STUDY_MAX_LENGTH}
                required
                disabled={pending}
              />
            )}
          </Field>
          <Field id="skill-level" label="Skill level" error={state.fieldErrors?.skillLevel}>
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
          <Field id="weekly-study-time" label="Weekly study time" error={state.fieldErrors?.weeklyStudyTime}>
            {(control) => (
              <Select
                {...control}
                name="weeklyStudyTime"
                defaultValue={profile.weeklyStudyTime}
                required
                disabled={pending}
              >
                <option value="">Select study time</option>
                {WEEKLY_STUDY_TIMES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="learning-style" label="Learning style" error={state.fieldErrors?.learningStyle}>
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
          <Field id="career-goal" label="Career goal" error={state.fieldErrors?.careerGoal} className="sm:col-span-2">
            {(control) => (
              <Input
                {...control}
                name="careerGoal"
                type="text"
                defaultValue={profile.careerGoal}
                maxLength={CAREER_GOAL_MAX_LENGTH}
                required
                disabled={pending}
              />
            )}
          </Field>
          <Field
            id="target-outcome"
            label="Target outcome"
            error={state.fieldErrors?.targetOutcome}
            className="sm:col-span-2"
          >
            {(control) => (
              <Textarea
                {...control}
                name="targetOutcome"
                defaultValue={profile.targetOutcome}
                maxLength={TARGET_OUTCOME_MAX_LENGTH}
                required
                disabled={pending}
              />
            )}
          </Field>
          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
            <Button type="submit" loading={pending} disabled={pending}>
              {pending ? "Saving changes" : "Save Changes"}
            </Button>
            <Button type="button" variant="secondary" onClick={cancelEditing} disabled={pending}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Full name" value={profile.fullName || "Not set yet"} />
            <Detail label="Email" value={profile.email} />
            <Detail label="Education level" value={optionLabel(EDUCATION_LEVELS, profile.educationLevel)} />
            <Detail label="Field of study" value={profile.fieldOfStudy || "Not set yet"} />
            <Detail label="Skill level" value={optionLabel(SKILL_LEVELS, profile.skillLevel)} />
            <Detail label="Weekly study time" value={optionLabel(WEEKLY_STUDY_TIMES, profile.weeklyStudyTime)} />
            <Detail label="Learning style" value={optionLabel(LEARNING_STYLES, profile.learningStyle)} />
            <Detail label="Career goal" value={profile.careerGoal || "Not set yet"} />
            <Detail label="Target outcome" value={profile.targetOutcome || "Not set yet"} />
          </dl>
          <div>
            <Button type="button" onClick={startEditing}>
              Edit Profile
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileIdentity({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div
        className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ink"
        aria-hidden="true"
      >
        <span
          className="text-xl font-medium"
          style={{ color: "var(--paper)", fontFamily: "var(--font-display), Georgia, serif" }}
        >
          {profileInitials(name)}
        </span>
      </div>
      <div className="min-w-0">
        <p className="card-heading">{name || "Your profile"}</p>
        <p className="body-secondary truncate">{email}</p>
        <p className="caption mt-1">A photo can be added later. This mark uses your initials, and no image is stored.</p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className={label === "Target outcome" ? "sm:col-span-2" : undefined}>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}

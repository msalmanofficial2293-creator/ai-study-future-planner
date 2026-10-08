"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { AccountPanel } from "@/features/profile/account-panel";
import { saveProfileAction } from "@/features/profile/actions";
import {
  BIO_MAX_LENGTH,
  CAREER_GOAL_MAX_LENGTH,
  FIELD_OF_STUDY_MAX_LENGTH,
  FULL_NAME_MAX_LENGTH,
  INTERESTS_MAX_LENGTH,
  TARGET_OUTCOME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  optionLabel,
  profileCompletionPercent,
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

const sections = [
  { href: "#profile-header", label: "Overview" },
  { href: "#personal", label: "Personal" },
  { href: "#education", label: "Education" },
  { href: "#goals", label: "Goals" },
  { href: "#account", label: "Account" },
];

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
    <div className="flex min-w-0 flex-col gap-6">
      <nav aria-label="Profile sections" className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((section) => (
          <a key={section.href} href={section.href} className="nav-link whitespace-nowrap">
            {section.label}
          </a>
        ))}
      </nav>
      <div className="flex min-w-0 flex-col gap-6">
        <ProfileHeader profile={profile} editing={showForm} onEdit={startEditing} />
        {saved && state.message ? (
          <p className="rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
            {state.message}
          </p>
        ) : null}
        {showForm ? (
          <form
            key={formKey}
            action={formAction}
            className="flex flex-col gap-6"
            aria-busy={pending}
            noValidate
            onSubmit={handleSubmit}
          >
            {state.formError ? (
              <p className="field-error" role="alert">
                Error: {state.formError}
              </p>
            ) : null}
            <Section id="personal" title="Personal information" description="How you appear on your account.">
              <div className="grid gap-5 md:grid-cols-2">
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
                <Field
                  id="username"
                  label="Username"
                  description="3 to 30 lowercase letters, numbers, or underscores."
                  error={state.fieldErrors?.username}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="username"
                      type="text"
                      autoComplete="username"
                      defaultValue={profile.username}
                      maxLength={USERNAME_MAX_LENGTH}
                      required
                      disabled={pending}
                    />
                  )}
                </Field>
                <Field
                  id="email"
                  label="Email"
                  description="Email is managed by your account and cannot be changed here."
                  className="md:col-span-2"
                >
                  {(control) => <Input {...control} type="email" defaultValue={profile.email} readOnly />}
                </Field>
                <Field id="bio" label="Bio" description="Optional." error={state.fieldErrors?.bio} className="md:col-span-2">
                  {(control) => (
                    <Textarea
                      {...control}
                      name="bio"
                      defaultValue={profile.bio}
                      maxLength={BIO_MAX_LENGTH}
                      disabled={pending}
                    />
                  )}
                </Field>
              </div>
            </Section>
            <Section id="education" title="Education and learning" description="The context used for your study plan.">
              <div className="grid gap-5 md:grid-cols-2">
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
              </div>
            </Section>
            <Section id="goals" title="Career and goals" description="The future you are studying toward.">
              <div className="grid gap-5">
                <Field id="career-goal" label="Career goal" error={state.fieldErrors?.careerGoal}>
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
                <Field id="target-outcome" label="Target outcome" error={state.fieldErrors?.targetOutcome}>
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
                <Field
                  id="interests"
                  label="Interests"
                  description="Optional. Separate topics with commas."
                  error={state.fieldErrors?.interests}
                >
                  {(control) => (
                    <Input
                      {...control}
                      name="interests"
                      type="text"
                      defaultValue={profile.interests}
                      maxLength={INTERESTS_MAX_LENGTH}
                      disabled={pending}
                    />
                  )}
                </Field>
              </div>
            </Section>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" loading={pending} disabled={pending} className="w-full sm:w-auto">
                {pending ? "Saving changes" : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={cancelEditing}
                disabled={pending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-6">
            <Section id="personal" title="Personal information" description="How you appear on your account.">
              <dl className="grid gap-4 md:grid-cols-2">
                <Detail label="Full name" value={profile.fullName || "Not set yet"} />
                <Detail label="Username" value={profile.username ? `@${profile.username}` : "Not set yet"} />
                <Detail label="Email" value={profile.email} />
                <Detail label="Bio" value={profile.bio || "Not set yet"} wide />
              </dl>
            </Section>
            <Section id="education" title="Education and learning" description="The context used for your study plan.">
              <dl className="grid gap-4 md:grid-cols-2">
                <Detail label="Education level" value={optionLabel(EDUCATION_LEVELS, profile.educationLevel)} />
                <Detail label="Field of study" value={profile.fieldOfStudy || "Not set yet"} />
                <Detail label="Skill level" value={optionLabel(SKILL_LEVELS, profile.skillLevel)} />
                <Detail label="Weekly study time" value={optionLabel(WEEKLY_STUDY_TIMES, profile.weeklyStudyTime)} />
                <Detail label="Learning style" value={optionLabel(LEARNING_STYLES, profile.learningStyle)} />
              </dl>
            </Section>
            <Section id="goals" title="Career and goals" description="The future you are studying toward.">
              <dl className="grid gap-4">
                <Detail label="Career goal" value={profile.careerGoal || "Not set yet"} />
                <Detail label="Target outcome" value={profile.targetOutcome || "Not set yet"} />
                <Detail label="Interests" value={profile.interests || "Not set yet"} />
              </dl>
              <div className="mt-5">
                <Button href="/app/future-planner" variant="secondary">
                  Manage Goals
                </Button>
              </div>
            </Section>
          </div>
        )}
        <AccountPanel profile={profile} />
      </div>
    </div>
  );
}

function ProfileHeader({
  profile,
  editing,
  onEdit,
}: {
  profile: ProfileRecord;
  editing: boolean;
  onEdit: () => void;
}) {
  const completion = profileCompletionPercent(profile);
  const joined = formatJoinedDate(profile.createdAt);

  return (
    <section id="profile-header" className="card card-elevated scroll-mt-24">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-ink sm:size-24"
            aria-hidden="true"
          >
            <span
              className="text-2xl font-medium"
              style={{ color: "var(--paper)", fontFamily: "var(--font-display), Georgia, serif" }}
            >
              {profileInitials(profile.fullName || profile.email)}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="card-heading">{profile.fullName || "Your profile"}</h2>
            <p className="body-secondary mt-1 truncate">{profile.email}</p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="caption">Education level</dt>
                <dd className="body mt-1">{optionLabel(EDUCATION_LEVELS, profile.educationLevel)}</dd>
              </div>
              <div>
                <dt className="caption">Career goal</dt>
                <dd className="body mt-1">{profile.careerGoal || "Not set yet"}</dd>
              </div>
              {joined ? (
                <div>
                  <dt className="caption">Member since</dt>
                  <dd className="body mt-1">{joined}</dd>
                </div>
              ) : null}
              <div>
                <dt className="caption">Profile completion</dt>
                <dd className="body mt-1">{completion}%</dd>
              </div>
            </dl>
          </div>
        </div>
        {editing ? null : (
          <Button type="button" onClick={onEdit} className="w-full sm:w-auto">
            Edit Profile
          </Button>
        )}
      </div>
      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
          <div className="h-full rounded-full bg-tide" style={{ width: `${completion}%` }} />
        </div>
        <p className="caption mt-2">
          Initials avatar for now—photo upload can be added later without changing this layout.
        </p>
      </div>
    </section>
  );
}

function formatJoinedDate(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric", day: "numeric" }).format(date);
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="card card-raised scroll-mt-24">
      <h2 className="card-heading">{title}</h2>
      <p className="caption">{description}</p>
      {children}
    </section>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "md:col-span-2" : undefined}>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}

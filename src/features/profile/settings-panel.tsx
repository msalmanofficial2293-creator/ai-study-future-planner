"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/ui/user-avatar";
import { LogoutButton } from "@/features/auth/logout-button";
import {
  EDUCATION_LEVELS,
  LEARNING_STYLES,
} from "@/features/onboarding/options";
import { LearningPreferencesForm } from "@/features/profile/learning-preferences-form";
import { NotificationForm } from "@/features/profile/notification-form";
import { PasswordForm } from "@/features/profile/password-form";
import { optionLabel, profileInitials } from "@/features/profile/validation";
import type { ProfileRecord } from "@/services/profile";
import { cn } from "@/lib/cn";

type SettingsPanelProps = {
  profile: ProfileRecord;
};

const SETTINGS_SECTIONS = [
  { id: "account", label: "Account" },
  { id: "profile-personalization", label: "Profile" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "learning-preferences", label: "Learning" },
  { id: "privacy", label: "Privacy" },
  { id: "danger-zone", label: "Danger zone" },
] as const;

export function SettingsPanel({ profile }: SettingsPanelProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const initials = profileInitials(profile.fullName || profile.email);
  const memberSince = formatMemberSince(profile.createdAt);

  return (
    <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
      <nav
        aria-label="Settings sections"
        className="lg:sticky lg:top-20"
      >
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {SETTINGS_SECTIONS.map((section) => (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                className="block rounded-lg border border-transparent px-3 py-2 text-sm font-medium text-ink-soft transition hover:border-border hover:bg-elevated hover:text-ink lg:border-0"
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
        <section id="account" className="card card-raised scroll-mt-24" aria-labelledby="settings-account-heading">
          <h2 id="settings-account-heading" className="card-heading">
            Account
          </h2>
          <p className="caption mt-1">Your authenticated identity for AI Study Future Planner.</p>
          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
            <UserAvatar
              name={profile.fullName || profile.email}
              initials={initials}
              imageUrl={profile.avatarUrl}
              size="md"
            />
            <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="caption">Name</dt>
                <dd className="body mt-1 break-words">{profile.fullName || "Not set yet"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="caption">Email</dt>
                <dd className="body mt-1 break-all">{profile.email}</dd>
              </div>
              <div className="min-w-0">
                <dt className="caption">Member since</dt>
                <dd className="body mt-1">{memberSince}</dd>
              </div>
              <div className="min-w-0">
                <dt className="caption">Account status</dt>
                <dd className="body mt-1">Active</dd>
              </div>
            </dl>
          </div>
          <p className="body-secondary mt-4">
            Email changes are not available from Settings. Sign-in email stays managed by secure authentication.
          </p>
          <div className="mt-5">
            <Button href="/app/profile" variant="secondary">
              View Profile
            </Button>
          </div>
        </section>

        <section
          id="profile-personalization"
          className="card card-raised scroll-mt-24"
          aria-labelledby="settings-profile-heading"
        >
          <h2 id="settings-profile-heading" className="card-heading">
            Profile & personalization
          </h2>
          <p className="caption mt-1">
            Shortcuts to the learning details that shape your roadmap and recommendations.
          </p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <Detail label="Career goal" value={profile.careerGoal || "Not set yet"} />
            <Detail label="Target outcome" value={profile.targetOutcome || "Not set yet"} wide />
            <Detail
              label="Education level"
              value={optionLabel(EDUCATION_LEVELS, profile.educationLevel)}
            />
            <Detail label="Field of study" value={profile.fieldOfStudy || "Not set yet"} />
            <Detail
              label="Learning style"
              value={optionLabel(LEARNING_STYLES, profile.learningStyle)}
            />
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button href="/app/profile">Edit Profile</Button>
            <Button href="/app/future-planner" variant="secondary">
              Open Future Planner
            </Button>
          </div>
        </section>

        <section id="security" className="card card-raised scroll-mt-24" aria-labelledby="settings-security-heading">
          <h2 id="settings-security-heading" className="card-heading">
            Security
          </h2>
          <p className="caption mt-1">Your account is protected by secure authentication.</p>
          <div className="mt-5">
            <h3 className="font-medium text-ink">Change password</h3>
            <p className="caption mt-1">Requires your current password and an active signed-in session.</p>
            <div className="mt-4">
              <PasswordForm />
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="font-medium text-ink">Session</h3>
            <p className="body-secondary mt-2">
              Sign out ends the current session on this device.
            </p>
            <div className="mt-4">
              <LogoutButton />
            </div>
          </div>
        </section>

        <section
          id="notifications"
          className="card card-raised scroll-mt-24"
          aria-labelledby="settings-notifications-heading"
        >
          <h2 id="settings-notifications-heading" className="card-heading">
            Notifications
          </h2>
          <p className="caption mt-1">
            Choose which reminder categories to keep enabled for future delivery.
          </p>
          <div className="mt-5">
            <NotificationForm profile={profile} />
          </div>
        </section>

        <section
          id="learning-preferences"
          className="card card-raised scroll-mt-24"
          aria-labelledby="settings-learning-heading"
        >
          <h2 id="settings-learning-heading" className="card-heading">
            Learning preferences
          </h2>
          <p className="caption mt-1">
            Update how you prefer to study. Changes save to your profile and can influence personalization.
          </p>
          <div className="mt-5">
            <LearningPreferencesForm profile={profile} />
          </div>
        </section>

        <section id="privacy" className="card card-raised scroll-mt-24" aria-labelledby="settings-privacy-heading">
          <h2 id="settings-privacy-heading" className="card-heading">
            Privacy
          </h2>
          <p className="body-secondary mt-3">
            Your authenticated learning data is associated with your account and protected by row level
            security. Other students cannot read or change your profile, goals, plans, tasks, quizzes,
            performance records, tutor conversations, or personalization decisions.
          </p>
          <p className="body-secondary mt-3">
            Profile photos use a user-scoped Storage path. Account deletion and broader data-export
            controls are not available yet.
          </p>
        </section>

        <section
          id="danger-zone"
          className={cn(
            "scroll-mt-24 rounded-2xl border border-danger/30 bg-danger-surface/40 p-5 sm:p-6",
          )}
          aria-labelledby="settings-danger-heading"
        >
          <h2 id="settings-danger-heading" className="card-heading text-danger">
            Danger zone
          </h2>
          <p className="body-secondary mt-3">
            Deleting your account permanently removes your sign-in and learning data. This action cannot
            be undone.
          </p>
          <p className="body mt-3">
            Secure account deletion is not available yet. Opening the confirmation explains that
            nothing will be deleted.
          </p>
          <div className="mt-5">
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)} className="w-full sm:w-auto">
              Delete account
            </Button>
          </div>
        </section>
      </div>

      <Dialog
        open={deleteOpen}
        title="Delete account unavailable"
        description="Secure account deletion is not available yet. Your profile, goals, study data, and sign-in remain in place."
        onClose={() => setDeleteOpen(false)}
        actions={
          <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto">
            Close
          </Button>
        }
      />
    </div>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "sm:col-span-2")}>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1 break-words">{value}</dd>
    </div>
  );
}

function formatMemberSince(value: string | null): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

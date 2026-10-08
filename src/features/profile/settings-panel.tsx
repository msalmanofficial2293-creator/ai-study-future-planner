"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AccountPanel } from "@/features/profile/account-panel";
import {
  EDUCATION_LEVELS,
  LEARNING_STYLES,
  SKILL_LEVELS,
  WEEKLY_STUDY_TIMES,
} from "@/features/onboarding/options";
import { optionLabel } from "@/features/profile/validation";
import type { ProfileRecord } from "@/services/profile";

type SettingsPanelProps = {
  profile: ProfileRecord;
};

export function SettingsPanel({ profile }: SettingsPanelProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="card card-raised">
        <h2 className="card-heading">Account</h2>
        <p className="caption">Your sign-in identity for AI Study Future Planner.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="caption">Email</dt>
            <dd className="body mt-1 break-all">{profile.email}</dd>
          </div>
          <div>
            <dt className="caption">Full name</dt>
            <dd className="body mt-1">{profile.fullName || "Not set yet"}</dd>
          </div>
        </dl>
        <div className="mt-5">
          <Button href="/app/profile" variant="secondary">
            Manage profile
          </Button>
        </div>
      </section>

      <section className="card card-raised">
        <h2 className="card-heading">Learning preferences</h2>
        <p className="caption">These values personalize plans, quizzes, and recommendations.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="caption">Skill level</dt>
            <dd className="body mt-1">{optionLabel(SKILL_LEVELS, profile.skillLevel)}</dd>
          </div>
          <div>
            <dt className="caption">Learning style</dt>
            <dd className="body mt-1">{optionLabel(LEARNING_STYLES, profile.learningStyle)}</dd>
          </div>
          <div>
            <dt className="caption">Weekly study time</dt>
            <dd className="body mt-1">{optionLabel(WEEKLY_STUDY_TIMES, profile.weeklyStudyTime)}</dd>
          </div>
          <div>
            <dt className="caption">Education level</dt>
            <dd className="body mt-1">{optionLabel(EDUCATION_LEVELS, profile.educationLevel)}</dd>
          </div>
        </dl>
        <p className="body-secondary mt-4">
          Edit these on your{" "}
          <Link href="/app/profile" className="font-medium text-accent-deep underline underline-offset-4">
            profile
          </Link>{" "}
          page. Preferences are stored with your account and respected by RLS.
        </p>
      </section>

      <AccountPanel profile={profile} />
    </div>
  );
}

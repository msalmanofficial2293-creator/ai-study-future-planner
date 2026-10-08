"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { LogoutButton } from "@/features/auth/logout-button";
import { NotificationForm } from "@/features/profile/notification-form";
import { PasswordForm } from "@/features/profile/password-form";
import type { ProfileRecord } from "@/services/profile";

type AccountPanelProps = {
  profile: ProfileRecord;
};

export function AccountPanel({ profile }: AccountPanelProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <section id="account" className="card card-raised scroll-mt-24">
      <h2 className="card-heading">Account & security</h2>
      <p className="caption">Password, notifications, sign-out, and account controls.</p>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="font-medium text-ink">Change password</h3>
        <p className="caption mt-1">Your account is protected by secure authentication.</p>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <h3 className="font-medium text-ink">Notification preferences</h3>
        <div className="mt-4">
          <NotificationForm profile={profile} />
        </div>
      </div>

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

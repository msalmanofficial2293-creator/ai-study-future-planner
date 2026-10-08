"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  AVATAR_ACCEPT,
  AVATAR_MAX_BYTES,
  isAvatarMimeType,
} from "@/features/profile/avatar-constants";
import {
  removeAvatarAction,
  uploadAvatarAction,
  type AvatarActionState,
} from "@/features/profile/avatar-actions";
import { profileInitials } from "@/features/profile/validation";
import { cn } from "@/lib/cn";

const initialState: AvatarActionState = {};

type ProfileAvatarEditorProps = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
};

export function ProfileAvatarEditor({ fullName, email, avatarUrl }: ProfileAvatarEditorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const previewRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadAvatarAction, initialState);
  const [removeState, removeFormAction, removePending] = useActionState(removeAvatarAction, initialState);
  const busy = uploadPending || removePending;
  const displayUrl = resolveDisplayUrl(previewUrl, uploadPending, avatarUrl, uploadState, removeState);
  const initials = profileInitials(fullName || email);
  const statusMessage = uploadState.message ?? removeState.message;
  const errorMessage = clientError ?? uploadState.error ?? removeState.error;

  useEffect(() => {
    if (!uploadState.savedAt && !removeState.savedAt) {
      return;
    }

    router.refresh();
  }, [router, uploadState.savedAt, removeState.savedAt]);

  function openPicker() {
    if (busy) {
      return;
    }
    setClientError(null);
    inputRef.current?.click();
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setClientError("Profile photo must be 5 MB or smaller.");
      return;
    }

    if (!isAvatarMimeType(file.type)) {
      setClientError("Use a JPG, PNG, or WebP image.");
      return;
    }

    setClientError(null);
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
    }
    const nextPreview = URL.createObjectURL(file);
    previewRef.current = nextPreview;
    setPreviewUrl(nextPreview);

    const body = new FormData();
    body.set("avatar", file);
    uploadAction(body);
  }

  function submitRemove(formData: FormData) {
    setRemoveOpen(false);
    removeFormAction(formData);
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative">
        <button
          type="button"
          className={cn(
            "group relative size-20 overflow-hidden rounded-2xl bg-ink sm:size-24",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--focus)]",
          )}
          aria-label="Change profile photo"
          disabled={busy}
          onClick={openPicker}
        >
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt={`${fullName || "Your"} profile photo`}
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <span
              className="flex size-full items-center justify-center text-2xl font-medium"
              style={{ color: "var(--paper)", fontFamily: "var(--font-display), Georgia, serif" }}
              aria-hidden="true"
            >
              {initials}
            </span>
          )}
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-ink/55 px-2 text-center opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <CameraIcon className="size-5" />
            <span className="text-xs font-medium" style={{ color: "var(--paper)" }}>
              {busy ? "Updating…" : "Change photo"}
            </span>
          </span>
          {busy ? (
            <span className="absolute inset-0 flex items-center justify-center bg-ink/40">
              <span className="spinner" aria-hidden="true" />
              <span className="sr-only">Updating profile photo</span>
            </span>
          ) : null}
        </button>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
          onChange={onFileChange}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={openPicker} disabled={busy} className="w-auto">
          {displayUrl ? "Change photo" : "Upload photo"}
        </Button>
        {displayUrl ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setRemoveOpen(true)}
            disabled={busy}
            className="w-auto"
            aria-label="Remove profile photo"
          >
            Remove photo
          </Button>
        ) : null}
      </div>

      {statusMessage ? (
        <p className="rounded-2xl bg-success-surface px-4 py-2 text-sm text-success" role="status">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="field-error" role="alert">
          Error: {errorMessage}
        </p>
      ) : null}
      <p className="caption">JPG, PNG, or WebP. Maximum 5 MB.</p>

      <Dialog
        open={removeOpen}
        title="Remove profile photo"
        description="Remove your profile photo? Your initials will show instead. Other profile details stay the same."
        onClose={() => {
          if (!removePending) {
            setRemoveOpen(false);
          }
        }}
        actions={
          <form action={submitRemove} className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              disabled={removePending}
              onClick={() => setRemoveOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              loading={removePending}
              disabled={removePending}
              className="w-full sm:w-auto"
              aria-label="Remove profile photo"
            >
              {removePending ? "Removing" : "Remove"}
            </Button>
          </form>
        }
      />
    </div>
  );
}

function resolveDisplayUrl(
  previewUrl: string | null,
  uploadPending: boolean,
  avatarUrl: string | null,
  uploadState: AvatarActionState,
  removeState: AvatarActionState,
): string | null {
  if (previewUrl && uploadPending) {
    return previewUrl;
  }

  const uploadAt = uploadState.savedAt ?? 0;
  const removeAt = removeState.savedAt ?? 0;

  if (removeAt > uploadAt) {
    return removeState.avatarUrl ?? null;
  }

  if (uploadAt > 0 && uploadState.avatarUrl) {
    return uploadState.avatarUrl;
  }

  return avatarUrl;
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8.5 8.5 10 6.5h4L15.5 8.5H18a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        style={{ color: "var(--paper)" }}
      />
      <circle cx="12" cy="13.5" r="2.75" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--paper)" }} />
    </svg>
  );
}

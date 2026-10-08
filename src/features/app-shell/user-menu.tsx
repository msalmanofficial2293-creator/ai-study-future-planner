"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { LogoutButton } from "@/features/auth/logout-button";
import { IconChevron } from "@/features/app-shell/icons";
import type { AppShellUser } from "@/features/app-shell/nav";

type UserMenuProps = {
  user: AppShellUser;
};

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex max-w-[14rem] items-center gap-2 rounded-xl border border-border bg-elevated px-2 py-1.5 text-left transition hover:bg-paper-raised"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-medium"
          style={{ color: "var(--paper)" }}
          aria-hidden="true"
        >
          {user.initials}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{user.fullName || "Learner"}</span>
          <span className="block truncate text-xs text-foreground-muted">{user.email}</span>
        </span>
        <IconChevron className="size-4 shrink-0 text-foreground-muted" />
      </button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-elevated shadow-[var(--shadow-soft)]"
        >
          <Link
            href="/app/profile"
            role="menuitem"
            className="block px-3 py-2.5 text-sm text-ink hover:bg-paper-raised"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/app/settings"
            role="menuitem"
            className="block px-3 py-2.5 text-sm text-ink hover:bg-paper-raised"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <div className="border-t border-border p-2">
            <LogoutButton className="w-full" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Mark } from "@/components/brand/mark";
import { siteConfig } from "@/config/site";
import {
  IconBell,
  IconClose,
  IconMenu,
  NavIcon,
} from "@/features/app-shell/icons";
import {
  isNavItemActive,
  pageTitleForPath,
  primaryAppNav,
  utilityAppNav,
  type AppShellUser,
} from "@/features/app-shell/nav";
import { UserMenu } from "@/features/app-shell/user-menu";
import { LogoutButton } from "@/features/auth/logout-button";
import { cn } from "@/lib/cn";

type AppShellProps = {
  user: AppShellUser;
  children: ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerId = useId();
  const title = pageTitleForPath(pathname);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  return (
    <div className="app-shell min-h-[100dvh] bg-transparent">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[90rem]">
        <aside
          className="app-sidebar sticky top-0 hidden h-[100dvh] w-56 shrink-0 flex-col border-r lg:flex"
          aria-label="Application"
        >
          <SidebarBrand />
          <SidebarNav pathname={pathname} />
          <SidebarFooter pathname={pathname} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-cool-gray">
          <header className="sticky top-0 z-30 border-b border-border bg-elevated/90 backdrop-blur-md">
            <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  className="icon-button lg:hidden"
                  aria-expanded={mobileOpen}
                  aria-controls={drawerId}
                  aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                  onClick={() => setMobileOpen((value) => !value)}
                >
                  {mobileOpen ? <IconClose className="size-5" /> : <IconMenu className="size-5" />}
                </button>
                <div className="min-w-0">
                  <p className="truncate caption">AI Study Future Planner</p>
                  <p className="shell-title truncate">{title}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/app/settings"
                  className="icon-button"
                  aria-label="Notification preferences"
                >
                  <IconBell className="size-5" />
                </Link>
                <UserMenu user={user} />
              </div>
            </div>
          </header>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/50"
            aria-label="Close navigation overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div
            id={drawerId}
            className="app-sidebar absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r shadow-[var(--shadow-soft)]"
            role="dialog"
            aria-modal="true"
            aria-label="Application navigation"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <SidebarBrand compact />
              <button
                type="button"
                className="icon-button border-white/20 bg-white/10 text-white hover:bg-white/15"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <IconClose className="size-5" />
              </button>
            </div>
            <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("border-b border-white/10 px-3", compact ? "py-0" : "py-4")}>
      <Link href="/app" className="flex items-center gap-2.5 rounded-xl">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
          <Mark className="size-8" />
        </span>
        <span className="min-w-0">
          <span className="nav-brand block truncate text-sm leading-tight">{siteConfig.name}</span>
          {!compact ? <span className="caption">Learning workspace</span> : null}
        </span>
      </Link>
    </div>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2.5 py-3">
      <ul className="flex flex-col gap-0.5">
        {primaryAppNav.map((item) => {
          const active = isNavItemActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn("app-nav-link", active && "app-nav-link-active")}
              >
                <NavIcon href={item.href} className="size-4 shrink-0 opacity-90" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarFooter({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="mt-auto border-t border-white/10 px-2.5 py-3">
      <ul className="flex flex-col gap-0.5">
        {utilityAppNav.map((item) => {
          const active = isNavItemActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn("app-nav-link", active && "app-nav-link-active")}
              >
                <NavIcon href={item.href} className="size-4 shrink-0 opacity-90" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 px-1">
        <LogoutButton className="w-full" />
      </div>
    </div>
  );
}

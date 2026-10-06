"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { planningCta, primaryNav } from "@/config/site";

type MobileNavProps = {
  isAuthenticated: boolean;
};

export function MobileNav({ isAuthenticated }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="nav-link"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full border-b border-border bg-background"
        >
          <nav aria-label="Primary">
            <ul className="flex flex-col px-5 py-2 sm:px-8">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="nav-link w-full"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href={isAuthenticated ? "/app" : "/login"}
                  className="nav-link w-full"
                  onClick={() => setOpen(false)}
                >
                  {isAuthenticated ? "Account" : "Log in"}
                </Link>
              </li>
            </ul>
          </nav>
          <div className="px-5 pb-4 sm:hidden sm:px-8">
            <Button
              href={planningCta.href}
              className="w-full"
              onClick={() => setOpen(false)}
            >
              {planningCta.label}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { planningCta, primaryNav, siteConfig } from "@/config/site";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function SiteHeader() {
  const user = await getAuthenticatedUser();
  const isAuthenticated = Boolean(user);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <Container className="relative flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-full"
          aria-label={`${siteConfig.name}, home`}
        >
          <Mark className="size-9 shrink-0" />
          <span className="nav-brand truncate">
            <span className="sm:hidden">Study Future</span>
            <span className="hidden sm:inline">{siteConfig.name}</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="nav-link">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden sm:block">
            <Button href={isAuthenticated ? "/app" : "/login"} variant="ghost">
              {isAuthenticated ? "Account" : "Log in"}
            </Button>
          </div>
          <div className="hidden sm:block">
            <Button href={planningCta.href}>{planningCta.label}</Button>
          </div>
          <MobileNav isAuthenticated={isAuthenticated} />
        </div>
      </Container>
    </header>
  );
}

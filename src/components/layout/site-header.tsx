import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { Container } from "@/components/ui/container";
import { primaryNav, siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper">
      <Container className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-full"
          aria-label={`${siteConfig.name}, home`}
        >
          <Mark className="size-9 shrink-0" />
          <span className="font-display text-base leading-tight text-ink sm:text-lg">
            <span className="sm:hidden">Study Future</span>
            <span className="hidden sm:inline">{siteConfig.name}</span>
          </span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-1">
            {primaryNav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-medium text-ink-soft hover:bg-paper-raised hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}

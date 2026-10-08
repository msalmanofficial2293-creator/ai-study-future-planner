import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { Container } from "@/components/ui/container";
import { footerNav, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <Container className="grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="max-w-md">
          <Link
            href="/"
            className="inline-flex min-w-0 items-center gap-3 rounded-full"
            aria-label={`${siteConfig.name}, home`}
          >
            <Mark className="size-9 shrink-0" />
            <span className="nav-brand">{siteConfig.name}</span>
          </Link>
          <p className="caption mt-4">
            A study platform designed to turn one future goal into a clear
            learning path of roadmap, plan, practice, and progress.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <nav aria-label="Product">
            <p className="field-label">Product</p>
            <ul className="mt-3 flex flex-col">
              {footerNav.product.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="nav-link nav-link-flush">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Resources">
            <p className="field-label">Resources</p>
            <ul className="mt-3 flex flex-col">
              {footerNav.resources.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="nav-link nav-link-flush">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between lg:col-span-2">
          <p className="caption max-w-md">
            Study data stays on the signed-in student account. Privacy and terms
            will be published before a public production launch.
          </p>
          <p className="caption">
            © {siteConfig.copyrightYear} {siteConfig.name}
          </p>
        </div>
      </Container>
    </footer>
  );
}

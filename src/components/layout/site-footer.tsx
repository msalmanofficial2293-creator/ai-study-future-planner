import Link from "next/link";
import { Mark } from "@/components/brand/mark";
import { Container } from "@/components/ui/container";
import { footerNav, siteConfig } from "@/config/site";

const LINK_ACCENTS = ["hover:text-[#c4b5fd]", "hover:text-[#93c5fd]", "hover:text-[#5eead4]"] as const;

export function SiteFooter() {
  return (
    <footer className="section-on-dark section-scene-footer mt-auto border-t border-white/10">
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
            A personalized learning platform that turns a career goal into
            roadmap, study plan, daily work, practice, progress, and guidance.
          </p>
          <div className="mt-5 flex gap-2" aria-hidden="true">
            <span className="size-2 rounded-full bg-purple" />
            <span className="size-2 rounded-full bg-blue" />
            <span className="size-2 rounded-full bg-teal" />
            <span className="size-2 rounded-full bg-emerald" />
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          <nav aria-label="Product">
            <p className="field-label text-[#c4b5fd]">Product</p>
            <ul className="mt-3 flex flex-col">
              {footerNav.product.map((item, index) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link nav-link-flush ${LINK_ACCENTS[index % LINK_ACCENTS.length]}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Resources">
            <p className="field-label text-[#93c5fd]">Resources</p>
            <ul className="mt-3 flex flex-col">
              {footerNav.resources.map((item, index) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link nav-link-flush ${LINK_ACCENTS[(index + 1) % LINK_ACCENTS.length]}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between lg:col-span-2">
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

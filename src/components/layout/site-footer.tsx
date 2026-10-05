import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-lg text-ink">{siteConfig.name}</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            A study platform for students building a future with intention.
          </p>
        </div>
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
      </Container>
    </footer>
  );
}

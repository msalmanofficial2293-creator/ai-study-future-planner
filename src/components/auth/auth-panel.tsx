import Link from "next/link";
import type { ReactNode } from "react";
import { Mark } from "@/components/brand/mark";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

type AuthPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthPanel({ title, description, children, footer }: AuthPanelProps) {
  return (
    <Container className="flex flex-1 items-center py-12 sm:py-16">
      <Card variant="elevated" className="mx-auto w-full max-w-md">
        <Link
          href="/"
          className="inline-flex min-w-0 items-center gap-3 rounded-full"
          aria-label={`${siteConfig.name}, home`}
        >
          <Mark className="size-9 shrink-0" />
          <span className="nav-brand">{siteConfig.name}</span>
        </Link>
        <h1 className="page-heading mt-6">{title}</h1>
        <p className="body-secondary mt-3">{description}</p>
        <div className="mt-8">{children}</div>
        <p className="caption mt-6">{footer}</p>
      </Card>
    </Container>
  );
}

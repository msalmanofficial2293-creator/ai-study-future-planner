import { headers } from "next/headers";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

async function isAuthenticatedAppPath(): Promise<boolean> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  return pathname === "/app" || pathname.startsWith("/app/");
}

export async function MarketingHeader() {
  if (await isAuthenticatedAppPath()) {
    return null;
  }

  return <SiteHeader />;
}

export async function MarketingFooter() {
  if (await isAuthenticatedAppPath()) {
    return null;
  }

  return <SiteFooter />;
}

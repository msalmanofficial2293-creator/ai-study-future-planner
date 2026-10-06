import { env } from "@/config/env";

export const siteConfig = {
  name: "AI Study Future Planner",
  description:
    "AI Study Future Planner is designed to turn a future goal into a roadmap, study plan, daily work, practice, and progress. Planning tools are not open yet.",
  url: env.appUrl,
  locale: "en_US",
  copyrightYear: 2026,
} as const;

export const primaryNav = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#faq", label: "FAQ" },
] as const;

export const planningCta = {
  href: "#start",
  label: "Start Planning",
} as const;

export const footerNav = {
  product: [
    { href: "#product", label: "Product" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#features", label: "Features" },
    { href: "#why", label: "Why this path" },
    { href: "#journey", label: "Learning journey" },
  ],
  resources: [
    { href: "#benefits", label: "Student benefits" },
    { href: "#faq", label: "FAQ" },
    { href: "#start", label: "Start planning" },
  ],
} as const;

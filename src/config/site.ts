import { env } from "@/config/env";

export const siteConfig = {
  name: "AI Study Future Planner",
  description:
    "Turn your career goals into a personalized learning roadmap with study plans, daily tasks, quizzes, performance tracking, adaptive recommendations, and AI tutoring.",
  url: env.appUrl,
  locale: "en_US",
  copyrightYear: 2026,
} as const;

export const primaryNav = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#faq", label: "FAQ" },
] as const;

export const planningCta = {
  href: "/signup",
  label: "Get Started",
} as const;

export const footerNav = {
  product: [
    { href: "/#product", label: "Product" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#features", label: "Features" },
    { href: "/#why", label: "Why this path" },
    { href: "/#journey", label: "Learning journey" },
  ],
  resources: [
    { href: "/#benefits", label: "Student benefits" },
    { href: "/#faq", label: "FAQ" },
    { href: "/signup", label: "Get Started" },
    { href: "/login", label: "Sign In" },
  ],
} as const;

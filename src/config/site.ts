import { env } from "@/config/env";

export const siteConfig = {
  name: "AI Study Future Planner",
  description:
    "Define a future goal and follow a personalized learning journey, from roadmap and study plan to daily tasks, practice, and review.",
  url: env.appUrl,
  locale: "en_US",
} as const;

export const primaryNav = [
  { href: "#journey", label: "Journey" },
  { href: "#approach", label: "Approach" },
] as const;

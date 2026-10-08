export type AppNavItem = {
  href: string;
  label: string;
  match: "exact" | "prefix";
};

export const primaryAppNav: AppNavItem[] = [
  { href: "/app", label: "Dashboard", match: "exact" },
  { href: "/app/future-planner", label: "Future Planner", match: "prefix" },
  { href: "/app/study-plan", label: "Study Plan", match: "prefix" },
  { href: "/app/daily-tasks", label: "Daily Tasks", match: "prefix" },
  { href: "/app/quiz", label: "AI Quiz", match: "prefix" },
  { href: "/app/performance", label: "Performance", match: "prefix" },
  { href: "/app/adaptive-plan", label: "Adaptive Plan", match: "prefix" },
  { href: "/app/ai-tutor", label: "AI Tutor", match: "prefix" },
  { href: "/app/personalization", label: "Personalization", match: "prefix" },
];

export const utilityAppNav: AppNavItem[] = [
  { href: "/app/profile", label: "Profile", match: "prefix" },
  { href: "/app/settings", label: "Settings", match: "prefix" },
];

export function isNavItemActive(pathname: string, item: AppNavItem): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function pageTitleForPath(pathname: string): string {
  const all = [...primaryAppNav, ...utilityAppNav];
  const exact = all.find((item) => item.match === "exact" && pathname === item.href);

  if (exact) {
    return exact.label;
  }

  const prefix = all.find(
    (item) => item.match === "prefix" && (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );

  return prefix?.label ?? "Workspace";
}

export type AppShellUser = {
  fullName: string;
  firstName: string;
  email: string;
  initials: string;
  avatarUrl: string | null;
};

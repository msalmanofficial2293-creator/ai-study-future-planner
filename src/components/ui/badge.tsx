import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type BadgeProps = {
  children: ReactNode;
  tone?: "accent" | "neutral" | "secondary";
  className?: string;
};

export function Badge({ children, tone = "accent", className }: BadgeProps) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

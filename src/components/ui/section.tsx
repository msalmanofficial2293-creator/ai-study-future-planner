import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = {
  id?: string;
  labelledBy?: string;
  tone?: "default" | "raised" | "plain" | "lavender" | "sky" | "mint" | "peach" | "cool";
  className?: string;
  children: ReactNode;
};

const tones = {
  default: "border-b border-border bg-cool-gray",
  raised: "border-b border-border bg-elevated",
  plain: "",
  lavender: "border-b border-border bg-soft-lavender",
  sky: "border-b border-border bg-soft-blue",
  mint: "border-b border-border bg-soft-mint",
  peach: "border-b border-border bg-soft-peach",
  cool: "border-b border-border bg-cool-gray",
} as const;

export function Section({
  id,
  labelledBy,
  tone = "default",
  className,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("py-16 sm:py-20 lg:py-24", tones[tone], className)}
    >
      {children}
    </section>
  );
}

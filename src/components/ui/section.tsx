import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = {
  id?: string;
  labelledBy?: string;
  tone?: "default" | "raised" | "plain";
  className?: string;
  children: ReactNode;
};

const tones = {
  default: "border-b border-border",
  raised: "border-b border-border bg-surface",
  plain: "",
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

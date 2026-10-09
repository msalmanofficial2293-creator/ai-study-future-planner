import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionProps = {
  id?: string;
  labelledBy?: string;
  tone?:
    | "default"
    | "raised"
    | "plain"
    | "lavender"
    | "sky"
    | "mint"
    | "peach"
    | "cool"
    | "journey"
    | "navy"
    | "cta";
  className?: string;
  children: ReactNode;
};

/** Each tone maps to a multi-color layered scene (see globals.css). */
const tones = {
  default: "border-b border-border section-scene-neutral",
  raised: "border-b border-border section-scene-product",
  plain: "",
  lavender: "border-b border-border section-scene-faq",
  sky: "border-b border-border section-scene-how",
  mint: "border-b border-border section-scene-path",
  peach: "border-b border-border section-scene-peach",
  cool: "border-b border-border section-scene-features",
  journey: "border-b border-border section-scene-journey",
  navy: "border-b border-white/10 section-scene-benefits section-on-dark",
  cta: "border-b border-transparent section-scene-cta section-on-dark",
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

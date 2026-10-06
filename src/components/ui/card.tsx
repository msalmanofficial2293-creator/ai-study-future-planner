import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardProps = {
  as?: "div" | "article" | "li";
  variant?: "quiet" | "raised" | "elevated";
  icon?: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function Card({
  as = "div",
  variant = "raised",
  icon,
  title,
  description,
  footer,
  className,
  children,
}: CardProps) {
  const Tag = as;

  return (
    <Tag className={cn("card", `card-${variant}`, className)}>
      {icon ? <div>{icon}</div> : null}
      {title ? <h3 className="card-heading">{title}</h3> : null}
      {description ? <p className="caption">{description}</p> : null}
      {children}
      {footer ? <div className="mt-auto pt-2">{footer}</div> : null}
    </Tag>
  );
}

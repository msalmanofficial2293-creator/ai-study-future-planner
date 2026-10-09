import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: PageHeaderProps) {
  const copy = (
    <div className="page-header-copy">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className={cn("page-heading", eyebrow ? "mt-3" : undefined)}>{title}</h1>
      {description ? <p className="body-secondary mt-3">{description}</p> : null}
      {children}
    </div>
  );

  if (!actions) {
    return <header className={cn("page-header", className)}>{copy}</header>;
  }

  return (
    <header className={cn("page-header page-header-split", className)}>
      {copy}
      <div className="page-header-actions">{actions}</div>
    </header>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type LoadingStateProps = {
  label: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <div className="status-panel" role="status">
      <span className="spinner" aria-hidden="true" />
      <p className="body">{label}</p>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="status-panel rounded-2xl border border-dashed border-border bg-surface px-6 py-10">
      <h2 className="card-heading">{title}</h2>
      <p className="body-secondary">{description}</p>
      {action ? <div className="pt-3">{action}</div> : null}
    </div>
  );
}

type ErrorStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  reference?: string;
  action?: ReactNode;
};

export function ErrorState({
  eyebrow = "Error",
  title,
  description,
  reference,
  action,
}: ErrorStateProps) {
  return (
    <div className="status-panel" role="alert">
      <p className="eyebrow eyebrow-danger">{eyebrow}</p>
      <h1 className="page-heading">{title}</h1>
      <p className="body-secondary">{description}</p>
      {reference ? <p className="caption">Reference: {reference}</p> : null}
      {action ? <div className="pt-3">{action}</div> : null}
    </div>
  );
}

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return <span className={cn("skeleton", className)} aria-hidden="true" />;
}

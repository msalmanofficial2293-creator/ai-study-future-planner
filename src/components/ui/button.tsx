import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const variants = {
  primary: "button-primary",
  secondary: "button-secondary",
  outline: "button-outline",
  ghost: "button-ghost",
  destructive: "button-destructive",
} as const;

type ButtonVariant = keyof typeof variants;

type ButtonCommonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
};

type ButtonLinkProps = ButtonCommonProps & {
  href: string;
  onClick?: () => void;
};

type ButtonActionProps = ButtonCommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
};

type ButtonProps = ButtonLinkProps | ButtonActionProps;

function ButtonLabel({
  loading,
  children,
}: {
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      {loading ? <span className="spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
      {loading ? <span className="sr-only">Loading</span> : null}
    </>
  );
}

export function Button(props: ButtonProps) {
  const unavailable = Boolean(props.disabled || props.loading);
  const className = cn(
    "button",
    variants[props.variant ?? "primary"],
    props.className,
  );

  if (typeof props.href === "string") {
    if (unavailable) {
      return (
        <span aria-disabled="true" className={className}>
          <ButtonLabel loading={props.loading}>{props.children}</ButtonLabel>
        </span>
      );
    }

    return (
      <Link href={props.href} className={className} onClick={props.onClick}>
        <ButtonLabel loading={props.loading}>{props.children}</ButtonLabel>
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={className}
      disabled={unavailable}
      aria-busy={props.loading || undefined}
    >
      <ButtonLabel loading={props.loading}>{props.children}</ButtonLabel>
    </button>
  );
}

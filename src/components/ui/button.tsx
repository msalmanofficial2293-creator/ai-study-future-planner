import Link from "next/link";
import { cn } from "@/lib/cn";

const variants = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary:
    "border border-line bg-paper-raised text-ink hover:border-horizon-deep",
} as const;

type ButtonCommonProps = {
  variant?: keyof typeof variants;
  children: React.ReactNode;
  className?: string;
};

type ButtonLinkProps = ButtonCommonProps & {
  href: string;
};

type ButtonActionProps = ButtonCommonProps & {
  href?: undefined;
  type?: "button" | "submit";
  onClick?: () => void;
};

type ButtonProps = ButtonLinkProps | ButtonActionProps;

export function Button(props: ButtonProps) {
  const className = cn(
    "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium transition-colors",
    variants[props.variant ?? "primary"],
    props.className,
  );

  if (typeof props.href === "string") {
    return (
      <Link href={props.href} className={className}>
        {props.children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={className}
    >
      {props.children}
    </button>
  );
}

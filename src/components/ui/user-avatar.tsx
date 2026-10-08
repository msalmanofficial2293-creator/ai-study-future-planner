import Image from "next/image";
import { cn } from "@/lib/cn";

const sizeClasses = {
  sm: "size-9 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-2xl sm:size-24",
} as const;

type UserAvatarProps = {
  name: string;
  initials: string;
  imageUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
  alt?: string;
};

export function UserAvatar({
  name,
  initials,
  imageUrl,
  size = "md",
  className,
  alt,
}: UserAvatarProps) {
  const label = alt ?? `${name || "User"} profile photo`;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink font-medium",
        size === "sm" || size === "md" ? "rounded-full" : "rounded-2xl",
        sizeClasses[size],
        className,
      )}
      style={{ color: "var(--paper)" }}
      aria-hidden={imageUrl ? undefined : true}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={label}
          fill
          sizes={size === "lg" ? "96px" : "40px"}
          className="object-cover"
          unoptimized
        />
      ) : (
        <span style={{ fontFamily: "var(--font-display), Georgia, serif" }}>{initials}</span>
      )}
    </span>
  );
}

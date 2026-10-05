type MarkProps = {
  className?: string;
  title?: string;
};

export function Mark({ className, title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="8" fill="#102033" />
      <path
        d="M7 21.5h18"
        stroke="#F3EFE7"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.5 21.5c1.6-5.4 3.6-8 6.5-8s4.9 2.6 6.5 8"
        stroke="#B85A28"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="16" cy="13.5" r="1.7" fill="#FBF9F5" />
    </svg>
  );
}

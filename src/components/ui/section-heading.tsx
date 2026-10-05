type SectionHeadingProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium tracking-[0.14em] text-tide uppercase">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 font-display text-3xl tracking-tight text-balance text-ink sm:text-4xl"
      >
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
        {description}
      </p>
    </div>
  );
}

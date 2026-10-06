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
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="section-heading mt-3">
        {title}
      </h2>
      <p className="body-secondary mt-4 max-w-2xl">{description}</p>
    </div>
  );
}

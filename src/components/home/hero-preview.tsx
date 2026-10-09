/**
 * Illustrative marketing preview only — not live account data.
 */
export function HeroPreview() {
  return (
    <aside
      aria-labelledby="path-heading"
      className="min-w-0 rounded-2xl border border-white/20 bg-elevated p-5 text-foreground shadow-[var(--shadow-soft)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow text-purple-deep">Sample workspace</p>
          <h2 id="path-heading" className="card-heading mt-2 text-ink">
            Learning dashboard preview
          </h2>
          <p className="caption mt-1 text-foreground-muted">
            Illustrative example of the signed-in experience. Not live student data.
          </p>
        </div>
        <span className="icon-well icon-well-purple shrink-0" aria-hidden="true">
          <SparkIcon />
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-purple to-blue p-4 text-white">
        <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">
          Current learning goal
        </p>
        <p className="mt-2 text-lg font-medium leading-snug">
          Become a full-stack developer
        </p>
        <p className="mt-2 text-sm text-white/85">
          Build job-ready projects with a clear weekly study rhythm.
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between gap-3 text-xs text-white/80">
            <span>Roadmap progress</span>
            <span>42%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25" role="presentation">
            <div className="h-full w-[42%] rounded-full bg-white" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PreviewStat
          label="Today's tasks"
          value="3 of 5"
          hint="Study sessions due today"
          well="icon-well-emerald"
          barClass="progress-fill-emerald"
          percent={60}
        />
        <PreviewStat
          label="Quiz average"
          value="84%"
          hint="Recent practice scores"
          well="icon-well-blue"
          barClass="progress-fill-blue"
          percent={84}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-soft-blue/60 p-4">
        <p className="caption text-blue-deep">Today&apos;s study focus</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          <PreviewTask title="Complete React state module" meta="45 min · Study Plan" done />
          <PreviewTask title="Practice API quiz set" meta="20 min · AI Quiz" />
          <PreviewTask title="Review roadmap milestone notes" meta="30 min · Daily Tasks" />
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-gold/30 bg-soft-gold p-4">
        <p className="caption text-gold-deep">Upcoming milestone</p>
        <p className="body mt-1 font-medium text-ink">Ship a portfolio project sprint</p>
        <p className="caption mt-1 text-foreground-muted">
          Next stage after frontend foundations and backend practice.
        </p>
      </div>
    </aside>
  );
}

function PreviewStat({
  label,
  value,
  hint,
  well,
  barClass,
  percent,
}: {
  label: string;
  value: string;
  hint: string;
  well: string;
  barClass: string;
  percent: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-cool-gray/70 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="caption">{label}</p>
        <span className={`icon-well size-8 ${well}`} aria-hidden="true">
          <DotIcon />
        </span>
      </div>
      <p
        className="mt-2 text-2xl font-medium text-ink"
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        {value}
      </p>
      <p className="caption mt-1">{hint}</p>
      <div className="progress-track mt-3 h-1.5" role="presentation">
        <div className={`${barClass} h-full rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function PreviewTask({
  title,
  meta,
  done = false,
}: {
  title: string;
  meta: string;
  done?: boolean;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={
          done
            ? "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald text-white"
            : "mt-0.5 inline-flex size-5 shrink-0 rounded-full border-2 border-blue/40 bg-elevated"
        }
        aria-hidden="true"
      >
        {done ? <CheckIcon /> : null}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{title}</span>
        <span className="caption mt-0.5 block">{meta}</span>
      </span>
    </li>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden="true">
      <path
        d="M8 1.5 9.2 5.8 13.5 7 9.2 8.2 8 12.5 6.8 8.2 2.5 7l4.3-1.2L8 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function DotIcon() {
  return <span className="size-2 rounded-full bg-current" />;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

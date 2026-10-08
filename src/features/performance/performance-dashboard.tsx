import { Card } from "@/components/ui/card";
import type {
  ActivityItem,
  PerformanceDashboard,
  PerformanceSnapshot,
  QuizTrendPoint,
  RecentQuiz,
  SkillArea,
  TaskBar,
} from "@/features/performance/types";

export function PerformanceDashboardView({ dashboard }: { dashboard: PerformanceDashboard }) {
  const taskRemaining = Math.max(dashboard.tasksTotal - dashboard.tasksCompleted, 0);

  return (
    <div className="flex flex-col gap-8">
      <p className="body-secondary" role="status">
        Progress loaded from your saved tasks, quiz attempts, and performance snapshots.
      </p>
      <Card variant="elevated">
        <p className="caption">Progress summary</p>
        <h2 className="section-heading mt-2">Where you stand</h2>
        <p className="body mt-3">{dashboard.summary}</p>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Overall learning progress"
          value={`${dashboard.overallPercent}%`}
          detail="Task completion and quiz average, using whichever of those you have saved."
        />
        <Metric
          label="Average quiz score"
          value={dashboard.averageQuizScore === null ? "No score yet" : formatPercent(dashboard.averageQuizScore)}
          detail={
            dashboard.quizzesCompleted === 0
              ? "Submit a quiz to record a score."
              : `Across ${dashboard.quizzesCompleted} submitted ${dashboard.quizzesCompleted === 1 ? "quiz" : "quizzes"}.`
          }
        />
        <Metric
          label="Quizzes completed"
          value={String(dashboard.quizzesCompleted)}
          detail="Submitted attempts saved on your account."
        />
        <Metric
          label="Study tasks completed"
          value={String(dashboard.tasksCompleted)}
          detail={dashboard.tasksTotal === 0 ? "No study tasks are saved yet." : `${dashboard.tasksTotal} saved in total.`}
        />
        <Metric
          label="Task completion"
          value={dashboard.taskPercent === null ? "No tasks yet" : `${dashboard.taskPercent}%`}
          detail={
            dashboard.taskPercent === null
              ? "Add a study task to measure completion."
              : `${dashboard.tasksCompleted} complete and ${taskRemaining} still open.`
          }
        />
        <Metric
          label="Current learning progress"
          value={dashboard.currentPercent === null ? "No current tasks" : `${dashboard.currentPercent}%`}
          detail={currentDetail(dashboard)}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="raised">
          <h2 className="card-heading">Overall progress</h2>
          <p className="caption mt-1">Combined from saved task completion and submitted quiz scores.</p>
          <Meter label="Overall learning progress" percent={dashboard.overallPercent} />
        </Card>
        <Card variant="raised">
          <h2 className="card-heading">Study task completion</h2>
          <p className="caption mt-1">
            {dashboard.tasksTotal === 0
              ? "No study tasks are saved yet."
              : `${dashboard.tasksCompleted} complete, ${taskRemaining} remaining, out of ${dashboard.tasksTotal}.`}
          </p>
          {dashboard.taskPercent === null ? (
            <p className="body-secondary mt-4">No study tasks are saved yet.</p>
          ) : (
            <Meter label="Study task completion" percent={dashboard.taskPercent} />
          )}
          <TaskBars bars={dashboard.taskBars} />
        </Card>
      </div>
      <Card variant="raised">
        <h2 className="card-heading">Quiz score trend</h2>
        <p className="caption mt-1">Each bar is one submitted attempt, oldest to newest.</p>
        <QuizTrend points={dashboard.quizTrend} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <AreaList
          title="Strong areas"
          empty={
            dashboard.quizzesCompleted === 0
              ? "Submit a quiz to see skills from your answers."
              : "No skill is at 80% or above yet."
          }
          areas={dashboard.strongAreas}
        />
        <AreaList
          title="Weak areas"
          empty={
            dashboard.quizzesCompleted === 0
              ? "Submit a quiz to see skills from your answers."
              : "No skill is below 80% yet."
          }
          areas={dashboard.weakAreas}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="raised">
          <h2 className="card-heading">Recent quiz results</h2>
          {dashboard.recentQuizzes.length === 0 ? (
            <p className="body-secondary mt-3">Submit a quiz to see a result here.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {dashboard.recentQuizzes.map((quiz) => (
                <QuizResult key={quiz.id} quiz={quiz} />
              ))}
            </ul>
          )}
        </Card>
        <Card variant="raised">
          <h2 className="card-heading">Recent activity</h2>
          {dashboard.recentActivity.length === 0 ? (
            <p className="body-secondary mt-3">Completed tasks and submitted quizzes will appear here.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {dashboard.recentActivity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card variant="quiet">
        <h2 className="card-heading">Saved snapshots</h2>
        <p className="caption mt-1">These rows are written when you submit a quiz or change a task status.</p>
        {dashboard.snapshots.length === 0 ? (
          <p className="body-secondary mt-3">No performance snapshot is saved yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {dashboard.snapshots.map((snapshot) => (
              <SnapshotRow key={snapshot.id} snapshot={snapshot} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card variant="elevated">
      <p className="caption">{label}</p>
      <p className="section-heading mt-2">{value}</p>
      <p className="body-secondary mt-2">{detail}</p>
    </Card>
  );
}

function Meter({ label, percent }: { label: string; percent: number }) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className="mt-4">
      <div
        className="h-3 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={width}
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </div>
      <p className="caption mt-2">{width}%</p>
    </div>
  );
}

function TaskBars({ bars }: { bars: TaskBar[] }) {
  if (bars.length === 0) {
    return <p className="body-secondary mt-4">No study tasks are saved yet.</p>;
  }

  return (
    <ul className="mt-5 flex flex-col gap-4">
      {bars.map((bar) => {
        const value = bar.total === 0 ? 0 : Math.round((bar.completed / bar.total) * 100);
        return (
          <li key={bar.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="body">{bar.label}</p>
              <p className="caption">
                {bar.completed}/{bar.total}
              </p>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-label={`${bar.label} task completion`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
            >
              <div className="h-full rounded-full bg-accent-secondary" style={{ width: `${value}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function QuizTrend({ points }: { points: QuizTrendPoint[] }) {
  if (points.length === 0) {
    return <p className="body-secondary mt-4">Submit a quiz to see a score trend.</p>;
  }

  return (
    <div className="mt-6 flex h-48 items-end gap-2 sm:gap-3" role="img" aria-label="Quiz score trend">
      {points.map((point) => (
        <div key={point.id} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
          <p className="caption text-center">{formatPercent(point.score)}</p>
          <div className="flex min-h-16 flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-accent"
              style={{ height: `${Math.max(point.score, 4)}%` }}
              title={`${point.title}: ${formatPercent(point.score)}`}
            />
          </div>
          <p className="caption text-center">{formatWhen(point.label)}</p>
        </div>
      ))}
    </div>
  );
}

function AreaList({ title, empty, areas }: { title: string; empty: string; areas: SkillArea[] }) {
  return (
    <Card variant="raised">
      <h2 className="card-heading">{title}</h2>
      {areas.length === 0 ? (
        <p className="body-secondary mt-3">{empty}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {areas.map((area) => (
            <li key={area.skill} className="flex items-baseline justify-between gap-3">
              <p className="body">{area.skill}</p>
              <p className="caption">
                {area.percent}% · {area.correct}/{area.total}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function QuizResult({ quiz }: { quiz: RecentQuiz }) {
  return (
    <li className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="caption">{formatWhen(quiz.submittedAt)}</p>
      <p className="body mt-1">{quiz.title}</p>
      <p className="caption mt-1">
        {quiz.skill} · {formatPercent(quiz.score)} · {quiz.correct}/{quiz.total} correct
      </p>
    </li>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <li className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="caption">{formatWhen(item.at)}</p>
      <p className="body mt-1">{item.title}</p>
      <p className="caption mt-1">{item.detail}</p>
    </li>
  );
}

function SnapshotRow({ snapshot }: { snapshot: PerformanceSnapshot }) {
  return (
    <li className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="caption">{formatDay(snapshot.recordedOn)}</p>
      <p className="body mt-1">{snapshot.summary}</p>
      <p className="caption mt-1">
        Tasks {snapshot.tasksCompleted}/{snapshot.tasksTotal} · Quizzes {snapshot.quizzesTaken}
        {snapshot.averageScore === null ? "" : ` · Average ${formatPercent(snapshot.averageScore)}`}
      </p>
      {snapshot.consistencyNote ? <p className="body-secondary mt-1">{snapshot.consistencyNote}</p> : null}
    </li>
  );
}

function currentDetail(dashboard: PerformanceDashboard): string {
  if (!dashboard.currentPlanTitle) {
    return "Save a current study plan to track this stage.";
  }

  const stage = dashboard.currentStageTitle ? ` Current stage: ${dashboard.currentStageTitle}.` : "";
  return `${dashboard.currentCompleted} of ${dashboard.currentTotal} tasks on ${dashboard.currentPlanTitle}.${stage}`;
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return formatDay(iso);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDay(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return "Saved";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

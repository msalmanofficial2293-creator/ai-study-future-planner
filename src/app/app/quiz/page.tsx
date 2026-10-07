import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/feedback";
import { QuizDashboard } from "@/features/quiz/quiz-dashboard";
import { QuizPlayer } from "@/features/quiz/quiz-player";
import type { QuizResult } from "@/features/quiz/types";
import { loadQuizPage } from "@/services/quiz";

export const metadata: Metadata = {
  title: "AI Quiz",
  robots: { index: false, follow: false },
};

type QuizPageProps = {
  searchParams: Promise<{ attempt?: string; error?: string }>;
};

const ERRORS: Record<string, string> = {
  prepare: "The practice quiz could not be saved. Please try again.",
  start: "That quiz could not be started. Please try again.",
  plan: "Save a study task before creating a quiz.",
  save: "The quiz could not be saved. Please try again.",
};

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const params = await searchParams;
  const attemptId = typeof params.attempt === "string" && /^[0-9a-f-]{36}$/i.test(params.attempt) ? params.attempt : null;
  const loaded = await loadQuizPage(attemptId);

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  if (loaded.status === "incomplete") {
    redirect("/onboarding");
  }

  if (params.attempt && !attemptId) {
    return <QuizError title="AI Quiz" message="That quiz attempt is not available." />;
  }

  if (loaded.status === "unavailable") {
    return <QuizError title="AI Quiz" message="Something went wrong. Please try again." retry />;
  }

  if (loaded.status === "missing-attempt") {
    return <QuizError title="AI Quiz" message="That quiz attempt is not available." />;
  }

  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="max-w-2xl">
          <p className="eyebrow">AI Quiz</p>
          <h1 className="page-heading mt-3">Practice what you studied</h1>
          <p className="body-secondary mt-3">
            Questions are written on this server from your roadmap and study plan. This page does
            not call a paid AI provider, and it does not change your study plan.
          </p>
        </div>
        {loaded.status === "no-roadmap" ? (
          <EmptyState
            title="No roadmap yet"
            description="Generate a roadmap, then save a study task. A practice quiz is stored on that plan."
            action={<Button href="/app/future-planner">Open Future Planner</Button>}
          />
        ) : null}
        {loaded.status === "no-plan" ? (
          <EmptyState
            title="No study plan yet"
            description="Save a study task before creating a quiz. The quiz is stored on your current study plan."
            action={<Button href="/app/study-plan">Open Study Plan</Button>}
          />
        ) : null}
        {loaded.status === "playing" ? <QuizPlayer quiz={loaded.quiz} /> : null}
        {loaded.status === "result" ? <QuizResultView result={loaded.result} /> : null}
        {loaded.status === "ready" ? (
          <QuizDashboard dashboard={loaded.dashboard} formError={ERRORS[params.error ?? ""]} />
        ) : null}
      </div>
    </Container>
  );
}

function QuizResultView({ result }: { result: QuizResult }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
        Attempt saved.
      </p>
      <Card variant="elevated">
        <p className="caption">
          {result.difficulty} · {result.skill}
        </p>
        <h2 className="section-heading mt-2">{result.title}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Score label="Score" value={`${result.correctCount} / ${result.total}`} />
          <Score label="Percentage" value={formatPercent(result.percentage)} />
          <Score label="Correct answers" value={String(result.correctCount)} />
          <Score label="Incorrect answers" value={String(result.incorrectCount)} />
          <Score label="Total questions" value={String(result.total)} />
        </dl>
        <div className="mt-5">
          <Button href="/app/quiz" variant="secondary">
            Back to quizzes
          </Button>
        </div>
      </Card>
      <section aria-labelledby="quiz-review" className="flex flex-col gap-3">
        <h2 id="quiz-review" className="section-heading">
          Question review
        </h2>
        <ol className="grid gap-3">
          {result.review.map((item) => (
            <li key={item.position}>
              <Card variant="quiet">
                <p className={item.correct ? "font-medium text-success" : "field-error"}>
                  {item.correct ? "Correct" : "Incorrect"}
                </p>
                <h3 className="card-heading mt-2">
                  {item.position}. {item.prompt}
                </h3>
                <dl className="mt-4 grid gap-3">
                  <div>
                    <dt className="caption">Your answer</dt>
                    <dd className="body mt-1">{item.choices[item.selectedIndex] ?? "No answer"}</dd>
                  </div>
                  <div>
                    <dt className="caption">Correct answer</dt>
                    <dd className="body mt-1">{item.choices[item.correctIndex] ?? "Not available"}</dd>
                  </div>
                  <div>
                    <dt className="caption">Explanation</dt>
                    <dd className="body mt-1">{item.explanation || "No explanation was saved."}</dd>
                  </div>
                </dl>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="section-heading mt-1">{value}</dd>
    </div>
  );
}

function QuizError({ title, message, retry = false }: { title: string; message: string; retry?: boolean }) {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-4">
        <h1 className="page-heading">{title}</h1>
        <p className="field-error" role="alert">
          Error: {message}
        </p>
        {retry ? (
          <Link href="/app/quiz" className="font-medium text-accent-deep underline underline-offset-4">
            Try again
          </Link>
        ) : (
          <Button href="/app/quiz" variant="secondary">
            Back to quizzes
          </Button>
        )}
      </div>
    </Container>
  );
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

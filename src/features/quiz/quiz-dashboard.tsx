"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { prepareQuizzesAction, startQuizAction } from "@/features/quiz/actions";
import type { QuizDashboard as QuizDashboardData } from "@/features/quiz/types";

type QuizDashboardProps = {
  dashboard: QuizDashboardData;
  formError?: string;
};

export function QuizDashboard({ dashboard, formError }: QuizDashboardProps) {
  return (
    <div className="flex flex-col gap-8">
      {formError ? (
        <p className="field-error" role="alert">
          Error: {formError}
        </p>
      ) : null}
      <section aria-labelledby="available-quizzes" className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="available-quizzes" className="section-heading">
              Available quizzes
            </h2>
            <p className="body-secondary">Practice from {dashboard.roadmapTitle}.</p>
          </div>
          {dashboard.canPrepare && dashboard.quizzes.length > 0 ? <PrepareButton label="Add practice quiz" /> : null}
        </div>
        {dashboard.quizzes.length === 0 ? (
          <EmptyState
            title="No quizzes yet"
            description="Create a practice quiz from your current study skills. It stays in this list after you refresh."
            action={dashboard.canPrepare ? <PrepareButton label="Create practice quizzes" /> : undefined}
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {dashboard.quizzes.map((quiz) => (
              <li key={quiz.id}>
                <Card variant="quiet" className="h-full">
                  <p className="caption">{quiz.difficulty}</p>
                  <h3 className="card-heading mt-2">{quiz.title}</h3>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Detail label="Topic or skill" value={quiz.skill} />
                    <Detail label="Questions" value={String(quiz.questionCount)} />
                  </dl>
                  <form action={startQuizAction} className="mt-4">
                    <input type="hidden" name="quizId" value={quiz.id} />
                    {quiz.continueAttemptId ? (
                      <input type="hidden" name="continueAttemptId" value={quiz.continueAttemptId} />
                    ) : null}
                    <StartButton label={quiz.continueAttemptId ? "Continue quiz" : "Start quiz"} />
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="quiz-history" className="flex flex-col gap-4">
        <h2 id="quiz-history" className="section-heading">
          Quiz history
        </h2>
        {dashboard.history.length === 0 ? (
          <p className="body-secondary">No attempts yet. A saved score will stay here after you refresh.</p>
        ) : (
          <ul className="grid gap-3">
            {dashboard.history.map((attempt) => (
              <li key={attempt.attemptId}>
                <Card variant="quiet">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="caption">{formatWhen(attempt.submittedAt)}</p>
                      <h3 className="card-heading mt-1">{attempt.quizTitle}</h3>
                      <p className="body-secondary">{attempt.skill}</p>
                    </div>
                    <p className="section-heading">{formatPercent(attempt.percentage)}</p>
                  </div>
                  <div className="mt-4">
                    <Button href={`/app/quiz?attempt=${attempt.attemptId}`} variant="secondary">
                      Review attempt
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PrepareButton({ label }: { label: string }) {
  return (
    <form action={prepareQuizzesAction}>
      <PrepareSubmit label={label} />
    </form>
  );
}

function PrepareSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" loading={pending} disabled={pending}>
      {pending ? "Creating quiz" : label}
    </Button>
  );
}

function StartButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" loading={pending} disabled={pending}>
      {pending ? "Starting quiz" : label}
    </Button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}

function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Saved attempt";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

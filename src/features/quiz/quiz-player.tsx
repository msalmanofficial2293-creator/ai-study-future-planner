"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { submitQuizAction, type QuizSubmitState } from "@/features/quiz/actions";
import type { QuizPlay } from "@/features/quiz/types";

const initialState: QuizSubmitState = {};

export function QuizPlayer({ quiz }: { quiz: QuizPlay }) {
  const [state, action, pending] = useActionState(submitQuizAction, initialState);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState("");
  const answersRef = useRef(answers);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const question = quiz.questions[index];
  const last = index === quiz.questions.length - 1;
  const percent = quiz.questions.length === 0 ? 0 : Math.round(((index + 1) / quiz.questions.length) * 100);

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  if (!question) {
    return (
      <p className="field-error" role="alert">
        Error: This quiz has no questions. Go back and create another practice quiz.
      </p>
    );
  }

  function choose(choiceIndex: number) {
    if (!question) {
      return;
    }

    const next = { ...answersRef.current, [question.id]: choiceIndex };
    answersRef.current = next;
    setAnswers(next);
    setNotice("");
  }

  function goNext() {
    if (!question || answersRef.current[question.id] === undefined) {
      setNotice("Choose an answer before continuing.");
      return;
    }

    setIndex((current) => Math.min(current + 1, quiz.questions.length - 1));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;

    for (const item of quiz.questions) {
      const selected = answersRef.current[item.id];
      const input = form.elements.namedItem(`answer-${item.id}`);

      if (selected === undefined || !(input instanceof HTMLInputElement)) {
        event.preventDefault();
        setNotice("Choose an answer before continuing.");
        return;
      }

      input.value = String(selected);
    }
  }

  return (
    <Card variant="raised">
      <p className="caption">
        {quiz.difficulty} · {quiz.skill}
      </p>
      <h2 className="card-heading mt-2">{quiz.title}</h2>
      <p className="body-secondary mt-3">
        Question {index + 1} of {quiz.questions.length}
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={quiz.questions.length}
        aria-valuenow={index + 1}
        aria-label="Quiz progress"
      >
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
      <form action={action} onSubmit={onSubmit} className="mt-6" aria-busy={pending}>
        <input type="hidden" name="attemptId" value={quiz.attemptId} />
        {quiz.questions.map((item) => (
          <input key={item.id} type="hidden" name={`answer-${item.id}`} value={answers[item.id] ?? ""} />
        ))}
        <fieldset disabled={pending} className="grid gap-3">
          <legend>
            <h3 ref={headingRef} tabIndex={-1} className="section-heading outline-none">
              {question.prompt}
            </h3>
          </legend>
          {question.choices.map((choice, choiceIndex) => {
            const selected = answers[question.id] === choiceIndex;
            return (
              <label
                key={`${question.id}-${choiceIndex}`}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 ${selected ? "border-accent" : "border-border"}`}
              >
                <input
                  type="radio"
                  name={`choice-${question.id}`}
                  className="mt-1"
                  checked={selected}
                  onChange={() => choose(choiceIndex)}
                />
                <span className="body">{choice}</span>
              </label>
            );
          })}
        </fieldset>
        {notice ? (
          <p className="field-error mt-4" role="alert">
            Error: {notice}
          </p>
        ) : null}
        {state.formError ? (
          <p className="field-error mt-4" role="alert">
            Error: {state.formError}
          </p>
        ) : null}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          {last ? (
            <SubmitQuizButton />
          ) : (
            <Button type="button" className="w-full sm:w-auto" onClick={goNext} disabled={pending}>
              Next question
            </Button>
          )}
          <Button href="/app/quiz" variant="secondary" className="w-full sm:w-auto">
            Back to quizzes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SubmitQuizButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" loading={pending} disabled={pending}>
      {pending ? "Submitting quiz" : "Submit quiz"}
    </Button>
  );
}

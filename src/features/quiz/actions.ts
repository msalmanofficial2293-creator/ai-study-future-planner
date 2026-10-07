"use server";

import { redirect } from "next/navigation";
import { preparePracticeQuizzes, startQuizAttempt, submitQuizAttempt } from "@/services/quiz";
import type { QuizMutation } from "@/services/quiz";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export type QuizSubmitState = {
  formError?: string;
};

const prepareInFlight = new Map<string, Promise<void>>();
const startInFlight = new Map<string, Promise<void>>();
const submitInFlight = new Map<string, Promise<QuizSubmitState>>();

export async function prepareQuizzesAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/quiz?error=prepare");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = prepareInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = runPrepare(user.id).finally(() => {
    prepareInFlight.delete(user.id);
  });
  prepareInFlight.set(user.id, outcome);
  return outcome;
}

export async function startQuizAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/quiz?error=start");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = startInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = runStart(user.id, formData).finally(() => {
    startInFlight.delete(user.id);
  });
  startInFlight.set(user.id, outcome);
  return outcome;
}

export async function submitQuizAction(
  _previous: QuizSubmitState,
  formData: FormData,
): Promise<QuizSubmitState> {
  if (!(formData instanceof FormData)) {
    return { formError: "Something went wrong. Please try again." };
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = submitInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = runSubmit(user.id, formData).finally(() => {
    submitInFlight.delete(user.id);
  });
  submitInFlight.set(user.id, outcome);
  return outcome;
}

async function runPrepare(userId: string): Promise<void> {
  const result = await preparePracticeQuizzes(userId);

  if (!result.ok) {
    redirect(result.reason === "missing-plan" ? "/app/quiz?error=plan" : "/app/quiz?error=prepare");
  }

  redirect("/app/quiz");
}

async function runStart(userId: string, formData: FormData): Promise<void> {
  const quizId = readId(formData, "quizId");
  const continueId = readId(formData, "continueAttemptId");

  if (continueId) {
    redirect(`/app/quiz?attempt=${continueId}`);
  }

  if (!quizId) {
    redirect("/app/quiz?error=start");
  }

  const result = await startQuizAttempt(userId, quizId);

  if (!result.ok || !result.attemptId) {
    redirect("/app/quiz?error=start");
  }

  redirect(`/app/quiz?attempt=${result.attemptId}`);
}

async function runSubmit(userId: string, formData: FormData): Promise<QuizSubmitState> {
  const attemptId = readId(formData, "attemptId");

  if (!attemptId) {
    return { formError: "Something went wrong. Please try again." };
  }

  const selections = new Map<string, number>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("answer-") || typeof value !== "string") {
      continue;
    }

    const questionId = key.slice("answer-".length);
    const selected = Number(value);

    if (value.trim() === "" || !/^[0-9a-f-]{36}$/i.test(questionId) || !Number.isInteger(selected) || selected < 0) {
      return { formError: "Answer every question before submitting." };
    }

    selections.set(questionId, selected);
  }

  const result = await submitQuizAttempt(userId, attemptId, selections);
  return submitState(result, attemptId);
}

function submitState(result: QuizMutation, attemptId: string): QuizSubmitState {
  if (!result.ok && result.reason === "unauthenticated") {
    redirect("/login");
  }

  if (!result.ok && result.reason === "invalid") {
    return { formError: "Answer every question before submitting." };
  }

  if (!result.ok) {
    return { formError: "The quiz could not be saved. Please try again." };
  }

  redirect(`/app/quiz?attempt=${result.attemptId ?? attemptId}`);
}

function readId(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  const text = typeof value === "string" ? value.trim() : "";
  return /^[0-9a-f-]{36}$/i.test(text) ? text : null;
}

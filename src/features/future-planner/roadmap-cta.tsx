"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { generateRoadmapAction, type RoadmapActionState } from "@/features/roadmap/actions";

const initialState: RoadmapActionState = {};

type RoadmapCtaProps = {
  hasGoal: boolean;
};

export function RoadmapCta({ hasGoal }: RoadmapCtaProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(generateRoadmapAction, initialState);
  const submitLock = useRef(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (!pending) {
      submitLock.current = false;
    }
  }, [pending]);

  useEffect(() => {
    if (wasPending.current && !pending && state.message) {
      router.refresh();
    }

    wasPending.current = pending;
  }, [pending, router, state.message]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submitLock.current || !hasGoal) {
      event.preventDefault();
      return;
    }

    submitLock.current = true;
  }

  return (
    <form action={formAction} className="flex w-full flex-col items-start gap-4 sm:max-w-sm lg:max-w-xs" aria-busy={pending} onSubmit={handleSubmit}>
      {state.formError ? (
        <p className="field-error" role="alert">
          Error: {state.formError}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full sm:w-auto" loading={pending} disabled={pending || !hasGoal}>
        {pending ? "Generating your roadmap" : "Generate My AI Future Roadmap"}
      </Button>
      <p className="caption">
        {hasGoal
          ? "This uses your saved goal and learning context. Study plans are not created."
          : "Add a career goal before generating a roadmap."}
      </p>
    </form>
  );
}

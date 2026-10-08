"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  applyPersonalizationAction,
  dismissPersonalizationAction,
  refreshPersonalizationAction,
} from "@/features/personalization/actions";

export function RefreshAnalysisButton() {
  return (
    <form action={refreshPersonalizationAction}>
      <RefreshSubmit />
    </form>
  );
}

export function RecommendationActions({
  fingerprint,
  canApply,
  status,
}: {
  fingerprint: string;
  canApply: boolean;
  status: "open" | "applied" | "dismissed";
}) {
  if (status !== "open") {
    return (
      <p className="caption mt-3">
        {status === "applied" ? "Applied" : "Dismissed"}
      </p>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {canApply ? (
        <form action={applyPersonalizationAction}>
          <input type="hidden" name="fingerprint" value={fingerprint} />
          <ApplySubmit />
        </form>
      ) : (
        <form action={applyPersonalizationAction}>
          <input type="hidden" name="fingerprint" value={fingerprint} />
          <MarkSubmit />
        </form>
      )}
      <form action={dismissPersonalizationAction}>
        <input type="hidden" name="fingerprint" value={fingerprint} />
        <DismissSubmit />
      </form>
    </div>
  );
}

function RefreshSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" loading={pending} disabled={pending}>
      Refresh Analysis
    </Button>
  );
}

function ApplySubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={pending}>
      Apply Recommendation
    </Button>
  );
}

function MarkSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" loading={pending} disabled={pending}>
      Mark as followed
    </Button>
  );
}

function DismissSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="ghost" loading={pending} disabled={pending}>
      Dismiss Recommendation
    </Button>
  );
}

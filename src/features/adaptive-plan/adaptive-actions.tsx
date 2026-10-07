"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { applyAdaptivePlanAction, saveAdaptivePlanAction } from "@/features/adaptive-plan/actions";

export function AdaptiveActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form action={saveAdaptivePlanAction}>
        <SaveButton />
      </form>
      <form action={applyAdaptivePlanAction}>
        <ApplyButton />
      </form>
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="secondary" className="w-full sm:w-auto" loading={pending} disabled={pending}>
      {pending ? "Saving recommendation" : "Save recommendation"}
    </Button>
  );
}

function ApplyButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" loading={pending} disabled={pending}>
      {pending ? "Applying changes" : "Apply changes"}
    </Button>
  );
}

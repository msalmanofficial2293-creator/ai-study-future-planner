"use server";

import { redirect } from "next/navigation";
import { applyAdaptiveRecommendation, saveAdaptiveRecommendation } from "@/services/adaptive-plan";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const saveInFlight = new Map<string, Promise<void>>();
const applyInFlight = new Map<string, Promise<void>>();

export async function saveAdaptivePlanAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/adaptive-plan?error=save");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = saveInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = runSave(user.id).finally(() => {
    saveInFlight.delete(user.id);
  });
  saveInFlight.set(user.id, outcome);
  return outcome;
}

export async function applyAdaptivePlanAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/adaptive-plan?error=apply");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const pending = applyInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = runApply(user.id).finally(() => {
    applyInFlight.delete(user.id);
  });
  applyInFlight.set(user.id, outcome);
  return outcome;
}

async function runSave(userId: string): Promise<void> {
  const result = await saveAdaptiveRecommendation(userId);

  if (!result.ok) {
    redirect(result.reason === "unauthenticated" ? "/login" : "/app/adaptive-plan?error=save");
  }

  redirect("/app/adaptive-plan?notice=saved");
}

async function runApply(userId: string): Promise<void> {
  const result = await applyAdaptiveRecommendation(userId);

  if (!result.ok) {
    redirect(result.reason === "unauthenticated" ? "/login" : "/app/adaptive-plan?error=apply");
  }

  redirect(result.added === 0 ? "/app/adaptive-plan?notice=already" : "/app/adaptive-plan?notice=applied");
}

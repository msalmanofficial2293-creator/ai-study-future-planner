"use server";

import { redirect } from "next/navigation";
import {
  applyPersonalizationRecommendation,
  dismissPersonalizationRecommendation,
} from "@/services/personalization";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const applyInFlight = new Map<string, Promise<void>>();
const dismissInFlight = new Map<string, Promise<void>>();

export async function applyPersonalizationAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/personalization?error=apply");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const fingerprint = readField(formData, "fingerprint");
  const pending = applyInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = runApply(user.id, fingerprint).finally(() => {
    applyInFlight.delete(user.id);
  });
  applyInFlight.set(user.id, outcome);
  return outcome;
}

export async function dismissPersonalizationAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/personalization?error=dismiss");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const fingerprint = readField(formData, "fingerprint");
  const pending = dismissInFlight.get(user.id);

  if (pending) {
    return pending;
  }

  const outcome = runDismiss(user.id, fingerprint).finally(() => {
    dismissInFlight.delete(user.id);
  });
  dismissInFlight.set(user.id, outcome);
  return outcome;
}

export async function refreshPersonalizationAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/personalization?error=refresh");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  redirect("/app/personalization?notice=refreshed");
}

async function runApply(userId: string, fingerprint: string): Promise<void> {
  const result = await applyPersonalizationRecommendation(userId, fingerprint);

  if (!result.ok) {
    if (result.reason === "already") {
      redirect("/app/personalization?notice=already");
    }

    redirect(`/app/personalization?error=${result.reason === "missing" ? "missing" : "apply"}`);
  }

  redirect(result.added === 0 ? "/app/personalization?notice=marked" : "/app/personalization?notice=applied");
}

async function runDismiss(userId: string, fingerprint: string): Promise<void> {
  const result = await dismissPersonalizationRecommendation(userId, fingerprint);

  if (!result.ok) {
    redirect(`/app/personalization?error=${result.reason === "missing" ? "missing" : "dismiss"}`);
  }

  redirect("/app/personalization?notice=dismissed");
}

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

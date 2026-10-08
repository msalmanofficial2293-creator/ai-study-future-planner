"use server";

import { redirect } from "next/navigation";
import { allowTutorSend } from "@/features/tutor/allowance";
import type { TutorSendResult } from "@/features/tutor/types";
import {
  clearTutorConversation,
  deleteTutorConversation,
  renameTutorConversation,
  sendTutorMessage,
} from "@/services/tutor";
import { getAuthenticatedUser } from "@/lib/supabase/server";

const sendInFlight = new Map<string, Promise<TutorSendResult>>();

export async function sendTutorMessageAction(
  conversationId: string | null,
  content: string,
): Promise<TutorSendResult> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { ok: false, message: "Sign in to use the tutor." };
  }

  if (!allowTutorSend(user.id)) {
    return { ok: false, message: "Too many tutor messages. Please wait a minute and try again." };
  }

  if (sendInFlight.has(user.id)) {
    return { ok: false, message: "Wait for the current reply before sending another question." };
  }

  const pending = sendTutorMessage(user.id, conversationId, content).finally(() => {
    sendInFlight.delete(user.id);
  });
  sendInFlight.set(user.id, pending);
  return pending;
}

export async function renameTutorConversationAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/ai-tutor?error=rename");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const conversationId = readField(formData, "conversationId");
  const title = readField(formData, "title");
  const result = await renameTutorConversation(user.id, conversationId, title);

  if (!result.ok) {
    const error = result.reason === "invalid" ? "title" : result.reason === "missing" ? "missing" : "rename";
    redirect(`/app/ai-tutor?chat=${encodeURIComponent(conversationId)}&error=${error}`);
  }

  redirect(`/app/ai-tutor?chat=${encodeURIComponent(conversationId)}&notice=renamed`);
}

export async function clearTutorConversationAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/ai-tutor?error=clear");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const conversationId = readField(formData, "conversationId");
  const result = await clearTutorConversation(user.id, conversationId);

  if (!result.ok) {
    redirect(`/app/ai-tutor?error=${result.reason === "missing" ? "missing" : "clear"}`);
  }

  redirect(`/app/ai-tutor?chat=${encodeURIComponent(conversationId)}&notice=cleared`);
}

export async function deleteTutorConversationAction(formData: FormData): Promise<void> {
  if (!(formData instanceof FormData)) {
    redirect("/app/ai-tutor?error=delete");
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const conversationId = readField(formData, "conversationId");
  const result = await deleteTutorConversation(user.id, conversationId);

  if (!result.ok) {
    redirect(`/app/ai-tutor?error=${result.reason === "missing" ? "missing" : "delete"}`);
  }

  redirect("/app/ai-tutor?notice=deleted");
}

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

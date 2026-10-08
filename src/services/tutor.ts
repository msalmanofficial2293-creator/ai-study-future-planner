import "server-only";

import { TUTOR_MESSAGE_MAX } from "@/features/tutor/prompts";
import type {
  TutorConversationSummary,
  TutorMessage,
  TutorMutation,
  TutorPage,
  TutorRole,
  TutorSendResult,
} from "@/features/tutor/types";
import { logServerDiagnostic } from "@/lib/security/log";
import { createTutorGenerator } from "@/services/tutor-generator";
import { loadTutorContext } from "@/services/tutor-context";
import { createSupabaseServerClient, getAuthenticatedUser } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function loadTutorPage(chatId: string | null): Promise<TutorPage> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return { status: "unauthenticated" };
  }

  const context = await loadTutorContext(user.id);

  if (context === "incomplete" || context === "unavailable") {
    return { status: context };
  }

  const conversations = await listConversations(user.id);

  if (!conversations) {
    return { status: "unavailable" };
  }

  const requested = chatId && UUID.test(chatId) ? chatId : null;
  const active = requested ? await loadConversation(user.id, requested) : null;

  if (requested && active === "unavailable") {
    return { status: "unavailable" };
  }

  const studyFocus =
    context.todayTasks[0]?.skill ?? context.stageSkills[0] ?? context.stageTitle ?? context.field;

  return {
    status: "ready",
    focus: {
      goalTitle: context.goalTitle,
      stageTitle: context.stageTitle,
      studyFocus,
    },
    conversations,
    active: active && active !== "unavailable" ? active : null,
    missingChat: Boolean(chatId) && !active,
  };
}

export async function sendTutorMessage(
  userId: string,
  conversationId: string | null,
  content: string,
): Promise<TutorSendResult> {
  const message = content.trim();

  if (!message) {
    return { ok: false, message: "Write a question before sending." };
  }

  if (message.length > TUTOR_MESSAGE_MAX) {
    return { ok: false, message: "Keep the question under 2,000 characters." };
  }

  if (conversationId && !UUID.test(conversationId)) {
    return { ok: false, message: "That conversation is not available." };
  }

  const context = await loadTutorContext(userId);

  if (context === "incomplete") {
    return { ok: false, message: "Finish your profile before using the tutor." };
  }

  if (context === "unavailable") {
    return { ok: false, message: "Your study context could not be loaded. Please try again." };
  }

  let reply = "";

  try {
    reply = createTutorGenerator().reply(message, context).trim();
  } catch {
    reply = "";
  }

  if (!reply || reply.length > 4000) {
    return { ok: false, message: "The tutor could not write a reply. Please try again." };
  }

  const ownedId = conversationId ? await ownedConversation(userId, conversationId) : null;

  if (conversationId && !ownedId) {
    return { ok: false, message: "That conversation is not available." };
  }

  const activeId = ownedId ?? (await createConversation(userId, titleFrom(message)));

  if (!activeId) {
    return { ok: false, message: "The conversation could not be saved. Please try again." };
  }

  const supabase = await createSupabaseServerClient();

  const userSaved = await insertMessage(userId, activeId, "user", message);

  if (!userSaved) {
    return { ok: false, message: "Your question could not be saved. Please try again." };
  }

  const tutorSaved = await insertMessage(userId, activeId, "assistant", reply);

  if (!tutorSaved) {
    return { ok: false, message: "The reply could not be saved. Please try again." };
  }

  const touched = await supabase
    .from("tutor_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", activeId)
    .eq("user_id", userId);

  if (touched.error) {
    logTutor("touch", touched.error);
  }

  return { ok: true, conversationId: activeId };
}

export async function renameTutorConversation(
  userId: string,
  conversationId: string,
  title: string,
): Promise<TutorMutation> {
  const nextTitle = title.trim().replace(/\s+/g, " ");

  if (!UUID.test(conversationId) || !(await ownedConversation(userId, conversationId))) {
    return { ok: false, reason: "missing" };
  }

  if (!nextTitle || nextTitle.length > 80) {
    return { ok: false, reason: "invalid" };
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("tutor_conversations")
    .update({ title: nextTitle })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (result.error) {
    logTutor("rename", result.error);
    return { ok: false, reason: "failed" };
  }

  return { ok: true };
}

export async function clearTutorConversation(userId: string, conversationId: string): Promise<TutorMutation> {
  if (!UUID.test(conversationId) || !(await ownedConversation(userId, conversationId))) {
    return { ok: false, reason: "missing" };
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("tutor_messages")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (result.error) {
    logTutor("clear", result.error);
    return { ok: false, reason: "failed" };
  }

  return { ok: true };
}

export async function deleteTutorConversation(userId: string, conversationId: string): Promise<TutorMutation> {
  if (!UUID.test(conversationId)) {
    return { ok: false, reason: "missing" };
  }

  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("tutor_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select("id");

  if (result.error) {
    logTutor("delete", result.error);
    return { ok: false, reason: "failed" };
  }

  if (!result.data || result.data.length === 0) {
    return { ok: false, reason: "missing" };
  }

  return { ok: true };
}

async function listConversations(userId: string): Promise<TutorConversationSummary[] | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("tutor_conversations")
    .select("id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (result.error) {
    logTutor("list", result.error);
    return null;
  }

  return (result.data ?? []).flatMap((row) => {
    const record = asRecord(row);
    const id = readString(record, "id");
    const title = readString(record, "title");
    const updatedAt = readString(record, "updated_at");

    if (!id || !title || !updatedAt) {
      return [];
    }

    return [{ id, title, updatedAt }];
  });
}

async function loadConversation(
  userId: string,
  conversationId: string,
): Promise<{ id: string; title: string; messages: TutorMessage[] } | "unavailable" | null> {
  const supabase = await createSupabaseServerClient();
  const conversation = await supabase
    .from("tutor_conversations")
    .select("id, title")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (conversation.error) {
    logTutor("open", conversation.error);
    return "unavailable";
  }

  const record = asRecord(conversation.data);
  const id = readString(record, "id");
  const title = readString(record, "title");

  if (!id || !title) {
    return null;
  }

  const messages = await supabase
    .from("tutor_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (messages.error) {
    logTutor("messages", messages.error);
    return "unavailable";
  }

  return {
    id,
    title,
    messages: (messages.data ?? []).flatMap((row) => readMessage(row)).reverse(),
  };
}

async function ownedConversation(userId: string, conversationId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("tutor_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    logTutor("own", result.error);
    return null;
  }

  return readString(asRecord(result.data), "id");
}

async function createConversation(userId: string, title: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase
    .from("tutor_conversations")
    .insert({ user_id: userId, title })
    .select("id")
    .single();

  if (result.error) {
    logTutor("create", result.error);
    return null;
  }

  return readString(asRecord(result.data), "id");
}

async function insertMessage(
  userId: string,
  conversationId: string,
  role: TutorRole,
  content: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const result = await supabase.from("tutor_messages").insert({
    user_id: userId,
    conversation_id: conversationId,
    role,
    content,
  });

  if (result.error) {
    logTutor("message", result.error);
    return false;
  }

  return true;
}

function readMessage(row: unknown): TutorMessage[] {
  const record = asRecord(row);
  const id = readString(record, "id");
  const role = readString(record, "role");
  const content = readString(record, "content");
  const createdAt = readString(record, "created_at");

  if (!id || !content || !createdAt || (role !== "user" && role !== "assistant")) {
    return [];
  }

  return [{ id, role, content, createdAt }];
}

function titleFrom(content: string): string {
  const line = content.split("\n")[0]?.replace(/\s+/g, " ").trim() ?? "";
  const title = line.slice(0, 80).trim();
  return title || "New chat";
}

function readString(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function logTutor(step: string, error: { message: string; code?: string } | null): void {
  logServerDiagnostic("tutor", step, error);
}

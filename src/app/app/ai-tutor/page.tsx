import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppPage } from "@/components/ui/app-page";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/feedback";
import { Input } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteConversationButton } from "@/features/tutor/delete-conversation-button";
import { clearTutorConversationAction, renameTutorConversationAction } from "@/features/tutor/actions";
import { TutorChat } from "@/features/tutor/tutor-chat";
import { loadTutorPage } from "@/services/tutor";

export const metadata: Metadata = {
  title: "AI Tutor",
  robots: { index: false, follow: false },
};

type TutorPageProps = {
  searchParams: Promise<{ chat?: string; error?: string; notice?: string }>;
};

const ERRORS: Record<string, string> = {
  rename: "The conversation could not be renamed. Please try again.",
  title: "Use a title between 1 and 80 characters.",
  clear: "The conversation could not be cleared. Please try again.",
  delete: "The conversation could not be deleted. Please try again.",
  missing: "That conversation is not available.",
};

const NOTICES: Record<string, string> = {
  renamed: "Conversation renamed.",
  cleared: "Conversation cleared.",
  deleted: "Conversation deleted.",
};

export default async function AiTutorPage({ searchParams }: TutorPageProps) {
  const params = await searchParams;
  const chatId = typeof params.chat === "string" ? params.chat : null;
  const loaded = await loadTutorPage(chatId);

  if (loaded.status === "unauthenticated") {
    redirect("/login");
  }

  if (loaded.status === "incomplete") {
    redirect("/onboarding");
  }

  if (loaded.status === "unavailable") {
    return (
      <AppPage scene="tutor">
        <ErrorState
          title="The tutor is unavailable"
          description="Your tutor could not be loaded. Please try again in a moment."
          action={<Button href="/app">Back to account</Button>}
        />
      </AppPage>
    );
  }

  const error = params.error ? ERRORS[params.error] : loaded.missingChat ? ERRORS.missing : undefined;
  const notice = params.notice ? NOTICES[params.notice] : undefined;

  return (
    <AppPage scene="tutor">
      <PageHeader
        eyebrow="AI Tutor"
        title="Your personal study assistant"
        description="Ask about the work already on your plan. Replies stay on your goal, stage, and saved results."
        actions={
          <Button href="/app/ai-tutor" variant="secondary">
            Start New Chat
          </Button>
        }
      />
      {notice ? (
        <p className="status-banner status-banner-success" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" role="alert">
          Error: {error}
        </p>
      ) : null}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 space-y-4">
          <Card variant="quiet" title="Recent conversations">
            {loaded.conversations.length === 0 ? (
              <p className="body-secondary">No saved conversations yet.</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {loaded.conversations.map((conversation) => {
                  const current = loaded.active?.id === conversation.id;

                  return (
                    <li
                      key={conversation.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2"
                    >
                      <Link
                        href={`/app/ai-tutor?chat=${conversation.id}`}
                        className={
                          current
                            ? "font-semibold text-accent-deep"
                            : "text-foreground hover:text-accent-deep"
                        }
                        aria-current={current ? "page" : undefined}
                      >
                        {conversation.title}
                      </Link>
                      <DeleteConversationButton
                        id={conversation.id}
                        title={conversation.title}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          {loaded.active ? (
            <div className="flex flex-wrap items-end justify-between gap-3">
              <form action={renameTutorConversationAction} className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
                <input type="hidden" name="conversationId" value={loaded.active.id} />
                <label className="field min-w-[12rem] flex-1">
                  <span className="field-label">Conversation title</span>
                  <Input name="title" type="text" defaultValue={loaded.active.title} maxLength={80} required />
                </label>
                <Button type="submit" variant="outline">
                  Rename
                </Button>
              </form>
              {loaded.active.messages.length > 0 ? (
                <form action={clearTutorConversationAction}>
                  <input type="hidden" name="conversationId" value={loaded.active.id} />
                  <Button type="submit" variant="ghost">
                    Clear conversation
                  </Button>
                </form>
              ) : null}
            </div>
          ) : null}
          <TutorChat conversationId={loaded.active?.id ?? null} messages={loaded.active?.messages ?? []} />
        </div>
        <aside className="lg:sticky lg:top-24">
          <Card variant="raised" title="Study context">
            <dl className="space-y-4">
              <ContextItem label="Career goal" value={loaded.focus.goalTitle} />
              <ContextItem label="Roadmap stage" value={loaded.focus.stageTitle} />
              <ContextItem label="Study focus" value={loaded.focus.studyFocus} />
            </dl>
          </Card>
        </aside>
      </div>
    </AppPage>
  );
}

function ContextItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="body">{value ?? "Not saved yet"}</dd>
    </div>
  );
}

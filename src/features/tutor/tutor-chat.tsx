"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form-controls";
import { sendTutorMessageAction } from "@/features/tutor/actions";
import { parseTutorReply } from "@/features/tutor/format";
import { QUICK_ACTIONS, SUGGESTED_PROMPTS, TUTOR_MESSAGE_MAX } from "@/features/tutor/prompts";
import type { TutorMessage } from "@/features/tutor/types";

type TutorChatProps = {
  conversationId: string | null;
  messages: TutorMessage[];
};

export function TutorChat({ conversationId, messages }: TutorChatProps) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, pending]);

  function send(text: string) {
    const value = text.trim();

    if (!value || pending) {
      return;
    }

    if (value.length > TUTOR_MESSAGE_MAX) {
      setError("Keep the question under 2,000 characters.");
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await sendTutorMessageAction(conversationId, value);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setDraft("");

      if (conversationId !== result.conversationId) {
        router.push(`/app/ai-tutor?chat=${result.conversationId}`);
        return;
      }

      router.refresh();
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(draft);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col rounded-2xl border border-border bg-elevated">
      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-6">
            <div>
              <h2 className="card-heading">Start a study conversation</h2>
              <p className="body-secondary">
                Ask about your goal, the current stage, or a topic you want to understand. The tutor uses your saved study context.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="rounded-full border border-border bg-surface px-3 py-2 text-left text-sm text-foreground hover:border-accent"
                  disabled={pending}
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        {pending ? (
          <p className="caption" role="status">
            Tutor is writing…
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>
      <form
        className="sticky bottom-0 space-y-3 border-t border-border bg-elevated px-4 py-4 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        <div className="flex flex-wrap gap-2" aria-label="Quick actions">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              type="button"
              className="rounded-full bg-info-surface px-3 py-1.5 text-sm font-medium text-accent-secondary disabled:opacity-60"
              disabled={pending}
              onClick={() => send(action.prompt)}
            >
              {action.label}
            </button>
          ))}
        </div>
        <label className="field-label" htmlFor="tutor-message">
          Message
        </label>
        <Textarea
          id="tutor-message"
          name="message"
          rows={3}
          maxLength={TUTOR_MESSAGE_MAX}
          value={draft}
          placeholder="Ask a study question"
          disabled={pending}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="caption">Enter to send. Shift+Enter for a new line.</p>
          <Button type="submit" disabled={pending || draft.trim().length === 0} loading={pending}>
            Send
          </Button>
        </div>
        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: TutorMessage }) {
  const isUser = message.role === "user";
  const reply = isUser ? null : parseTutorReply(message.content);

  return (
    <article className={isUser ? "ml-auto max-w-[42rem]" : "mr-auto max-w-[42rem]"}>
      <div
        className={
          isUser
            ? "rounded-2xl bg-accent px-4 py-3 text-elevated"
            : "rounded-2xl border border-border bg-surface px-4 py-3"
        }
      >
        <p className={isUser ? "text-sm font-semibold text-elevated" : "text-sm font-semibold text-accent-secondary"}>
          {isUser ? "You" : "Tutor"}
        </p>
        {reply ? <TutorReply reply={reply} /> : <p className="mt-2 whitespace-pre-wrap">{message.content}</p>}
      </div>
      <p className="caption mt-1">{formatStamp(message.createdAt)}</p>
    </article>
  );
}

function TutorReply({
  reply,
}: {
  reply: {
    explanation: string;
    points: string[];
    example: string;
    practice: string[];
    next: string;
  };
}) {
  return (
    <div className="mt-3 space-y-4">
      <section>
        <h3 className="text-sm font-semibold">Short explanation</h3>
        <TutorText text={reply.explanation} />
      </section>
      {reply.points.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold">Key points</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {reply.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {reply.example ? (
        <section>
          <h3 className="text-sm font-semibold">Example</h3>
          <TutorText text={reply.example} />
        </section>
      ) : null}
      {reply.practice.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold">Practice</h3>
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {reply.practice.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      ) : null}
      <section>
        <h3 className="text-sm font-semibold">Next step</h3>
        <TutorText text={reply.next} />
      </section>
    </div>
  );
}

function TutorText({ text }: { text: string }) {
  const parts = text.split("```");

  return (
    <div className="mt-1 space-y-2">
      {parts.map((part, index) => {
        if (!part.trim()) {
          return null;
        }

        if (index % 2 === 1) {
          return (
            <pre
              key={`${index}-${part.slice(0, 12)}`}
              className="overflow-x-auto rounded-xl bg-foreground px-3 py-2 text-sm text-elevated"
            >
              <code>{part.replace(/^\n/, "")}</code>
            </pre>
          );
        }

        return (
          <p key={`${index}-${part.slice(0, 12)}`} className="whitespace-pre-wrap">
            {part.trim()}
          </p>
        );
      })}
    </div>
  );
}

function formatStamp(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "Saved";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

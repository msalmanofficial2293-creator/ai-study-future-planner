"use client";

import { deleteTutorConversationAction } from "@/features/tutor/actions";

export function DeleteConversationButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const label = `Delete conversation: ${title}`;

  return (
    <form
      action={deleteTutorConversationAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete conversation “${title}”?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="conversationId" value={id} />
      <button
        type="submit"
        className="caption underline-offset-2 hover:underline"
        aria-label={label}
      >
        Delete
      </button>
    </form>
  );
}

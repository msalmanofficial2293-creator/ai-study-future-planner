"use client";

import { deleteTutorConversationAction } from "@/features/tutor/actions";

export function DeleteConversationButton({ id }: { id: string }) {
  return (
    <form
      action={deleteTutorConversationAction}
      onSubmit={(event) => {
        if (!window.confirm("Delete this conversation?")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="conversationId" value={id} />
      <button type="submit" className="caption underline-offset-2 hover:underline">
        Delete
      </button>
    </form>
  );
}

"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { changeStudyTaskAction, type StudyTaskActionState } from "@/features/study-plan/actions";
import type { DashboardTaskPreview } from "@/services/dashboard";
import { cn } from "@/lib/cn";

const initialState: StudyTaskActionState = {};

type DashboardTodayTasksProps = {
  tasks: DashboardTaskPreview[];
};

export function DashboardTodayTasks({ tasks }: DashboardTodayTasksProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(changeStudyTaskAction, initialState);

  useEffect(() => {
    if (!state.savedAt) {
      return;
    }
    router.refresh();
  }, [router, state.savedAt]);

  return (
    <div className="mt-4 flex flex-col gap-3">
      {state.formError ? (
        <p className="field-error" role="alert">
          Error: {state.formError}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-2xl bg-success-surface px-4 py-2 text-sm text-success" role="status">
          {state.message}
        </p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-paper-raised px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "truncate text-sm font-medium text-ink",
                    task.status === "completed" && "text-foreground-muted line-through",
                  )}
                >
                  {task.title}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
                    task.status === "completed"
                      ? "bg-success-surface text-success"
                      : "bg-info-surface text-tide",
                  )}
                >
                  {task.status === "completed" ? "Done" : "Open"}
                </span>
              </div>
              <p className="caption mt-1">
                {[task.skill || null, `${task.durationMinutes} min`, task.milestoneTitle || null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <form action={action} className="shrink-0">
              <input type="hidden" name="taskId" value={task.id} />
              <input
                type="hidden"
                name="intent"
                value={task.status === "completed" ? "incomplete" : "complete"}
              />
              <Button type="submit" variant="secondary" loading={pending} disabled={pending} className="w-full sm:w-auto">
                {task.status === "completed" ? "Undo" : "Mark complete"}
              </Button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import {
  addStudyTaskAction,
  changeStudyTaskAction,
  updateStudyTaskAction,
  type StudyTaskActionState,
} from "@/features/study-plan/actions";
import { formatDuration, taskGroup } from "@/features/study-plan/schedule";
import type { StudyTaskView } from "@/features/study-plan/types";
import {
  TASK_DESCRIPTION_MAX,
  TASK_DURATION_MAX,
  TASK_DURATION_MIN,
  TASK_SKILL_MAX,
  TASK_TITLE_MAX,
} from "@/features/study-plan/validation";
import type { DailyTasksView } from "@/services/daily-tasks";

const initialState: StudyTaskActionState = {};

type DailyBoardProps = {
  day: DailyTasksView;
};

export function DailyBoard({ day }: DailyBoardProps) {
  const [addState, addAction, addPending] = useActionState(addStudyTaskAction, initialState);
  const [editState, editAction, editPending] = useActionState(updateStudyTaskAction, initialState);
  const [changeState, changeAction, changePending] = useActionState(changeStudyTaskAction, initialState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const busy = addPending || editPending || changePending;
  const todayTasks = day.tasks.filter((task) => taskGroup(task, day.today) === "today");
  const upcomingTasks = day.tasks.filter((task) => taskGroup(task, day.today) === "upcoming");
  const completedTasks = day.tasks.filter((task) => taskGroup(task, day.today) === "completed");

  useRefreshOnSuccess(addPending, addState.message);
  useRefreshOnSuccess(editPending, editState.message);
  useRefreshOnSuccess(changePending, changeState.message);

  return (
    <div className="flex flex-col gap-6">
      <Card variant="raised">
        <h2 className="card-heading">Add a task for a date</h2>
        <p className="caption">Choose the day this task belongs to. It is saved on your current study plan.</p>
        {addState.formError ? <Alert text={addState.formError} /> : null}
        {addState.message ? <Success text={addState.message} /> : null}
        <form key={addState.savedAt ?? "add"} action={addAction} className="mt-4 grid gap-4" aria-busy={addPending}>
          <TaskFields
            idPrefix="daily-add"
            defaults={{
              title: "",
              description: "",
              skill: day.suggestedSkill,
              scheduledOn: day.today,
              durationMinutes: "45",
              milestoneId: day.milestones[0]?.id ?? "",
            }}
            milestones={day.milestones}
            errors={addState.fieldErrors}
            disabled={busy}
          />
          <Button type="submit" className="w-full sm:w-auto" loading={addPending} disabled={busy}>
            {addPending ? "Saving task" : "Add task"}
          </Button>
        </form>
      </Card>
      {changeState.formError ? <Alert text={changeState.formError} /> : null}
      {changeState.message ? <Success text={changeState.message} /> : null}
      {editState.formError ? <Alert text={editState.formError} /> : null}
      {editState.message ? <Success text={editState.message} /> : null}
      {day.tasks.length === 0 ? (
        <EmptyState
          title="No tasks for today"
          description="Add a task and choose today's date. It will stay here after you refresh."
        />
      ) : (
        <div className="grid gap-5">
          <TaskSection
            title="Today's Tasks"
            empty="Nothing left for today."
            tasks={todayTasks}
            planTitle={day.planTitle}
            milestones={day.milestones}
            editingId={editingId}
            editState={editState}
            editAction={editAction}
            changeAction={changeAction}
            busy={busy}
            editPending={editPending}
            changePending={changePending}
            onEdit={setEditingId}
            onClose={() => setEditingId(null)}
          />
          <TaskSection
            title="Upcoming Tasks"
            empty="No later tasks yet."
            tasks={upcomingTasks}
            planTitle={day.planTitle}
            milestones={day.milestones}
            editingId={editingId}
            editState={editState}
            editAction={editAction}
            changeAction={changeAction}
            busy={busy}
            editPending={editPending}
            changePending={changePending}
            onEdit={setEditingId}
            onClose={() => setEditingId(null)}
          />
          <TaskSection
            title="Completed Tasks"
            empty="No completed tasks yet."
            tasks={completedTasks}
            planTitle={day.planTitle}
            milestones={day.milestones}
            editingId={editingId}
            editState={editState}
            editAction={editAction}
            changeAction={changeAction}
            busy={busy}
            editPending={editPending}
            changePending={changePending}
            onEdit={setEditingId}
            onClose={() => setEditingId(null)}
          />
        </div>
      )}
    </div>
  );
}

function TaskSection({
  title,
  empty,
  tasks,
  planTitle,
  milestones,
  editingId,
  editState,
  editAction,
  changeAction,
  busy,
  editPending,
  changePending,
  onEdit,
  onClose,
}: {
  title: string;
  empty: string;
  tasks: StudyTaskView[];
  planTitle: string;
  milestones: DailyTasksView["milestones"];
  editingId: string | null;
  editState: StudyTaskActionState;
  editAction: (payload: FormData) => void;
  changeAction: (payload: FormData) => void;
  busy: boolean;
  editPending: boolean;
  changePending: boolean;
  onEdit: (taskId: string) => void;
  onClose: () => void;
}) {
  const headingId = `daily-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="section-heading">
        {title}
      </h2>
      {tasks.length === 0 ? (
        <p className="body-secondary">{empty}</p>
      ) : (
        <ul className="grid gap-3">
          {tasks.map((task) => (
            <li key={task.id}>
              <Card variant="quiet">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="caption">{task.status === "completed" ? "Complete" : "Pending"}</p>
                    <h3 className="card-heading mt-1">{task.title}</h3>
                  </div>
                  <p className="caption sm:text-right">{formatDay(task.scheduledOn)}</p>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Subject or skill" value={task.skill} />
                  <Detail label="Estimated duration" value={formatDuration(task.durationMinutes)} />
                </dl>
                <details className="mt-4">
                  <summary className="cursor-pointer font-medium text-accent-deep">View task details</summary>
                  <dl className="mt-3 grid gap-3">
                    <Detail label="Description" value={task.description || "No description"} />
                    <Detail label="Planned date" value={formatDay(task.scheduledOn)} />
                    <Detail label="Task status" value={task.status === "completed" ? "Complete" : "Pending"} />
                    <Detail label="Related study plan" value={planTitle} />
                    <Detail label="Related roadmap milestone" value={task.milestoneTitle} />
                  </dl>
                </details>
                {editingId === task.id ? (
                  <form key={`${task.id}-${editState.savedAt ?? "edit"}`} action={editAction} className="mt-4 grid gap-4" aria-busy={editPending}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <TaskFields
                      idPrefix={`daily-edit-${task.id}`}
                      defaults={{
                        title: task.title,
                        description: task.description,
                        skill: task.skill,
                        scheduledOn: task.scheduledOn,
                        durationMinutes: String(task.durationMinutes),
                        milestoneId: task.milestoneId,
                      }}
                      milestones={milestones}
                      errors={editState.fieldErrors}
                      disabled={busy}
                    />
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button type="submit" loading={editPending} disabled={busy}>
                        {editPending ? "Saving task" : "Save task"}
                      </Button>
                      <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button type="button" variant="secondary" onClick={() => onEdit(task.id)} disabled={busy}>
                      Edit task
                    </Button>
                    <form action={changeAction}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="intent" value={task.status === "completed" ? "incomplete" : "complete"} />
                      <Button type="submit" variant="secondary" loading={changePending} disabled={busy}>
                        {task.status === "completed" ? "Mark incomplete" : "Mark complete"}
                      </Button>
                    </form>
                    <form action={changeAction} onSubmit={(event) => guardSubmit(event, busy)}>
                      <input type="hidden" name="taskId" value={task.id} />
                      <input type="hidden" name="intent" value="delete" />
                      <Button type="submit" variant="destructive" disabled={busy}>
                        Delete task
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskFields({
  idPrefix,
  defaults,
  milestones,
  errors,
  disabled,
}: {
  idPrefix: string;
  defaults: {
    title: string;
    description: string;
    skill: string;
    scheduledOn: string;
    durationMinutes: string;
    milestoneId: string;
  };
  milestones: DailyTasksView["milestones"];
  errors?: StudyTaskActionState["fieldErrors"];
  disabled: boolean;
}) {
  return (
    <>
      <Field id={`${idPrefix}-title`} label="Task title" error={errors?.title}>
        {(control) => (
          <Input {...control} name="title" type="text" required maxLength={TASK_TITLE_MAX} defaultValue={defaults.title} disabled={disabled} />
        )}
      </Field>
      <Field id={`${idPrefix}-description`} label="Description" error={errors?.description}>
        {(control) => (
          <Textarea {...control} name="description" rows={3} maxLength={TASK_DESCRIPTION_MAX} defaultValue={defaults.description} disabled={disabled} />
        )}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${idPrefix}-skill`} label="Subject or skill" error={errors?.skill}>
          {(control) => (
            <Input {...control} name="skill" type="text" required maxLength={TASK_SKILL_MAX} defaultValue={defaults.skill} disabled={disabled} />
          )}
        </Field>
        <Field id={`${idPrefix}-date`} label="Planned date" error={errors?.scheduledOn}>
          {(control) => (
            <Input {...control} name="scheduledOn" type="date" required defaultValue={defaults.scheduledOn} disabled={disabled} />
          )}
        </Field>
        <Field
          id={`${idPrefix}-duration`}
          label="Estimated duration"
          description={`${TASK_DURATION_MIN} to ${TASK_DURATION_MAX} minutes.`}
          error={errors?.durationMinutes}
        >
          {(control) => (
            <Input
              {...control}
              name="durationMinutes"
              type="number"
              required
              min={TASK_DURATION_MIN}
              max={TASK_DURATION_MAX}
              step={5}
              defaultValue={defaults.durationMinutes}
              disabled={disabled}
            />
          )}
        </Field>
        <Field id={`${idPrefix}-milestone`} label="Related milestone" error={errors?.milestoneId}>
          {(control) => (
            <Select {...control} name="milestoneId" defaultValue={defaults.milestoneId} disabled={disabled}>
              <option value="">No milestone</option>
              {milestones.map((milestone) => (
                <option key={milestone.id} value={milestone.id}>
                  {milestone.title}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="caption">{label}</dt>
      <dd className="body mt-1">{value}</dd>
    </div>
  );
}

function Alert({ text }: { text: string }) {
  return (
    <p className="field-error mt-3" role="alert">
      Error: {text}
    </p>
  );
}

function Success({ text }: { text: string }) {
  return (
    <p className="mt-3 rounded-2xl bg-success-surface px-4 py-3 text-success" role="status">
      {text}
    </p>
  );
}

function useRefreshOnSuccess(pending: boolean, message?: string) {
  const router = useRouter();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && message) {
      router.refresh();
    }

    wasPending.current = pending;
  }, [message, pending, router]);
}

function guardSubmit(event: FormEvent<HTMLFormElement>, busy: boolean) {
  if (busy) {
    event.preventDefault();
  }
}

function formatDay(iso: string): string {
  const [year, month, day] = iso.split("-").map((part) => Number(part));
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year || 1970, (month || 1) - 1, day || 1)));
}

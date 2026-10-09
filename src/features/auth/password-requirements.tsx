"use client";

import {
  evaluatePasswordRequirements,
  type PasswordRequirementStatus,
} from "@/features/auth/password-policy";
import { cn } from "@/lib/cn";

type PasswordRequirementsProps = {
  password: string;
  id?: string;
};

export function PasswordRequirements({
  password,
  id = "password-requirements",
}: PasswordRequirementsProps) {
  const requirements = evaluatePasswordRequirements(password);
  const hasStarted = password.length > 0;
  const unmet = requirements.filter((requirement) => !requirement.met);

  return (
    <div className="mt-3 flex flex-col gap-2" id={id}>
      <p className="caption">Your password must include:</p>
      <ul className="flex flex-col gap-1.5" aria-label="Password requirements">
        {requirements.map((requirement) => (
          <RequirementRow key={requirement.id} requirement={requirement} hasStarted={hasStarted} />
        ))}
      </ul>
      {hasStarted && unmet.length > 0 ? (
        <p className="field-error" role="status">
          {unmet.length === 1
            ? unmetMessage(unmet[0]!)
            : `Password still needs: ${unmet.map((item) => shortLabel(item.id)).join(", ")}.`}
        </p>
      ) : null}
      {hasStarted && unmet.length === 0 ? (
        <p className="caption text-emerald" role="status">
          Password meets all requirements.
        </p>
      ) : null}
    </div>
  );
}

function RequirementRow({
  requirement,
  hasStarted,
}: {
  requirement: PasswordRequirementStatus;
  hasStarted: boolean;
}) {
  const state = !hasStarted ? "pending" : requirement.met ? "met" : "unmet";

  return (
    <li
      className={cn(
        "flex items-start gap-2 text-sm",
        state === "met" && "text-emerald",
        state === "unmet" && "text-danger",
        state === "pending" && "text-foreground-muted",
      )}
    >
      <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
        {state === "met" ? "✓" : state === "unmet" ? "✗" : "○"}
      </span>
      <span>
        <span className="sr-only">
          {state === "met" ? "Met: " : state === "unmet" ? "Not met: " : "Required: "}
        </span>
        {requirement.label}
      </span>
    </li>
  );
}

function unmetMessage(requirement: PasswordRequirementStatus): string {
  switch (requirement.id) {
    case "length":
      return "Add more characters until the password is at least 8 characters long.";
    case "uppercase":
      return "Add at least one uppercase English letter (A–Z).";
    case "lowercase":
      return "Add at least one lowercase English letter (a–z).";
    case "digit":
      return "Add at least one digit (0–9).";
    case "special":
      return "Add at least one special character, such as ! @ # $ % ^ & *.";
    default:
      return "Password does not meet the requirements yet.";
  }
}

function shortLabel(id: PasswordRequirementStatus["id"]): string {
  switch (id) {
    case "length":
      return "8+ characters";
    case "uppercase":
      return "an uppercase letter";
    case "lowercase":
      return "a lowercase letter";
    case "digit":
      return "a digit";
    case "special":
      return "a special character";
    default:
      return "another rule";
  }
}

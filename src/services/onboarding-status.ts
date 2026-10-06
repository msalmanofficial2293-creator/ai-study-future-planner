type ProfileCompletionClient = {
  from(table: "profiles"): unknown;
};

export function authDestination(completed: boolean): "/app" | "/onboarding" {
  return completed ? "/app" : "/onboarding";
}

export async function hasCompletedOnboarding(
  supabase: ProfileCompletionClient,
  userId: string,
): Promise<boolean> {
  const profiles = supabase.from("profiles") as {
    select(columns: "onboarding_completed_at"): {
      eq(
        column: "id",
        value: string,
      ): {
        maybeSingle(): PromiseLike<{
          data: unknown;
          error: { message: string; code?: string } | null;
        }>;
      };
    };
  };
  const result = await profiles
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  if (result.error) {
    logCompletionDiagnostic(result.error);
    return false;
  }

  return profileIsComplete(result.data);
}

export function profileIsComplete(data: unknown): boolean {
  const record = asRecord(data);
  const value = record?.onboarding_completed_at;
  return typeof value === "string" && value.length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function logCompletionDiagnostic(error: { message: string; code?: string }) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error("[onboarding:read-completion]", {
    code: error.code ?? null,
    message: error.message,
  });
}

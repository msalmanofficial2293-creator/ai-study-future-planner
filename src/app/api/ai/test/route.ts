import { env } from "@/config/env";
import { allowAiTest } from "@/features/ai/allowance";
import { runAiConnectivityCheck } from "@/features/ai/test";
import { parseAiTestBody } from "@/features/ai/validation";
import { describeAiConfig } from "@/lib/ai/config";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return aiJson(403, {
      ok: false,
      error: { code: "forbidden", message: "This check must come from the application." },
    });
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return aiJson(401, {
      ok: false,
      error: { code: "unauthenticated", message: "Sign in to use this check." },
    });
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return aiJson(400, {
      ok: false,
      error: { code: "invalid-input", message: "Send a JSON body." },
    });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return aiJson(400, {
      ok: false,
      error: { code: "invalid-input", message: "The request body is not valid JSON." },
    });
  }

  const parsed = parseAiTestBody(body);

  if (!parsed.ok) {
    return aiJson(400, {
      ok: false,
      error: { code: "invalid-input", message: parsed.message },
    });
  }

  const config = describeAiConfig();

  if (!config.ok) {
    return aiJson(503, {
      ok: false,
      error: { code: config.code, message: config.message },
    });
  }

  if (!allowAiTest(user.id)) {
    return aiJson(429, {
      ok: false,
      error: {
        code: "rate-limited",
        message: "Too many checks. Please wait a minute and try again.",
      },
    });
  }

  const result = await runAiConnectivityCheck(parsed.message);

  if (!result.ok) {
    return aiJson(result.error.status, {
      ok: false,
      error: { code: result.error.code, message: result.error.message },
    });
  }

  return aiJson(200, { ok: true, model: result.model, text: result.text });
}

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowed = new Set<string>([env.appUrl]);

  try {
    const requestUrl = new URL(request.url);
    allowed.add(requestUrl.origin);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");

    if (host && (proto === "http" || proto === "https")) {
      allowed.add(`${proto}://${host}`);
    }
  } catch {
    return false;
  }

  return allowed.has(origin);
}

function aiJson(status: number, body: unknown) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

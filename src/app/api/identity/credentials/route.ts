import { cookies } from "next/headers";
import {
  PENDING_COOKIE_NAME,
  PENDING_COOKIE_PATH,
} from "../../../../modules/learner/server/credential-cookies";
import { NextResponse } from "next/server";
import {
  LEARNER_COOKIE_NAME,
  resolveLearnerFromCookie,
} from "../../../../modules/practice/server/learner-identity";
import {
  cancelCredentialChange,
  confirmCredentialChange,
  pendingTransitionContext,
  startAuthenticatedCredentialChange,
  startRecovery,
} from "../../../../modules/learner/server/recovery-credentials";
import {
  cleanupCredentialOperations,
  CredentialRateLimited,
  limitCredentialAttempts,
} from "../../../../modules/learner/server/identity-rate-limit";
import {
  credentialRequestOriginAllowed,
  recoveryEnabled,
  trustedRecoveryNetworkBucket,
} from "../../../../modules/learner/server/recovery-security";
import {
  BROWSER_LIFETIME_SECONDS,
  isPendingSecret,
  isRecoveryCode,
  PENDING_LIFETIME_SECONDS,
} from "../../../../modules/learner/server/recovery-secrets";

export const runtime = "nodejs";
const COOKIE_PATH = PENDING_COOKIE_PATH;
const actions = [
  "enrollment",
  "replacement",
  "recovery",
  "confirm-authenticated",
  "confirm-recovery",
  "context-authenticated",
  "context-recovery",
  "cancel",
] as const;
type Action = (typeof actions)[number];

function response(body: unknown, status = 200, retryAfter?: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}),
    },
  });
}

const credentialCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
  sameSite: "strict" as const,
  path: COOKIE_PATH,
});

async function readInput(
  request: Request,
): Promise<{ action: Action; code?: string }> {
  if (!credentialRequestOriginAllowed(request))
    throw new Error("Invalid request.");
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new Error("Invalid request.");
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > 1024))
    throw new Error("Invalid request.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Invalid request.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) {
        await reader.cancel();
        throw new Error("Invalid request.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const input: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (typeof input !== "object" || input === null || Array.isArray(input))
    throw new Error("Invalid request.");
  const record = input as Record<string, unknown>;
  if (
    !actions.some((action) => action === record.action) ||
    Object.keys(record).some((key) => key !== "action" && key !== "code")
  )
    throw new Error("Invalid request.");
  const action = record.action as Action;
  const needsCode =
    action === "recovery" ||
    action.startsWith("confirm-") ||
    action.startsWith("context-");
  if (needsCode ? !isRecoveryCode(record.code) : record.code !== undefined)
    throw new Error("Invalid request.");
  return { action, code: record.code as string | undefined };
}

export async function POST(request: Request) {
  if (!recoveryEnabled())
    return response({ ok: false, error: "unavailable" }, 503);
  let input: Awaited<ReturnType<typeof readInput>>;
  try {
    input = await readInput(request);
  } catch {
    return response({ ok: false, error: "unavailable" }, 400);
  }
  const { action, code } = input;
  const needsNetwork = action === "recovery" || action.endsWith("-recovery");
  const network = needsNetwork
    ? trustedRecoveryNetworkBucket(request.headers)
    : null;
  if (needsNetwork && !network)
    return response({ ok: false, error: "unavailable" }, 503);
  try {
    if (network) {
      await limitCredentialAttempts(
        action === "recovery"
          ? "recovery-start-network"
          : "recovery-confirm-network",
        network,
        action === "recovery" ? 10 : 30,
      );
    }
    const jar = await cookies();
    const cookieOptions = credentialCookieOptions();
    if (
      action === "enrollment" ||
      action === "replacement" ||
      action === "recovery"
    ) {
      const pending =
        action === "recovery"
          ? await startRecovery(code!)
          : await startAuthenticatedCredentialChange(
              await resolveLearnerFromCookie(),
              action,
            );
      jar.set(PENDING_COOKIE_NAME, pending.secret, {
        ...cookieOptions,
        maxAge: PENDING_LIFETIME_SECONDS,
      });
      return response({
        ok: true,
        operationId: pending.operationId,
        code: pending.code,
      });
    }
    const secret = jar.get(PENDING_COOKIE_NAME)?.value;
    if (!isPendingSecret(secret))
      return response({ ok: false, error: "unavailable" }, 400);
    if (action === "cancel") {
      await cancelCredentialChange(secret);
      jar.set(PENDING_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
      return response({ ok: true });
    }
    const context = action.endsWith("-authenticated")
      ? await resolveLearnerFromCookie()
      : undefined;
    if (action.startsWith("context-"))
      return response({
        ok: true,
        ...(await pendingTransitionContext(secret, code!, context)),
      });
    const result = await confirmCredentialChange(secret, code!, context);
    // The transaction has committed. Never persist or replay this plaintext token.
    if ("browserToken" in result && typeof result.browserToken === "string")
      jar.set(LEARNER_COOKIE_NAME, result.browserToken, {
        httpOnly: true,
        secure: cookieOptions.secure,
        sameSite: "lax",
        path: "/",
        maxAge: BROWSER_LIFETIME_SECONDS,
      });
    jar.set(PENDING_COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
    return response({ ok: true, owner: result.owner });
  } catch (error) {
    if (error instanceof CredentialRateLimited)
      return response(
        { ok: false, error: "retry-later", retryAfter: error.retryAfter },
        429,
        error.retryAfter,
      );
    // Includes unexpected database failures: do not serialize/log credential data.
    return response({ ok: false, error: "unavailable" }, 400);
  } finally {
    // Opportunistic bounded cleanup; no failed cleanup can change stable identity.
    await cleanupCredentialOperations().catch(() => undefined);
  }
}

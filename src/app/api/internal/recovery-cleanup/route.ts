import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { scheduledCredentialCleanup } from "../../../../modules/learner/server/identity-rate-limit";
import { validCronSecret } from "../../../../modules/learner/server/recovery-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function response(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

// Vercel Cron uses GET and injects this bearer header. No browser identity needed.
export async function GET(request: Request) {
  const secret = validCronSecret();
  const supplied = request.headers.get("authorization");
  if (!secret || !supplied || supplied.length > 263)
    return response({ ok: false }, 401);
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(supplied);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    return response({ ok: false }, 401);
  try {
    const result = await scheduledCredentialCleanup();
    return response(
      { ok: result.complete, ...result },
      result.complete ? 200 : 503,
    );
  } catch {
    // No identifiers/errors logged; a scheduler-visible failure is not success.
    return response({ ok: false }, 503);
  }
}

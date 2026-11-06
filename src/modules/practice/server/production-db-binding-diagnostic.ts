import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { runtimeDatabaseUrl } from "./database-environment.mjs";
import { getProgressDb } from "./progress-db";

const PATH = "/api/internal/db-binding";
const EXPECTED_HOST = "ep-green-breeze-b83kwqyf.c-14.us-east-1.aws.neon.tech";
const WINDOW_MS = 10 * 60 * 1_000;
const QUERY_TIMEOUT_MS = 2_500;
const FAILED = {
  ok: false,
  targetMatches: false,
  databaseMatches: false,
  migration0021Present: false,
} as const;

function response(
  body: typeof FAILED | Record<keyof typeof FAILED, boolean>,
  status: number,
) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function denyDiagnosticMethod() {
  return response(FAILED, 405);
}

function authorized(request: Request): boolean {
  const env = process.env;
  const now = Date.now();
  const issued = Date.parse(env.DB_BINDING_DIAGNOSTIC_ISSUED_AT ?? "");
  const expires = Date.parse(env.DB_BINDING_DIAGNOSTIC_EXPIRES_AT ?? "");
  const deployment = env.VERCEL_DEPLOYMENT_ID ?? "";
  const hostname = env.VERCEL_URL ?? "";
  const verifier = env.DB_BINDING_DIAGNOSTIC_TOKEN_SHA256 ?? "";
  if (
    env.VERCEL !== "1" ||
    env.VERCEL_ENV !== "production" ||
    !Number.isFinite(issued) ||
    !Number.isFinite(expires) ||
    issued > now ||
    expires <= now ||
    expires <= issued ||
    expires - issued > WINDOW_MS ||
    !/^dpl_[A-Za-z0-9]+$/.test(deployment) ||
    request.headers.get("x-db-binding-deployment-id") !== deployment ||
    !/^[a-z0-9][a-z0-9-]*\.vercel\.app$/.test(hostname) ||
    !/^[a-f0-9]{64}$/.test(verifier)
  )
    return false;

  const url = new URL(request.url);
  if (
    url.origin !== `https://${hostname}` ||
    url.pathname !== PATH ||
    url.search !== "" ||
    request.headers.get("host") !== hostname
  )
    return false;
  const supplied = request.headers.get("authorization") ?? "";
  if (!/^Bearer [A-Za-z0-9_-]{43}$/.test(supplied)) return false;
  const token = supplied.slice(7);
  const decoded = Buffer.from(token, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== token)
    return false;
  return timingSafeEqual(
    createHash("sha256").update(token).digest(),
    Buffer.from(verifier, "hex"),
  );
}

async function hasEmptyBody(request: Request): Promise<boolean> {
  if (request.body === null) return true;
  // Next's Node adapter supplies a stream even for a bodyless POST.
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const first = await Promise.race([
      reader.read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Unavailable")), 250);
      }),
    ]);
    return first.done === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    // Cancellation itself must not extend the deadline for an unfinished body.
    void reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

function matchesExpectedTarget(): boolean {
  const url = new URL(runtimeDatabaseUrl(process.env));
  const host = url.hostname.replace(/-pooler(?=\.)/, "");
  return (
    host === EXPECTED_HOST &&
    decodeURIComponent(url.pathname) === "/neondb" &&
    (url.port === "" || url.port === "5432") &&
    // pg inherits these settings even when they are absent from the selected URL.
    (url.port !== "" || !process.env.PGPORT || process.env.PGPORT === "5432") &&
    !process.env.PGOPTIONS &&
    ["require", "verify-ca", "verify-full"].includes(
      url.searchParams.get("sslmode") ?? "",
    ) &&
    // Do not let libpq options override the attested database/target or run startup SQL.
    [...url.searchParams.keys()].every(
      (key) =>
        (key === "sslmode" || key === "channel_binding") &&
        url.searchParams.getAll(key).length === 1,
    )
  );
}

async function acquire(pool: Pool): Promise<PoolClient> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const pending = pool.connect();
  try {
    return await Promise.race([
      pending,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Unavailable")), 2_000);
      }),
    ]);
  } catch {
    // Pool acquisition cannot be cancelled. Destroy a client arriving after our deadline.
    void pending.then(
      (client) => client.release(true),
      () => undefined,
    );
    throw new Error("Unavailable");
  } finally {
    clearTimeout(timer);
  }
}

async function inspect() {
  // This is the existing application pool, not an independently supplied inspector credential.
  const client = await acquire(getProgressDb().$client);
  let rolledBack = false;
  const query = (text: string) => {
    // pg supports a per-query deadline; @types/pg only declares it on ClientConfig.
    const config = { text, query_timeout: QUERY_TIMEOUT_MS };
    return client.query(config);
  };
  try {
    await query("BEGIN READ ONLY");
    await query("SET LOCAL statement_timeout = '2s'");
    await query("SET LOCAL lock_timeout = '500ms'");
    await query("SET LOCAL idle_in_transaction_session_timeout = '3s'");
    const result = await query(`SELECT
      current_setting('transaction_read_only') = 'on' AS read_only,
      current_database() = 'neondb' AS database_matches,
      EXISTS (SELECT 1 FROM public.schema_migrations
        WHERE name = '0021_content_expansion_batch_2_pack_receipts.sql') AS migration_0021_present`);
    await query("ROLLBACK");
    rolledBack = true;
    const row = result.rows[0];
    const databaseMatches = row?.database_matches === true;
    const migration0021Present = row?.migration_0021_present === true;
    return {
      ok: row?.read_only === true && databaseMatches && migration0021Present,
      targetMatches: true,
      databaseMatches,
      migration0021Present,
    };
  } finally {
    // On any timeout/error, disconnect rather than returning uncertain transaction state.
    client.release(!rolledBack);
  }
}

export async function runProductionBindingDiagnostic(request: Request) {
  if (request.method !== "POST") return denyDiagnosticMethod();
  try {
    if (!authorized(request)) return response(FAILED, 404);
    if (!(await hasEmptyBody(request))) return response(FAILED, 404);
    if (!matchesExpectedTarget()) return response(FAILED, 503);
    const result = await inspect();
    return response(result, result.ok ? 200 : 503);
  } catch {
    // No errors, headers, URLs, credentials, or database details enter responses or logs.
    return response(FAILED, 503);
  }
}

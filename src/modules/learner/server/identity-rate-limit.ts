import "server-only";

import { sql } from "drizzle-orm";
import { getProgressDb } from "../../practice/server/progress-db";
import { operationalHash } from "./recovery-secrets";

export class CredentialRateLimited extends Error {
  constructor(public readonly retryAfter: number) {
    super("Credential request rate limited.");
  }
}

// The bounded counter saturates: rejected attempts do not create unbounded integers.
// Windows and retry information use database time, shared by all server instances.
export async function limitCredentialAttempts(
  scope: string,
  identifier: string,
  budget = 5,
) {
  const key = operationalHash(`rate-limit:${scope}`, identifier);
  const result = await getProgressDb().execute<{
    attempts: number;
    retry_after: number;
  }>(sql`
    WITH moment AS (SELECT clock_timestamp() AS now),
    rate_window AS (SELECT to_timestamp(floor(extract(epoch FROM now) / 900) * 900) AS start FROM moment)
    INSERT INTO identity_rate_limit_buckets (bucket_key, window_start, attempts, expires_at)
    SELECT ${key}, start, 1, start + interval '15 minutes' FROM rate_window
    ON CONFLICT (bucket_key, window_start) DO UPDATE
      SET attempts = least(identity_rate_limit_buckets.attempts + 1, ${budget + 1})
    RETURNING attempts, greatest(1, ceil(extract(epoch FROM (expires_at - clock_timestamp())))::int) AS retry_after
  `);
  if (result.rows[0].attempts > budget)
    throw new CredentialRateLimited(result.rows[0].retry_after);
}

export const CREDENTIAL_CLEANUP_BATCH_SIZE = 100;

// Bounded oldest-first batches; SKIP LOCKED permits safe overlapping cleanup.
export async function cleanupCredentialOperations() {
  const db = getProgressDb();
  const pending =
    await db.execute(sql`DELETE FROM learner_credential_changes WHERE id IN (
    SELECT id FROM learner_credential_changes WHERE expires_at <= clock_timestamp()
    ORDER BY expires_at, id LIMIT ${CREDENTIAL_CLEANUP_BATCH_SIZE} FOR UPDATE SKIP LOCKED
  )`);
  const rates =
    await db.execute(sql`DELETE FROM identity_rate_limit_buckets WHERE (bucket_key, window_start) IN (
    SELECT bucket_key, window_start FROM identity_rate_limit_buckets WHERE expires_at <= clock_timestamp()
    ORDER BY expires_at, bucket_key, window_start LIMIT ${CREDENTIAL_CLEANUP_BATCH_SIZE} FOR UPDATE SKIP LOCKED
  )`);
  return {
    pendingDeleted: pending.rowCount ?? 0,
    rateDeleted: rates.rowCount ?? 0,
  };
}

export const SCHEDULED_CLEANUP_MAX_BATCHES = 20;

export async function scheduledCredentialCleanup() {
  const total = { pendingDeleted: 0, rateDeleted: 0 };
  for (let batch = 0; batch < SCHEDULED_CLEANUP_MAX_BATCHES; batch++) {
    const result = await cleanupCredentialOperations();
    total.pendingDeleted += result.pendingDeleted;
    total.rateDeleted += result.rateDeleted;
    if (
      result.pendingDeleted < CREDENTIAL_CLEANUP_BATCH_SIZE &&
      result.rateDeleted < CREDENTIAL_CLEANUP_BATCH_SIZE
    )
      break;
  }
  const result = await getProgressDb().execute<{ remaining: boolean }>(sql`
    SELECT EXISTS (SELECT 1 FROM learner_credential_changes WHERE expires_at <= clock_timestamp())
      OR EXISTS (SELECT 1 FROM identity_rate_limit_buckets WHERE expires_at <= clock_timestamp()) AS remaining
  `);
  return { ...total, complete: !result.rows[0].remaining };
}

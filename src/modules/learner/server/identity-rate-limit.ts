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

// Bounded batches; scheduled execution/24-hour retention is a separate launch gate.
export async function cleanupCredentialOperations() {
  const db = getProgressDb();
  await db.execute(sql`DELETE FROM learner_credential_changes WHERE id IN (
    SELECT id FROM learner_credential_changes WHERE expires_at <= clock_timestamp()
    ORDER BY expires_at LIMIT 100
  )`);
  await db.execute(sql`DELETE FROM identity_rate_limit_buckets WHERE (bucket_key, window_start) IN (
    SELECT bucket_key, window_start FROM identity_rate_limit_buckets WHERE expires_at <= clock_timestamp()
    ORDER BY expires_at LIMIT 100
  )`);
}

// Fail closed. No trusted hosting source/daily keyed network hash is configured.
// Never substitute x-forwarded-for, a database secret, or an unkeyed IP hash.
export function trustedRecoveryNetworkBucket(): string | null {
  return null;
}

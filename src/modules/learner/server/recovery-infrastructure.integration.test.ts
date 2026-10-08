import { randomBytes, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import { eq, sql } from "drizzle-orm";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  address: "192.0.2.99",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.jar.has(name) ? { value: state.jar.get(name) } : undefined,
    set: (name: string, value: string) => state.jar.set(name, value),
  }),
}));
vi.mock("./recovery-security", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./recovery-security")>();
  return {
    ...actual,
    trustedRecoveryNetworkBucket: (headers: Headers) =>
      actual.trustedRecoveryNetworkBucket(headers, process.env, state.address),
  };
});
import { POST } from "../../../app/api/identity/credentials/route";
import { GET as cleanupRequest } from "../../../app/api/internal/recovery-cleanup/route";
import { getProgressDb } from "../../practice/server/progress-db";
import {
  identityRateLimitBuckets,
  learnerCredentialChanges,
  learners,
  practiceFinishReceipts,
} from "../../practice/server/progress-schema";
import {
  initializeAnonymousLearner,
  resolveLearnerFromCookie,
} from "../../practice/server/learner-identity";
import {
  importLegacyProgress,
  persistFinishContributions,
  readLearnerProgress,
} from "../../practice/server/learner-progress-persistence";
import {
  startAuthenticatedCredentialChange,
  confirmCredentialChange,
  startRecovery,
} from "./recovery-credentials";
import {
  cleanupCredentialOperations,
  limitCredentialAttempts,
  scheduledCredentialCleanup,
  CREDENTIAL_CLEANUP_BATCH_SIZE,
  SCHEDULED_CLEANUP_MAX_BATCHES,
} from "./identity-rate-limit";
import { PENDING_COOKIE_NAME } from "./credential-cookies";
import {
  generateBearerSecret,
  generateRecoveryCode,
  operationalHash,
  pendingSecretHash,
  recoveryCodeHash,
} from "./recovery-secrets";
import { trustedRecoveryNetworkBucket } from "./recovery-security";

const testUrl = process.env.DATABASE_TEST_URL;
const schema = `recovery_infra_${randomUUID().replaceAll("-", "")}`;
beforeAll(async () => {
  if (!testUrl) return;
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    for (const name of (await readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
    const url = new URL(testUrl);
    url.searchParams.set("options", `-c search_path=${schema}`);
    process.env.DATABASE_URL = url.toString();
  } finally {
    await client.end();
  }
});
afterAll(async () => {
  if (!testUrl) return;
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  } finally {
    await client.end();
  }
});
beforeEach(() => {
  state.jar.clear();
  state.address = "192.0.2.99";
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("RECOVERY_ENABLED", "true");
  vi.stubEnv(
    "RECOVERY_NETWORK_HMAC_KEY",
    randomBytes(32).toString("base64url"),
  );
  vi.stubEnv("CRON_SECRET", randomBytes(32).toString("base64url"));
});
afterEach(() => vi.unstubAllEnvs());
async function fresh() {
  await initializeAnonymousLearner();
  const context = await resolveLearnerFromCookie();
  await importLegacyProgress(context, null);
  return context;
}
async function enroll() {
  const context = await fresh();
  const pending = await startAuthenticatedCredentialChange(
    context,
    "enrollment",
  );
  await confirmCredentialChange(pending.secret, pending.code, context);
  return { context: await resolveLearnerFromCookie(), code: pending.code };
}
function request(action: string, code?: string) {
  return new Request("http://localhost:3000/api/identity/credentials", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-forwarded-for": "203.0.113.250",
    },
    body: JSON.stringify({ action, ...(code ? { code } : {}) }),
  });
}
async function bucket(scope: string, input: string) {
  return (
    await getProgressDb()
      .select()
      .from(identityRateLimitBuckets)
      .where(
        eq(
          identityRateLimitBuckets.bucketKey,
          operationalHash(`rate-limit:${scope}`, input),
        ),
      )
  )[0];
}

describe.skipIf(!testUrl)("PostgreSQL recovery release infrastructure", () => {
  it.each([5, 10, 30])(
    "shared atomic limiter permits exactly %i attempts under contention",
    async (budget) => {
      const identifier = randomUUID();
      const results = await Promise.allSettled(
        Array.from({ length: budget + 12 }, () =>
          limitCredentialAttempts("budget-contention", identifier, budget),
        ),
      );
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(budget);
      expect((await bucket("budget-contention", identifier)).attempts).toBe(
        budget + 1,
      );
      for (const result of results)
        if (result.status === "rejected")
          expect(result.reason.retryAfter).toBeGreaterThan(0);
    },
  );
  it("recovery starts use network10 and code5, preserve neutral errors and Practice access", async () => {
    const context = await fresh();
    const code = generateRecoveryCode();
    for (let count = 0; count < 5; count++)
      expect((await POST(request("recovery", code))).status).toBe(400);
    const limitedCode = await POST(request("recovery", code));
    expect(limitedCode.status).toBe(429);
    expect(Number(limitedCode.headers.get("Retry-After"))).toBeGreaterThan(0);
    for (let count = 0; count < 4; count++)
      expect(
        (await POST(request("recovery", generateRecoveryCode()))).status,
      ).toBe(400);
    const limitedNetwork = await POST(
      request("recovery", generateRecoveryCode()),
    );
    expect(limitedNetwork.status).toBe(429);
    const network = trustedRecoveryNetworkBucket(new Headers())!;
    expect((await bucket("recovery-start-network", network)).attempts).toBe(11);
    expect(
      (await bucket("recovery-start-code", recoveryCodeHash(code))).attempts,
    ).toBe(6);
    const rows = JSON.stringify(
      await getProgressDb().select().from(identityRateLimitBuckets),
    );
    expect(rows).not.toContain(state.address);
    expect(rows).not.toContain("203.0.113.250");
    expect(rows).not.toContain(code);
    await expect(readLearnerProgress(context)).resolves.toBeDefined();
    await expect(
      persistFinishContributions(context, randomUUID(), []),
    ).resolves.toBeDefined();
  });
  it("recovery context+confirmation share network30/pending5/learner5 and allow a complete controlled lifecycle", async () => {
    const { context, code } = await enroll();
    const display = await POST(request("recovery", code));
    expect(display.status).toBe(200);
    const successor = (await display.json()).code as string;
    const secret = state.jar.get(PENDING_COOKIE_NAME)!;
    const viewed = await POST(request("context-recovery", successor));
    expect(viewed.status).toBe(200);
    const expected = { learnerId: context.learnerId, generation: "2" };
    expect((await viewed.json()).target).toEqual(expected);
    const confirmation = await POST(request("confirm-recovery", successor));
    expect(confirmation.status).toBe(200);
    expect((await confirmation.json()).owner).toEqual(expected);
    expect((await resolveLearnerFromCookie()).learnerId).toBe(
      context.learnerId,
    );
    expect(
      (
        await bucket(
          "recovery-confirm-network",
          trustedRecoveryNetworkBucket(new Headers())!,
        )
      ).attempts,
    ).toBe(2);
    expect(
      (await bucket("confirm-secret", pendingSecretHash(secret))).attempts,
    ).toBe(2);
    expect((await bucket("confirm-learner", context.learnerId)).attempts).toBe(
      3,
    ); // includes enrollment confirmation
  });
  it("context and confirmation enforce shared pending/learner attempts without consuming active recovery code", async () => {
    const { context, code } = await enroll();
    const pending = await startRecovery(code);
    state.jar.set(PENDING_COOKIE_NAME, pending.secret);
    // Enrollment spent one of the target's five confirmation attempts.
    for (let count = 0; count < 4; count++)
      expect(
        (
          await POST(
            request(
              count % 2 ? "confirm-recovery" : "context-recovery",
              generateRecoveryCode(),
            ),
          )
        ).status,
      ).toBe(400);
    const result = await POST(request("confirm-recovery", pending.code));
    expect(result.status).toBe(429);
    expect(result.headers.has("Retry-After")).toBe(true);
    expect(
      (await bucket("confirm-secret", pendingSecretHash(pending.secret)))
        .attempts,
    ).toBe(5);
    expect((await bucket("confirm-learner", context.learnerId)).attempts).toBe(
      6,
    );
    await expect(startRecovery(code)).resolves.toHaveProperty("code");
    await expect(readLearnerProgress(context)).resolves.toBeDefined();
  });
  it("pending-secret budget admits five context/confirmation attempts and rejects the sixth", async () => {
    const secret = generateBearerSecret();
    state.jar.set(PENDING_COOKIE_NAME, secret);
    for (let count = 0; count < 5; count++)
      expect(
        (
          await POST(
            request(
              count % 2 ? "confirm-recovery" : "context-recovery",
              generateRecoveryCode(),
            ),
          )
        ).status,
      ).toBe(400);
    const limited = await POST(
      request("confirm-recovery", generateRecoveryCode()),
    );
    expect(limited.status).toBe(429);
    expect(limited.headers.has("Retry-After")).toBe(true);
    expect(
      (await bucket("confirm-secret", pendingSecretHash(secret))).attempts,
    ).toBe(6);
  });
  it("context/confirmation network budget30 rejects before looking up additional pending secrets", async () => {
    for (let count = 0; count < 30; count++) {
      state.jar.set(PENDING_COOKIE_NAME, generateBearerSecret());
      expect(
        (
          await POST(
            request(
              count % 2 ? "confirm-recovery" : "context-recovery",
              generateRecoveryCode(),
            ),
          )
        ).status,
      ).toBe(400);
    }
    const untouched = generateBearerSecret();
    state.jar.set(PENDING_COOKIE_NAME, untouched);
    const result = await POST(
      request("context-recovery", generateRecoveryCode()),
    );
    expect(result.status).toBe(429);
    expect(
      await bucket("confirm-secret", pendingSecretHash(untouched)),
    ).toBeUndefined();
  });
  it("authenticated starts enforce learner5; context+confirm use pending5+learner5 without network identity", async () => {
    const context = await fresh();
    const started = await POST(request("enrollment"));
    const code = (await started.json()).code as string;
    const secret = state.jar.get(PENDING_COOKIE_NAME)!;
    expect((await POST(request("context-authenticated", code))).status).toBe(
      200,
    );
    expect((await POST(request("confirm-authenticated", code))).status).toBe(
      200,
    );
    expect(
      (await bucket("confirm-secret", pendingSecretHash(secret))).attempts,
    ).toBe(2);
    expect((await bucket("confirm-learner", context.learnerId)).attempts).toBe(
      2,
    );
    for (let count = 0; count < 4; count++) await POST(request("replacement"));
    expect((await POST(request("replacement"))).status).toBe(429);
    expect(
      (await bucket("authenticated-start", context.learnerId)).attempts,
    ).toBe(6);
  });
  it("bounded cleanup preserves unexpired operations and all learner/history rows, is repeatable", async () => {
    const context = await fresh();
    await persistFinishContributions(context, randomUUID(), []);
    const before = await getProgressDb().select().from(learners);
    const history = await getProgressDb().select().from(practiceFinishReceipts);
    // This suite owns its schema. Remove preceding tests' operational fixtures only.
    await getProgressDb().delete(learnerCredentialChanges);
    await getProgressDb().delete(identityRateLimitBuckets);
    await startAuthenticatedCredentialChange(context, "enrollment");
    await getProgressDb()
      .execute(sql`INSERT INTO learner_credential_changes(learner_id,kind,pending_secret_hash,expected_generation,successor_code_hash,created_at,expires_at)
      SELECT ${context.learnerId}, 'enrollment', encode(sha256(gen_random_uuid()::text::bytea),'hex'), 0, encode(sha256(gen_random_uuid()::text::bytea),'hex'), clock_timestamp()-interval '20 minutes', clock_timestamp()-interval '10 minutes' FROM generate_series(1,105)`);
    await getProgressDb()
      .execute(sql`INSERT INTO identity_rate_limit_buckets(bucket_key,window_start,attempts,expires_at)
      SELECT encode(sha256(gen_random_uuid()::text::bytea),'hex'), clock_timestamp()-interval '30 minutes', 1, clock_timestamp()-interval '15 minutes' FROM generate_series(1,105)`);
    const batch = await cleanupCredentialOperations();
    expect(batch).toEqual({
      pendingDeleted: CREDENTIAL_CLEANUP_BATCH_SIZE,
      rateDeleted: CREDENTIAL_CLEANUP_BATCH_SIZE,
    });
    const auth = new Request("http://localhost/api/internal/recovery-cleanup", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const response = await cleanupRequest(auth);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      pendingDeleted: 5,
      rateDeleted: 5,
      complete: true,
    });
    expect(
      await getProgressDb().select().from(learnerCredentialChanges),
    ).toHaveLength(1);
    expect(
      await getProgressDb().select().from(identityRateLimitBuckets),
    ).toHaveLength(1); // current authenticated-start budget
    expect(await getProgressDb().select().from(learners)).toEqual(before);
    expect(await getProgressDb().select().from(practiceFinishReceipts)).toEqual(
      history,
    );
    expect(await scheduledCredentialCleanup()).toEqual({
      pendingDeleted: 0,
      rateDeleted: 0,
      complete: true,
    });
  });
  it("scheduled cleanup respects total batch cap and reports leftover backlog for retry", async () => {
    await getProgressDb().delete(identityRateLimitBuckets);
    await getProgressDb()
      .execute(sql`INSERT INTO identity_rate_limit_buckets(bucket_key,window_start,attempts,expires_at)
      SELECT encode(sha256(gen_random_uuid()::text::bytea),'hex'), clock_timestamp()-interval '30 minutes', 1, clock_timestamp()-interval '15 minutes' FROM generate_series(1,2001)`);
    const auth = new Request("http://localhost/api/internal/recovery-cleanup", {
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    });
    const first = await cleanupRequest(auth);
    expect(first.status).toBe(503);
    expect((await first.json()).rateDeleted).toBe(
      CREDENTIAL_CLEANUP_BATCH_SIZE * SCHEDULED_CLEANUP_MAX_BATCHES,
    );
    const second = await cleanupRequest(auth);
    expect(second.status).toBe(200);
    expect((await second.json()).rateDeleted).toBe(1);
  });
});

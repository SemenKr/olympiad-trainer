import { createHash, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name: string, value: string) => jar.set(name, value),
  }),
}));
import { getProgressDb } from "../../practice/server/progress-db";
import {
  learners,
  learnerCredentialChanges,
  practiceFinishReceipts,
} from "../../practice/server/progress-schema";
import {
  initializeAnonymousLearner,
  LEARNER_COOKIE_NAME,
  resolveLearnerFromCookie,
} from "../../practice/server/learner-identity";
import { type AuthenticatedLearner } from "../../practice/server/learner-auth";
import {
  importLegacyProgress,
  persistFinishContributions,
  readLearnerProgress,
} from "../../practice/server/learner-progress-persistence";
import { transactSimulation } from "../../simulation/server/persistence";
import {
  cancelCredentialChange,
  confirmCredentialChange,
  pendingTransitionContext,
  startAuthenticatedCredentialChange,
  startRecovery,
} from "./recovery-credentials";
import {
  cleanupCredentialOperations,
  limitCredentialAttempts,
} from "./identity-rate-limit";
import { generateRecoveryCode, recoveryCodeHash } from "./recovery-secrets";
import { recoveryLearners } from "./recovery-schema";

const testUrl = process.env.DATABASE_TEST_URL;
const schema = `recovery_${randomUUID().replaceAll("-", "")}`;
const migratedLearner = randomUUID();
let isolatedUrl: string;
beforeAll(async () => {
  if (!testUrl) return;
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const files = (await readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    for (const name of files) {
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      if (name === "0012_learner_identity_boundary.sql")
        await client.query(
          "INSERT INTO learners(id,anonymous_token_hash,browser_credential_expires_at,guarantee_evidence,impossibility_evidence,enumeration_evidence) VALUES ($1,$2,clock_timestamp()+interval '730 days',$3,$3,$3)",
          [migratedLearner, "migration-token-hash", {}],
        );
    }
    const url = new URL(testUrl);
    url.searchParams.set("options", `-c search_path=${schema}`);
    isolatedUrl = url.toString();
    process.env.DATABASE_URL = isolatedUrl;
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
async function fresh() {
  jar.clear();
  await initializeAnonymousLearner();
  const context = await resolveLearnerFromCookie();
  await importLegacyProgress(context, null);
  return context;
}
async function row(context: AuthenticatedLearner) {
  const learner = (
    await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, context.learnerId))
  )[0];
  const [credentials] = await getProgressDb()
    .select()
    .from(recoveryLearners)
    .where(eq(recoveryLearners.id, context.learnerId));
  return { ...learner, ...credentials };
}
async function enrolled() {
  const context = await fresh();
  const pending = await startAuthenticatedCredentialChange(
    context,
    "enrollment",
  );
  await confirmCredentialChange(pending.secret, pending.code, context);
  return { context: await resolveLearnerFromCookie(), code: pending.code };
}
async function expire(secretLearner: string) {
  await getProgressDb().execute(
    sql`UPDATE learner_credential_changes SET created_at=clock_timestamp()-interval '11 minutes', expires_at=clock_timestamp()-interval '1 minute' WHERE learner_id=${secretLearner}`,
  );
}

describe.skipIf(!testUrl)("PostgreSQL recovery lifecycle", () => {
  it("migrates existing 0012 learner unchanged and enforces recovery/pending constraints", async () => {
    const client = new pg.Client({ connectionString: isolatedUrl });
    await client.connect();
    try {
      const { rows } = await client.query(
        "SELECT id,anonymous_token_hash,recovery_code_hash,recovery_enabled_at,credential_generation FROM learners WHERE id=$1",
        [migratedLearner],
      );
      expect(rows[0]).toEqual({
        id: migratedLearner,
        anonymous_token_hash: "migration-token-hash",
        recovery_code_hash: null,
        recovery_enabled_at: null,
        credential_generation: "0",
      });
      await expect(
        client.query("UPDATE learners SET recovery_code_hash=$1 WHERE id=$2", [
          "a".repeat(64),
          migratedLearner,
        ]),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        client.query(
          "UPDATE learners SET credential_generation=-1 WHERE id=$1",
          [migratedLearner],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        client.query(
          "INSERT INTO learner_credential_changes(learner_id,kind,pending_secret_hash,expected_generation,successor_code_hash) VALUES ($1,'invalid',$2,0,$3)",
          [migratedLearner, "a".repeat(64), "b".repeat(64)],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      await expect(
        client.query(
          "INSERT INTO learner_credential_changes(learner_id,kind,pending_secret_hash,expected_generation,successor_code_hash,expires_at) VALUES ($1,'enrollment',$2,0,$3,clock_timestamp()-interval '1 minute')",
          [migratedLearner, "a".repeat(64), "b".repeat(64)],
        ),
      ).rejects.toMatchObject({ code: "23514" });
    } finally {
      await client.end();
    }
  });
  it("two authenticated confirmations have one winner and reject an old captured context", async () => {
    const context = await fresh();
    const pending = await startAuthenticatedCredentialChange(
      context,
      "enrollment",
    );
    const results = await Promise.allSettled([
      confirmCredentialChange(pending.secret, pending.code, context),
      confirmCredentialChange(pending.secret, pending.code, context),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect((await row(context)).credentialGeneration).toBe(BigInt(1));
    await expect(readLearnerProgress(context)).rejects.toThrow(
      "identity is unavailable",
    );
    await expect(
      readLearnerProgress(await resolveLearnerFromCookie()),
    ).resolves.toBeDefined();
  });
  it("pending authorization alone and stale generation cannot activate credentials", async () => {
    const context = await fresh();
    const before = await row(context);
    const pending = await startAuthenticatedCredentialChange(
      context,
      "enrollment",
    );
    jar.clear();
    jar.set("olympiad-trainer-credential-change-v1", pending.secret);
    await expect(resolveLearnerFromCookie()).rejects.toThrow(
      "identity is unavailable",
    );
    await expect(
      confirmCredentialChange(pending.secret, pending.code),
    ).rejects.toThrow("unavailable");
    expect(await row(context)).toEqual(before);
    await getProgressDb()
      .update(learners)
      .set({ credentialGeneration: BigInt(1) })
      .where(eq(learners.id, context.learnerId));
    await expect(
      confirmCredentialChange(pending.secret, pending.code, {
        ...context,
        generation: BigInt(1),
      }),
    ).rejects.toThrow("unavailable");
    expect((await row(context)).recoveryCodeHash).toBeNull();
  });
  it("recovery pending cannot use authenticated confirmation to bypass the network boundary", async () => {
    const { context, code } = await enrolled();
    const before = await row(context);
    const pending = await startRecovery(code);
    await expect(
      confirmCredentialChange(pending.secret, pending.code, context),
    ).rejects.toThrow("unavailable");
    await expect(
      pendingTransitionContext(pending.secret, pending.code, context),
    ).rejects.toThrow("unavailable");
    expect(await row(context)).toEqual(before);
  });
  it("in-flight Practice/Simulation writes queued behind actual recovery are rejected after rotation", async () => {
    const { context, code } = await enrolled();
    const sim = (await transactSimulation(context, { kind: "start" })).attempt!;
    const pending = await startRecovery(code);
    const client = new pg.Client({ connectionString: isolatedUrl });
    await client.connect();
    const lockKey = 3182101;
    try {
      await client.query(
        `CREATE FUNCTION hold_rotation() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN PERFORM pg_advisory_xact_lock(${lockKey}); RETURN NEW; END'`,
      );
      await client.query(
        "CREATE TRIGGER hold_rotation BEFORE UPDATE OF anonymous_token_hash ON learners FOR EACH ROW EXECUTE FUNCTION hold_rotation()",
      );
      await client.query("SELECT pg_advisory_lock($1)", [lockKey]);
      const confirmation = confirmCredentialChange(
        pending.secret,
        pending.code,
      );
      let waiting = false;
      for (let attempt = 0; attempt < 200; attempt++) {
        const result = await client.query(
          "SELECT 1 FROM pg_locks WHERE locktype='advisory' AND objid=$1 AND NOT granted",
          [lockKey],
        );
        if (result.rowCount) {
          waiting = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
      const practice = expect(
        persistFinishContributions(context, randomUUID(), []),
      ).rejects.toThrow("identity is unavailable");
      const simulation = expect(
        transactSimulation(context, {
          kind: "save",
          sessionId: sim.sessionId,
          revision: 0,
          work: sim,
        }),
      ).rejects.toThrow("identity is unavailable");
      await client.query("SELECT pg_advisory_unlock($1)", [lockKey]);
      await confirmation;
      await Promise.all([practice, simulation]);
    } finally {
      await client.query("SELECT pg_advisory_unlock($1)", [lockKey]);
      await client.query("DROP TRIGGER hold_rotation ON learners");
      await client.end();
    }
  });
  it("enrolls only on confirmation, retains token, persists no plaintext and increments once", async () => {
    const context = await fresh();
    const before = await row(context);
    const pending = await startAuthenticatedCredentialChange(
      context,
      "enrollment",
    );
    expect(await row(context)).toEqual(before);
    const stored = await getProgressDb()
      .select()
      .from(learnerCredentialChanges);
    expect(
      JSON.stringify(stored, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    ).not.toContain(pending.code);
    expect(
      JSON.stringify(stored, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    ).not.toContain(pending.secret);
    expect(
      await pendingTransitionContext(pending.secret, pending.code, context),
    ).toEqual({
      operationId: pending.operationId,
      target: { learnerId: context.learnerId, generation: "1" },
    });
    await confirmCredentialChange(pending.secret, pending.code, context);
    const after = await row(context);
    expect(after.recoveryCodeHash).toBe(recoveryCodeHash(pending.code));
    expect(after.recoveryEnabledAt).toBeInstanceOf(Date);
    expect(after.anonymousTokenHash).toBe(before.anonymousTokenHash);
    expect(after.credentialGeneration).toBe(BigInt(1));
    await expect(
      confirmCredentialChange(pending.secret, pending.code, context),
    ).rejects.toThrow("unavailable");
    expect(await row(context)).toEqual(after);
    expect((await resolveLearnerFromCookie()).generation).toBe(BigInt(1));
  });
  it.each(["cancel", "expiry"])(
    "%s before enrollment leaves disabled state unchanged",
    async (action) => {
      const context = await fresh();
      const before = await row(context);
      const pending = await startAuthenticatedCredentialChange(
        context,
        "enrollment",
      );
      if (action === "cancel") await cancelCredentialChange(pending.secret);
      else await expire(context.learnerId);
      await expect(
        confirmCredentialChange(pending.secret, pending.code, context),
      ).rejects.toThrow("unavailable");
      expect(await row(context)).toEqual(before);
    },
  );
  it("bounds active pending rows at three even concurrently, expiry frees capacity", async () => {
    const context = await fresh();
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        startAuthenticatedCredentialChange(context, "enrollment"),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(3);
    await expire(context.learnerId);
    await expect(
      startAuthenticatedCredentialChange(context, "enrollment"),
    ).resolves.toHaveProperty("code");
  });
  it("replacement retains old authority until confirmed, then revokes it without rotating browser", async () => {
    const { context, code } = await enrolled();
    const before = await row(context);
    const replacement = await startAuthenticatedCredentialChange(
      context,
      "replacement",
    );
    const oldRecovery = await startRecovery(code);
    expect(await row(context)).toEqual(before);
    await confirmCredentialChange(
      replacement.secret,
      replacement.code,
      context,
    );
    const after = await row(context);
    expect(after.anonymousTokenHash).toBe(before.anonymousTokenHash);
    expect(after.recoveryEnabledAt).toEqual(before.recoveryEnabledAt);
    expect(after.credentialGeneration).toBe(context.generation + BigInt(1));
    await expect(startRecovery(code)).rejects.toThrow("unavailable");
    await expect(
      confirmCredentialChange(oldRecovery.secret, oldRecovery.code),
    ).rejects.toThrow("unavailable");
    await expect(startRecovery(replacement.code)).resolves.toHaveProperty(
      "code",
    );
    expect((await resolveLearnerFromCookie()).learnerId).toBe(
      context.learnerId,
    );
  });
  it.each(["same operation", "competing operations"])(
    "one concurrent recovery winner for %s; same UUID, unchanged history, old browser revoked",
    async (competition) => {
      const { context, code } = await enrolled();
      await persistFinishContributions(context, randomUUID(), []);
      const sim = (await transactSimulation(context, { kind: "start" }))
        .attempt!;
      const before = await row(context);
      const history = await getProgressDb()
        .select()
        .from(practiceFinishReceipts);
      const first = await startRecovery(code);
      const second =
        competition === "same operation" ? first : await startRecovery(code);
      expect(await resolveLearnerFromCookie()).toEqual(context);
      const results = await Promise.allSettled([
        confirmCredentialChange(first.secret, first.code),
        confirmCredentialChange(second.secret, second.code),
      ]);
      const winners = results.filter((result) => result.status === "fulfilled");
      expect(winners).toHaveLength(1);
      const winner = winners[0];
      if (winner.status !== "fulfilled") throw new Error("Missing winner");
      const result = winner.value;
      if (
        !("browserToken" in result) ||
        typeof result.browserToken !== "string"
      )
        throw new Error("Missing browser credential");
      const after = await row(context);
      expect(after.id).toBe(before.id);
      expect(after.credentialGeneration).toBe(context.generation + BigInt(1));
      expect(after.anonymousTokenHash).toBe(
        createHash("sha256").update(result.browserToken).digest("hex"),
      );
      expect(after.browserCredentialExpiresAt.getTime()).toBeGreaterThan(
        Date.now() + 729 * 86400000,
      );
      expect({
        ...after,
        anonymousTokenHash: before.anonymousTokenHash,
        browserCredentialExpiresAt: before.browserCredentialExpiresAt,
        credentialGeneration: before.credentialGeneration,
        recoveryCodeHash: before.recoveryCodeHash,
      }).toEqual(before);
      await expect(resolveLearnerFromCookie()).rejects.toThrow(
        "identity is unavailable",
      );
      await expect(
        persistFinishContributions(context, randomUUID(), []),
      ).rejects.toThrow("identity is unavailable");
      await expect(
        transactSimulation(context, {
          kind: "save",
          sessionId: sim.sessionId,
          revision: 0,
          work: sim,
        }),
      ).rejects.toThrow("identity is unavailable");
      expect(
        await getProgressDb().select().from(practiceFinishReceipts),
      ).toEqual(history);
      await expect(startRecovery(code)).rejects.toThrow("unavailable");
      jar.set(LEARNER_COOKIE_NAME, result.browserToken);
      const restored = await resolveLearnerFromCookie();
      expect(restored.learnerId).toBe(context.learnerId);
      expect(
        (await transactSimulation(restored, { kind: "read" })).attempt,
      ).toEqual(sim);
    },
  );
  it("failed confirmation leaves active code usable; cancellation/expiry preserve enabled credentials", async () => {
    const { context, code } = await enrolled();
    const before = await row(context);
    const pending = await startRecovery(code);
    await expect(
      confirmCredentialChange(pending.secret, generateRecoveryCode()),
    ).rejects.toThrow("unavailable");
    expect(await row(context)).toEqual(before);
    const another = await startRecovery(code);
    await cancelCredentialChange(another.secret);
    await expire(context.learnerId);
    await expect(
      confirmCredentialChange(pending.secret, pending.code),
    ).rejects.toThrow("unavailable");
    expect(await row(context)).toEqual(before);
    await expect(startRecovery(code)).resolves.toHaveProperty("code");
  });
  it("lost committed response can recover through saved successor without replaying plaintext browser token", async () => {
    const { context, code } = await enrolled();
    const first = await startRecovery(code);
    await confirmCredentialChange(first.secret, first.code); // Deliberately discard token/Set-Cookie.
    await expect(resolveLearnerFromCookie()).rejects.toThrow(
      "identity is unavailable",
    );
    await expect(
      confirmCredentialChange(first.secret, first.code),
    ).rejects.toThrow("unavailable");
    const next = await startRecovery(first.code);
    const result = await confirmCredentialChange(next.secret, next.code);
    expect(result.owner.learnerId).toBe(context.learnerId);
    expect((await row(context)).credentialGeneration).toBe(BigInt(3));
  });
  it("database rollback restores stable credentials and pending authority", async () => {
    const { context, code } = await enrolled();
    const before = await row(context);
    const pending = await startRecovery(code);
    const client = new pg.Client({ connectionString: isolatedUrl });
    await client.connect();
    try {
      await client.query(
        "CREATE FUNCTION reject_pending_delete() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''rollback test''; END'",
      );
      await client.query(
        "CREATE TRIGGER reject_pending_delete BEFORE DELETE ON learner_credential_changes FOR EACH ROW EXECUTE FUNCTION reject_pending_delete()",
      );
      await expect(
        confirmCredentialChange(pending.secret, pending.code),
      ).rejects.toThrow("Failed query");
      expect(await row(context)).toEqual(before);
      expect(await resolveLearnerFromCookie()).toEqual(context);
    } finally {
      await client.query(
        "DROP TRIGGER reject_pending_delete ON learner_credential_changes",
      );
      await client.end();
    }
    await expect(
      confirmCredentialChange(pending.secret, pending.code),
    ).resolves.toHaveProperty("owner");
  });
  it("atomic shared rate budget admits exactly five, normal Practice remains usable", async () => {
    const context = await fresh();
    const results = await Promise.allSettled(
      Array.from({ length: 16 }, () =>
        limitCredentialAttempts("load-test", context.learnerId),
      ),
    );
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(5);
    for (const result of results)
      if (result.status === "rejected")
        expect(result.reason.retryAfter).toBeGreaterThan(0);
    await expect(readLearnerProgress(context)).resolves.toBeDefined();
    const starts = await Promise.allSettled(
      Array.from({ length: 7 }, () => startRecovery(generateRecoveryCode())),
    );
    expect(starts.every((result) => result.status === "rejected")).toBe(true);
    await expect(
      persistFinishContributions(context, randomUUID(), []),
    ).resolves.toBeDefined();
  });
  it("cleanup removes bounded expired operational rows only", async () => {
    const context = await fresh();
    const before = await row(context);
    await startAuthenticatedCredentialChange(context, "enrollment");
    await expire(context.learnerId);
    await cleanupCredentialOperations();
    expect(
      await getProgressDb()
        .select()
        .from(learnerCredentialChanges)
        .where(eq(learnerCredentialChanges.learnerId, context.learnerId)),
    ).toEqual([]);
    expect(await row(context)).toEqual(before);
  });
});

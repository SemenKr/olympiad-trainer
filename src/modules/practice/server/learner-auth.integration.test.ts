import { randomBytes, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const cookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      cookie.value === undefined ? undefined : { value: cookie.value },
    set: (_name: string, value: string) => {
      cookie.value = value;
    },
  }),
}));
import { getProgressDb } from "./progress-db";
import { learners, practiceFinishReceipts } from "./progress-schema";
import {
  initializeAnonymousLearner,
  resolveLearnerFromCookie,
} from "./learner-identity";
import {
  withAuthenticatedLearner,
  type AuthenticatedLearner,
} from "./learner-auth";
import {
  importLegacyProgress,
  persistFinishContributions,
  readLearnerProgress,
  readRecentPracticeEpisodes,
  readCompletedPackIds,
  readPracticeJourneyTotal,
  readPracticeJourneyFinish,
  readReviewAvailability,
  readAdaptiveAvailability,
  readNextUsefulProblem,
  startReview,
} from "./learner-progress-persistence";
import { transactSimulation } from "../../simulation/server/persistence";
import { requireSimulationAssistanceAllowed } from "../../simulation/server/assistance-guard";
import { readSimulationReferences } from "../../../app/simulation/actions";
import {
  readSupportObservation,
  persistSupportStep,
} from "../../knowledge-support/server/persistence";
import { emptyGuaranteeProgressEvidence } from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";

const testUrl = process.env.DATABASE_TEST_URL;
const suiteSchema = `identity_boundary_${randomUUID().replaceAll("-", "")}`;
let isolatedUrl = testUrl;
beforeAll(async () => {
  if (!testUrl) return;
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${suiteSchema}"`);
    await client.query(`SET search_path TO "${suiteSchema}"`);
    for (const name of (await readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort())
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
    const url = new URL(testUrl);
    url.searchParams.set("options", `-c search_path=${suiteSchema}`);
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
    await client.query(`DROP SCHEMA IF EXISTS "${suiteSchema}" CASCADE`);
  } finally {
    await client.end();
  }
});
async function fresh() {
  cookie.value = undefined;
  await initializeAnonymousLearner();
  return resolveLearnerFromCookie();
}
async function countLearners() {
  return (
    await getProgressDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(learners)
  )[0].count;
}
async function rotate(context: AuthenticatedLearner, token = false) {
  await getProgressDb()
    .update(learners)
    .set({
      credentialGeneration: context.generation + BigInt(1),
      ...(token ? { anonymousTokenHash: randomBytes(32).toString("hex") } : {}),
    })
    .where(eq(learners.id, context.learnerId));
}

describe.skipIf(!testUrl)("PostgreSQL authenticated learner boundary", () => {
  it("explicit initialization preserves a valid token's exact UUID, evidence and receipts on repeated resolution", async () => {
    const context = await fresh();
    await importLegacyProgress(context, null);
    const session = randomUUID();
    await persistFinishContributions(context, session, []);
    const before = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, context.learnerId));
    const count = await countLearners();
    await initializeAnonymousLearner();
    expect(await resolveLearnerFromCookie()).toEqual(context);
    expect(await countLearners()).toBe(count);
    expect(
      await getProgressDb()
        .select()
        .from(learners)
        .where(eq(learners.id, context.learnerId)),
    ).toEqual(before);
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(
          and(
            eq(practiceFinishReceipts.learnerId, context.learnerId),
            eq(practiceFinishReceipts.sessionId, session),
          ),
        ),
    ).toHaveLength(1);
  });
  it.each([undefined, "", "malformed", "A".repeat(43)])(
    "rejects missing/malformed/unknown credential %s without creating any row",
    async (value) => {
      const before = await countLearners();
      cookie.value = value;
      await expect(resolveLearnerFromCookie()).rejects.toThrow(
        "identity is unavailable",
      );
      expect(await countLearners()).toBe(before);
    },
  );
  it("rejects an expired cookie on resolution and on subsequent ownership operations", async () => {
    const context = await fresh();
    await getProgressDb()
      .update(learners)
      .set({ browserCredentialExpiresAt: new Date(0) })
      .where(eq(learners.id, context.learnerId));
    await expect(resolveLearnerFromCookie()).rejects.toThrow(
      "identity is unavailable",
    );
    await expect(readCompletedPackIds(context)).rejects.toThrow(
      "identity is unavailable",
    );
    await expect(
      transactSimulation(context, { kind: "start" }),
    ).rejects.toThrow("identity is unavailable");
  });
  it.each([false, true])(
    "rejects all stale context paths after generation/token rotation (%s), without copying or merging history",
    async (token) => {
      const context = await fresh();
      await importLegacyProgress(context, null);
      await persistFinishContributions(context, randomUUID(), []);
      const sim = (await transactSimulation(context, { kind: "start" }))
        .attempt!;
      const another = await fresh();
      await importLegacyProgress(another, null);
      await rotate(context, token);
      const rows = await getProgressDb().select().from(learners);
      const receipts = await getProgressDb()
        .select()
        .from(practiceFinishReceipts);
      const session = randomUUID();
      const operations = [
        () => importLegacyProgress(context, null),
        () => persistFinishContributions(context, session, []),
        () => readLearnerProgress(context),
        () => readRecentPracticeEpisodes(context),
        () => readCompletedPackIds(context),
        () => readPracticeJourneyTotal(context),
        () => readPracticeJourneyFinish(context, session),
        () => readReviewAvailability(context),
        () => readAdaptiveAvailability(context),
        () => readNextUsefulProblem(context),
        () => startReview(context),
        () => readSupportObservation(context, session),
        () => persistSupportStep(context, session, "diagnostic", "B", true),
        () => transactSimulation(context, { kind: "read" }),
        () => transactSimulation(context, { kind: "start" }),
        () =>
          transactSimulation(context, {
            kind: "save",
            sessionId: sim.sessionId,
            revision: 0,
            work: sim,
          }),
        () =>
          transactSimulation(context, {
            kind: "finish",
            sessionId: sim.sessionId,
            revision: 0,
            work: sim,
            confirmed: true,
          }),
      ];
      for (const operation of operations)
        await expect(operation()).rejects.toThrow("identity is unavailable");
      expect(await getProgressDb().select().from(learners)).toEqual(rows);
      expect(
        await getProgressDb().select().from(practiceFinishReceipts),
      ).toEqual(receipts);
      expect(await readRecentPracticeEpisodes(another)).toEqual([]);
      expect(await readPracticeJourneyTotal(another)).toBe(0);
    },
  );
  it("a context resolved before a competing transaction's rotation cannot mutate after that rotation commits", async () => {
    const context = await fresh();
    await importLegacyProgress(context, null);
    const client = new pg.Client({ connectionString: isolatedUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM learners WHERE id=$1 FOR UPDATE", [
        context.learnerId,
      ]);
      // This request must wait for the ownership lock, then recheck authority.
      const write = persistFinishContributions(context, randomUUID(), []);
      const rejected = expect(write).rejects.toThrow("identity is unavailable");
      await client.query(
        "UPDATE learners SET credential_generation=credential_generation+1 WHERE id=$1",
        [context.learnerId],
      );
      await client.query("COMMIT");
      await rejected;
      expect(
        await getProgressDb()
          .select()
          .from(practiceFinishReceipts)
          .where(eq(practiceFinishReceipts.learnerId, context.learnerId)),
      ).toEqual([]);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  });
  it("uses post-lock server time, rejecting expiry while a transaction waits", async () => {
    const context = await fresh();
    const client = new pg.Client({ connectionString: isolatedUrl });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        "UPDATE learners SET browser_credential_expires_at=clock_timestamp() + interval '100 milliseconds' WHERE id=$1",
        [context.learnerId],
      );
      const rejected = expect(
        withAuthenticatedLearner(context, async () => "must not run"),
      ).rejects.toThrow("identity is unavailable");
      await client.query("SELECT pg_sleep(0.15)");
      await client.query("COMMIT");
      await rejected;
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  });
  it("protects Simulation references and assistance when a cookie is revoked, while valid ownership retains deadline/isolation", async () => {
    const context = await fresh();
    const started = (await transactSimulation(context, { kind: "start" }))
      .attempt!;
    await expect(
      requireSimulationAssistanceAllowed("exact-coin-payments"),
    ).rejects.toThrow("until Simulation Finish");
    await expect(readSimulationReferences(started.sessionId)).rejects.toThrow(
      "only after Finish",
    );
    await rotate(context, true);
    await expect(
      requireSimulationAssistanceAllowed("exact-coin-payments"),
    ).rejects.toThrow("identity is unavailable");
    await expect(readSimulationReferences(started.sessionId)).rejects.toThrow(
      "identity is unavailable",
    );
    cookie.value = undefined;
    await expect(
      requireSimulationAssistanceAllowed("exact-coin-payments"),
    ).rejects.toThrow("identity is unavailable");
  });
  it("migrates the current schema, retaining every existing row and adding only generation/expiry", async () => {
    const client = new pg.Client({ connectionString: isolatedUrl });
    await client.connect();
    const schema = `identity_migration_${randomUUID().replaceAll("-", "")}`;
    try {
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      for (const name of (await readdir("db/migrations"))
        .filter((name) => name.endsWith(".sql") && name < "0012")
        .sort())
        await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      const inserted = await client.query(
        "INSERT INTO learners (anonymous_token_hash, guarantee_evidence, impossibility_evidence) VALUES ($1,$2,$3) RETURNING *",
        [
          "legacy-hash",
          emptyGuaranteeProgressEvidence(),
          emptyImpossibilityProgressEvidence(),
        ],
      );
      const id = inserted.rows[0].id;
      await client.query(
        "INSERT INTO practice_finish_receipts (learner_id,session_id,contribution_hash) VALUES ($1,$2,$3)",
        [id, randomUUID(), "unchanged"],
      );
      const before = await client.query(
        "SELECT * FROM practice_finish_receipts",
      );
      const started = Date.now();
      await client.query(
        await readFile(
          "db/migrations/0012_learner_identity_boundary.sql",
          "utf8",
        ),
      );
      const row = (await client.query("SELECT * FROM learners")).rows[0];
      const { credential_generation, browser_credential_expires_at, ...prior } =
        row;
      expect(prior).toEqual(inserted.rows[0]);
      expect(credential_generation).toBe("0");
      expect(browser_credential_expires_at.getTime()).toBeGreaterThanOrEqual(
        started + 730 * 86400000,
      );
      expect(browser_credential_expires_at.getTime()).toBeLessThanOrEqual(
        Date.now() + 730 * 86400000,
      );
      expect(
        (await client.query("SELECT * FROM practice_finish_receipts")).rows,
      ).toEqual(before.rows);
      await expect(
        client.query("UPDATE learners SET credential_generation=-1"),
      ).rejects.toThrow();
      await expect(
        client.query("UPDATE learners SET browser_credential_expires_at=NULL"),
      ).rejects.toThrow();
    } finally {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.end();
    }
  });
});

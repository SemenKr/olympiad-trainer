import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { eq } from "drizzle-orm";
import { getProgressDb } from "../../practice/server/progress-db";
import { findOrCreateLearner } from "../../practice/server/learner-progress-persistence";
import {
  learners,
  practiceCompletedEpisodes,
  practiceFinishReceipts,
  practiceJourneyAwards,
} from "../../practice/server/progress-schema";
import { simulationAttempts } from "./schema";
import { transactSimulation } from "./persistence";

const testUrl = process.env.DATABASE_TEST_URL;
const schema = `simulation_test_${randomUUID().replaceAll("-", "")}`;
let client: pg.Client | null = null;
let owner: string;
const previousUrl = process.env.DATABASE_URL;

describe.skipIf(!testUrl)(
  "PostgreSQL simulation isolation and concurrency",
  () => {
    beforeAll(async () => {
      client = new pg.Client({ connectionString: testUrl });
      await client.connect();
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      const names = [
        "0001_learner_progress.sql",
        "0002_adaptive_transfer_status.sql",
        "0003_parrots_transfer_status.sql",
        "0004_practice_completed_episodes.sql",
        "0005_enumeration_exploration.sql",
        "0006_content_scale_pack_a.sql",
        "0007_knowledge_support.sql",
        "0008_practice_journey.sql",
        "0009_practice_review.sql",
        "0010_simulation.sql",
      ];
      for (const name of names)
        await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      const url = new URL(testUrl!);
      url.searchParams.set("options", `-c search_path=${schema}`);
      process.env.DATABASE_URL = url.toString();
      owner = await findOrCreateLearner(`simulation-${randomUUID()}`);
    });
    afterAll(async () => {
      vi.restoreAllMocks();
      if (client) {
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        await client.end();
      }
      if (previousUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = previousUrl;
    });
    it("serializes simultaneous Starts and stale writes, freezing drafts without learning contributions", async () => {
      const db = getProgressDb();
      const before = await db
        .select()
        .from(learners)
        .where(eq(learners.id, owner));
      const starts = await Promise.all([
        transactSimulation(owner, { kind: "start" }),
        transactSimulation(owner, { kind: "start" }),
      ]);
      const attempt = starts[0].attempt!;
      expect(starts[1].attempt?.sessionId).toBe(attempt.sessionId);
      const requests = ["first", "second"].map((draft) =>
        transactSimulation(owner, {
          kind: "save",
          sessionId: attempt.sessionId,
          revision: 0,
          work: { drafts: [draft, "", "", ""], selectedIndex: 0 },
        }),
      );
      const results = await Promise.allSettled(requests);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const saved = (await transactSimulation(owner, { kind: "read" }))
        .attempt!;
      const foreign = await findOrCreateLearner(
        `simulation-other-${randomUUID()}`,
      );
      await expect(
        transactSimulation(foreign, {
          kind: "finish",
          sessionId: attempt.sessionId,
          revision: saved.revision,
          work: saved,
          confirmed: true,
        }),
      ).rejects.toThrow("Unknown simulation");
      const finished = (
        await transactSimulation(owner, {
          kind: "finish",
          sessionId: attempt.sessionId,
          revision: saved.revision,
          work: saved,
          confirmed: true,
        })
      ).attempt!;
      expect(finished.drafts).toEqual(saved.drafts);
      expect(
        await db.select().from(learners).where(eq(learners.id, owner)),
      ).toEqual(before);
      for (const table of [
        practiceCompletedEpisodes,
        practiceFinishReceipts,
        practiceJourneyAwards,
      ]) {
        expect(
          await db.select().from(table).where(eq(table.learnerId, owner)),
        ).toEqual([]);
      }
    });
    it("materializes timeout even when the first subsequent request tries to save late work", async () => {
      const expiredOwner = await findOrCreateLearner(
        `simulation-expired-${randomUUID()}`,
      );
      const { attempt } = await transactSimulation(expiredOwner, {
        kind: "start",
      });
      const startedAt = new Date(Date.now() - 46 * 60 * 1000);
      await getProgressDb()
        .update(simulationAttempts)
        .set({
          startedAt,
          deadlineAt: new Date(startedAt.getTime() + 45 * 60 * 1000),
        })
        .where(eq(simulationAttempts.learnerId, expiredOwner));
      const result = await transactSimulation(expiredOwner, {
        kind: "save",
        sessionId: attempt!.sessionId,
        revision: 0,
        work: { drafts: ["late work", "", "", ""], selectedIndex: 0 },
      });
      expect(result.attempt).toMatchObject({
        finishReason: "timeout",
        drafts: ["", "", "", ""],
      });
    });
  },
);

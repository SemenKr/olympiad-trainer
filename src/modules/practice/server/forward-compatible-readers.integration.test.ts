import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import pg from "pg";
import { migrateTestSchema } from "../../../test/migrate-test-schema";
import {
  createTestLearner,
  learnerContext,
} from "../../../test/learner-fixture";
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import {
  importLegacyProgress,
  persistFinishContributions,
  readAdaptiveRecommendation,
  readCompletedPackIds,
  readLearnerProgress,
  readPracticeJourneyTotal,
  readRecentPracticeEpisodes,
} from "./learner-progress-persistence";

vi.mock("server-only", () => ({}));
const testUrl = process.env.DATABASE_TEST_URL;
const schema = `future_packs_${randomUUID().replaceAll("-", "")}`;
let client: pg.Client;
beforeAll(async () => {
  if (!testUrl) return;
  client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET search_path TO "${schema}"`);
  await migrateTestSchema(client, { contract: true });
  // This disposable fixture also admits malformed receipts for strict-reader
  // tests. Migration 0023 separately verifies the actual SQL format bound.
  await client.query(`ALTER TABLE practice_finish_receipts
    DROP CONSTRAINT practice_finish_receipts_pack_id_check,
    DROP CONSTRAINT practice_finish_receipts_pack_id_mode_check`);
  const url = new URL(testUrl);
  url.searchParams.set("options", `-c search_path=${schema}`);
  process.env.DATABASE_URL = url.toString();
});
afterAll(async () => {
  if (!client) return;
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await client.end();
  }
});

const noAnswer = (problemId: string) => ({
  problemId,
  outcome: "no-valid-submissions",
  skipped: false,
  validSubmissionCount: 0,
  hintLevelsExposed: [],
  solutionExposed: false,
  checkpoint: null,
});
const futureFacts = () => ({
  version: 1,
  problems: [noAnswer("future-problem")],
});
async function learner() {
  const id = await createTestLearner(randomUUID());
  await importLegacyProgress(learnerContext(id), null);
  return id;
}
async function receipt(
  id: string,
  session: string,
  packId: string | null,
  mode: string | null = "pack",
) {
  await client.query(
    `INSERT INTO practice_finish_receipts
    (learner_id,session_id,contribution_hash,pack_id,episode_mode)
    VALUES($1,$2,'fixture-hash',$3,$4)`,
    [id, session, packId, mode],
  );
}
async function episode(
  id: string,
  session: string,
  facts: unknown = futureFacts(),
  mode = "pack",
) {
  await client.query(
    `INSERT INTO practice_completed_episodes
    (learner_id,session_id,mode,episode_facts) VALUES($1,$2,$3,$4)`,
    [id, session, mode, JSON.stringify(facts)],
  );
}
async function retained(id: string) {
  const result = [];
  for (const table of [
    "learners",
    "practice_finish_receipts",
    "practice_completed_episodes",
    "practice_journey_awards",
    "practice_adaptive_target_usage",
  ]) {
    const key = table === "learners" ? "id" : "learner_id";
    result.push(
      (await client.query(`SELECT * FROM ${table} WHERE ${key}=$1`, [id])).rows,
    );
  }
  return result;
}

describe.skipIf(!testUrl)("forward-compatible server Pack reads", () => {
  it("rejects a well-formed future Pack at the server writer without allocating a receipt", async () => {
    const id = await learner();
    const before = await retained(id);
    await expect(
      persistFinishContributions(
        learnerContext(id),
        randomUUID(),
        [],
        undefined,
        {
          mode: "pack",
          facts: futureFacts(),
        },
      ),
    ).rejects.toThrow("Invalid completed Practice episode.");
    expect(await retained(id)).toEqual(before);
  });

  it("keeps unknown receipts/history and existing XP while preserving returning status and isolation", async () => {
    const id = await learner();
    const other = await learner();
    const session = randomUUID();
    await receipt(id, session, "pack-t");
    await episode(id, session);
    await client.query(
      `INSERT INTO practice_journey_awards
      (learner_id,session_id,earned_xp,total_xp) VALUES($1,$2,7,7)`,
      [id, session],
    );
    const before = await retained(id);
    const progress = await readLearnerProgress(learnerContext(id));
    expect(await readCompletedPackIds(learnerContext(id))).toEqual([]);
    expect(await readRecentPracticeEpisodes(learnerContext(id))).toEqual([]);
    expect(await readPracticeJourneyTotal(learnerContext(id))).toBe(7);
    expect(await readAdaptiveRecommendation(learnerContext(id))).toMatchObject({
      hasPracticeHistory: true,
    });
    expect(await readLearnerProgress(learnerContext(id))).toEqual(progress);
    expect(await readCompletedPackIds(learnerContext(other))).toEqual([]);
    expect(await readRecentPracticeEpisodes(learnerContext(other))).toEqual([]);
    expect(await readPracticeJourneyTotal(learnerContext(other))).toBe(0);
    expect(
      await readAdaptiveRecommendation(learnerContext(other)),
    ).toMatchObject({ hasPracticeHistory: false });
    expect(await retained(id)).toEqual(before);
    await expect(
      readRecentPracticeEpisodes({ ...learnerContext(id), tokenHash: "wrong" }),
    ).rejects.toThrow("identity is unavailable");
    await expect(
      readCompletedPackIds({ ...learnerContext(id), generation: BigInt(1) }),
    ).rejects.toThrow("identity is unavailable");
  });

  it.each(PRACTICE_PACKS)(
    "preserves $id early Finish, exact replay, XP and history",
    async (pack) => {
      const id = await learner();
      const context = learnerContext(id);
      const session = randomUUID();
      const value = {
        mode: "pack",
        facts: { version: 1, problems: [noAnswer(pack.problemIds[0])] },
      };
      const first = await persistFinishContributions(
        context,
        session,
        [],
        undefined,
        value,
        2,
      );
      const before = await retained(id);
      expect(
        await persistFinishContributions(
          context,
          session,
          [],
          undefined,
          value,
          2,
        ),
      ).toEqual(first);
      expect(await readCompletedPackIds(context)).toEqual([pack.id]);
      expect(await readRecentPracticeEpisodes(context)).toHaveLength(1);
      expect(await retained(id)).toEqual(before);
      const changed = {
        ...value,
        facts: {
          ...value.facts,
          problems: [{ ...value.facts.problems[0], skipped: true }],
        },
      };
      await expect(
        persistFinishContributions(context, session, [], undefined, changed, 2),
      ).rejects.toThrow("changed after Finish");
      expect(await retained(id)).toEqual(before);
    },
  );

  it("keeps legacy NULL and receipt-less known History without inferring Pack completion", async () => {
    const id = await learner();
    const facts = {
      version: 1,
      problems: [noAnswer(PRACTICE_PACKS[0].problemIds[0])],
    };
    for (const mode of [null, "pack"]) {
      const session = randomUUID();
      await receipt(id, session, null, mode);
      await episode(id, session, facts);
    }
    await episode(id, randomUUID(), facts);
    expect(await readCompletedPackIds(learnerContext(id))).toEqual([]);
    expect(await readRecentPracticeEpisodes(learnerContext(id))).toHaveLength(
      3,
    );
  });

  it.each([
    ["pack--s", "pack"],
    ["Pack-s", "pack"],
    ["pack-t ", "pack"],
    ["pack-t", "core"],
    ["pack-t", null],
    [null, "future-mode"],
  ] as const)("rejects malformed receipt %s/%s", async (packId, mode) => {
    const id = await learner();
    await receipt(id, randomUUID(), packId, mode);
    await expect(readCompletedPackIds(learnerContext(id))).rejects.toThrow(
      "could not be verified",
    );
  });

  it.each([
    ["pack-t", "pack", { version: 2, problems: [noAnswer("future-problem")] }],
    [
      "pack-t",
      "pack",
      {
        version: 1,
        problems: [noAnswer("future-problem"), noAnswer("future-problem")],
      },
    ],
    [
      "pack-t",
      "pack",
      {
        version: 1,
        problems: [
          { ...noAnswer("future-problem"), outcome: "eventually-correct" },
        ],
      },
    ],
    ["pack-a", "pack", futureFacts()],
    [
      "pack-t",
      "pack",
      { version: 1, problems: [noAnswer(PRACTICE_PACKS[0].problemIds[0])] },
    ],
    [
      "pack-b",
      "pack",
      { version: 1, problems: [noAnswer(PRACTICE_PACKS[0].problemIds[0])] },
    ],
    ["pack--s", "pack", futureFacts()],
    ["pack-t", "core", futureFacts()],
  ] as const)(
    "rejects inconsistent History %s/%s/%j",
    async (packId, mode, facts) => {
      const id = await learner();
      const session = randomUUID();
      await receipt(id, session, packId, mode);
      await episode(id, session, facts);
      await expect(
        readRecentPracticeEpisodes(learnerContext(id)),
      ).rejects.toThrow("could not be verified");
    },
  );

  it("does not borrow a future receipt from a different learner or session", async () => {
    const id = await learner();
    const other = await learner();
    const session = randomUUID();
    await episode(id, session);
    await receipt(other, session, "pack-t");
    await receipt(id, randomUUID(), "pack-t");
    await expect(
      readRecentPracticeEpisodes(learnerContext(id)),
    ).rejects.toThrow("could not be verified");
  });

  it.each([
    futureFacts(),
    {
      version: 1,
      problems: [
        noAnswer(PRACTICE_PACKS[0].problemIds[1]),
        noAnswer(PRACTICE_PACKS[0].problemIds[0]),
      ],
    },
  ])(
    "keeps Finish strict even with broadened fixture storage constraints: %j",
    async (facts) => {
      const id = await learner();
      const session = randomUUID();
      const before = await retained(id);
      await expect(
        persistFinishContributions(
          learnerContext(id),
          session,
          [],
          undefined,
          { mode: "pack", facts },
          2,
        ),
      ).rejects.toThrow("Invalid completed Practice episode");
      expect(await retained(id)).toEqual(before);
    },
  );
});

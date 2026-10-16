import { randomUUID, createHash } from "node:crypto";
import pg from "pg";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { eq, and } from "drizzle-orm";
import {
  createTestLearner,
  learnerContext,
} from "../../../test/learner-fixture";
import { ADAPTIVE_RULES } from "../application/adaptive-recommendation";
import {
  appendGuaranteeEvidence,
  emptyGuaranteeProgressEvidence,
} from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";
import { emptyEnumerationProgressEvidence } from "../application/enumeration-progress-evidence";
import {
  importLegacyProgress,
  persistFinishContributions,
  readAdaptiveRecommendation,
  readLearnerProgress,
} from "./learner-progress-persistence";
import { getProgressDb } from "./progress-db";
import {
  learners,
  practiceAdaptiveTargetUsage,
  practiceFinishReceipts,
  practiceCompletedEpisodes,
  practiceJourneyAwards,
} from "./progress-schema";

const testUrl = process.env.DATABASE_TEST_URL;
const noAnswer = (problemId: string) => ({
  problemId,
  outcome: "no-valid-submissions",
  skipped: false,
  validSubmissionCount: 0,
  hintLevelsExposed: [] as string[],
  solutionExposed: false,
  checkpoint: null,
});
const sources = [
  {
    bucket: "impossibility",
    value: {
      problemId: "table-impossible-sums",
      observation: {
        checkpointId: "table-impossible-sums-impossibility-argument",
        selectedOptionId: "A",
        outcome: "correct",
        validSubmissionCountAtSubmit: 1,
      },
      hintLevelsExposedBeforeCheckpoint: [],
      solutionExposedBeforeCheckpoint: false,
    },
  },
  {
    bucket: "guarantee",
    value: {
      problemId: "guaranteed-sock-pair",
      observation: {
        checkpointId: "guaranteed-sock-pair-guarantee-argument",
        selectedOptionId: "A",
        outcome: "correct",
        validSubmissionCountAtSubmit: 1,
      },
      hintLevelsExposedBeforeCheckpoint: [],
      solutionExposedBeforeCheckpoint: false,
    },
  },
];
const owners: string[] = [];
async function learner() {
  const id = await createTestLearner(randomUUID());
  owners.push(id);
  const context = learnerContext(id);
  await importLegacyProgress(context, null);
  return context;
}

describe.skipIf(!testUrl)("Adaptive v1 PostgreSQL", () => {
  beforeAll(() => {
    process.env.DATABASE_URL = testUrl;
  });
  afterAll(async () => {
    for (const id of owners) {
      for (const table of [
        practiceAdaptiveTargetUsage,
        practiceJourneyAwards,
        practiceCompletedEpisodes,
        practiceFinishReceipts,
      ])
        await getProgressDb().delete(table).where(eq(table.learnerId, id));
      await getProgressDb().delete(learners).where(eq(learners.id, id));
    }
  });
  it("imports sessionless target closure and returning status without an exploration Finish prerequisite", async () => {
    const id = await createTestLearner(randomUUID());
    owners.push(id);
    const context = learnerContext(id);
    const guarantee = appendGuaranteeEvidence(
      emptyGuaranteeProgressEvidence(),
      {
        problemId: "parrots-guaranteed-colors",
        observation: {
          checkpointId: "parrots-guaranteed-colors-guarantee-argument",
          selectedOptionId: "B",
          outcome: "incorrect",
          validSubmissionCountAtSubmit: 1,
        },
        hintLevelsExposedBeforeCheckpoint: [],
        solutionExposedBeforeCheckpoint: false,
      },
    )!;
    const raw = JSON.stringify({
      version: 3,
      guarantee,
      impossibility: emptyImpossibilityProgressEvidence(),
      enumeration: emptyEnumerationProgressEvidence(),
    });
    await importLegacyProgress(context, raw);
    await importLegacyProgress(context, raw);
    const usage = await getProgressDb()
      .select()
      .from(practiceAdaptiveTargetUsage)
      .where(eq(practiceAdaptiveTargetUsage.learnerId, id));
    expect(usage).toHaveLength(1);
    expect(usage[0]).toMatchObject({
      problemId: "parrots-guaranteed-colors",
      sourceSessionId: null,
    });
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(eq(practiceFinishReceipts.learnerId, id)),
    ).toHaveLength(0);
    expect(await readAdaptiveRecommendation(context)).toEqual({
      availability: { status: "none" },
      hasPracticeHistory: true,
    });
  });
  it("rolls back receipt, evidence, history and award if closure insertion fails", async () => {
    const context = await learner();
    const before = await readLearnerProgress(context);
    const session = randomUUID();
    const name = `adaptive_fail_${randomUUID().replaceAll("-", "")}`;
    const client = new pg.Client({ connectionString: testUrl });
    await client.connect();
    try {
      await client.query(
        `CREATE FUNCTION ${name}() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.learner_id = '${context.learnerId}'::uuid THEN RAISE EXCEPTION 'injected closure failure'; END IF; RETURN NEW; END $$`,
      );
      await client.query(
        `CREATE TRIGGER ${name} BEFORE INSERT ON practice_adaptive_target_usage FOR EACH ROW EXECUTE FUNCTION ${name}()`,
      );
      await expect(
        persistFinishContributions(
          context,
          session,
          [],
          undefined,
          {
            mode: "transfer",
            facts: {
              version: 1,
              problems: [noAnswer("brothers-ages-products")],
            },
          },
          2,
        ),
      ).rejects.toThrow();
      for (const table of [
        practiceFinishReceipts,
        practiceCompletedEpisodes,
        practiceJourneyAwards,
        practiceAdaptiveTargetUsage,
      ])
        expect(
          await getProgressDb()
            .select()
            .from(table)
            .where(eq(table.learnerId, context.learnerId)),
        ).toHaveLength(0);
      expect(await readLearnerProgress(context)).toEqual(before);
    } finally {
      await client.query(
        `DROP TRIGGER IF EXISTS ${name} ON practice_adaptive_target_usage`,
      );
      await client.query(`DROP FUNCTION IF EXISTS ${name}()`);
      await client.end();
    }
  });

  it.each(
    ADAPTIVE_RULES.flatMap((rule) =>
      [true, false].map((skipped) => ({ rule, skipped })),
    ),
  )(
    "versioned Finish closes $rule.target including skipped=$skipped",
    async ({ rule, skipped }) => {
      const context = await learner(),
        session = randomUUID();
      const episode = {
        mode: rule.purpose === "test-transfer" ? "transfer" : "exploration",
        facts: {
          version: 1,
          problems: [
            {
              ...noAnswer(rule.target),
              skipped,
              hintLevelsExposed: skipped ? [] : ["focus"],
            },
          ],
        },
      };
      const award = await persistFinishContributions(
        context,
        session,
        [],
        undefined,
        episode,
        2,
      );
      const [before] = await getProgressDb()
        .select()
        .from(practiceAdaptiveTargetUsage)
        .where(eq(practiceAdaptiveTargetUsage.learnerId, context.learnerId));
      expect(before).toMatchObject({
        problemId: rule.target,
        sourceSessionId: session,
      });
      await getProgressDb()
        .delete(practiceCompletedEpisodes)
        .where(eq(practiceCompletedEpisodes.learnerId, context.learnerId));
      expect(
        await persistFinishContributions(
          context,
          session,
          [],
          undefined,
          episode,
          2,
        ),
      ).toEqual(award);
      expect(
        await getProgressDb()
          .select()
          .from(practiceAdaptiveTargetUsage)
          .where(eq(practiceAdaptiveTargetUsage.learnerId, context.learnerId)),
      ).toEqual([before]);
      await expect(
        persistFinishContributions(
          context,
          session,
          [],
          undefined,
          {
            ...episode,
            facts: {
              version: 1,
              problems: [{ ...noAnswer(rule.target), skipped: !skipped }],
            },
          },
          2,
        ),
      ).rejects.toThrow("changed");
    },
  );
  it.each(["brothers-legacy", "pages-legacy"])(
    "accepts first submission and immutable replay of %s",
    async (kind) => {
      const context = await learner(),
        session = randomUUID();
      const adaptiveFacts =
        kind === "brothers-legacy"
          ? { attempted: false, solutionExposed: false }
          : {
              problemId: "pages-without-digit-one",
              attempted: true,
              solutionExposed: false,
            };
      const episode =
        kind === "brothers-legacy"
          ? undefined
          : {
              mode: "exploration",
              facts: {
                version: 1,
                problems: [noAnswer("pages-without-digit-one")],
              },
            };
      await persistFinishContributions(
        context,
        session,
        [],
        adaptiveFacts,
        episode,
      );
      const [receipt] = await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(
          and(
            eq(practiceFinishReceipts.learnerId, context.learnerId),
            eq(practiceFinishReceipts.sessionId, session),
          ),
        );
      const historical = episode
        ? {
            contributions: [],
            adaptiveFacts,
            episodeMode: episode.mode,
            episodeFacts: episode.facts,
          }
        : { contributions: [], adaptiveFacts };
      expect(receipt.contributionHash).toBe(
        createHash("sha256").update(JSON.stringify(historical)).digest("hex"),
      );
      await persistFinishContributions(
        context,
        session,
        [],
        adaptiveFacts,
        episode,
      );
      expect(
        await getProgressDb()
          .select()
          .from(practiceAdaptiveTargetUsage)
          .where(eq(practiceAdaptiveTargetUsage.learnerId, context.learnerId)),
      ).toHaveLength(1);
    },
  );
  it("serializes concurrent different-session Finish on one target without rejecting resumed work", async () => {
    const context = await learner();
    const episode = {
      mode: "transfer",
      facts: { version: 1, problems: [noAnswer("brothers-ages-products")] },
    };
    await Promise.all(
      [randomUUID(), randomUUID()].map((session) =>
        persistFinishContributions(context, session, [], undefined, episode, 2),
      ),
    );
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(eq(practiceFinishReceipts.learnerId, context.learnerId)),
    ).toHaveLength(2);
    expect(
      await getProgressDb()
        .select()
        .from(practiceAdaptiveTargetUsage)
        .where(eq(practiceAdaptiveTargetUsage.learnerId, context.learnerId)),
    ).toHaveLength(1);
  });
  it.each(
    ADAPTIVE_RULES.flatMap((rule) =>
      ["skip", "hint-only"].map((finish) => ({ rule, finish })),
    ),
  )(
    "closes $rule.target on $finish Finish, surviving pruning and immutable replay",
    async ({ rule, finish }) => {
      const context = await learner();
      await persistFinishContributions(context, randomUUID(), sources);
      const before = await readLearnerProgress(context);
      const sessionId = randomUUID();
      const episode = {
        mode: rule.purpose === "test-transfer" ? "transfer" : "exploration",
        facts: {
          version: 1,
          problems: [
            {
              ...noAnswer(rule.target),
              skipped: finish === "skip",
              hintLevelsExposed: finish === "hint-only" ? ["focus"] : [],
            },
          ],
        },
      };
      const adaptive = {
        problemId: rule.target,
        attempted: rule.target === "pages-without-digit-one",
        solutionExposed: false,
      };
      await persistFinishContributions(
        context,
        sessionId,
        [],
        adaptive,
        episode,
      );
      const where = and(
        eq(practiceFinishReceipts.learnerId, context.learnerId),
        eq(practiceFinishReceipts.sessionId, sessionId),
      );
      const [receipt] = await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(where);
      expect(
        await getProgressDb()
          .select()
          .from(practiceAdaptiveTargetUsage)
          .where(
            and(
              eq(practiceAdaptiveTargetUsage.learnerId, context.learnerId),
              eq(practiceAdaptiveTargetUsage.problemId, rule.target),
            ),
          ),
      ).toHaveLength(1);
      expect(await readLearnerProgress(context)).toEqual(before);

      await getProgressDb()
        .delete(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, context.learnerId),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        );
      await persistFinishContributions(
        context,
        sessionId,
        [],
        adaptive,
        episode,
      );
      const [after] = await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(where);
      expect(after).toEqual(receipt);
      const result = await readAdaptiveRecommendation(context);
      if (result.availability.status === "recommendation")
        expect(result.availability.problemId).not.toBe(rule.target);
      expect(
        await getProgressDb()
          .select()
          .from(practiceCompletedEpisodes)
          .where(
            and(
              eq(practiceCompletedEpisodes.learnerId, context.learnerId),
              eq(practiceCompletedEpisodes.sessionId, sessionId),
            ),
          ),
      ).toHaveLength(0);
      await expect(
        persistFinishContributions(context, sessionId, [], adaptive, {
          ...episode,
          facts: {
            version: 1,
            problems: [
              {
                ...episode.facts.problems[0],
                hintLevelsExposed:
                  finish === "skip" ? ["focus"] : ["focus", "strategy"],
              },
            ],
          },
        }),
      ).rejects.toThrow("changed after Finish");
    },
  );
  it("does not infer targets or block recommendations from unresolved legacy receipts", async () => {
    const context = await learner();
    await persistFinishContributions(context, randomUUID(), sources);
    const before = await readAdaptiveRecommendation(context);
    for (const episodeMode of [null, "transfer"] as const)
      await getProgressDb()
        .insert(practiceFinishReceipts)
        .values({
          learnerId: context.learnerId,
          sessionId: randomUUID(),
          contributionHash: "0".repeat(64),
          episodeMode,
        });
    expect(await readAdaptiveRecommendation(context)).toEqual(before);
    expect(before.availability).toMatchObject({
      status: "recommendation",
      problemId: "brothers-ages-products",
    });
    expect(Object.keys(before.availability).sort()).toEqual([
      "problemId",
      "reason",
      "status",
    ]);
  });
  it("protocol-compatible rollback pauses adaptive entry without losing Practice history", async () => {
    const context = await learner();
    await persistFinishContributions(context, randomUUID(), sources);
    expect(
      (await readAdaptiveRecommendation(context)).availability.status,
    ).toBe("recommendation");
    vi.stubEnv("ADAPTIVE_RELEASE_MODE", "rollback");
    try {
      expect(await readAdaptiveRecommendation(context)).toEqual({
        availability: { status: "none" },
        hasPracticeHistory: true,
      });
    } finally {
      vi.unstubAllEnvs();
    }
  });
  it("Pack Finish opens exploration without producing capability evidence; Review receipt does not", async () => {
    const context = await learner();
    const before = await readLearnerProgress(context);
    await getProgressDb()
      .insert(practiceFinishReceipts)
      .values({
        learnerId: context.learnerId,
        sessionId: randomUUID(),
        contributionHash: "0".repeat(64),
        episodeMode: "review",
      });
    expect(
      (await readAdaptiveRecommendation(context)).availability.status,
    ).toBe("none");
    await persistFinishContributions(context, randomUUID(), [], undefined, {
      mode: "pack",
      facts: { version: 1, problems: [noAnswer("granddaughters-first")] },
    });
    expect(
      (await readAdaptiveRecommendation(context)).availability,
    ).toMatchObject({
      status: "recommendation",
      problemId: "pages-without-digit-one",
    });
    expect(await readLearnerProgress(context)).toEqual(before);
  });
  it("an identical legacy retry does not annotate a null target or recreate pruned history", async () => {
    const context = await learner();
    const sessionId = randomUUID();
    const adaptive = {
      problemId: "brothers-ages-products",
      attempted: false,
      solutionExposed: false,
    };
    const episode = {
      mode: "transfer",
      facts: { version: 1, problems: [noAnswer(adaptive.problemId)] },
    };
    await persistFinishContributions(context, sessionId, [], adaptive, episode);
    const where = and(
      eq(practiceFinishReceipts.learnerId, context.learnerId),
      eq(practiceFinishReceipts.sessionId, sessionId),
    );
    // Simulate a pre-0014 receipt whose episode was pruned before migration.
    await getProgressDb()
      .delete(practiceAdaptiveTargetUsage)
      .where(eq(practiceAdaptiveTargetUsage.learnerId, context.learnerId));
    await getProgressDb()
      .delete(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, context.learnerId),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    const [before] = await getProgressDb()
      .select()
      .from(practiceFinishReceipts)
      .where(where);
    await persistFinishContributions(context, sessionId, [], adaptive, episode);
    expect(
      await getProgressDb().select().from(practiceFinishReceipts).where(where),
    ).toEqual([before]);
    expect(
      await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, context.learnerId),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        ),
    ).toEqual([]);
  });
});

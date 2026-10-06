import { createHash, randomBytes, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  emptyGuaranteeProgressEvidence,
  type GuaranteeEvidenceContribution,
} from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";
import { emptyEnumerationProgressEvidence } from "../application/enumeration-progress-evidence";
import {
  findOrCreateLearner,
  importLegacyProgress,
  persistFinishContributions,
  readRecentPracticeEpisodes,
  readAdaptiveAvailability,
  readLearnerProgress,
  readNextUsefulProblem,
  readPracticeJourneyTotal,
  readPracticeJourneyFinish,
  readCompletedPackIds,
  startReview,
  readReviewAvailability,
} from "./learner-progress-persistence";
import { getProgressDb } from "./progress-db";
import { validateCompletedEpisode } from "../application/completed-practice-episode";
import {
  learners,
  practiceCompletedEpisodes,
  practiceFinishReceipts,
  practiceJourneyAwards,
  practiceReviewAssignments,
} from "./progress-schema";
import { and, eq } from "drizzle-orm";

const testUrl = process.env.DATABASE_TEST_URL;

beforeAll(() => {
  if (testUrl) process.env.DATABASE_URL = testUrl;
});

const guarantee: GuaranteeEvidenceContribution = {
  problemId: "guaranteed-sock-pair",
  observation: {
    checkpointId: "guaranteed-sock-pair-guarantee-argument",
    selectedOptionId: "A",
    outcome: "correct",
    validSubmissionCountAtSubmit: 1,
  },
  hintLevelsExposedBeforeCheckpoint: [],
  solutionExposedBeforeCheckpoint: false,
};
const impossibility = {
  problemId: "table-impossible-sums" as const,
  observation: {
    checkpointId: "table-impossible-sums-impossibility-argument" as const,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  hintLevelsExposedBeforeCheckpoint: [] as const,
  solutionExposedBeforeCheckpoint: false as const,
};
const transfer = {
  problemId: "brothers-ages-products" as const,
  observation: {
    checkpointId: "brothers-ages-products-youngest-lower-bound" as const,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  hintLevelsExposedBeforeCheckpoint: [] as const,
  solutionExposedBeforeCheckpoint: false as const,
};
const parrots = {
  problemId: "parrots-guaranteed-colors" as const,
  observation: {
    checkpointId: "parrots-guaranteed-colors-guarantee-argument" as const,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  hintLevelsExposedBeforeCheckpoint: [] as const,
  solutionExposedBeforeCheckpoint: false as const,
};
const enumeration = {
  problemId: "pages-without-digit-one" as const,
  observation: {
    checkpointId: "pages-without-digit-one-complete-enumeration" as const,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  hintLevelsExposedBeforeCheckpoint: [] as const,
  solutionExposedBeforeCheckpoint: false as const,
};

const noAnswer = (problemId: string) => ({
  problemId,
  outcome: "no-valid-submissions" as const,
  skipped: false,
  validSubmissionCount: 0,
  hintLevelsExposed: [],
  solutionExposed: false,
  checkpoint: null,
});
const coreEpisode = {
  mode: "core" as const,
  facts: {
    version: 1 as const,
    problems: [
      noAnswer("coinciding-seats"),
      noAnswer("guaranteed-sock-pair"),
      noAnswer("table-impossible-sums"),
    ],
  },
};
const transferEpisode = (
  problemId: "brothers-ages-products" | "parrots-guaranteed-colors",
) => ({
  mode: "transfer" as const,
  facts: { version: 1 as const, problems: [noAnswer(problemId)] },
});

const positiveXpEpisode = {
  ...coreEpisode,
  facts: {
    ...coreEpisode.facts,
    problems: [
      {
        ...noAnswer("coinciding-seats"),
        outcome: "incorrect-only" as const,
        validSubmissionCount: 3,
      },
      {
        ...noAnswer("guaranteed-sock-pair"),
        outcome: "incorrect-only" as const,
        validSubmissionCount: 1,
        hintLevelsExposed: ["focus", "strategy", "next-step"],
        solutionExposed: true,
      },
      noAnswer("table-impossible-sums"),
    ],
  },
};

it("validates the positive XP integration fixture without PostgreSQL", () => {
  expect(
    validateCompletedEpisode(positiveXpEpisode.mode, positiveXpEpisode.facts),
  ).toEqual(positiveXpEpisode.facts);
});

async function learner() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const id = await findOrCreateLearner(tokenHash);
  expect(await findOrCreateLearner(tokenHash)).toBe(id);
  const [row] = await getProgressDb()
    .select()
    .from(learners)
    .where(eq(learners.id, id));
  expect(row.anonymousTokenHash).toBe(tokenHash);
  expect(JSON.stringify(row)).not.toContain(token);
  expect(row.enumerationEvidence).toEqual(emptyEnumerationProgressEvidence());
  return id;
}

describe.skipIf(!testUrl)("PostgreSQL learner Progress", () => {
  it("records zero XP for Skip-only Finish and no reward without an episode", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const withoutEpisode = randomUUID();
    expect(await persistFinishContributions(id, withoutEpisode, [])).toBeNull();
    expect(await readPracticeJourneyTotal(id)).toBe(0);

    const skipped = {
      ...coreEpisode,
      facts: {
        ...coreEpisode.facts,
        problems: coreEpisode.facts.problems.map((problem) => ({
          ...problem,
          skipped: true,
        })),
      },
    };
    const skippedSessionId = randomUUID();
    const result = await persistFinishContributions(
      id,
      skippedSessionId,
      [],
      undefined,
      skipped,
    );
    expect(result).toEqual({
      earnedXp: 0,
      totalXp: 0,
      newlyReachedMilestone: null,
    });
    expect(await readPracticeJourneyFinish(id, skippedSessionId)).toEqual(
      result,
    );
  });

  it("awards Journey XP once in the Finish receipt transaction without changing learning state", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), []);
    const beforeProgress = await readLearnerProgress(id);
    const beforeAvailability = await readAdaptiveAvailability(id);
    const [beforeLearner] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    const sessionId = randomUUID();
    const facts = positiveXpEpisode;
    const first = await persistFinishContributions(
      id,
      sessionId,
      [],
      undefined,
      facts,
    );
    const retry = await persistFinishContributions(
      id,
      sessionId,
      [],
      undefined,
      facts,
    );
    expect(first).toEqual({
      earnedXp: 20,
      totalXp: 20,
      newlyReachedMilestone: "Первый шаг",
    });
    expect(retry).toEqual(first);
    expect(await readPracticeJourneyFinish(id, sessionId)).toEqual(first);
    expect(await readPracticeJourneyTotal(id)).toBe(20);
    expect(await readLearnerProgress(id)).toEqual(beforeProgress);
    expect(await readAdaptiveAvailability(id)).toEqual(beforeAvailability);
    const [afterLearner] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(afterLearner).toMatchObject({
      guaranteeEvidence: beforeLearner.guaranteeEvidence,
      impossibilityEvidence: beforeLearner.impossibilityEvidence,
      enumerationEvidence: beforeLearner.enumerationEvidence,
      brothersAgesAttempted: beforeLearner.brothersAgesAttempted,
      brothersAgesSolutionExposed: beforeLearner.brothersAgesSolutionExposed,
      parrotsAttempted: beforeLearner.parrotsAttempted,
      parrotsSolutionExposed: beforeLearner.parrotsSolutionExposed,
      pagesAttempted: beforeLearner.pagesAttempted,
      pagesSolutionExposed: beforeLearner.pagesSolutionExposed,
    });
    expect(
      await getProgressDb()
        .select()
        .from(practiceJourneyAwards)
        .where(eq(practiceJourneyAwards.learnerId, id)),
    ).toHaveLength(1);
  });

  it("keeps Pack C history under one immutable receipt without capability or adaptive changes", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const beforeProgress = await readLearnerProgress(id);
    const beforeAvailability = (await readAdaptiveAvailability(id))
      .availability;
    const sessionId = randomUUID();
    const pack = {
      mode: "pack" as const,
      facts: {
        version: 1 as const,
        problems: [
          noAnswer("largest-valid-eight-digit"),
          noAnswer("three-numbers-digit-sums"),
          noAnswer("mountain-plain-flights"),
        ],
      },
    };
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    expect(await readLearnerProgress(id)).toEqual(beforeProgress);
    expect((await readAdaptiveAvailability(id)).availability).toEqual(
      beforeAvailability,
    );
    expect((await readRecentPracticeEpisodes(id))[0]).toMatchObject({
      mode: "pack",
      problems: [
        {
          problemTitle: "Самое большое число",
        },
        {
          problemTitle: "Три загадочных числа",
        },
        {
          problemTitle: "Рейсы между городами",
        },
      ],
    });
    const receiptRows = await getProgressDb()
      .select()
      .from(practiceFinishReceipts)
      .where(
        and(
          eq(practiceFinishReceipts.learnerId, id),
          eq(practiceFinishReceipts.sessionId, sessionId),
        ),
      );
    const episodeRows = await getProgressDb()
      .select()
      .from(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    expect(receiptRows).toHaveLength(1);
    expect(receiptRows[0].episodeMode).toBe("pack");
    expect(receiptRows[0].packId).toBe("pack-c");
    expect(await readCompletedPackIds(id)).toEqual(["pack-c"]);
    expect(episodeRows).toHaveLength(1);
    expect(episodeRows[0].episodeFacts).toEqual(pack.facts);
    await expect(
      persistFinishContributions(id, sessionId, [], undefined, {
        ...pack,
        facts: {
          ...pack.facts,
          problems: [
            {
              ...pack.facts.problems[0],
              validSubmissionCount: 1,
              outcome: "incorrect-only" as const,
            },
            ...pack.facts.problems.slice(1),
          ],
        },
      }),
    ).rejects.toThrow("Session contribution changed after Finish.");
    await getProgressDb()
      .delete(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    expect(
      await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        ),
    ).toHaveLength(0);
    expect(await readCompletedPackIds(id)).toEqual(["pack-c"]);
  });
  it("leaves a pre-v1 null Pack receipt unknown even on a matching retry", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const sessionId = randomUUID();
    const pack = {
      mode: "pack" as const,
      facts: {
        version: 1 as const,
        problems: [
          noAnswer("largest-valid-eight-digit"),
          noAnswer("three-numbers-digit-sums"),
          noAnswer("mountain-plain-flights"),
        ],
      },
    };
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    await getProgressDb()
      .update(practiceFinishReceipts)
      .set({ packId: null })
      .where(
        and(
          eq(practiceFinishReceipts.learnerId, id),
          eq(practiceFinishReceipts.sessionId, sessionId),
        ),
      );
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    expect(await readCompletedPackIds(id)).toEqual([]);
    expect(await readCompletedPackIds(await learner())).toEqual([]);
  });
  it.each([null, "core", "transfer", "review"] as const)(
    "rejects non-null Pack identity for mode %s at the SQL boundary",
    async (episodeMode) => {
      const id = await learner();
      await expect(
        getProgressDb().insert(practiceFinishReceipts).values({
          learnerId: id,
          sessionId: randomUUID(),
          contributionHash: "test",
          episodeMode,
          packId: "pack-a",
        }),
      ).rejects.toThrow();
      expect(await readCompletedPackIds(id)).toEqual([]);
    },
  );
  it("serializes concurrent Pack retries and counts repeated sessions once", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const sessionId = randomUUID();
    const pack = {
      mode: "pack" as const,
      facts: {
        version: 1 as const,
        problems: [
          noAnswer("largest-valid-eight-digit"),
          noAnswer("three-numbers-digit-sums"),
          noAnswer("mountain-plain-flights"),
        ],
      },
    };
    await Promise.all([
      persistFinishContributions(id, sessionId, [], undefined, pack),
      persistFinishContributions(id, sessionId, [], undefined, pack),
    ]);
    await persistFinishContributions(id, randomUUID(), [], undefined, pack);
    expect(await readCompletedPackIds(id)).toEqual(["pack-c"]);
    expect(await readCompletedPackIds(await learner())).toEqual([]);
    expect(await readPracticeJourneyTotal(id)).toBe(0);
    for (let index = 0; index < 50; index++)
      await persistFinishContributions(id, randomUUID(), [], undefined, pack);
    expect(
      await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        ),
    ).toEqual([]);
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(
          and(
            eq(practiceFinishReceipts.learnerId, id),
            eq(practiceFinishReceipts.sessionId, sessionId),
          ),
        ),
    ).toHaveLength(1);
    expect(await readCompletedPackIds(id)).toEqual(["pack-c"]);
  });
  it("stores Pack B once in history without changing progress or adaptive availability", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const beforeProgress = await readLearnerProgress(id);
    const beforeAvailability = (await readAdaptiveAvailability(id))
      .availability;
    const sessionId = randomUUID();
    const pack = {
      mode: "pack" as const,
      facts: {
        version: 1 as const,
        problems: [
          noAnswer("truck-car-same-arrival"),
          noAnswer("knights-all-or-none"),
          noAnswer("boastful-fisherman-streak"),
        ],
      },
    };
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    expect(await readLearnerProgress(id)).toEqual(beforeProgress);
    expect((await readAdaptiveAvailability(id)).availability).toEqual(
      beforeAvailability,
    );
    expect((await readAdaptiveAvailability(id)).hasPracticeHistory).toBe(true);
    expect((await readRecentPracticeEpisodes(id))[0]).toMatchObject({
      mode: "pack",
      problems: [
        { problemTitle: "Одновременно в город" },
        { problemTitle: "Рыцари и лжецы" },
        { problemTitle: "Хвастливый рыбак" },
      ],
    });
    const receipts = await getProgressDb()
      .select()
      .from(practiceFinishReceipts)
      .where(
        and(
          eq(practiceFinishReceipts.learnerId, id),
          eq(practiceFinishReceipts.sessionId, sessionId),
        ),
      );
    const episodes = await getProgressDb()
      .select()
      .from(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    expect(receipts).toHaveLength(1);
    expect(receipts[0].episodeMode).toBe("pack");
    expect(receipts[0].packId).toBe("pack-b");
    expect(await readCompletedPackIds(id)).toEqual(["pack-b"]);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].episodeFacts).toEqual(pack.facts);
    await expect(
      persistFinishContributions(id, sessionId, [], undefined, {
        ...pack,
        facts: {
          ...pack.facts,
          problems: [
            {
              ...pack.facts.problems[0],
              validSubmissionCount: 1,
              outcome: "incorrect-only" as const,
            },
            ...pack.facts.problems.slice(1),
          ],
        },
      }),
    ).rejects.toThrow("Session contribution changed after Finish.");
    await getProgressDb()
      .delete(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    expect(
      await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        ),
    ).toHaveLength(0);
  });
  it("stores Pack A atomically under a receipt without capability or adaptive changes", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const beforeProgress = await readLearnerProgress(id);
    const beforeAvailability = await readAdaptiveAvailability(id);
    const sessionId = randomUUID();
    const pack = {
      mode: "pack" as const,
      facts: {
        version: 1 as const,
        problems: [
          noAnswer("granddaughters-first"),
          noAnswer("cutout-area-ratio"),
          noAnswer("domino-placements"),
        ],
      },
    };
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    expect(await readLearnerProgress(id)).toEqual(beforeProgress);
    expect((await readAdaptiveAvailability(id)).availability).toEqual(
      beforeAvailability.availability,
    );
    expect((await readAdaptiveAvailability(id)).hasPracticeHistory).toBe(true);
    expect((await readRecentPracticeEpisodes(id))[0]).toMatchObject({
      mode: "pack",
      problems: [
        { problemTitle: "Кто пришёл первым?" },
        { problemTitle: "Вырезанная фигура" },
        { problemTitle: "Сколько прямоугольников?" },
      ],
    });
    const receipts = await getProgressDb()
      .select()
      .from(practiceFinishReceipts)
      .where(
        and(
          eq(practiceFinishReceipts.learnerId, id),
          eq(practiceFinishReceipts.sessionId, sessionId),
        ),
      );
    const episodes = await getProgressDb()
      .select()
      .from(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    expect(receipts).toHaveLength(1);
    expect(receipts[0].episodeMode).toBe("pack");
    expect(receipts[0].packId).toBe("pack-a");
    expect(await readCompletedPackIds(id)).toEqual(["pack-a"]);
    expect(episodes).toHaveLength(1);
    expect(episodes[0].episodeFacts).toEqual(pack.facts);
    expect(JSON.stringify(episodes[0].episodeFacts)).not.toMatch(
      /answer|draft|solutionId|hintId|hash/i,
    );
    await expect(
      persistFinishContributions(id, sessionId, [], undefined, {
        ...pack,
        facts: {
          ...pack.facts,
          problems: [
            {
              ...pack.facts.problems[0],
              validSubmissionCount: 1,
              outcome: "incorrect-only",
            },
            ...pack.facts.problems.slice(1),
          ],
        },
      }),
    ).rejects.toThrow("Session contribution changed after Finish.");
    await getProgressDb()
      .delete(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    await persistFinishContributions(id, sessionId, [], undefined, pack);
    expect(
      await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        ),
    ).toHaveLength(0);
  });
  it("requires a server Finish before pages and stores an exact completed exploration idempotently", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    expect(await readNextUsefulProblem(id)).toBeNull();
    await persistFinishContributions(
      id,
      randomUUID(),
      [],
      undefined,
      coreEpisode,
    );
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "pages-without-digit-one",
    });
    const sessionId = randomUUID();
    const episode = {
      mode: "exploration" as const,
      facts: {
        version: 1 as const,
        problems: [
          {
            ...noAnswer("pages-without-digit-one"),
            skipped: true,
          },
        ],
      },
    };
    const finish = {
      problemId: "pages-without-digit-one" as const,
      attempted: true,
      solutionExposed: false,
    };
    await persistFinishContributions(id, sessionId, [], finish, episode);
    await persistFinishContributions(id, sessionId, [], finish, episode);
    expect(await readNextUsefulProblem(id)).toBeNull();
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(row.pagesAttempted).toBe(true);
    expect(row.enumerationEvidence).toEqual(emptyEnumerationProgressEvidence());
    expect((await readRecentPracticeEpisodes(id))[0]).toMatchObject({
      mode: "exploration",
      problems: [{ problemTitle: "Страницы без цифры 1", skipped: true }],
    });
    const episodes = await getProgressDb()
      .select()
      .from(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    expect(episodes).toHaveLength(1);
    expect(episodes[0].episodeFacts).toEqual(episode.facts);
    expect(JSON.stringify(episodes[0].episodeFacts)).not.toMatch(
      /Разделить числа|232/,
    );
    await getProgressDb()
      .delete(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, id),
          eq(practiceCompletedEpisodes.sessionId, sessionId),
        ),
      );
    await persistFinishContributions(id, sessionId, [], finish, episode);
    expect(await readNextUsefulProblem(id)).toBeNull();
    expect(
      await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        ),
    ).toHaveLength(0);
    await expect(
      persistFinishContributions(id, sessionId, [], finish, {
        ...episode,
        facts: {
          ...episode.facts,
          problems: [
            {
              ...episode.facts.problems[0],
              hintLevelsExposed: ["focus"] as const,
            },
          ],
        },
      }),
    ).rejects.toThrow("changed after Finish");
  });

  it("persists canonical enumeration evidence and immutable Finish with bounded Progress wording", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(
      id,
      randomUUID(),
      [],
      undefined,
      coreEpisode,
    );
    const sessionId = randomUUID();
    const episode = {
      mode: "exploration" as const,
      facts: {
        version: 1 as const,
        problems: [
          {
            ...noAnswer("pages-without-digit-one"),
            outcome: "eventually-correct" as const,
            validSubmissionCount: 1,
            checkpoint: {
              checkpointId: enumeration.observation.checkpointId,
              outcome: "correct" as const,
            },
          },
        ],
      },
    };
    const finish = {
      problemId: "pages-without-digit-one" as const,
      attempted: true,
      solutionExposed: false,
    };
    const contribution = [{ bucket: "enumeration", value: enumeration }];
    await persistFinishContributions(
      id,
      sessionId,
      contribution,
      finish,
      episode,
    );
    await persistFinishContributions(
      id,
      sessionId,
      contribution,
      finish,
      episode,
    );
    expect((await readLearnerProgress(id))[2]).toMatchObject({
      learnerLabel: "Проверять все возможные случаи",
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Без подсказок ты верно выбрал способ перебора, в котором каждый подходящий случай учитывается ровно один раз. Пока это показывает распознавание полного перебора, а не умение самостоятельно строить такой разбор в новой задаче.",
    });
    expect(await readNextUsefulProblem(id)).toBeNull();
    await expect(
      persistFinishContributions(
        id,
        sessionId,
        [
          {
            bucket: "enumeration",
            value: {
              ...enumeration,
              hintLevelsExposedBeforeCheckpoint: ["focus"],
            },
          },
        ],
        finish,
        episode,
      ),
    ).rejects.toThrow("changed after Finish");
    await expect(
      persistFinishContributions(
        id,
        randomUUID(),
        [
          {
            bucket: "enumeration",
            value: {
              ...enumeration,
              observation: {
                ...enumeration.observation,
                selectedOptionId: "B",
              },
            },
          },
        ],
        finish,
        episode,
      ),
    ).rejects.toThrow("Invalid Practice contribution");
  });

  it("records pages solution exposure without positive evidence and suppresses repeats", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(
      id,
      randomUUID(),
      [],
      undefined,
      coreEpisode,
    );
    const episode = {
      mode: "exploration" as const,
      facts: {
        version: 1 as const,
        problems: [
          {
            ...noAnswer("pages-without-digit-one"),
            outcome: "incorrect-only" as const,
            validSubmissionCount: 1,
            hintLevelsExposed: ["focus", "strategy", "next-step"] as const,
            solutionExposed: true,
          },
        ],
      },
    };
    await persistFinishContributions(
      id,
      randomUUID(),
      [],
      {
        problemId: "pages-without-digit-one",
        attempted: true,
        solutionExposed: true,
      },
      episode,
    );
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(row.pagesAttempted).toBe(true);
    expect(row.pagesSolutionExposed).toBe(true);
    expect(row.enumerationEvidence).toEqual(emptyEnumerationProgressEvidence());
    expect((await readLearnerProgress(id))[2].progressGroup).toBeNull();
    expect(await readNextUsefulProblem(id)).toBeNull();
  });

  it.each(["hinted-correct", "incorrect-only"] as const)(
    "keeps %s pages checkpoint interpretation bounded",
    async (caseName) => {
      const id = await learner();
      await importLegacyProgress(id, null);
      await persistFinishContributions(
        id,
        randomUUID(),
        [],
        undefined,
        coreEpisode,
      );
      const correct = caseName === "hinted-correct";
      const observation = correct
        ? enumeration.observation
        : {
            ...enumeration.observation,
            selectedOptionId: "B" as const,
            outcome: "incorrect" as const,
          };
      const episode = {
        mode: "exploration" as const,
        facts: {
          version: 1 as const,
          problems: [
            {
              ...noAnswer("pages-without-digit-one"),
              outcome: "eventually-correct" as const,
              validSubmissionCount: 1,
              hintLevelsExposed: ["focus"] as const,
              checkpoint: {
                checkpointId: observation.checkpointId,
                outcome: observation.outcome,
              },
            },
          ],
        },
      };
      await persistFinishContributions(
        id,
        randomUUID(),
        [
          {
            bucket: "enumeration",
            value: {
              ...enumeration,
              observation,
              hintLevelsExposedBeforeCheckpoint: ["focus"],
            },
          },
        ],
        {
          problemId: "pages-without-digit-one",
          attempted: true,
          solutionExposed: false,
        },
        episode,
      );
      expect((await readLearnerProgress(id))[2]).toMatchObject(
        correct
          ? {
              progressGroup: "Начинаю разбираться",
              conclusion:
                "После подсказок ты верно выбрал способ, который не пропускает подходящие случаи и не считает их дважды. Самостоятельное построение полного перебора пока не проверено.",
            }
          : {
              progressGroup: null,
              conclusion:
                "Проверенного выбора способа полного перебора пока нет.",
            },
      );
      expect(await readNextUsefulProblem(id)).toBeNull();
    },
  );
  it("writes a core episode with its receipt, keeps first completion time on retry, and rejects changed facts", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const sessionId = randomUUID();
    await persistFinishContributions(id, sessionId, [], undefined, coreEpisode);
    const [first] = await getProgressDb()
      .select()
      .from(practiceCompletedEpisodes)
      .where(eq(practiceCompletedEpisodes.learnerId, id));
    expect(first.episodeFacts).toEqual(coreEpisode.facts);
    expect(
      (await readRecentPracticeEpisodes(id))[0].problems.map(
        (problem) => problem.problemTitle,
      ),
    ).toEqual(["Совпадающие места", "Носки в пакете", "Невозможные суммы"]);
    await persistFinishContributions(id, sessionId, [], undefined, coreEpisode);
    const rows = await getProgressDb()
      .select()
      .from(practiceCompletedEpisodes)
      .where(eq(practiceCompletedEpisodes.learnerId, id));
    expect(rows).toHaveLength(1);
    expect(rows[0].completedAt).toEqual(first.completedAt);
    await expect(
      persistFinishContributions(id, sessionId, [], undefined, {
        ...coreEpisode,
        facts: {
          ...coreEpisode.facts,
          problems: [
            { ...coreEpisode.facts.problems[0], skipped: true },
            ...coreEpisode.facts.problems.slice(1),
          ],
        },
      }),
    ).rejects.toThrow("changed after Finish");
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(eq(practiceFinishReceipts.learnerId, id)),
    ).toHaveLength(1);
  });

  it.each(["brothers-ages-products", "parrots-guaranteed-colors"] as const)(
    "persists current %s transfer identity without making history evidence",
    async (problemId) => {
      const id = await learner();
      await importLegacyProgress(id, null);
      await persistFinishContributions(
        id,
        randomUUID(),
        [],
        {
          problemId,
          attempted: false,
          solutionExposed: false,
        },
        transferEpisode(problemId),
      );
      expect((await readRecentPracticeEpisodes(id))[0]).toMatchObject({
        mode: "transfer",
        problems: [
          {
            problemTitle:
              problemId === "brothers-ages-products"
                ? "Возраст братьев"
                : "Попугаи в зоопарке",
          },
        ],
      });
      const [row] = await getProgressDb()
        .select()
        .from(learners)
        .where(eq(learners.id, id));
      expect(row.guaranteeEvidence).toEqual(emptyGuaranteeProgressEvidence());
      expect(row.impossibilityEvidence).toEqual(
        emptyImpossibilityProgressEvidence(),
      );
    },
  );

  it("rolls back evidence when episode insertion conflicts, without writing a receipt", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const sessionId = randomUUID();
    await getProgressDb().insert(practiceCompletedEpisodes).values({
      learnerId: id,
      sessionId,
      mode: "core",
      episodeFacts: coreEpisode.facts,
    });
    const before = (
      await getProgressDb().select().from(learners).where(eq(learners.id, id))
    )[0];
    const episode = {
      ...coreEpisode,
      facts: {
        ...coreEpisode.facts,
        problems: [
          coreEpisode.facts.problems[0],
          {
            ...coreEpisode.facts.problems[1],
            outcome: "eventually-correct" as const,
            validSubmissionCount: 1,
            checkpoint: {
              checkpointId: guarantee.observation.checkpointId,
              outcome: "correct" as const,
            },
          },
          coreEpisode.facts.problems[2],
        ],
      },
    };
    await expect(
      persistFinishContributions(
        id,
        sessionId,
        [{ bucket: "guarantee", value: guarantee }],
        undefined,
        episode,
      ),
    ).rejects.toThrow();
    const after = (
      await getProgressDb().select().from(learners).where(eq(learners.id, id))
    )[0];
    expect(after.guaranteeEvidence).toEqual(before.guaranteeEvidence);
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(eq(practiceFinishReceipts.learnerId, id)),
    ).toHaveLength(0);
  });

  it.each([1, 50, 53])(
    "retains newest 50 of %s episodes with deterministic ties and authoritative receipts",
    async (count) => {
      const id = await learner();
      await importLegacyProgress(id, null);
      const otherId = await learner();
      await importLegacyProgress(otherId, null);
      await persistFinishContributions(
        otherId,
        randomUUID(),
        [],
        undefined,
        coreEpisode,
      );
      const episodeFor = (index: number) => ({
        ...coreEpisode,
        facts: {
          ...coreEpisode.facts,
          problems: [
            {
              ...coreEpisode.facts.problems[0],
              outcome: "incorrect-only" as const,
              validSubmissionCount: index,
            },
            ...coreEpisode.facts.problems.slice(1),
          ],
        },
      });
      const sessionIds: string[] = [];
      for (let index = 1; index <= count; index++) {
        const sessionId =
          "00000000-0000-4000-8000-" + String(index).padStart(12, "0");
        sessionIds.push(sessionId);
        await persistFinishContributions(
          id,
          sessionId,
          [],
          undefined,
          episodeFor(index),
        );
        await getProgressDb()
          .update(practiceCompletedEpisodes)
          .set({ completedAt: new Date("2020-01-01T00:00:00.000Z") })
          .where(eq(practiceCompletedEpisodes.learnerId, id));
      }
      const expected = sessionIds.slice(-50).sort();
      const readRows = () =>
        getProgressDb()
          .select()
          .from(practiceCompletedEpisodes)
          .where(eq(practiceCompletedEpisodes.learnerId, id));
      const before = await readRows();
      expect(before.map((row) => row.sessionId).sort()).toEqual(expected);
      expect(
        await getProgressDb()
          .select()
          .from(practiceFinishReceipts)
          .where(eq(practiceFinishReceipts.learnerId, id)),
      ).toHaveLength(count);
      const newestCounts = Array.from(
        { length: Math.min(count, 10) },
        (_, index) => count - index,
      );
      expect(
        (await readRecentPracticeEpisodes(id)).map(
          (episode) => episode.problems[0].validSubmissionCount,
        ),
      ).toEqual(newestCounts);
      // For 53 episodes this receipt's episode was pruned. The receipt still wins.
      await persistFinishContributions(
        id,
        sessionIds[0],
        [],
        undefined,
        episodeFor(1),
      );
      expect(
        (await readRows()).sort((a, b) =>
          a.sessionId.localeCompare(b.sessionId),
        ),
      ).toEqual(before.sort((a, b) => a.sessionId.localeCompare(b.sessionId)));
      expect(
        await getProgressDb()
          .select()
          .from(practiceFinishReceipts)
          .where(eq(practiceFinishReceipts.learnerId, id)),
      ).toHaveLength(count);
      expect(await readRecentPracticeEpisodes(otherId)).toHaveLength(1);
      // Completion time takes precedence over the session-ID tie breaker.
      const oldestRetained = Math.max(1, count - 49);
      await getProgressDb()
        .update(practiceCompletedEpisodes)
        .set({ completedAt: new Date("2021-01-01T00:00:00.000Z") })
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(
              practiceCompletedEpisodes.sessionId,
              sessionIds[oldestRetained - 1],
            ),
          ),
        );
      expect(
        (await readRecentPracticeEpisodes(id)).map(
          (episode) => episode.problems[0].validSubmissionCount,
        ),
      ).toEqual(
        [
          oldestRetained,
          ...newestCounts.filter((value) => value !== oldestRetained),
        ].slice(0, 10),
      );
    },
  );

  it("accepts legacy Finish semantics without history and rejects corrupt stored facts on read", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const legacyId = randomUUID();
    await persistFinishContributions(id, legacyId, []);
    await persistFinishContributions(id, legacyId, []);
    expect(await readRecentPracticeEpisodes(id)).toEqual([]);
    const sessionId = randomUUID();
    await persistFinishContributions(id, sessionId, [], undefined, coreEpisode);
    await getProgressDb()
      .update(practiceCompletedEpisodes)
      .set({ episodeFacts: { version: 1, problems: [] } })
      .where(eq(practiceCompletedEpisodes.sessionId, sessionId));
    await expect(readRecentPracticeEpisodes(id)).rejects.toThrow(
      "could not be verified",
    );
  });
  it("uses a Finish receipt for history even without checkpoint evidence", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    expect(await readAdaptiveAvailability(id)).toEqual({
      availability: { status: "insufficient-evidence" },
      hasPracticeHistory: false,
    });
    await persistFinishContributions(id, randomUUID(), []);
    expect(await readAdaptiveAvailability(id)).toMatchObject({
      availability: {
        status: "recommendation",
        problemId: "pages-without-digit-one",
      },
      hasPracticeHistory: true,
    });
  });

  it("keeps I-08 first when both sources qualify, then offers parrots when brothers is attempted", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "guarantee", value: guarantee },
      { bucket: "impossibility", value: impossibility },
    ]);
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "brothers-ages-products",
    });
    expect(await readAdaptiveAvailability(id)).toMatchObject({
      availability: {
        status: "recommendation",
        problemId: "brothers-ages-products",
      },
      hasPracticeHistory: true,
    });
    await persistFinishContributions(id, randomUUID(), [], {
      problemId: "brothers-ages-products",
      attempted: true,
      solutionExposed: false,
    });
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "parrots-guaranteed-colors",
      reason: expect.stringContaining("Раньше ты уже"),
    });
  });

  it("reports exhaustion only after both transfer targets are attempted", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [], {
      problemId: "brothers-ages-products",
      attempted: true,
      solutionExposed: false,
    });
    expect(await readAdaptiveAvailability(id)).toMatchObject({
      availability: {
        status: "recommendation",
        problemId: "pages-without-digit-one",
      },
      hasPracticeHistory: true,
    });
    await persistFinishContributions(id, randomUUID(), [], {
      problemId: "parrots-guaranteed-colors",
      attempted: true,
      solutionExposed: false,
    });
    expect(await readAdaptiveAvailability(id)).toMatchObject({
      availability: {
        status: "recommendation",
        problemId: "pages-without-digit-one",
      },
      hasPracticeHistory: true,
    });
  });

  it.each([
    [true, "Уже получается", "В прошлой задаче"],
    [false, "Получается в разных задачах", "Раньше ты уже"],
  ] as const)(
    "persists parrots transfer with %s hinted frozen sock basis",
    async (hinted, group, reasonStart) => {
      const id = await learner();
      await importLegacyProgress(id, null);
      await persistFinishContributions(id, randomUUID(), [
        {
          bucket: "guarantee",
          value: {
            ...guarantee,
            hintLevelsExposedBeforeCheckpoint: hinted ? ["focus"] : [],
          },
        },
      ]);
      expect(await readNextUsefulProblem(id)).toMatchObject({
        problemId: "parrots-guaranteed-colors",
        reason: expect.stringContaining(reasonStart),
      });
      const sessionId = randomUUID();
      const contributions = [{ bucket: "guarantee", value: parrots }];
      const facts = {
        problemId: "parrots-guaranteed-colors",
        attempted: true,
        solutionExposed: false,
      };
      await persistFinishContributions(id, sessionId, contributions, facts);
      await persistFinishContributions(id, sessionId, contributions, facts);
      expect((await readLearnerProgress(id))[0].progressGroup).toBe(group);
      expect(await readNextUsefulProblem(id)).toMatchObject({
        problemId: "pages-without-digit-one",
      });
      await persistFinishContributions(id, randomUUID(), [
        {
          bucket: "guarantee",
          value: {
            ...guarantee,
            hintLevelsExposedBeforeCheckpoint: hinted ? [] : ["focus"],
          },
        },
      ]);
      const [row] = await getProgressDb()
        .select()
        .from(learners)
        .where(eq(learners.id, id));
      expect(row.guaranteeEvidence).toMatchObject({
        version: 2,
        nextSequence: 4,
        sockBasisForParrotsWithoutHints: {
          sequence: 1,
          hintLevelsExposedBeforeCheckpoint: hinted ? ["focus"] : [],
        },
      });
      expect(row.parrotsAttempted).toBe(true);
      expect((await readLearnerProgress(id))[0].progressGroup).toBe(group);
      expect(
        await getProgressDb()
          .select()
          .from(practiceFinishReceipts)
          .where(eq(practiceFinishReceipts.learnerId, id)),
      ).toHaveLength(3);
      await expect(
        persistFinishContributions(
          id,
          sessionId,
          [
            {
              bucket: "guarantee",
              value: {
                ...parrots,
                hintLevelsExposedBeforeCheckpoint: ["focus"],
              },
            },
          ],
          facts,
        ),
      ).rejects.toThrow("changed after Finish");
      await expect(
        persistFinishContributions(id, sessionId, contributions, {
          ...facts,
          problemId: "brothers-ages-products",
        }),
      ).rejects.toThrow("Unexpected adaptive contribution");
    },
  );

  it("records parrots attempt and solution exposure without a checkpoint", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "guarantee", value: guarantee },
    ]);
    const sessionId = randomUUID();
    const facts = {
      problemId: "parrots-guaranteed-colors",
      attempted: true,
      solutionExposed: false,
    };
    await persistFinishContributions(id, sessionId, [], facts);
    await persistFinishContributions(id, sessionId, [], facts);
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "pages-without-digit-one",
    });
    expect((await readLearnerProgress(id))[0].progressGroup).toBe(
      "Начинаю разбираться",
    );
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(row.parrotsAttempted).toBe(true);
    expect(row.guaranteeEvidence).toMatchObject({
      version: 1,
      nextSequence: 2,
    });
    await expect(
      persistFinishContributions(id, sessionId, [], {
        ...facts,
        solutionExposed: true,
      }),
    ).rejects.toThrow("changed after Finish");
    const exposureId = randomUUID();
    await persistFinishContributions(id, exposureId, [], {
      ...facts,
      solutionExposed: true,
    });
    const [exposed] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(exposed.parrotsSolutionExposed).toBe(true);
  });

  it("suppresses on later sock incorrect and restores after a new verified correct", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "guarantee", value: guarantee },
    ]);
    await persistFinishContributions(id, randomUUID(), [
      {
        bucket: "guarantee",
        value: {
          ...guarantee,
          observation: {
            ...guarantee.observation,
            selectedOptionId: "B",
            outcome: "incorrect",
          },
        },
      },
    ]);
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "pages-without-digit-one",
    });
    expect((await readLearnerProgress(id))[0].progressGroup).toBe(
      "Начинаю разбираться",
    );
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "guarantee", value: guarantee },
    ]);
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "parrots-guaranteed-colors",
    });
  });

  it("reverifies a frozen sock basis after its live slot changes", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "guarantee", value: guarantee },
    ]);
    await persistFinishContributions(
      id,
      randomUUID(),
      [{ bucket: "guarantee", value: parrots }],
      {
        problemId: "parrots-guaranteed-colors",
        attempted: true,
        solutionExposed: false,
      },
    );
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "guarantee", value: guarantee },
    ]);
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    const evidence = row.guaranteeEvidence as {
      sockBasisForParrotsWithoutHints: {
        observation: { selectedOptionId: string };
      };
    };
    await getProgressDb()
      .update(learners)
      .set({
        guaranteeEvidence: {
          ...evidence,
          sockBasisForParrotsWithoutHints: {
            ...evidence.sockBasisForParrotsWithoutHints,
            observation: {
              ...evidence.sockBasisForParrotsWithoutHints.observation,
              selectedOptionId: "B",
            },
          },
        },
      })
      .where(eq(learners.id, id));
    await expect(readLearnerProgress(id)).rejects.toThrow(
      "could not be verified",
    );
  });
  it.each([
    {
      priorHinted: true,
      laterHinted: false,
      group: "Уже получается",
    },
    {
      priorHinted: false,
      laterHinted: true,
      group: "Получается в разных задачах",
    },
  ] as const)(
    "keeps a verified transfer basis across later I-08 work and identical Finish retry ($group)",
    async ({ priorHinted, laterHinted, group }) => {
      const id = await learner();
      await importLegacyProgress(id, null);
      await persistFinishContributions(id, randomUUID(), [
        {
          bucket: "impossibility",
          value: {
            ...impossibility,
            hintLevelsExposedBeforeCheckpoint: priorHinted
              ? (["focus"] as const)
              : ([] as const),
          },
        },
      ]);
      const transferSessionId = randomUUID();
      const transferContributions = [
        { bucket: "impossibility" as const, value: transfer },
      ];
      const adaptiveFacts = { attempted: true, solutionExposed: false };
      await persistFinishContributions(
        id,
        transferSessionId,
        transferContributions,
        adaptiveFacts,
      );
      await persistFinishContributions(
        id,
        transferSessionId,
        transferContributions,
        adaptiveFacts,
      );
      expect((await readLearnerProgress(id))[1].progressGroup).toBe(group);
      await persistFinishContributions(id, randomUUID(), [
        {
          bucket: "impossibility",
          value: {
            ...impossibility,
            hintLevelsExposedBeforeCheckpoint: laterHinted
              ? (["focus"] as const)
              : ([] as const),
          },
        },
      ]);
      const [row] = await getProgressDb()
        .select()
        .from(learners)
        .where(eq(learners.id, id));
      expect(row.impossibilityEvidence).toMatchObject({
        version: 2,
        nextSequence: 4,
        tableBasisForBrothersWithoutHints: {
          sequence: 1,
          observation: impossibility.observation,
          hintLevelsExposedBeforeCheckpoint: priorHinted ? ["focus"] : [],
        },
      });
      expect((await readLearnerProgress(id))[1].progressGroup).toBe(group);
      expect(
        await getProgressDb()
          .select()
          .from(practiceFinishReceipts)
          .where(eq(practiceFinishReceipts.learnerId, id)),
      ).toHaveLength(3);
    },
  );

  it("canonically reverifies a captured I-08 basis after its live slot is replaced", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "impossibility", value: impossibility },
    ]);
    await persistFinishContributions(
      id,
      randomUUID(),
      [{ bucket: "impossibility", value: transfer }],
      { attempted: true, solutionExposed: false },
    );
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "impossibility", value: impossibility },
    ]);
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    const evidence = row.impossibilityEvidence as {
      tableBasisForBrothersWithoutHints: {
        observation: { selectedOptionId: string };
      };
    };
    await getProgressDb()
      .update(learners)
      .set({
        impossibilityEvidence: {
          ...evidence,
          tableBasisForBrothersWithoutHints: {
            ...evidence.tableBasisForBrothersWithoutHints,
            observation: {
              ...evidence.tableBasisForBrothersWithoutHints.observation,
              selectedOptionId: "B",
            },
          },
        },
      })
      .where(eq(learners.id, id));
    await expect(readLearnerProgress(id)).rejects.toThrow(
      "could not be verified",
    );
    await expect(readNextUsefulProblem(id)).rejects.toThrow(
      "could not be verified",
    );
  });

  it("derives an eligible transfer from verified I-08, migrates its bucket, and receipts an immutable adaptive Finish", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "impossibility", value: impossibility },
    ]);
    expect((await readNextUsefulProblem(id))?.reason).toContain(
      "Раньше ты уже",
    );
    const sessionId = randomUUID();
    const contributions = [{ bucket: "impossibility", value: transfer }];
    const facts = { attempted: true, solutionExposed: false };
    await persistFinishContributions(id, sessionId, contributions, facts);
    await persistFinishContributions(id, sessionId, contributions, facts);
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "pages-without-digit-one",
    });
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(row.brothersAgesAttempted).toBe(true);
    expect(row.brothersAgesSolutionExposed).toBe(false);
    expect(row.impossibilityEvidence).toMatchObject({
      version: 2,
      nextSequence: 3,
    });
    expect((await readLearnerProgress(id))[1].progressGroup).toBe(
      "Получается в разных задачах",
    );
    await expect(
      persistFinishContributions(
        id,
        sessionId,
        [
          {
            bucket: "impossibility",
            value: {
              ...transfer,
              hintLevelsExposedBeforeCheckpoint: ["focus"],
            },
          },
        ],
        facts,
      ),
    ).rejects.toThrow("changed after Finish");
  });

  it("records an adaptive attempt without checkpoint and never treats it as positive evidence", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "impossibility", value: impossibility },
    ]);
    const sessionId = randomUUID();
    await persistFinishContributions(id, sessionId, [], {
      attempted: true,
      solutionExposed: false,
    });
    await persistFinishContributions(id, sessionId, [], {
      attempted: true,
      solutionExposed: false,
    });
    await expect(
      persistFinishContributions(id, sessionId, [], {
        attempted: false,
        solutionExposed: false,
      }),
    ).rejects.toThrow("changed after Finish");
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "pages-without-digit-one",
    });
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(row.impossibilityEvidence).toMatchObject({
      version: 1,
      nextSequence: 2,
    });
    expect((await readLearnerProgress(id))[1].progressGroup).toBe(
      "Начинаю разбираться",
    );
  });

  it("records solution exposure without transfer evidence and serializes concurrent transfer sequences", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await persistFinishContributions(id, randomUUID(), [
      { bucket: "impossibility", value: impossibility },
    ]);
    const exposureSession = randomUUID();
    await persistFinishContributions(id, exposureSession, [], {
      attempted: true,
      solutionExposed: true,
    });
    expect(await readNextUsefulProblem(id)).toMatchObject({
      problemId: "pages-without-digit-one",
    });
    const first = randomUUID();
    const second = randomUUID();
    await Promise.all([
      persistFinishContributions(
        id,
        first,
        [{ bucket: "impossibility", value: transfer }],
        { attempted: true, solutionExposed: false },
      ),
      persistFinishContributions(
        id,
        second,
        [{ bucket: "impossibility", value: transfer }],
        { attempted: true, solutionExposed: false },
      ),
    ]);
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(row.impossibilityEvidence).toMatchObject({
      version: 2,
      nextSequence: 4,
      brothers: { latestCorrectWithoutHints: { sequence: 3 } },
    });
    expect(row.brothersAgesSolutionExposed).toBe(true);
  });
  it("imports guarantee-only v1, retries the same bytes and rejects different bytes", async () => {
    const id = await learner();
    const raw = JSON.stringify({
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 2,
      latestCorrectWithoutHints: { sequence: 1, ...guarantee },
    });
    await importLegacyProgress(id, raw);
    await importLegacyProgress(id, raw);
    await importLegacyProgress(id, null);
    await expect(
      importLegacyProgress(
        id,
        JSON.stringify(emptyGuaranteeProgressEvidence()),
      ),
    ).rejects.toThrow("changed after import");
    const [first, second] = await readLearnerProgress(id);
    expect(first.progressGroup).toBe("Начинаю разбираться");
    expect(second.progressGroup).toBeNull();
  });

  it("imports two buckets and rejects malformed or canonically false evidence without replacing it", async () => {
    const id = await learner();
    const valid = JSON.stringify({
      version: 2,
      guarantee: emptyGuaranteeProgressEvidence(),
      impossibility: {
        ...emptyImpossibilityProgressEvidence(),
        nextSequence: 2,
        latestCorrectWithoutHints: { sequence: 1, ...impossibility },
      },
    });
    await expect(importLegacyProgress(id, "{malformed")).rejects.toThrow();
    await expect(
      importLegacyProgress(
        id,
        valid.replace('"selectedOptionId":"A"', '"selectedOptionId":"B"'),
      ),
    ).rejects.toThrow("could not be verified");
    await importLegacyProgress(id, valid);
    expect((await readLearnerProgress(id))[1].progressGroup).toBe(
      "Начинаю разбираться",
    );
  });

  it("serializes concurrent Finish, coexists across buckets and makes retries idempotent", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const firstSession = randomUUID();
    const secondSession = randomUUID();
    await Promise.all([
      persistFinishContributions(id, firstSession, [
        { bucket: "guarantee", value: guarantee },
      ]),
      persistFinishContributions(id, secondSession, [
        { bucket: "guarantee", value: guarantee },
        { bucket: "impossibility", value: impossibility },
      ]),
    ]);
    await persistFinishContributions(id, firstSession, [
      { bucket: "guarantee", value: guarantee },
    ]);
    await persistFinishContributions(id, firstSession, [
      {
        value: {
          solutionExposedBeforeCheckpoint: false,
          hintLevelsExposedBeforeCheckpoint: [],
          observation: {
            outcome: "correct",
            selectedOptionId: "A",
            validSubmissionCountAtSubmit: 1,
            checkpointId: "guaranteed-sock-pair-guarantee-argument",
          },
          problemId: "guaranteed-sock-pair",
        },
        bucket: "guarantee",
      },
    ]);
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    const guaranteeBucket = row.guaranteeEvidence as ReturnType<
      typeof emptyGuaranteeProgressEvidence
    >;
    const impossibilityBucket = row.impossibilityEvidence as ReturnType<
      typeof emptyImpossibilityProgressEvidence
    >;
    expect(guaranteeBucket.nextSequence).toBe(3);
    expect(impossibilityBucket.nextSequence).toBe(2);
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(eq(practiceFinishReceipts.learnerId, id)),
    ).toHaveLength(2);
    const changed = {
      ...guarantee,
      hintLevelsExposedBeforeCheckpoint: ["focus"],
    };
    await expect(
      persistFinishContributions(id, firstSession, [
        { bucket: "guarantee", value: changed },
      ]),
    ).rejects.toThrow("changed after Finish");
    const interpretations = await readLearnerProgress(id);
    expect(interpretations.map((item) => item.progressGroup)).toEqual([
      "Начинаю разбираться",
      "Начинаю разбираться",
      null,
    ]);
    expect(JSON.stringify(interpretations)).not.toContain("selectedOptionId");
    expect(JSON.stringify(interpretations)).not.toContain("nextSequence");
    expect(JSON.stringify(interpretations)).not.toContain("capability");
  });

  it("recovers a committed Finish when its response is lost", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const sessionId = randomUUID();
    const contribution = [{ bucket: "guarantee", value: guarantee }];
    await expect(
      (async () => {
        await persistFinishContributions(id, sessionId, contribution);
        throw new Error("Response lost");
      })(),
    ).rejects.toThrow("Response lost");
    await persistFinishContributions(id, sessionId, contribution);
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(
      (
        row.guaranteeEvidence as ReturnType<
          typeof emptyGuaranteeProgressEvidence
        >
      ).nextSequence,
    ).toBe(2);
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(eq(practiceFinishReceipts.learnerId, id)),
    ).toHaveLength(1);
  });

  it("persists both checkpoint buckets once for one Finish request and its retry", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const sessionId = randomUUID();
    const contributions = [
      { bucket: "guarantee", value: guarantee },
      { bucket: "impossibility", value: impossibility },
    ];

    await persistFinishContributions(id, sessionId, contributions);
    await persistFinishContributions(id, sessionId, contributions);

    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    const guaranteeBucket = row.guaranteeEvidence as ReturnType<
      typeof emptyGuaranteeProgressEvidence
    >;
    const impossibilityBucket = row.impossibilityEvidence as ReturnType<
      typeof emptyImpossibilityProgressEvidence
    >;
    expect(guaranteeBucket.nextSequence).toBe(2);
    expect(impossibilityBucket.nextSequence).toBe(2);
    expect(guaranteeBucket.latestCorrectWithoutHints?.sequence).toBe(1);
    expect(impossibilityBucket.latestCorrectWithoutHints?.sequence).toBe(1);
    expect(
      await getProgressDb()
        .select()
        .from(practiceFinishReceipts)
        .where(eq(practiceFinishReceipts.learnerId, id)),
    ).toHaveLength(1);
  });

  it("fails closed when stored JSONB is structurally invalid", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    await getProgressDb()
      .update(learners)
      .set({ guaranteeEvidence: { version: 99 } })
      .where(eq(learners.id, id));
    await expect(readLearnerProgress(id)).rejects.toThrow(
      "could not be verified",
    );
    await expect(readNextUsefulProblem(id)).rejects.toThrow(
      "could not be verified",
    );
  });

  it("rejects sparse contribution arrays before allocating a receipt", async () => {
    const id = await learner();
    await importLegacyProgress(id, null);
    const sparse = new Array(1);
    await expect(
      persistFinishContributions(id, randomUUID(), sparse),
    ).rejects.toThrow("Invalid Practice contribution");
    const [row] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, id));
    expect(
      (
        row.guaranteeEvidence as ReturnType<
          typeof emptyGuaranteeProgressEvidence
        >
      ).nextSequence,
    ).toBe(1);
  });
});

const eligibleCoreEpisode = {
  mode: "core" as const,
  facts: {
    version: 1 as const,
    problems: [
      {
        ...noAnswer("coinciding-seats"),
        outcome: "eventually-correct" as const,
        validSubmissionCount: 1,
      },
      noAnswer("guaranteed-sock-pair"),
      noAnswer("table-impossible-sums"),
    ],
  },
};
const reviewEpisode = {
  mode: "review" as const,
  facts: {
    version: 1 as const,
    problems: [
      {
        ...noAnswer("coinciding-seats"),
        outcome: "incorrect-only" as const,
        validSubmissionCount: 1,
      },
    ],
  },
};

it("validates eligible source and Review integration fixtures without PostgreSQL", () => {
  expect(
    validateCompletedEpisode("core", eligibleCoreEpisode.facts),
  ).not.toBeNull();
  expect(
    validateCompletedEpisode("review", reviewEpisode.facts),
  ).not.toBeNull();
});

describe.skipIf(!testUrl)(
  "PostgreSQL Review ownership and atomic integrity",
  () => {
    it("chooses newest eligible unreviewed source with deterministic ties and serializes starts/Finish", async () => {
      const id = await learner();
      await importLegacyProgress(id, null);
      const ids = [randomUUID(), randomUUID()].sort();
      for (const sessionId of ids)
        await persistFinishContributions(
          id,
          sessionId,
          [],
          undefined,
          eligibleCoreEpisode,
        );
      await getProgressDb()
        .update(practiceCompletedEpisodes)
        .set({ completedAt: new Date("2026-10-01T00:00:00Z") })
        .where(eq(practiceCompletedEpisodes.learnerId, id));
      const beforeProgress = await readLearnerProgress(id);
      const beforeAdaptive = await readAdaptiveAvailability(id);
      const beforeXp = await readPracticeJourneyTotal(id);
      const starts = await Promise.all([startReview(id), startReview(id)]);
      expect(starts[0]).toBe(starts[1]);
      expect(starts[0]).not.toBeNull();
      const sessionId = starts[0]!;
      const [assignment] = await getProgressDb()
        .select()
        .from(practiceReviewAssignments)
        .where(
          and(
            eq(practiceReviewAssignments.learnerId, id),
            eq(practiceReviewAssignments.sessionId, sessionId),
          ),
        );
      expect(assignment.reviewSourceSessionId).toBe(ids[1]);
      await expect(
        persistFinishContributions(
          id,
          sessionId,
          [],
          undefined,
          eligibleCoreEpisode,
        ),
      ).rejects.toThrow("assignment");
      await expect(
        persistFinishContributions(id, sessionId, []),
      ).rejects.toThrow("assignment");
      await expect(
        persistFinishContributions(
          id,
          sessionId,
          [{ bucket: "guarantee", value: guarantee }],
          undefined,
          reviewEpisode,
        ),
      ).rejects.toThrow();
      await expect(
        persistFinishContributions(
          id,
          sessionId,
          [],
          {
            problemId: "brothers-ages-products",
            attempted: true,
            solutionExposed: false,
          },
          reviewEpisode,
        ),
      ).rejects.toThrow();
      await expect(
        persistFinishContributions(id, sessionId, [], undefined, {
          ...reviewEpisode,
          reviewSourceSessionId: ids[0],
        }),
      ).rejects.toThrow();
      const foreignId = await learner();
      await importLegacyProgress(foreignId, null);
      await expect(
        persistFinishContributions(
          foreignId,
          sessionId,
          [],
          undefined,
          reviewEpisode,
        ),
      ).rejects.toThrow("assignment");
      const finishes = await Promise.all([
        persistFinishContributions(id, sessionId, [], undefined, reviewEpisode),
        persistFinishContributions(id, sessionId, [], undefined, reviewEpisode),
      ]);
      expect(finishes[0]).toEqual(finishes[1]);
      expect(await readPracticeJourneyTotal(id)).toBe(
        beforeXp + finishes[0]!.earnedXp,
      );
      expect(await readLearnerProgress(id)).toEqual(beforeProgress);
      expect(await readAdaptiveAvailability(id)).toEqual(beforeAdaptive);
      const [completed] = await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(practiceCompletedEpisodes.sessionId, sessionId),
          ),
        );
      expect(completed.mode).toBe("review");
      expect(completed.reviewSourceSessionId).toBe(ids[1]);
      const next = await startReview(id);
      expect(next).not.toBe(sessionId);
      const skipped = {
        mode: "review",
        facts: {
          version: 1,
          problems: [{ ...noAnswer("coinciding-seats"), skipped: true }],
        },
      };
      await persistFinishContributions(id, next, [], undefined, skipped);
      expect(await readReviewAvailability(id)).toBe(false);
      expect(await startReview(id)).toBeNull();
      await expect(
        persistFinishContributions(id, sessionId, [], undefined, skipped),
      ).rejects.toThrow("changed");
      expect(
        (await readRecentPracticeEpisodes(id)).filter(
          (e) => e.mode === "review",
        ),
      ).toHaveLength(2);
    });

    it("ignores newer ineligible and foreign episodes, retains source across history pruning", async () => {
      const id = await learner();
      await importLegacyProgress(id, null);
      expect(await startReview(id)).toBeNull();
      await persistFinishContributions(
        id,
        randomUUID(),
        [],
        undefined,
        coreEpisode,
      );
      const exposed = {
        ...eligibleCoreEpisode,
        facts: {
          ...eligibleCoreEpisode.facts,
          problems: [
            {
              ...eligibleCoreEpisode.facts.problems[0],
              hintLevelsExposed: ["focus", "strategy", "next-step"],
              solutionExposed: true,
            },
            ...eligibleCoreEpisode.facts.problems.slice(1),
          ],
        },
      };
      await persistFinishContributions(
        id,
        randomUUID(),
        [],
        undefined,
        exposed,
      );
      expect(await readReviewAvailability(id)).toBe(false);
      const foreign = await learner();
      await importLegacyProgress(foreign, null);
      await persistFinishContributions(
        foreign,
        randomUUID(),
        [],
        undefined,
        eligibleCoreEpisode,
      );
      expect(await startReview(id)).toBeNull();
      const source = randomUUID();
      await persistFinishContributions(
        id,
        source,
        [],
        undefined,
        eligibleCoreEpisode,
      );
      const sessionId = await startReview(id);
      for (let n = 0; n < 51; n++)
        await persistFinishContributions(
          id,
          randomUUID(),
          [],
          undefined,
          coreEpisode,
        );
      expect(await startReview(id)).toBe(sessionId);
      await persistFinishContributions(
        id,
        sessionId,
        [],
        undefined,
        reviewEpisode,
      );
      const [row] = await getProgressDb()
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, id),
            eq(practiceCompletedEpisodes.sessionId, source),
          ),
        );
      expect(row).toBeDefined();
      expect(await startReview(id)).toBeNull();
    });
  },
);

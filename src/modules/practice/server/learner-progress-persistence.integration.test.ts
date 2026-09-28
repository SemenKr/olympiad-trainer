import { createHash, randomBytes, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  emptyGuaranteeProgressEvidence,
  type GuaranteeEvidenceContribution,
} from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";
import {
  findOrCreateLearner,
  importLegacyProgress,
  persistFinishContributions,
  readRecentPracticeEpisodes,
  readAdaptiveAvailability,
  readLearnerProgress,
  readNextUsefulProblem,
} from "./learner-progress-persistence";
import { getProgressDb } from "./progress-db";
import {
  learners,
  practiceCompletedEpisodes,
  practiceFinishReceipts,
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
  return id;
}

describe.skipIf(!testUrl)("PostgreSQL learner Progress", () => {
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
    expect(await readAdaptiveAvailability(id)).toEqual({
      availability: { status: "insufficient-evidence" },
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
    expect(await readAdaptiveAvailability(id)).toEqual({
      availability: { status: "insufficient-evidence" },
      hasPracticeHistory: true,
    });
    await persistFinishContributions(id, randomUUID(), [], {
      problemId: "parrots-guaranteed-colors",
      attempted: true,
      solutionExposed: false,
    });
    expect(await readAdaptiveAvailability(id)).toEqual({
      availability: { status: "transfer-exhausted" },
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
      expect(await readNextUsefulProblem(id)).toBeNull();
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
    expect(await readNextUsefulProblem(id)).toBeNull();
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
    expect(await readNextUsefulProblem(id)).toBeNull();
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
    expect(await readNextUsefulProblem(id)).toBeNull();
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
    expect(await readNextUsefulProblem(id)).toBeNull();
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
    expect(await readNextUsefulProblem(id)).toBeNull();
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

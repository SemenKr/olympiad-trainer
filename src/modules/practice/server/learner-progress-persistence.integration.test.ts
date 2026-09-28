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
  readAdaptiveAvailability,
  readLearnerProgress,
  readNextUsefulProblem,
} from "./learner-progress-persistence";
import { getProgressDb } from "./progress-db";
import { learners, practiceFinishReceipts } from "./progress-schema";
import { eq } from "drizzle-orm";

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

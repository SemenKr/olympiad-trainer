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
  readLearnerProgress,
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

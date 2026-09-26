import "server-only";

import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";

import {
  deriveGuaranteeProgressInterpretation,
  emptyGuaranteeProgressEvidence,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceContribution,
  type GuaranteeEvidenceFact,
} from "../application/guarantee-progress-evidence";
import {
  deriveImpossibilityProgressInterpretation,
  emptyImpossibilityProgressEvidence,
  validateImpossibilityProgressEvidence,
  type ImpossibilityEvidenceContribution,
  type ImpossibilityEvidenceFact,
} from "../application/impossibility-progress-evidence";
import {
  appendPracticeProgressEvidence,
  progressEvidenceBuckets,
  validatePracticeProgressEvidence,
  type PracticeProgressContribution,
} from "../application/practice-progress-evidence";
import type { LearnerProgressInterpretation } from "../application/reasoning-checkpoint";
import { assessReasoningCheckpointOption } from "./problem-catalog";
import { getProgressDb } from "./progress-db";
import { learners, practiceFinishReceipts } from "./progress-schema";

const NO_LOCAL_EVIDENCE = "no-browser-progress-evidence-v1";
const SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function facts(
  guarantee: ReturnType<typeof emptyGuaranteeProgressEvidence>,
  impossibility: ReturnType<typeof emptyImpossibilityProgressEvidence>,
): readonly (GuaranteeEvidenceFact | ImpossibilityEvidenceFact)[] {
  return [
    guarantee.latestCorrectWithoutHints,
    guarantee.latestCorrectWithHints,
    guarantee.latestIncorrect,
    impossibility.latestCorrectWithoutHints,
    impossibility.latestCorrectWithHints,
    impossibility.latestIncorrect,
  ].filter(
    (fact): fact is GuaranteeEvidenceFact | ImpossibilityEvidenceFact =>
      fact !== null,
  );
}

function canonicalFactsAreValid(
  values: readonly (GuaranteeEvidenceFact | ImpossibilityEvidenceFact)[],
) {
  return values.every((fact) => {
    try {
      return (
        assessReasoningCheckpointOption(
          fact.problemId,
          fact.observation.checkpointId,
          fact.observation.selectedOptionId,
        ).outcome === fact.observation.outcome
      );
    } catch {
      return false;
    }
  });
}

function validatedBuckets(
  guaranteeValue: unknown,
  impossibilityValue: unknown,
) {
  const guarantee = validateGuaranteeProgressEvidence(guaranteeValue);
  const impossibility =
    validateImpossibilityProgressEvidence(impossibilityValue);
  if (
    !guarantee ||
    !impossibility ||
    !canonicalFactsAreValid(facts(guarantee, impossibility))
  )
    throw new Error("Progress evidence could not be verified.");
  return { guarantee, impossibility };
}

export async function findOrCreateLearner(anonymousTokenHash: string) {
  const db = getProgressDb();
  const [row] = await db
    .insert(learners)
    .values({
      anonymousTokenHash,
      guaranteeEvidence: emptyGuaranteeProgressEvidence(),
      impossibilityEvidence: emptyImpossibilityProgressEvidence(),
    })
    .onConflictDoUpdate({
      target: learners.anonymousTokenHash,
      set: { anonymousTokenHash },
    })
    .returning({ id: learners.id });
  return row.id;
}

export async function importLegacyProgress(
  learnerId: string,
  raw: unknown,
): Promise<void> {
  if (!(raw === null || (typeof raw === "string" && raw.length <= 32768)))
    throw new Error("Invalid legacy Progress data.");
  const originalHash = hash(raw ?? NO_LOCAL_EVIDENCE);
  const parsed: unknown = raw === null ? null : JSON.parse(raw);
  const evidence =
    raw === null ? null : validatePracticeProgressEvidence(parsed);
  if (raw !== null && !evidence)
    throw new Error("Invalid legacy Progress data.");
  const incoming = evidence
    ? progressEvidenceBuckets(evidence)
    : {
        guarantee: emptyGuaranteeProgressEvidence(),
        impossibility: emptyImpossibilityProgressEvidence(),
      };
  const buckets = validatedBuckets(incoming.guarantee, incoming.impossibility);

  await getProgressDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(learners)
      .where(eq(learners.id, learnerId))
      .for("update");
    if (!row) throw new Error("Learner identity is unavailable.");
    if (row.legacyImportHash !== null) {
      if (raw === null || row.legacyImportHash === originalHash) return;
      throw new Error("Legacy Progress data changed after import.");
    }
    await tx
      .update(learners)
      .set({
        guaranteeEvidence: buckets.guarantee,
        impossibilityEvidence: buckets.impossibility,
        legacyImportHash: originalHash,
        updatedAt: new Date(),
      })
      .where(eq(learners.id, learnerId));
  });
}

function validateContribution(
  value: unknown,
): PracticeProgressContribution | null {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return null;
  const candidate = value as Record<string, unknown>;
  if (
    Object.keys(candidate).length !== 2 ||
    !Object.hasOwn(candidate, "bucket") ||
    !Object.hasOwn(candidate, "value")
  )
    return null;
  if (candidate.bucket !== "guarantee" && candidate.bucket !== "impossibility")
    return null;
  const base =
    candidate.bucket === "guarantee"
      ? emptyGuaranteeProgressEvidence()
      : emptyImpossibilityProgressEvidence();
  const entry = candidate.value;
  if (typeof entry !== "object" || entry === null || Array.isArray(entry))
    return null;
  const typed = entry as Record<string, unknown>;
  if (
    Object.keys(typed).length !== 4 ||
    !Object.hasOwn(typed, "problemId") ||
    !Object.hasOwn(typed, "observation") ||
    !Object.hasOwn(typed, "hintLevelsExposedBeforeCheckpoint") ||
    !Object.hasOwn(typed, "solutionExposedBeforeCheckpoint")
  )
    return null;
  const fact = { sequence: 1, ...typed };
  const snapshot = {
    ...base,
    nextSequence: 2,
    latestCorrectWithoutHints: null,
    latestCorrectWithHints: null,
    latestIncorrect: null,
  };
  const observation = typed.observation;
  if (
    typeof observation !== "object" ||
    observation === null ||
    Array.isArray(observation)
  )
    return null;
  const outcome = (observation as Record<string, unknown>).outcome;
  const hints = typed.hintLevelsExposedBeforeCheckpoint;
  if (
    !Array.isArray(hints) ||
    Array.from(hints.keys()).some((index) => !Object.hasOwn(hints, index))
  )
    return null;
  const slot =
    outcome === "incorrect"
      ? "latestIncorrect"
      : hints.length === 0
        ? "latestCorrectWithoutHints"
        : "latestCorrectWithHints";
  const checked =
    candidate.bucket === "guarantee"
      ? validateGuaranteeProgressEvidence({ ...snapshot, [slot]: fact })
      : validateImpossibilityProgressEvidence({ ...snapshot, [slot]: fact });
  if (
    !checked ||
    !canonicalFactsAreValid(
      facts(
        candidate.bucket === "guarantee"
          ? (checked as ReturnType<typeof emptyGuaranteeProgressEvidence>)
          : emptyGuaranteeProgressEvidence(),
        candidate.bucket === "impossibility"
          ? (checked as ReturnType<typeof emptyImpossibilityProgressEvidence>)
          : emptyImpossibilityProgressEvidence(),
      ),
    )
  )
    return null;
  const verified = checked[slot];
  if (!verified) return null;
  const normalized = {
    problemId: verified.problemId,
    observation: {
      checkpointId: verified.observation.checkpointId,
      selectedOptionId: verified.observation.selectedOptionId,
      outcome: verified.observation.outcome,
      validSubmissionCountAtSubmit:
        verified.observation.validSubmissionCountAtSubmit,
    },
    hintLevelsExposedBeforeCheckpoint: [
      ...verified.hintLevelsExposedBeforeCheckpoint,
    ],
    solutionExposedBeforeCheckpoint: false as const,
  };
  return candidate.bucket === "guarantee"
    ? {
        bucket: "guarantee",
        value: normalized as GuaranteeEvidenceContribution,
      }
    : {
        bucket: "impossibility",
        value: normalized as ImpossibilityEvidenceContribution,
      };
}

export async function persistFinishContributions(
  learnerId: string,
  sessionId: unknown,
  input: unknown,
): Promise<void> {
  if (
    typeof sessionId !== "string" ||
    !SESSION_ID.test(sessionId) ||
    !Array.isArray(input) ||
    input.length < 1 ||
    input.length > 2 ||
    Array.from(input.keys()).some((index) => !Object.hasOwn(input, index))
  )
    throw new Error("Invalid Practice contribution.");
  const contributions = input.map(validateContribution);
  if (contributions.some((value) => value === null))
    throw new Error("Invalid Practice contribution.");
  const values = contributions as PracticeProgressContribution[];
  if (new Set(values.map((value) => value.bucket)).size !== values.length)
    throw new Error("Duplicate Practice contribution.");
  const ordered = ["guarantee", "impossibility"].flatMap((bucket) =>
    values.filter((value) => value.bucket === bucket),
  );
  const contributionHash = hash(JSON.stringify(ordered));
  await getProgressDb().transaction(async (tx) => {
    const [learner] = await tx
      .select()
      .from(learners)
      .where(eq(learners.id, learnerId))
      .for("update");
    if (!learner || learner.legacyImportHash === null)
      throw new Error("Legacy Progress import is required.");
    const [receipt] = await tx
      .select()
      .from(practiceFinishReceipts)
      .where(
        and(
          eq(practiceFinishReceipts.learnerId, learnerId),
          eq(practiceFinishReceipts.sessionId, sessionId),
        ),
      );
    if (receipt) {
      if (receipt.contributionHash !== contributionHash)
        throw new Error("Session contribution changed after Finish.");
      return;
    }
    let current = {
      version: 2 as const,
      ...validatedBuckets(
        learner.guaranteeEvidence,
        learner.impossibilityEvidence,
      ),
    };
    for (const contribution of ordered) {
      const next = appendPracticeProgressEvidence(current, contribution);
      if (!next || next.version !== 2)
        throw new Error("Progress sequence exhausted.");
      current = next;
    }
    await tx
      .update(learners)
      .set({
        guaranteeEvidence: current.guarantee,
        impossibilityEvidence: current.impossibility,
        updatedAt: new Date(),
      })
      .where(eq(learners.id, learnerId));
    await tx
      .insert(practiceFinishReceipts)
      .values({ learnerId, sessionId, contributionHash });
  });
}

export async function readLearnerProgress(
  learnerId: string,
): Promise<
  readonly [LearnerProgressInterpretation, LearnerProgressInterpretation]
> {
  const [row] = await getProgressDb()
    .select()
    .from(learners)
    .where(eq(learners.id, learnerId));
  if (!row || row.legacyImportHash === null)
    throw new Error("Legacy Progress import is required.");
  const { guarantee, impossibility } = validatedBuckets(
    row.guaranteeEvidence,
    row.impossibilityEvidence,
  );
  const first = deriveGuaranteeProgressInterpretation(guarantee);
  const second = deriveImpossibilityProgressInterpretation(impossibility);
  return [
    {
      learnerLabel: first.learnerLabel,
      progressGroup: first.progressGroup,
      conclusion: first.conclusion,
    },
    {
      learnerLabel: second.learnerLabel,
      progressGroup: second.progressGroup,
      conclusion: second.conclusion,
    },
  ];
}

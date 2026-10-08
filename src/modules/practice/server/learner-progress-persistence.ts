import "server-only";

import { isEligibleReviewSource } from "../application/review";
import { randomUUID, createHash } from "node:crypto";
import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";
import {
  packById,
  packIdFromCompletedProblemIds,
  validateCompletedEpisode,
  type CompletedPracticeEpisodeFactsV1,
  type CompletedPracticeEpisodeMode,
  type PackId,
} from "../application/completed-practice-episode";
import {
  classifyAdaptiveAvailability,
  type AdaptiveAvailability,
} from "../application/adaptive-availability";
import {
  deriveEnumerationProgressInterpretation,
  emptyEnumerationProgressEvidence,
  enumerationFacts,
  validateEnumerationProgressEvidence,
  type EnumerationEvidenceContribution,
  type EnumerationEvidenceFact,
  type EnumerationProgressEvidence,
} from "../application/enumeration-progress-evidence";
import {
  deriveGuaranteeProgressInterpretation,
  emptyGuaranteeProgressEvidence,
  guaranteeFacts,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceContribution,
  type GuaranteeEvidenceFact,
} from "../application/guarantee-progress-evidence";
import {
  deriveImpossibilityProgressInterpretation,
  emptyImpossibilityProgressEvidence,
  impossibilityFacts,
  validateImpossibilityProgressEvidence,
  type ImpossibilityEvidenceContribution,
  type ImpossibilityEvidenceFact,
  type ImpossibilityProgressEvidence,
} from "../application/impossibility-progress-evidence";
import {
  appendPracticeProgressEvidence,
  progressEvidenceBuckets,
  validatePracticeProgressEvidence,
  type PracticeProgressContribution,
} from "../application/practice-progress-evidence";
import type { LearnerProgressInterpretation } from "../application/reasoning-checkpoint";
import {
  calculatePracticeJourneyFinish,
  type PracticeJourneyFinish,
} from "../application/practice-journey";
import {
  assessReasoningCheckpointOption,
  getProblemDefinition,
} from "./problem-catalog";
import {
  withAuthenticatedLearner,
  type AuthenticatedLearner,
} from "./learner-auth";
import {
  learners,
  practiceCompletedEpisodes,
  practiceFinishReceipts,
  practiceJourneyAwards,
  practiceReviewAssignments,
} from "./progress-schema";

const NO_LOCAL_EVIDENCE = "no-browser-progress-evidence-v1";
const SESSION_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function facts(
  guarantee: NonNullable<ReturnType<typeof validateGuaranteeProgressEvidence>>,
  impossibility: ImpossibilityProgressEvidence,
  enumeration: EnumerationProgressEvidence,
): readonly (
  GuaranteeEvidenceFact | ImpossibilityEvidenceFact | EnumerationEvidenceFact
)[] {
  return [
    ...guaranteeFacts(guarantee),
    ...impossibilityFacts(impossibility),
    ...enumerationFacts(enumeration),
  ].filter(
    (
      fact,
    ): fact is
      | GuaranteeEvidenceFact
      | ImpossibilityEvidenceFact
      | EnumerationEvidenceFact => fact !== null,
  );
}

function canonicalFactsAreValid(
  values: readonly (
    GuaranteeEvidenceFact | ImpossibilityEvidenceFact | EnumerationEvidenceFact
  )[],
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
  enumerationValue: unknown,
) {
  const guarantee = validateGuaranteeProgressEvidence(guaranteeValue);
  const impossibility =
    validateImpossibilityProgressEvidence(impossibilityValue);
  const enumeration = validateEnumerationProgressEvidence(enumerationValue);
  if (
    !guarantee ||
    !impossibility ||
    !enumeration ||
    !canonicalFactsAreValid(facts(guarantee, impossibility, enumeration))
  )
    throw new Error("Progress evidence could not be verified.");
  return { guarantee, impossibility, enumeration };
}

export async function importLegacyProgress(
  context: AuthenticatedLearner,
  raw: unknown,
): Promise<void> {
  const learnerId = context.learnerId;
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
        enumeration: emptyEnumerationProgressEvidence(),
      };
  const buckets = validatedBuckets(
    incoming.guarantee,
    incoming.impossibility,
    incoming.enumeration,
  );

  await withAuthenticatedLearner(context, async (tx, row) => {
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
        enumerationEvidence: buckets.enumeration,
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
  if (
    candidate.bucket !== "guarantee" &&
    candidate.bucket !== "impossibility" &&
    candidate.bucket !== "enumeration"
  )
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
  if (candidate.bucket === "enumeration") {
    const checked = validateEnumerationProgressEvidence({
      ...emptyEnumerationProgressEvidence(),
      nextSequence: 2,
      [slot]: fact,
    });
    const verified = checked?.[slot];
    if (!verified || !canonicalFactsAreValid([verified])) return null;
    return {
      bucket: "enumeration",
      value: {
        problemId: verified.problemId,
        observation: { ...verified.observation },
        hintLevelsExposedBeforeCheckpoint: [
          ...verified.hintLevelsExposedBeforeCheckpoint,
        ],
        solutionExposedBeforeCheckpoint: false,
      } as EnumerationEvidenceContribution,
    };
  }
  const checked =
    candidate.bucket === "guarantee"
      ? validateGuaranteeProgressEvidence(
          typed.problemId === "parrots-guaranteed-colors"
            ? {
                version: 2,
                nextSequence: 2,
                sock: {
                  latestCorrectWithoutHints: null,
                  latestCorrectWithHints: null,
                  latestIncorrect: null,
                },
                parrots: {
                  latestCorrectWithoutHints: null,
                  latestCorrectWithHints: null,
                  latestIncorrect: null,
                  [slot]: fact,
                },
                sockBasisForParrotsWithoutHints: null,
              }
            : { ...snapshot, [slot]: fact },
        )
      : validateImpossibilityProgressEvidence(
          typed.problemId === "brothers-ages-products"
            ? {
                version: 2,
                nextSequence: 2,
                table: {
                  latestCorrectWithoutHints: null,
                  latestCorrectWithHints: null,
                  latestIncorrect: null,
                },
                brothers: {
                  latestCorrectWithoutHints: null,
                  latestCorrectWithHints: null,
                  latestIncorrect: null,
                  [slot]: fact,
                },
                tableBasisForBrothersWithoutHints: null,
              }
            : { ...snapshot, [slot]: fact },
        );
  if (
    !checked ||
    !canonicalFactsAreValid(
      facts(
        candidate.bucket === "guarantee"
          ? (checked as NonNullable<
              ReturnType<typeof validateGuaranteeProgressEvidence>
            >)
          : emptyGuaranteeProgressEvidence(),
        candidate.bucket === "impossibility"
          ? (checked as ImpossibilityProgressEvidence)
          : emptyImpossibilityProgressEvidence(),
        emptyEnumerationProgressEvidence(),
      ),
    )
  )
    return null;
  const verified =
    checked.version === 2
      ? "parrots" in checked
        ? checked.parrots[slot]
        : checked.brothers[slot]
      : checked[slot];
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

export type AdaptiveTransferFinishFacts = Readonly<{
  problemId:
    | "brothers-ages-products"
    | "parrots-guaranteed-colors"
    | "pages-without-digit-one";
  attempted: boolean;
  solutionExposed: boolean;
}>;

type LegacyAdaptiveTransferFinishFacts = Omit<
  AdaptiveTransferFinishFacts,
  "problemId"
>;

function validAdaptiveFinishFacts(
  value: unknown,
): value is AdaptiveTransferFinishFacts | LegacyAdaptiveTransferFinishFacts {
  const candidate = value as AdaptiveTransferFinishFacts;
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (Object.keys(value).length === 2 || Object.keys(value).length === 3) &&
    (Object.keys(value).length === 2 ||
      (Object.hasOwn(value, "problemId") &&
        (candidate.problemId === "brothers-ages-products" ||
          candidate.problemId === "parrots-guaranteed-colors" ||
          candidate.problemId === "pages-without-digit-one"))) &&
    Object.hasOwn(value, "attempted") &&
    Object.hasOwn(value, "solutionExposed") &&
    typeof candidate.attempted === "boolean" &&
    typeof candidate.solutionExposed === "boolean" &&
    (!candidate.solutionExposed || candidate.attempted)
  );
}

export async function persistFinishContributions(
  context: AuthenticatedLearner,
  sessionId: unknown,
  input: unknown,
  adaptiveFacts?: unknown,
  episode?: unknown,
): Promise<PracticeJourneyFinish | null> {
  const learnerId = context.learnerId;
  if (
    typeof sessionId !== "string" ||
    !SESSION_ID.test(sessionId) ||
    !Array.isArray(input) ||
    input.length > 2 ||
    Array.from(input.keys()).some((index) => !Object.hasOwn(input, index))
  )
    throw new Error("Invalid Practice contribution.");
  if (adaptiveFacts !== undefined && !validAdaptiveFinishFacts(adaptiveFacts))
    throw new Error("Invalid adaptive Finish facts.");
  const adaptiveProblemId =
    adaptiveFacts === undefined
      ? null
      : "problemId" in (adaptiveFacts as AdaptiveTransferFinishFacts)
        ? (adaptiveFacts as AdaptiveTransferFinishFacts).problemId
        : "brothers-ages-products";
  if (
    adaptiveProblemId === "pages-without-digit-one" &&
    (episode === undefined ||
      !(adaptiveFacts as AdaptiveTransferFinishFacts).attempted)
  )
    throw new Error("Enumeration Finish requires completed attempt facts.");
  const contributions = input.map(validateContribution);
  if (contributions.some((value) => value === null))
    throw new Error("Invalid Practice contribution.");
  const values = contributions as PracticeProgressContribution[];
  if (new Set(values.map((value) => value.bucket)).size !== values.length)
    throw new Error("Duplicate Practice contribution.");
  if (
    adaptiveFacts === undefined &&
    values.some(
      (value) =>
        value.value.problemId === "brothers-ages-products" ||
        value.value.problemId === "parrots-guaranteed-colors" ||
        value.value.problemId === "pages-without-digit-one",
    )
  )
    throw new Error("Adaptive Finish facts are required.");
  if (
    adaptiveFacts !== undefined &&
    values.some((value) => value.value.problemId !== adaptiveProblemId)
  )
    throw new Error("Unexpected adaptive contribution.");
  if (
    adaptiveFacts !== undefined &&
    values.length > 0 &&
    (!(adaptiveFacts as AdaptiveTransferFinishFacts).attempted ||
      (adaptiveFacts as AdaptiveTransferFinishFacts).solutionExposed)
  )
    throw new Error("Adaptive contribution conflicts with Finish facts.");
  const ordered = ["guarantee", "impossibility", "enumeration"].flatMap(
    (bucket) => values.filter((value) => value.bucket === bucket),
  );
  let completedEpisode: null | Readonly<{
    mode: CompletedPracticeEpisodeMode;
    facts: CompletedPracticeEpisodeFactsV1;
  }> = null;
  if (episode !== undefined) {
    if (
      typeof episode !== "object" ||
      episode === null ||
      Array.isArray(episode) ||
      Object.keys(episode).length !== 2 ||
      !Object.hasOwn(episode, "mode") ||
      !Object.hasOwn(episode, "facts")
    )
      throw new Error("Invalid completed Practice episode.");
    const candidate = episode as { mode?: unknown; facts?: unknown };
    const checked = validateCompletedEpisode(candidate.mode, candidate.facts);
    if (
      !checked ||
      (candidate.mode === "transfer" || candidate.mode === "exploration") !==
        (adaptiveFacts !== undefined) ||
      ((candidate.mode === "pack" || candidate.mode === "review") &&
        ordered.length !== 0) ||
      ((candidate.mode === "transfer" || candidate.mode === "exploration") &&
        candidate.mode !==
          (adaptiveProblemId === "pages-without-digit-one"
            ? "exploration"
            : "transfer")) ||
      ((candidate.mode === "transfer" || candidate.mode === "exploration") &&
        (checked.problems[0].problemId !== adaptiveProblemId ||
          (adaptiveProblemId === "pages-without-digit-one" ||
            checked.problems[0].validSubmissionCount > 0) !==
            (adaptiveFacts as AdaptiveTransferFinishFacts).attempted ||
          checked.problems[0].solutionExposed !==
            (adaptiveFacts as AdaptiveTransferFinishFacts).solutionExposed))
    )
      throw new Error("Invalid completed Practice episode.");
    for (const fact of checked.problems) {
      const contribution = ordered.find(
        (item) => item.value.problemId === fact.problemId,
      );
      const checkpoint = contribution?.value.observation ?? null;
      if (
        JSON.stringify(fact.checkpoint) !==
        JSON.stringify(
          checkpoint && {
            checkpointId: checkpoint.checkpointId,
            outcome: checkpoint.outcome,
          },
        )
      )
        throw new Error("Completed checkpoint conflicts with Finish evidence.");
    }
    completedEpisode = {
      mode: candidate.mode as CompletedPracticeEpisodeMode,
      facts: checked,
    };
  }
  const completedPackId =
    completedEpisode?.mode === "pack"
      ? packIdFromCompletedProblemIds(
          completedEpisode.facts.problems.map((problem) => problem.problemId),
        )
      : null;
  if (completedEpisode?.mode === "pack" && !completedPackId)
    throw new Error("Completed Pack identity could not be verified.");

  const contributionHash = hash(
    JSON.stringify(
      completedEpisode
        ? {
            contributions: ordered,
            ...(adaptiveFacts === undefined ? {} : { adaptiveFacts }),
            episodeMode: completedEpisode.mode,
            episodeFacts: completedEpisode.facts,
          }
        : adaptiveFacts === undefined
          ? ordered
          : { contributions: ordered, adaptiveFacts },
    ),
  );
  return withAuthenticatedLearner(context, async (tx, learner) => {
    if (!learner || learner.legacyImportHash === null)
      throw new Error("Legacy Progress import is required.");
    const [assignment] = await tx
      .select()
      .from(practiceReviewAssignments)
      .where(
        and(
          eq(practiceReviewAssignments.learnerId, learnerId),
          eq(practiceReviewAssignments.sessionId, sessionId),
        ),
      );
    if ((completedEpisode?.mode === "review") !== !!assignment)
      throw new Error("Review assignment does not match Finish.");
    if (assignment) {
      const [source] = await tx
        .select()
        .from(practiceCompletedEpisodes)
        .where(
          and(
            eq(practiceCompletedEpisodes.learnerId, learnerId),
            eq(
              practiceCompletedEpisodes.sessionId,
              assignment.reviewSourceSessionId,
            ),
          ),
        );
      if (!source || !isEligibleReviewSource(source.mode, source.episodeFacts))
        throw new Error("Review source is unavailable.");
    }
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
      const [award] = await tx
        .select({
          earnedXp: practiceJourneyAwards.earnedXp,
          totalXp: practiceJourneyAwards.totalXp,
          newlyReachedMilestone: practiceJourneyAwards.newlyReachedMilestone,
        })
        .from(practiceJourneyAwards)
        .where(
          and(
            eq(practiceJourneyAwards.learnerId, learnerId),
            eq(practiceJourneyAwards.sessionId, sessionId),
          ),
        );
      return award ?? null;
    }
    let current = {
      version: 3 as const,
      ...validatedBuckets(
        learner.guaranteeEvidence,
        learner.impossibilityEvidence,
        learner.enumerationEvidence,
      ),
    };
    for (const contribution of ordered) {
      const next = appendPracticeProgressEvidence(current, contribution);
      if (!next || !("guarantee" in next))
        throw new Error("Progress sequence exhausted.");
      current = { version: 3, ...progressEvidenceBuckets(next) };
    }
    await tx
      .update(learners)
      .set({
        guaranteeEvidence: current.guarantee,
        impossibilityEvidence: current.impossibility,
        enumerationEvidence: current.enumeration,
        ...(adaptiveFacts === undefined
          ? {}
          : adaptiveProblemId === "brothers-ages-products"
            ? {
                brothersAgesAttempted:
                  learner.brothersAgesAttempted ||
                  (adaptiveFacts as AdaptiveTransferFinishFacts).attempted,
                brothersAgesSolutionExposed:
                  learner.brothersAgesSolutionExposed ||
                  (adaptiveFacts as AdaptiveTransferFinishFacts)
                    .solutionExposed,
              }
            : adaptiveProblemId === "parrots-guaranteed-colors"
              ? {
                  parrotsAttempted:
                    learner.parrotsAttempted ||
                    (adaptiveFacts as AdaptiveTransferFinishFacts).attempted,
                  parrotsSolutionExposed:
                    learner.parrotsSolutionExposed ||
                    (adaptiveFacts as AdaptiveTransferFinishFacts)
                      .solutionExposed,
                }
              : {
                  pagesAttempted:
                    learner.pagesAttempted ||
                    (adaptiveFacts as AdaptiveTransferFinishFacts).attempted,
                  pagesSolutionExposed:
                    learner.pagesSolutionExposed ||
                    (adaptiveFacts as AdaptiveTransferFinishFacts)
                      .solutionExposed,
                }),
        updatedAt: new Date(),
      })
      .where(eq(learners.id, learnerId));
    if (completedEpisode) {
      await tx.insert(practiceCompletedEpisodes).values({
        learnerId,
        sessionId,
        mode: completedEpisode.mode,
        episodeFacts: completedEpisode.facts,
        reviewSourceSessionId: assignment?.reviewSourceSessionId ?? null,
      });
      await tx.execute(sql`DELETE FROM practice_completed_episodes
        WHERE learner_id = ${learnerId}
        AND NOT (mode = 'core' AND episode_facts->'problems'->0->>'outcome' = 'eventually-correct'
          AND episode_facts->'problems'->0->>'solutionExposed' = 'false')
        AND session_id NOT IN (SELECT review_source_session_id FROM practice_review_assignments WHERE learner_id = ${learnerId})
        AND session_id IN (
          SELECT session_id FROM practice_completed_episodes
          WHERE learner_id = ${learnerId}
          ORDER BY completed_at DESC, session_id DESC OFFSET 50
        )`);
    }
    let journeyFinish: PracticeJourneyFinish | null = null;
    if (completedEpisode) {
      const priorAwards = await tx
        .select({ earnedXp: practiceJourneyAwards.earnedXp })
        .from(practiceJourneyAwards)
        .where(eq(practiceJourneyAwards.learnerId, learnerId));
      const previousTotalXp = priorAwards.reduce(
        (total, award) => total + award.earnedXp,
        0,
      );
      journeyFinish = calculatePracticeJourneyFinish(
        completedEpisode.facts,
        previousTotalXp,
      );
      await tx.insert(practiceJourneyAwards).values({
        learnerId,
        sessionId,
        ...journeyFinish,
      });
    }
    await tx.insert(practiceFinishReceipts).values({
      learnerId,
      sessionId,
      contributionHash,
      episodeMode: completedEpisode?.mode ?? null,
      packId: completedPackId,
    });
    return journeyFinish;
  });
}

export async function readCompletedPackIds(
  context: AuthenticatedLearner,
): Promise<readonly PackId[]> {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const rows = await tx
      .select({
        packId: practiceFinishReceipts.packId,
        mode: practiceFinishReceipts.episodeMode,
      })
      .from(practiceFinishReceipts)
      .where(eq(practiceFinishReceipts.learnerId, learnerId));
    const result: PackId[] = [];
    for (const row of rows) {
      if (row.packId === null) continue;
      const pack = packById(row.packId);
      if (!pack || row.mode !== "pack")
        throw new Error("Learning Path Pack receipt could not be verified.");
      if (!result.includes(pack.id)) result.push(pack.id);
    }
    return result;
  });
}

export async function readPracticeJourneyTotal(context: AuthenticatedLearner) {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const rows = await tx
      .select({ earnedXp: practiceJourneyAwards.earnedXp })
      .from(practiceJourneyAwards)
      .where(eq(practiceJourneyAwards.learnerId, learnerId));
    return rows.reduce((total, award) => total + award.earnedXp, 0);
  });
}

export async function readPracticeJourneyFinish(
  context: AuthenticatedLearner,
  sessionId: string,
): Promise<PracticeJourneyFinish | null> {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const [award] = await tx
      .select({
        earnedXp: practiceJourneyAwards.earnedXp,
        totalXp: practiceJourneyAwards.totalXp,
        newlyReachedMilestone: practiceJourneyAwards.newlyReachedMilestone,
      })
      .from(practiceJourneyAwards)
      .where(
        and(
          eq(practiceJourneyAwards.learnerId, learnerId),
          eq(practiceJourneyAwards.sessionId, sessionId),
        ),
      );
    return award ?? null;
  });
}

export type RecentPracticeEpisode = Readonly<{
  mode: CompletedPracticeEpisodeMode;
  completedAt: string;
  problems: readonly Readonly<{
    problemTitle: string;
    outcome: "no-valid-submissions" | "incorrect-only" | "eventually-correct";
    skipped: boolean;
    validSubmissionCount: number;
    hintLevelsExposed: readonly ("focus" | "strategy" | "next-step")[];
    solutionExposed: boolean;
    checkpoint: Readonly<{ outcome: "correct" | "incorrect" }> | null;
  }>[];
}>;

export async function readRecentPracticeEpisodes(
  context: AuthenticatedLearner,
): Promise<readonly RecentPracticeEpisode[]> {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const rows = await tx
      .select({
        mode: practiceCompletedEpisodes.mode,
        facts: practiceCompletedEpisodes.episodeFacts,
        completedAt: practiceCompletedEpisodes.completedAt,
      })
      .from(practiceCompletedEpisodes)
      .where(eq(practiceCompletedEpisodes.learnerId, learnerId))
      .orderBy(
        desc(practiceCompletedEpisodes.completedAt),
        desc(practiceCompletedEpisodes.sessionId),
      )
      .limit(10);
    return rows.map((row) => {
      const checked = validateCompletedEpisode(row.mode, row.facts);
      if (
        !checked ||
        !(row.completedAt instanceof Date) ||
        Number.isNaN(row.completedAt.getTime())
      )
        throw new Error("Completed Practice history could not be verified.");
      const problems = checked.problems.map((fact) => {
        const definition = getProblemDefinition(fact.problemId);
        if (
          fact.checkpoint &&
          definition.reasoningCheckpoint?.id !== fact.checkpoint.checkpointId
        )
          throw new Error("Completed Practice history could not be verified.");
        return {
          problemTitle: definition.title,
          outcome: fact.outcome,
          skipped: fact.skipped,
          validSubmissionCount: fact.validSubmissionCount,
          hintLevelsExposed: fact.hintLevelsExposed,
          solutionExposed: fact.solutionExposed,
          checkpoint: fact.checkpoint
            ? { outcome: fact.checkpoint.outcome }
            : null,
        };
      });
      return {
        mode: row.mode,
        completedAt: row.completedAt.toISOString(),
        problems,
      };
    });
  });
}

export async function readNextUsefulProblem(
  context: AuthenticatedLearner,
): Promise<null | Readonly<{
  problemId:
    | "brothers-ages-products"
    | "parrots-guaranteed-colors"
    | "pages-without-digit-one";
  reason: string;
}>> {
  const { availability } = await readAdaptiveAvailability(context);
  return availability.status === "recommendation"
    ? { problemId: availability.problemId, reason: availability.reason }
    : null;
}

export async function readAdaptiveAvailability(
  context: AuthenticatedLearner,
): Promise<
  Readonly<{
    availability: AdaptiveAvailability;
    hasPracticeHistory: boolean;
  }>
> {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const [row] = await tx
      .select()
      .from(learners)
      .where(eq(learners.id, learnerId));
    if (!row || row.legacyImportHash === null)
      throw new Error("Legacy Progress import is required.");
    const { guarantee, impossibility, enumeration } = validatedBuckets(
      row.guaranteeEvidence,
      row.impossibilityEvidence,
      row.enumerationEvidence,
    );
    const hasVerifiedFacts =
      facts(guarantee, impossibility, enumeration).length > 0;
    const hasTransferAttempt =
      row.brothersAgesAttempted ||
      row.brothersAgesSolutionExposed ||
      row.parrotsAttempted ||
      row.parrotsSolutionExposed ||
      row.pagesAttempted ||
      row.pagesSolutionExposed;
    const [receipt] = await tx
      .select({ sessionId: practiceFinishReceipts.sessionId })
      .from(practiceFinishReceipts)
      .where(eq(practiceFinishReceipts.learnerId, learnerId))
      .limit(1);
    const [adaptiveReceipt] = await tx
      .select({ sessionId: practiceFinishReceipts.sessionId })
      .from(practiceFinishReceipts)
      .where(
        and(
          eq(practiceFinishReceipts.learnerId, learnerId),
          or(
            isNull(practiceFinishReceipts.episodeMode),
            and(
              ne(practiceFinishReceipts.episodeMode, "pack"),
              ne(practiceFinishReceipts.episodeMode, "review"),
            ),
          ),
        ),
      )
      .limit(1);
    const hasPracticeHistory =
      hasVerifiedFacts || hasTransferAttempt || !!receipt;
    const availability = classifyAdaptiveAvailability(
      guarantee,
      impossibility,
      {
        brothersAttempted: row.brothersAgesAttempted,
        brothersSolutionExposed: row.brothersAgesSolutionExposed,
        parrotsAttempted: row.parrotsAttempted,
        parrotsSolutionExposed: row.parrotsSolutionExposed,
        pagesAttempted: row.pagesAttempted,
        pagesSolutionExposed: row.pagesSolutionExposed,
      },
      enumeration,
      !!adaptiveReceipt,
    );
    return {
      availability,
      hasPracticeHistory,
    };
  });
}

export async function readLearnerProgress(
  context: AuthenticatedLearner,
): Promise<
  readonly [
    LearnerProgressInterpretation,
    LearnerProgressInterpretation,
    LearnerProgressInterpretation,
  ]
> {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const [row] = await tx
      .select()
      .from(learners)
      .where(eq(learners.id, learnerId));
    if (!row || row.legacyImportHash === null)
      throw new Error("Legacy Progress import is required.");
    const { guarantee, impossibility, enumeration } = validatedBuckets(
      row.guaranteeEvidence,
      row.impossibilityEvidence,
      row.enumerationEvidence,
    );
    const first = deriveGuaranteeProgressInterpretation(guarantee);
    const second = deriveImpossibilityProgressInterpretation(impossibility);
    const third = deriveEnumerationProgressInterpretation(enumeration);
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
      {
        learnerLabel: third.learnerLabel,
        progressGroup: third.progressGroup,
        conclusion: third.conclusion,
      },
    ];
  });
}

const eligibleUnassignedReviewSource = sql`mode = 'core'
  AND episode_facts->'problems'->0->>'outcome' = 'eventually-correct'
  AND episode_facts->'problems'->0->>'solutionExposed' = 'false'
  AND NOT EXISTS (SELECT 1 FROM practice_review_assignments a
    WHERE a.learner_id = practice_completed_episodes.learner_id
      AND a.review_source_session_id = practice_completed_episodes.session_id)`;

export async function readReviewAvailability(
  context: AuthenticatedLearner,
): Promise<boolean> {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const db = tx;
    const [pending] = await db
      .select()
      .from(practiceReviewAssignments)
      .where(
        and(
          eq(practiceReviewAssignments.learnerId, learnerId),
          sql`NOT EXISTS (SELECT 1 FROM practice_finish_receipts r WHERE r.learner_id = practice_review_assignments.learner_id AND r.session_id = practice_review_assignments.session_id)`,
        ),
      )
      .limit(1);
    if (pending) return true;
    const [source] = await db
      .select()
      .from(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, learnerId),
          eligibleUnassignedReviewSource,
        ),
      )
      .orderBy(
        desc(practiceCompletedEpisodes.completedAt),
        desc(practiceCompletedEpisodes.sessionId),
      )
      .limit(1);
    return !!source && isEligibleReviewSource(source.mode, source.episodeFacts);
  });
}

export async function startReview(
  context: AuthenticatedLearner,
): Promise<string | null> {
  const learnerId = context.learnerId;
  return withAuthenticatedLearner(context, async (tx, learner) => {
    if (!learner || learner.legacyImportHash === null)
      throw new Error("Legacy Progress import is required.");
    // Concurrent starts and lost browser snapshots reuse the same pending attempt.
    const [pending] = await tx
      .select()
      .from(practiceReviewAssignments)
      .where(
        and(
          eq(practiceReviewAssignments.learnerId, learnerId),
          sql`NOT EXISTS (SELECT 1 FROM practice_finish_receipts r WHERE r.learner_id = practice_review_assignments.learner_id AND r.session_id = practice_review_assignments.session_id)`,
        ),
      )
      .limit(1);
    if (pending) return pending.sessionId;
    const [source] = await tx
      .select()
      .from(practiceCompletedEpisodes)
      .where(
        and(
          eq(practiceCompletedEpisodes.learnerId, learnerId),
          eligibleUnassignedReviewSource,
        ),
      )
      .orderBy(
        desc(practiceCompletedEpisodes.completedAt),
        desc(practiceCompletedEpisodes.sessionId),
      )
      .limit(1);
    if (!source) return null;
    if (!isEligibleReviewSource(source.mode, source.episodeFacts))
      throw new Error("Review source could not be verified.");
    const sessionId = randomUUID();
    await tx.insert(practiceReviewAssignments).values({
      learnerId,
      sessionId,
      reviewSourceSessionId: source.sessionId,
    });
    return sessionId;
  });
}

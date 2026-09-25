import {
  deriveGuaranteeProgressInterpretation,
  emptyGuaranteeProgressEvidence,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceFact,
  type GuaranteeProgressEvidenceV0,
} from "../application/guarantee-progress-evidence";
import {
  deriveImpossibilityProgressInterpretation,
  type ImpossibilityEvidenceFact,
} from "../application/impossibility-progress-evidence";
import {
  emptyPracticeProgressEvidence,
  progressEvidenceBuckets,
  validatePracticeProgressEvidence,
  type PracticeProgressEvidence,
} from "../application/practice-progress-evidence";
import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";

export const PROGRESS_EVIDENCE_STORAGE_KEY =
  "olympiad-trainer:progress-evidence-v0";

export async function readVerifiedPracticeProgressEvidence(
  verifyFacts: (
    facts: readonly (GuaranteeEvidenceFact | ImpossibilityEvidenceFact)[],
  ) => Promise<boolean>,
  storage?: Storage,
): Promise<{
  evidence: PracticeProgressEvidence;
  interpretations: readonly [
    ReasoningCheckpointInterpretation,
    ReasoningCheckpointInterpretation,
  ];
}> {
  const store = storage ?? window.localStorage;
  const raw = store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
  if (raw === null) {
    const empty = progressEvidenceBuckets(emptyPracticeProgressEvidence());
    return {
      evidence: emptyPracticeProgressEvidence(),
      interpretations: [
        deriveGuaranteeProgressInterpretation(empty.guarantee),
        deriveImpossibilityProgressInterpretation(empty.impossibility),
      ],
    };
  }
  let evidence: PracticeProgressEvidence | null = null;
  if (raw !== null) {
    try {
      evidence = validatePracticeProgressEvidence(JSON.parse(raw));
    } catch {
      evidence = null;
    }
  }
  const buckets = progressEvidenceBuckets(
    evidence ?? emptyPracticeProgressEvidence(),
  );
  const facts = [
    buckets.guarantee.latestCorrectWithoutHints,
    buckets.guarantee.latestCorrectWithHints,
    buckets.guarantee.latestIncorrect,
    buckets.impossibility.latestCorrectWithoutHints,
    buckets.impossibility.latestCorrectWithHints,
    buckets.impossibility.latestIncorrect,
  ].filter(
    (fact): fact is GuaranteeEvidenceFact | ImpossibilityEvidenceFact =>
      fact !== null,
  );
  const valid =
    evidence !== null && (facts.length === 0 || (await verifyFacts(facts)));
  if (store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== raw)
    throw new Error("Progress evidence changed during verification.");
  if (!valid || !evidence)
    throw new Error("Progress evidence could not be verified.");
  const verified = evidence;
  const verifiedBuckets = progressEvidenceBuckets(verified);
  return {
    evidence: verified,
    interpretations: [
      deriveGuaranteeProgressInterpretation(verifiedBuckets.guarantee),
      deriveImpossibilityProgressInterpretation(verifiedBuckets.impossibility),
    ],
  };
}

export async function readVerifiedGuaranteeProgressEvidence(
  verifyFacts: (facts: readonly GuaranteeEvidenceFact[]) => Promise<boolean>,
  storage?: Storage,
): Promise<{
  evidence: GuaranteeProgressEvidenceV0;
  interpretation: ReasoningCheckpointInterpretation;
}> {
  const store = storage ?? window.localStorage;
  const raw = store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
  if (raw === null) {
    const evidence = emptyGuaranteeProgressEvidence();
    return {
      evidence,
      interpretation: deriveGuaranteeProgressInterpretation(evidence),
    };
  }

  let evidence: GuaranteeProgressEvidenceV0 | null;
  try {
    evidence = validateGuaranteeProgressEvidence(JSON.parse(raw));
  } catch {
    evidence = null;
  }
  const facts = evidence
    ? [
        evidence.latestCorrectWithoutHints,
        evidence.latestCorrectWithHints,
        evidence.latestIncorrect,
      ].filter((fact): fact is GuaranteeEvidenceFact => fact !== null)
    : [];
  const valid =
    evidence !== null && (facts.length === 0 || (await verifyFacts(facts)));
  if (store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== raw)
    throw new Error("Progress evidence changed during verification.");
  const verifiedEvidence =
    valid && evidence ? evidence : emptyGuaranteeProgressEvidence();
  return {
    evidence: verifiedEvidence,
    interpretation: deriveGuaranteeProgressInterpretation(verifiedEvidence),
  };
}

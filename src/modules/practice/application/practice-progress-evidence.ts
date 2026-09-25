import {
  appendGuaranteeEvidence,
  emptyGuaranteeProgressEvidence,
  getGuaranteeEvidenceContribution,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceContribution,
  type GuaranteeProgressEvidenceV0,
} from "./guarantee-progress-evidence";
import {
  appendImpossibilityEvidence,
  emptyImpossibilityProgressEvidence,
  getImpossibilityEvidenceContribution,
  validateImpossibilityProgressEvidence,
  type ImpossibilityEvidenceContribution,
  type ImpossibilityProgressEvidenceV0,
} from "./impossibility-progress-evidence";
import type { PracticeSummary } from "./practice-state";
import type { ReasoningCheckpointObservation } from "./reasoning-checkpoint";

export type TwoBucketProgressEvidence = Readonly<{
  version: 2;
  guarantee: GuaranteeProgressEvidenceV0;
  impossibility: ImpossibilityProgressEvidenceV0;
}>;

export type PracticeProgressEvidence =
  GuaranteeProgressEvidenceV0 | TwoBucketProgressEvidence;

type ContributingResult =
  | {
      problemId: string;
      taskOutcome?: "skipped";
      summary: PracticeSummary;
      reasoningCheckpointObservation?: ReasoningCheckpointObservation;
    }
  | undefined;

export type PracticeProgressContribution =
  | Readonly<{ bucket: "guarantee"; value: GuaranteeEvidenceContribution }>
  | Readonly<{
      bucket: "impossibility";
      value: ImpossibilityEvidenceContribution;
    }>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePracticeProgressEvidence(
  value: unknown,
): PracticeProgressEvidence | null {
  const legacy = validateGuaranteeProgressEvidence(value);
  if (legacy) return legacy;
  if (
    !record(value) ||
    value.version !== 2 ||
    Object.keys(value).length !== 3 ||
    !Object.hasOwn(value, "guarantee") ||
    !Object.hasOwn(value, "impossibility")
  )
    return null;
  const guarantee = validateGuaranteeProgressEvidence(value.guarantee);
  const impossibility = validateImpossibilityProgressEvidence(
    value.impossibility,
  );
  return guarantee && impossibility
    ? { version: 2, guarantee, impossibility }
    : null;
}

export function progressEvidenceBuckets(value: PracticeProgressEvidence) {
  return value.version === 2
    ? { guarantee: value.guarantee, impossibility: value.impossibility }
    : {
        guarantee: value,
        impossibility: emptyImpossibilityProgressEvidence(),
      };
}

export function getPracticeProgressContribution(
  result: ContributingResult,
): PracticeProgressContribution | null {
  const guarantee = getGuaranteeEvidenceContribution(result);
  if (guarantee) return { bucket: "guarantee", value: guarantee };
  const impossibility = getImpossibilityEvidenceContribution(result);
  return impossibility
    ? { bucket: "impossibility", value: impossibility }
    : null;
}

export function appendPracticeProgressEvidence(
  current: PracticeProgressEvidence,
  contribution: PracticeProgressContribution,
): PracticeProgressEvidence | null {
  if (contribution.bucket === "guarantee") {
    const next = appendGuaranteeEvidence(
      current.version === 2 ? current.guarantee : current,
      contribution.value,
    );
    if (!next) return null;
    return current.version === 2 ? { ...current, guarantee: next } : next;
  }
  const next = appendImpossibilityEvidence(
    current.version === 2
      ? current.impossibility
      : emptyImpossibilityProgressEvidence(),
    contribution.value,
  );
  if (!next) return null;
  return {
    version: 2,
    guarantee: current.version === 2 ? current.guarantee : current,
    impossibility: next,
  };
}

export function emptyPracticeProgressEvidence(): PracticeProgressEvidence {
  return emptyGuaranteeProgressEvidence();
}

import {
  appendGuaranteeEvidence,
  emptyGuaranteeProgressEvidence,
  getGuaranteeEvidenceContribution,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceContribution,
  type GuaranteeProgressEvidence,
} from "./guarantee-progress-evidence";
import {
  appendImpossibilityEvidence,
  emptyImpossibilityProgressEvidence,
  getImpossibilityEvidenceContribution,
  validateImpossibilityProgressEvidence,
  type ImpossibilityEvidenceContribution,
  type ImpossibilityProgressEvidence,
} from "./impossibility-progress-evidence";
import type { PracticeSummary } from "./practice-state";
import type { ReasoningCheckpointObservation } from "./reasoning-checkpoint";

export type TwoBucketProgressEvidence = Readonly<{
  version: 2;
  guarantee: GuaranteeProgressEvidence;
  impossibility: ImpossibilityProgressEvidence;
}>;

export type PracticeProgressEvidence =
  GuaranteeProgressEvidence | TwoBucketProgressEvidence;

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
  return "guarantee" in value
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
      "guarantee" in current ? current.guarantee : current,
      contribution.value,
    );
    if (!next) return null;
    return "guarantee" in current ? { ...current, guarantee: next } : next;
  }
  const next = appendImpossibilityEvidence(
    "guarantee" in current
      ? current.impossibility
      : emptyImpossibilityProgressEvidence(),
    contribution.value,
  );
  if (!next) return null;
  return {
    version: 2,
    guarantee: "guarantee" in current ? current.guarantee : current,
    impossibility: next,
  };
}

export function emptyPracticeProgressEvidence(): PracticeProgressEvidence {
  return emptyGuaranteeProgressEvidence();
}

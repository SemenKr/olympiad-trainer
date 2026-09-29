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
import {
  appendEnumerationEvidence,
  emptyEnumerationProgressEvidence,
  getEnumerationEvidenceContribution,
  validateEnumerationProgressEvidence,
  type EnumerationEvidenceContribution,
  type EnumerationProgressEvidence,
} from "./enumeration-progress-evidence";

export type TwoBucketProgressEvidence = Readonly<{
  version: 2;
  guarantee: GuaranteeProgressEvidence;
  impossibility: ImpossibilityProgressEvidence;
}>;

export type ThreeBucketProgressEvidence = Readonly<{
  version: 3;
  guarantee: GuaranteeProgressEvidence;
  impossibility: ImpossibilityProgressEvidence;
  enumeration: EnumerationProgressEvidence;
}>;

export type PracticeProgressEvidence =
  | GuaranteeProgressEvidence
  | TwoBucketProgressEvidence
  | ThreeBucketProgressEvidence;

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
    }>
  | Readonly<{ bucket: "enumeration"; value: EnumerationEvidenceContribution }>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validatePracticeProgressEvidence(
  value: unknown,
): PracticeProgressEvidence | null {
  const legacy = validateGuaranteeProgressEvidence(value);
  if (legacy) return legacy;
  if (record(value) && value.version === 3) {
    if (
      Object.keys(value).length !== 4 ||
      !Object.hasOwn(value, "guarantee") ||
      !Object.hasOwn(value, "impossibility") ||
      !Object.hasOwn(value, "enumeration")
    )
      return null;
    const guarantee = validateGuaranteeProgressEvidence(value.guarantee);
    const impossibility = validateImpossibilityProgressEvidence(
      value.impossibility,
    );
    const enumeration = validateEnumerationProgressEvidence(value.enumeration);
    return guarantee && impossibility && enumeration
      ? { version: 3, guarantee, impossibility, enumeration }
      : null;
  }
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
    ? {
        guarantee: value.guarantee,
        impossibility: value.impossibility,
        enumeration:
          "enumeration" in value
            ? value.enumeration
            : emptyEnumerationProgressEvidence(),
      }
    : {
        guarantee: value,
        impossibility: emptyImpossibilityProgressEvidence(),
        enumeration: emptyEnumerationProgressEvidence(),
      };
}

export function getPracticeProgressContribution(
  result: ContributingResult,
): PracticeProgressContribution | null {
  const guarantee = getGuaranteeEvidenceContribution(result);
  if (guarantee) return { bucket: "guarantee", value: guarantee };
  const impossibility = getImpossibilityEvidenceContribution(result);
  if (impossibility) return { bucket: "impossibility", value: impossibility };
  const enumeration = getEnumerationEvidenceContribution(result);
  return enumeration ? { bucket: "enumeration", value: enumeration } : null;
}

export function appendPracticeProgressEvidence(
  current: PracticeProgressEvidence,
  contribution: PracticeProgressContribution,
): PracticeProgressEvidence | null {
  if (contribution.bucket === "enumeration") {
    const buckets = progressEvidenceBuckets(current);
    const next = appendEnumerationEvidence(
      buckets.enumeration,
      contribution.value,
    );
    return next
      ? {
          version: 3,
          guarantee: buckets.guarantee,
          impossibility: buckets.impossibility,
          enumeration: next,
        }
      : null;
  }
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
  if ("enumeration" in current)
    return {
      version: 3,
      guarantee: current.guarantee,
      impossibility: next,
      enumeration: current.enumeration,
    };
  return {
    version: 2,
    guarantee: "guarantee" in current ? current.guarantee : current,
    impossibility: next,
  };
}

export function emptyPracticeProgressEvidence(): PracticeProgressEvidence {
  return emptyGuaranteeProgressEvidence();
}

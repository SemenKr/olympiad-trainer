import {
  getGuaranteeTransferReason,
  guaranteeFacts,
  type GuaranteeProgressEvidence,
} from "./guarantee-progress-evidence";
import {
  getImpossibilityTransferReason,
  impossibilityFacts,
  type ImpossibilityProgressEvidence,
} from "./impossibility-progress-evidence";
import {
  enumerationFacts,
  type EnumerationProgressEvidence,
} from "./enumeration-progress-evidence";

export const ENUMERATION_EXPLORATION_REASON =
  "В твоём прогрессе пока нет проверяемой работы с таким типом рассуждения. Эта задача даст возможность попробовать новую идею.";

export type AdaptiveAvailability =
  | Readonly<{
      status: "recommendation";
      problemId:
        | "brothers-ages-products"
        | "parrots-guaranteed-colors"
        | "pages-without-digit-one";
      reason: string;
    }>
  | Readonly<{ status: "insufficient-evidence" }>
  | Readonly<{ status: "transfer-exhausted" }>;

export function classifyAdaptiveAvailability(
  guarantee: GuaranteeProgressEvidence,
  impossibility: ImpossibilityProgressEvidence,
  transferStatus: Readonly<{
    brothersAttempted: boolean;
    brothersSolutionExposed: boolean;
    parrotsAttempted: boolean;
    parrotsSolutionExposed: boolean;
    pagesAttempted?: boolean;
    pagesSolutionExposed?: boolean;
  }>,
  enumeration?: EnumerationProgressEvidence,
  hasPracticeHistory = false,
): AdaptiveAvailability {
  const brothersConsumed =
    transferStatus.brothersAttempted ||
    transferStatus.brothersSolutionExposed ||
    impossibilityFacts(impossibility).some(
      (fact) => fact.problemId === "brothers-ages-products",
    );
  const parrotsConsumed =
    transferStatus.parrotsAttempted ||
    transferStatus.parrotsSolutionExposed ||
    guaranteeFacts(guarantee).some(
      (fact) => fact.problemId === "parrots-guaranteed-colors",
    );

  if (!brothersConsumed) {
    const reason = getImpossibilityTransferReason(impossibility);
    if (reason)
      return {
        status: "recommendation",
        problemId: "brothers-ages-products",
        reason,
      };
  }
  if (!parrotsConsumed) {
    const reason = getGuaranteeTransferReason(guarantee);
    if (reason)
      return {
        status: "recommendation",
        problemId: "parrots-guaranteed-colors",
        reason,
      };
  }
  if (
    hasPracticeHistory &&
    enumeration &&
    !transferStatus.pagesAttempted &&
    !transferStatus.pagesSolutionExposed &&
    !enumerationFacts(enumeration).some(
      (fact) => fact.observation.outcome === "correct",
    )
  )
    return {
      status: "recommendation",
      problemId: "pages-without-digit-one",
      reason: ENUMERATION_EXPLORATION_REASON,
    };
  return {
    status:
      brothersConsumed && parrotsConsumed
        ? "transfer-exhausted"
        : "insufficient-evidence",
  };
}

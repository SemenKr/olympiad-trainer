import {
  guaranteeFacts,
  type GuaranteeProgressEvidence,
} from "./guarantee-progress-evidence";
import {
  impossibilityFacts,
  type ImpossibilityProgressEvidence,
} from "./impossibility-progress-evidence";
import {
  enumerationFacts,
  type EnumerationProgressEvidence,
} from "./enumeration-progress-evidence";

import {
  recommendAdaptiveWork,
  type AdaptiveTargetId,
} from "../domain/adaptive-recommendation";
export {
  ADAPTIVE_RULES,
  isAdaptiveTargetId,
  type AdaptiveTargetId,
  type AdaptivePurpose,
} from "../domain/adaptive-recommendation";
export const ENUMERATION_EXPLORATION_REASON =
  "Для этой части прогресса пока нет сохранённых проверок рассуждения. Можно попробовать новую задачу.";
const TRANSFER_WITH_HINTS_REASON =
  "В сохранённой тренировке ты верно выбрал объяснение после подсказки. Предлагаем попробовать задачу с другими условиями.";
const TRANSFER_WITHOUT_HINTS_REASON =
  "В сохранённой тренировке ты верно выбрал объяснение без открытых перед ним подсказок. Предлагаем попробовать задачу с другими условиями.";

// Only this projection crosses the learner boundary, not the selection basis.
export type AdaptiveRecommendation = Readonly<{
  status: "recommendation";
  problemId: AdaptiveTargetId;
  reason: string;
}>;

export function recommendationPresentation(value: AdaptiveRecommendation) {
  const presentation = {
    "brothers-ages-products": {
      title: "Возраст братьев",
      href: "/practice/transfer",
    },
    "parrots-guaranteed-colors": {
      title: "Попугаи в зоопарке",
      href: "/practice/transfer?problem=parrots-guaranteed-colors",
    },
    "pages-without-digit-one": {
      title: "Страницы без цифры 1",
      href: "/practice/transfer?problem=pages-without-digit-one",
    },
  };
  const rule = presentation[value.problemId];
  return { title: rule.title, href: rule.href, reason: value.reason };
}

export type AdaptiveRecommendationResult =
  AdaptiveRecommendation | Readonly<{ status: "none" }>;
export function getAdaptiveRecommendation(
  input: Readonly<{
    guarantee: GuaranteeProgressEvidence;
    impossibility: ImpossibilityProgressEvidence;
    enumeration: EnumerationProgressEvidence;
    hasPracticeFinish: boolean;
    closedTargets: readonly AdaptiveTargetId[];
  }>,
): AdaptiveRecommendationResult {
  const allFacts = [
    ...guaranteeFacts(input.guarantee),
    ...impossibilityFacts(input.impossibility),
  ];
  function latest(source: "table-impossible-sums" | "guaranteed-sock-pair") {
    const fact = allFacts
      .filter((fact) => fact.problemId === source)
      .toSorted((a, b) => b.sequence - a.sequence)[0];
    return fact
      ? {
          outcome: fact.observation.outcome,
          hintsBeforeCheckpoint:
            fact.hintLevelsExposedBeforeCheckpoint.length > 0,
        }
      : null;
  }
  const decision = recommendAdaptiveWork({
    latestSourceCheckpoints: {
      "table-impossible-sums": latest("table-impossible-sums"),
      "guaranteed-sock-pair": latest("guaranteed-sock-pair"),
    },
    hasEnumerationObservation: enumerationFacts(input.enumeration).length > 0,
    hasDurablePracticeFinish: input.hasPracticeFinish,
    closedTargets: input.closedTargets,
  });
  if (decision.kind === "none") return { status: "none" };
  return {
    status: "recommendation",
    problemId: decision.problemId,
    reason:
      decision.basis === "no-retained-enumeration-observation"
        ? ENUMERATION_EXPLORATION_REASON
        : decision.basis === "correct-source-checkpoint-after-hints"
          ? TRANSFER_WITH_HINTS_REASON
          : TRANSFER_WITHOUT_HINTS_REASON,
  };
}

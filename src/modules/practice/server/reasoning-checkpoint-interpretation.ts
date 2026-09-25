import "server-only";

import type { PracticeSummary } from "../application/practice-state";
import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";

export function getReasoningCheckpointInterpretation(
  summary: PracticeSummary,
  outcome: "correct" | "incorrect",
  problemId: string = "guaranteed-sock-pair",
): ReasoningCheckpointInterpretation {
  if (problemId === "table-impossible-sums") {
    const base = {
      capability: "Доказывать глобальную невозможность через ограничения",
      learnerLabel: "Доказывать, что что-то невозможно",
    };
    if (outcome !== "correct" || summary.solutionExposure !== null)
      return { ...base, progressGroup: null, conclusion: "Пока рано сказать" };
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        summary.hintExposures.length === 0
          ? "Без открытых подсказок ты верно выбрал рассуждение, которое показывает, почему сумма 20 невозможна. Пока это показывает распознавание готового доказательства, а не самостоятельное построение."
          : "После открытых подсказок ты верно выбрал рассуждение, которое показывает, почему сумма 20 невозможна. Самостоятельное построение такого доказательства пока не проверено.",
    };
  }
  const capability =
    "Обосновывать гарантированный результат при неблагоприятном выборе";
  const learnerLabel = "Как гарантировать результат";

  if (outcome !== "correct" || summary.solutionExposure !== null) {
    return {
      capability,
      learnerLabel,
      progressGroup: null,
      conclusion: "Пока рано сказать",
    };
  }

  return {
    capability,
    learnerLabel,
    progressGroup: "Начинаю разбираться",
    conclusion:
      summary.hintExposures.length === 0
        ? "Ты сам верно выбрал объяснение, почему 7 носков уже гарантируют нужную пару. Пока рано сказать, сможешь ли ты сам построить такое доказательство в новой задаче."
        : "В этой задаче ты открывал подсказку и верно выбрал объяснение, почему 7 носков гарантируют нужную пару. Самостоятельный выбор такого обоснования пока не проверен.",
  };
}

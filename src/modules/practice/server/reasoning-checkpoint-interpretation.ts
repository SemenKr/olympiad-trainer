import "server-only";

import type { PracticeSummary } from "../application/practice-state";
import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";

export function getReasoningCheckpointInterpretation(
  summary: PracticeSummary,
  outcome: "correct" | "incorrect",
): ReasoningCheckpointInterpretation {
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

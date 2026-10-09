export type PracticeFinishOutcome =
  "completed" | "outcome-unknown" | "reconciliation-pending" | "blocked";

export function practiceFinishFeedback(
  outcome: Exclude<PracticeFinishOutcome, "completed">,
): string {
  if (outcome === "reconciliation-pending")
    return "Итоги сохранены. Не удалось обновить данные тренировки в браузере. Нажми «Завершить» ещё раз.";
  if (outcome === "outcome-unknown")
    return "Не удалось подтвердить сохранение итогов. Они уже могли сохраниться. Нажми «Завершить» ещё раз, чтобы проверить.";
  return "Не удалось подтвердить завершение тренировки. Попробуй завершить ещё раз. Сохранённая работа остаётся в браузере.";
}

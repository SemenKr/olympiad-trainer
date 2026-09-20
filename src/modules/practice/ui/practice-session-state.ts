import {
  finishPractice,
  getPracticeSummary,
  type PracticeSummary,
} from "../application/practice-state";
import type { ShortNumericAnswerState } from "./short-numeric-answer-state";

type ConfirmDiscard = () => boolean;

export function requestPracticeFinish(
  answerState: ShortNumericAnswerState,
  confirmDiscard: ConfirmDiscard,
): PracticeSummary | null {
  if (answerState.status === "loading") {
    return null;
  }

  const hasUnsubmittedAnswer =
    answerState.status === "typing" && answerState.rawAnswer.length > 0;

  if (hasUnsubmittedAnswer && !confirmDiscard()) {
    return null;
  }

  return getPracticeSummary(finishPractice(answerState.practice));
}

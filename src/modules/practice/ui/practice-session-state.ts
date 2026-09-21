import {
  finishPractice,
  getPracticeSummary,
  recordHintExposure,
  type PracticeSummary,
} from "../application/practice-state";
import type { ShortNumericAnswerState } from "./short-numeric-answer-state";

type ConfirmDiscard = () => boolean;

export function isFocusHintAvailable(
  answerState: ShortNumericAnswerState,
  hintId: string,
): boolean {
  return (
    answerState.status !== "loading" &&
    !answerState.practice.submissions.some(
      (submission) => submission.outcome === "correct",
    ) &&
    !answerState.practice.hintExposures.some(
      (exposure) => exposure.hintId === hintId,
    )
  );
}

export function openFocusHint(
  answerState: ShortNumericAnswerState,
  hintId: string,
): ShortNumericAnswerState {
  if (!isFocusHintAvailable(answerState, hintId)) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordHintExposure(answerState.practice, {
      hintId,
      level: "focus",
    }),
  };
}

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

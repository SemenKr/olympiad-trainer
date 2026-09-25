import type { LearnerSafePracticeProblem } from "../application/practice-problem-presentation";
import {
  createMultipleChoiceSetAnswerState,
  type MultipleChoiceSetAnswerState,
} from "./multiple-choice-set-answer-state";
import {
  createShortNumericAnswerState,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";

export type PracticeAnswerState =
  ShortNumericAnswerState | MultipleChoiceSetAnswerState;

export function isMultipleChoiceSetAnswerState(
  state: PracticeAnswerState,
): state is MultipleChoiceSetAnswerState {
  return "selectedOptionIds" in state;
}

export function createPracticeAnswerState(
  problem: LearnerSafePracticeProblem,
): PracticeAnswerState {
  return problem.response.kind === "multiple-choice-set"
    ? createMultipleChoiceSetAnswerState()
    : createShortNumericAnswerState();
}

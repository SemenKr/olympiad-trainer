import type { LearnerSafePracticeProblem } from "../application/practice-problem-presentation";
import type { PracticeSummary } from "../application/practice-state";
import type { ShortNumericAnswerState } from "./short-numeric-answer-state";
import { requestPracticeFinish } from "./practice-session-state";

export type PracticeSessionResult = Readonly<{
  problemId: string;
  problemTitle: string;
  summary: PracticeSummary;
  taskOutcome?: "skipped";
}>;

export type TwoProblemSessionState = Readonly<{
  activeProblemIndex: 0 | 1;
  completedResults: readonly PracticeSessionResult[];
}>;

export type NoNextTwoProblemSessionState = Readonly<{
  status: "no-next";
  completedResults: readonly [PracticeSessionResult, PracticeSessionResult];
}>;

export function startTwoProblemSession(): TwoProblemSessionState {
  return { activeProblemIndex: 0, completedResults: [] };
}

export function isPracticeProblemNavigationComplete(
  answerState: ShortNumericAnswerState,
): boolean {
  return (
    answerState.status !== "loading" &&
    (answerState.practice.solutionExposure !== null ||
      answerState.practice.submissions.some(
        (submission) => submission.outcome === "correct",
      ))
  );
}

export function isPracticeProblemSkipAvailable(
  answerState: ShortNumericAnswerState,
  supportRevealPending = false,
): boolean {
  return (
    !supportRevealPending &&
    !isPracticeProblemNavigationComplete(answerState) &&
    answerState.status !== "loading"
  );
}

export function requestPracticeSkip(
  answerState: ShortNumericAnswerState,
  confirmDiscard: () => boolean,
  supportRevealPending = false,
): PracticeSummary | null {
  if (!isPracticeProblemSkipAvailable(answerState, supportRevealPending)) {
    return null;
  }

  return requestPracticeFinish(
    answerState,
    confirmDiscard,
    supportRevealPending,
  );
}

export function createPracticeSessionResult(
  problem: LearnerSafePracticeProblem,
  summary: PracticeSummary,
  taskOutcome?: "skipped",
): PracticeSessionResult {
  return {
    problemId: problem.problemId,
    problemTitle: problem.title,
    summary,
    ...(taskOutcome ? { taskOutcome } : {}),
  };
}

export function advanceTwoProblemSession(
  state: TwoProblemSessionState,
  result: PracticeSessionResult,
): TwoProblemSessionState | null {
  if (state.activeProblemIndex !== 0) {
    return null;
  }

  return {
    activeProblemIndex: 1,
    completedResults: [...state.completedResults, result],
  };
}

export function finishTwoProblemSession(
  state: TwoProblemSessionState,
  currentResult: PracticeSessionResult,
): readonly PracticeSessionResult[] {
  return [...state.completedResults, currentResult];
}

export function skipFinalTwoProblemSession(
  state: TwoProblemSessionState,
  result: PracticeSessionResult,
): NoNextTwoProblemSessionState | null {
  if (
    state.activeProblemIndex !== 1 ||
    state.completedResults.length !== 1 ||
    result.taskOutcome !== "skipped"
  ) {
    return null;
  }

  return {
    status: "no-next",
    completedResults: [state.completedResults[0], result],
  };
}

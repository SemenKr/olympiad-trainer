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
  hasNextProblem: boolean,
  supportRevealPending = false,
): boolean {
  return (
    hasNextProblem &&
    !supportRevealPending &&
    !isPracticeProblemNavigationComplete(answerState) &&
    answerState.status !== "loading"
  );
}

export function requestPracticeSkip(
  answerState: ShortNumericAnswerState,
  hasNextProblem: boolean,
  confirmDiscard: () => boolean,
  supportRevealPending = false,
): PracticeSummary | null {
  if (
    !isPracticeProblemSkipAvailable(
      answerState,
      hasNextProblem,
      supportRevealPending,
    )
  ) {
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

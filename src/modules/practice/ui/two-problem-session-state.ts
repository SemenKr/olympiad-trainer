import type { LearnerSafePracticeProblem } from "../application/practice-problem-presentation";
import type { PracticeSummary } from "../application/practice-state";
import type { ShortNumericAnswerState } from "./short-numeric-answer-state";

export type PracticeSessionResult = Readonly<{
  problemId: string;
  problemTitle: string;
  summary: PracticeSummary;
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

export function createPracticeSessionResult(
  problem: LearnerSafePracticeProblem,
  summary: PracticeSummary,
): PracticeSessionResult {
  return {
    problemId: problem.problemId,
    problemTitle: problem.title,
    summary,
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

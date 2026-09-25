import type { LearnerSafePracticeProblem } from "../application/practice-problem-presentation";
import type { PracticeSummary } from "../application/practice-state";
import type { ReasoningCheckpointObservation } from "../application/reasoning-checkpoint";
import type { PracticeAnswerState } from "./practice-answer-state";
import { requestPracticeFinish } from "./practice-session-state";

export type PracticeSessionResult = Readonly<{
  problemId: string;
  problemTitle: string;
  summary: PracticeSummary;
  taskOutcome?: "skipped";
  reasoningCheckpointObservation?: ReasoningCheckpointObservation;
  firstCorrectSubmissionCount?: number;
}>;

export type TwoProblemSessionState = Readonly<{
  sessionId: string;
  activeProblemIndex: 0 | 1;
  completedResults: readonly PracticeSessionResult[];
}>;

export type NoNextTwoProblemSessionState = Readonly<{
  sessionId: string;
  status: "no-next";
  completedResults: readonly [PracticeSessionResult, PracticeSessionResult];
}>;

export function startTwoProblemSession(): TwoProblemSessionState {
  return {
    sessionId: crypto.randomUUID(),
    activeProblemIndex: 0,
    completedResults: [],
  };
}

export function isPracticeProblemNavigationComplete(
  answerState: PracticeAnswerState,
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
  answerState: PracticeAnswerState,
  supportRevealPending = false,
): boolean {
  return (
    !supportRevealPending &&
    !isPracticeProblemNavigationComplete(answerState) &&
    answerState.status !== "loading"
  );
}

export function requestPracticeSkip(
  answerState: PracticeAnswerState,
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
  reasoningCheckpointObservation?: ReasoningCheckpointObservation,
  firstCorrectSubmissionCount?: number,
): PracticeSessionResult {
  return {
    problemId: problem.problemId,
    problemTitle: problem.title,
    summary,
    ...(taskOutcome ? { taskOutcome } : {}),
    ...(reasoningCheckpointObservation
      ? { reasoningCheckpointObservation, firstCorrectSubmissionCount }
      : {}),
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
    sessionId: state.sessionId,
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
    sessionId: state.sessionId,
    status: "no-next",
    completedResults: [state.completedResults[0], result],
  };
}

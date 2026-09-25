import {
  createPracticeSessionResult,
  isPracticeProblemNavigationComplete,
  isPracticeProblemSkipAvailable,
  requestPracticeSkip,
  type PracticeSessionResult,
} from "./two-problem-session-state";

export {
  createPracticeSessionResult,
  isPracticeProblemNavigationComplete,
  isPracticeProblemSkipAvailable,
  requestPracticeSkip,
};
export type { PracticeSessionResult };

export type PracticeSessionState = Readonly<{
  sessionId: string;
  activeProblemIndex: 0 | 1 | 2;
  completedResults: readonly PracticeSessionResult[];
}>;

export type NoNextPracticeSessionState = Readonly<{
  sessionId: string;
  status: "no-next";
  completedResults: readonly PracticeSessionResult[];
}>;

export function startPracticeSession(): PracticeSessionState {
  return {
    sessionId: crypto.randomUUID(),
    activeProblemIndex: 0,
    completedResults: [],
  };
}

export function advancePracticeSession(
  state: PracticeSessionState,
  result: PracticeSessionResult,
): PracticeSessionState | null {
  if (
    state.activeProblemIndex === 2 ||
    state.completedResults.length !== state.activeProblemIndex
  )
    return null;
  return {
    sessionId: state.sessionId,
    activeProblemIndex: (state.activeProblemIndex + 1) as 1 | 2,
    completedResults: [...state.completedResults, result],
  };
}

export function finishPracticeSession(
  state: PracticeSessionState,
  currentResult: PracticeSessionResult,
): readonly PracticeSessionResult[] {
  return [...state.completedResults, currentResult];
}

export function skipFinalPracticeSession(
  state: PracticeSessionState,
  result: PracticeSessionResult,
): NoNextPracticeSessionState | null {
  if (
    state.activeProblemIndex !== 2 ||
    state.completedResults.length !== 2 ||
    result.taskOutcome !== "skipped"
  )
    return null;
  return {
    sessionId: state.sessionId,
    status: "no-next",
    completedResults: [
      state.completedResults[0],
      state.completedResults[1],
      result,
    ],
  };
}

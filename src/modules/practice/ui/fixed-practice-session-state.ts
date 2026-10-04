import {
  createPracticeSessionResult,
  isPracticeProblemNavigationComplete,
  isPracticeProblemSkipAvailable,
  requestPracticeSkip,
  type PracticeSessionResult,
} from "./two-problem-session-state";
import {
  packProblemIds,
  type PackId,
} from "../application/completed-practice-episode";

export {
  createPracticeSessionResult,
  isPracticeProblemNavigationComplete,
  isPracticeProblemSkipAvailable,
  requestPracticeSkip,
};
export type { PracticeSessionResult };

export type PracticeSessionState = Readonly<{
  sessionId: string;
  mode?: "pack";
  problemIds?: readonly [string, string, string];
  activeProblemIndex: 0 | 1 | 2;
  completedResults: readonly PracticeSessionResult[];
}>;

export type AdaptivePracticeSessionState = Readonly<{
  sessionId: string;
  mode: "transfer" | "exploration" | "review";
  problemId:
    | "brothers-ages-products"
    | "parrots-guaranteed-colors"
    | "pages-without-digit-one"
    | "coinciding-seats";
  activeProblemIndex: 0;
  completedResults: readonly [];
}>;

export type ActivePracticeSessionState =
  PracticeSessionState | AdaptivePracticeSessionState;

export type NoNextPracticeSessionState = Readonly<{
  sessionId: string;
  mode?: "pack";
  status: "no-next";
  completedResults: readonly PracticeSessionResult[];
}>;

export type AdaptiveNoNextPracticeSessionState = Readonly<{
  sessionId: string;
  mode: "transfer" | "exploration" | "review";
  status: "no-next";
  completedResults: readonly [PracticeSessionResult];
}>;

export type FinishedPracticeSessionState =
  NoNextPracticeSessionState | AdaptiveNoNextPracticeSessionState;

export function startAdaptivePracticeSession(
  problemId: Exclude<
    AdaptivePracticeSessionState["problemId"],
    "coinciding-seats"
  > = "brothers-ages-products",
): AdaptivePracticeSessionState {
  return {
    sessionId: crypto.randomUUID(),
    mode: problemId === "pages-without-digit-one" ? "exploration" : "transfer",
    problemId,
    activeProblemIndex: 0,
    completedResults: [],
  };
}

export function startPracticeSession(): PracticeSessionState {
  return {
    sessionId: crypto.randomUUID(),
    activeProblemIndex: 0,
    completedResults: [],
  };
}

export function startPackPracticeSession(
  packId: PackId = "pack-a",
): PracticeSessionState {
  return {
    ...startPracticeSession(),
    mode: "pack",
    problemIds: packProblemIds(packId),
  };
}

export function isFixedPracticeSession(
  state: ActivePracticeSessionState,
): state is PracticeSessionState {
  return !("mode" in state) || state.mode === "pack";
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
    ...(state.mode === "pack" ? { mode: "pack" as const } : {}),
    ...(state.problemIds ? { problemIds: state.problemIds } : {}),
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
    ...(state.mode === "pack" ? { mode: "pack" as const } : {}),
    status: "no-next",
    completedResults: [
      state.completedResults[0],
      state.completedResults[1],
      result,
    ],
  };
}

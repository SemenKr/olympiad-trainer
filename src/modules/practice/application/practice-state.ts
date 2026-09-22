import type { NumericAnswerResult } from "../domain/numeric-answer";

export type PracticeSubmission = Readonly<{
  answer: string;
  outcome: "correct" | "incorrect";
}>;

export type PracticeHintExposure = Readonly<{
  hintId: string;
  level: "focus" | "strategy" | "next-step";
  validSubmissionCountAtOpen: number;
}>;

export type PracticeSolutionExposure = Readonly<{
  solutionId: string;
  validSubmissionCountAtOpen: number;
}>;

export type ActivePractice = Readonly<{
  status: "active";
  submissions: readonly PracticeSubmission[];
  hintExposures: readonly PracticeHintExposure[];
  solutionExposure: PracticeSolutionExposure | null;
}>;

export type FinishedPractice = Readonly<{
  status: "finished";
  submissions: readonly PracticeSubmission[];
  hintExposures: readonly PracticeHintExposure[];
  solutionExposure: PracticeSolutionExposure | null;
}>;

export type PracticeState = ActivePractice | FinishedPractice;

export type PracticeSummary = Readonly<{
  outcome: "no-valid-submissions" | "incorrect-only" | "eventually-correct";
  validSubmissionCount: number;
  hintExposures: readonly PracticeHintExposure[];
  solutionExposure: PracticeSolutionExposure | null;
}>;

export function startPractice(): ActivePractice {
  return {
    status: "active",
    submissions: [],
    hintExposures: [],
    solutionExposure: null,
  };
}

export function recordHintExposure(
  state: ActivePractice,
  hint: Readonly<{
    hintId: string;
    level: "focus" | "strategy" | "next-step";
  }>,
): ActivePractice {
  if (state.hintExposures.some((exposure) => exposure.hintId === hint.hintId)) {
    return state;
  }

  return {
    ...state,
    hintExposures: [
      ...state.hintExposures,
      {
        ...hint,
        validSubmissionCountAtOpen: state.submissions.length,
      },
    ],
  };
}

export function recordSolutionExposure(
  state: ActivePractice,
  solution: Readonly<{ solutionId: string }>,
): ActivePractice {
  if (state.solutionExposure) {
    return state;
  }

  return {
    ...state,
    solutionExposure: {
      solutionId: solution.solutionId,
      validSubmissionCountAtOpen: state.submissions.length,
    },
  };
}

export function recordAnswerResult(
  state: ActivePractice,
  result: NumericAnswerResult,
): ActivePractice {
  if (result.status === "invalid") {
    return state;
  }

  return {
    ...state,
    submissions: [
      ...state.submissions,
      { answer: result.normalizedAnswer, outcome: result.status },
    ],
  };
}

export function finishPractice(state: ActivePractice): FinishedPractice {
  return {
    status: "finished",
    submissions: state.submissions,
    hintExposures: state.hintExposures,
    solutionExposure: state.solutionExposure,
  };
}

export function getPracticeSummary(state: FinishedPractice): PracticeSummary {
  const validSubmissionCount = state.submissions.length;

  if (validSubmissionCount === 0) {
    return {
      outcome: "no-valid-submissions",
      validSubmissionCount,
      hintExposures: state.hintExposures,
      solutionExposure: state.solutionExposure,
    };
  }

  return {
    outcome: state.submissions.some(
      (submission) => submission.outcome === "correct",
    )
      ? "eventually-correct"
      : "incorrect-only",
    validSubmissionCount,
    hintExposures: state.hintExposures,
    solutionExposure: state.solutionExposure,
  };
}

import type { NumericAnswerResult } from "../domain/numeric-answer";

export type PracticeSubmission = Readonly<{
  answer: string;
  outcome: "correct" | "incorrect";
}>;

export type ActivePractice = Readonly<{
  status: "active";
  submissions: readonly PracticeSubmission[];
}>;

export type FinishedPractice = Readonly<{
  status: "finished";
  submissions: readonly PracticeSubmission[];
}>;

export type PracticeState = ActivePractice | FinishedPractice;

export type PracticeSummary = Readonly<{
  outcome: "no-valid-submissions" | "incorrect-only" | "eventually-correct";
  validSubmissionCount: number;
}>;

export function startPractice(): ActivePractice {
  return { status: "active", submissions: [] };
}

export function recordAnswerResult(
  state: ActivePractice,
  result: NumericAnswerResult,
): ActivePractice {
  if (result.status === "invalid") {
    return state;
  }

  return {
    status: "active",
    submissions: [
      ...state.submissions,
      { answer: result.normalizedAnswer, outcome: result.status },
    ],
  };
}

export function finishPractice(state: ActivePractice): FinishedPractice {
  return { status: "finished", submissions: state.submissions };
}

export function getPracticeSummary(state: FinishedPractice): PracticeSummary {
  const validSubmissionCount = state.submissions.length;

  if (validSubmissionCount === 0) {
    return { outcome: "no-valid-submissions", validSubmissionCount };
  }

  return {
    outcome: state.submissions.some(
      (submission) => submission.outcome === "correct",
    )
      ? "eventually-correct"
      : "incorrect-only",
    validSubmissionCount,
  };
}

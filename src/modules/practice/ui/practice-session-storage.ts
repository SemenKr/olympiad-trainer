import type {
  ActivePractice,
  PracticeHintExposure,
  PracticeSummary,
} from "../application/practice-state";
import type { ShortNumericAnswerState } from "./short-numeric-answer-state";
import type {
  PracticeSessionResult,
  TwoProblemSessionState,
} from "./two-problem-session-state";

export const PRACTICE_SESSION_STORAGE_KEY = "olympiad-trainer:practice-session";

const problems = [
  {
    id: "coinciding-seats",
    title: "Совпадающие места",
    hints: [
      "coinciding-seats-focus-simultaneous-rules",
      "coinciding-seats-strategy-repeat-interval",
      "coinciding-seats-next-step-list-common-seats",
    ],
    solution: "coinciding-seats-full-solution",
  },
  {
    id: "guaranteed-sock-pair",
    title: "Носки в пакете",
    hints: [
      "guaranteed-sock-pair-focus-guarantee",
      "guaranteed-sock-pair-strategy-worst-case",
      "guaranteed-sock-pair-next-step-bound-without-pair",
    ],
    solution: "guaranteed-sock-pair-full-solution",
  },
] as const;

export type PracticeSessionSnapshot = Readonly<{
  problemIds: readonly [string, string];
  activeProblemIndex: 0 | 1;
  completedResults: readonly PracticeSessionResult[];
  activePractice: ActivePractice;
  rawAnswer: string;
}>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return (
    Object.keys(value).every((key) => keys.includes(key)) &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function validCount(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximum
  );
}

function validExposures(
  value: unknown,
  problem: (typeof problems)[number],
  submissionCount: number,
): value is PracticeHintExposure[] {
  if (!Array.isArray(value) || value.length > 3) return false;

  return value.every(
    (exposure, index) =>
      record(exposure) &&
      exactKeys(exposure, ["hintId", "level", "validSubmissionCountAtOpen"]) &&
      exposure.hintId === problem.hints[index] &&
      exposure.level === ["focus", "strategy", "next-step"][index] &&
      validCount(exposure.validSubmissionCountAtOpen, submissionCount) &&
      (index === 0 ||
        exposure.validSubmissionCountAtOpen >=
          value[index - 1].validSubmissionCountAtOpen),
  );
}

function validSolution(
  value: unknown,
  problem: (typeof problems)[number],
  submissionCount: number,
  hintExposures: readonly PracticeHintExposure[],
): boolean {
  return (
    value === null ||
    (record(value) &&
      exactKeys(value, ["solutionId", "validSubmissionCountAtOpen"]) &&
      value.solutionId === problem.solution &&
      hintExposures.length === 3 &&
      submissionCount > 0 &&
      validCount(value.validSubmissionCountAtOpen, submissionCount) &&
      value.validSubmissionCountAtOpen > 0 &&
      value.validSubmissionCountAtOpen >=
        hintExposures[2].validSubmissionCountAtOpen)
  );
}

function validSummary(
  value: unknown,
  problem: (typeof problems)[number],
): value is PracticeSummary {
  if (
    !record(value) ||
    !exactKeys(value, [
      "outcome",
      "validSubmissionCount",
      "hintExposures",
      "solutionExposure",
    ]) ||
    !validCount(value.validSubmissionCount, Number.MAX_SAFE_INTEGER) ||
    !validExposures(value.hintExposures, problem, value.validSubmissionCount) ||
    !validSolution(
      value.solutionExposure,
      problem,
      value.validSubmissionCount,
      value.hintExposures,
    )
  ) {
    return false;
  }

  if (value.validSubmissionCount === 0) {
    return value.outcome === "no-valid-submissions";
  }
  if (value.outcome === "incorrect-only") return true;
  if (value.outcome !== "eventually-correct") return false;

  // A correct submission must have happened after every recorded reveal.
  const summary = value as PracticeSummary;
  return (
    summary.hintExposures.every(
      (exposure) =>
        exposure.validSubmissionCountAtOpen < summary.validSubmissionCount,
    ) &&
    (summary.solutionExposure === null ||
      summary.solutionExposure.validSubmissionCountAtOpen <
        summary.validSubmissionCount)
  );
}

function validResult(value: unknown): value is PracticeSessionResult {
  const problem = problems[0];
  if (
    !record(value) ||
    !exactKeys(
      value,
      value.taskOutcome === undefined
        ? ["problemId", "problemTitle", "summary"]
        : ["problemId", "problemTitle", "summary", "taskOutcome"],
    ) ||
    value.problemId !== problem.id ||
    value.problemTitle !== problem.title ||
    !validSummary(value.summary, problem)
  ) {
    return false;
  }

  if (value.taskOutcome === "skipped") {
    return (
      value.summary.outcome !== "eventually-correct" &&
      value.summary.solutionExposure === null
    );
  }

  return (
    value.taskOutcome === undefined &&
    (value.summary.outcome === "eventually-correct" ||
      value.summary.solutionExposure !== null)
  );
}

function validActivePractice(
  value: unknown,
  problem: (typeof problems)[number],
): value is ActivePractice {
  if (
    !record(value) ||
    !exactKeys(value, [
      "status",
      "submissions",
      "hintExposures",
      "solutionExposure",
    ]) ||
    value.status !== "active" ||
    !Array.isArray(value.submissions) ||
    !value.submissions.every(
      (submission) =>
        record(submission) &&
        exactKeys(submission, ["answer", "outcome"]) &&
        typeof submission.answer === "string" &&
        /^(?:0|[1-9][0-9]*)$/.test(submission.answer) &&
        (submission.outcome === "correct" ||
          submission.outcome === "incorrect"),
    ) ||
    !validExposures(value.hintExposures, problem, value.submissions.length) ||
    !validSolution(
      value.solutionExposure,
      problem,
      value.submissions.length,
      value.hintExposures,
    )
  ) {
    return false;
  }

  const firstCorrect = value.submissions.findIndex(
    (submission) => submission.outcome === "correct",
  );
  if (
    firstCorrect >= 0 &&
    value.hintExposures.some(
      (exposure) => exposure.validSubmissionCountAtOpen >= firstCorrect + 1,
    )
  )
    return false;
  const solutionExposure =
    value.solutionExposure as ActivePractice["solutionExposure"];
  if (
    solutionExposure &&
    (solutionExposure.validSubmissionCountAtOpen === 0 ||
      (firstCorrect >= 0 &&
        solutionExposure.validSubmissionCountAtOpen > firstCorrect))
  )
    return false;
  return true;
}

export function validatePracticeSessionSnapshot(
  value: unknown,
): PracticeSessionSnapshot | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      "problemIds",
      "activeProblemIndex",
      "completedResults",
      "activePractice",
      "rawAnswer",
    ]) ||
    !Array.isArray(value.problemIds) ||
    value.problemIds.length !== 2 ||
    value.problemIds[0] !== problems[0].id ||
    value.problemIds[1] !== problems[1].id ||
    (value.activeProblemIndex !== 0 && value.activeProblemIndex !== 1) ||
    !Array.isArray(value.completedResults) ||
    value.completedResults.length !== value.activeProblemIndex ||
    (value.activeProblemIndex === 1 &&
      !validResult(value.completedResults[0])) ||
    !validActivePractice(
      value.activePractice,
      problems[value.activeProblemIndex],
    ) ||
    typeof value.rawAnswer !== "string"
  ) {
    return null;
  }

  return value as PracticeSessionSnapshot;
}

export function readPracticeSessionSnapshot(
  storage?: Storage,
): PracticeSessionSnapshot | null {
  try {
    const store = storage ?? window.localStorage;
    const raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
    if (raw === null) return null;
    const snapshot = validatePracticeSessionSnapshot(JSON.parse(raw));
    if (!snapshot) store.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    return snapshot;
  } catch {
    return null;
  }
}

export function savePracticeSessionSnapshot(
  session: TwoProblemSessionState,
  answer: ShortNumericAnswerState,
  storage?: Storage,
): boolean {
  const snapshot: PracticeSessionSnapshot = {
    problemIds: [problems[0].id, problems[1].id],
    activeProblemIndex: session.activeProblemIndex,
    completedResults: session.completedResults,
    activePractice: answer.practice,
    rawAnswer: answer.rawAnswer,
  };
  try {
    (storage ?? window.localStorage).setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearPracticeSessionSnapshot(storage?: Storage): boolean {
  try {
    (storage ?? window.localStorage).removeItem(PRACTICE_SESSION_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function restoreAnswerState(
  snapshot: PracticeSessionSnapshot,
): ShortNumericAnswerState {
  const lastSubmission = snapshot.activePractice.submissions.at(-1);
  return {
    practice: snapshot.activePractice,
    rawAnswer: snapshot.rawAnswer,
    status:
      lastSubmission && snapshot.rawAnswer === lastSubmission.answer
        ? lastSubmission.outcome
        : "typing",
  };
}

export function getStoredProblemTitle(
  snapshot: PracticeSessionSnapshot,
): string {
  return problems[snapshot.activeProblemIndex].title;
}

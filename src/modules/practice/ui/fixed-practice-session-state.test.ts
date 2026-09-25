import { describe, expect, it } from "vitest";

import {
  advancePracticeSession,
  finishPracticeSession,
  skipFinalPracticeSession,
  startPracticeSession,
  type PracticeSessionResult,
} from "./fixed-practice-session-state";

const summary = {
  outcome: "no-valid-submissions" as const,
  validSubmissionCount: 0,
  hintExposures: [],
  solutionExposure: null,
};
const first: PracticeSessionResult = {
  problemId: "coinciding-seats",
  problemTitle: "Совпадающие места",
  summary,
  taskOutcome: "skipped",
};
const second: PracticeSessionResult = {
  problemId: "guaranteed-sock-pair",
  problemTitle: "Носки в пакете",
  summary,
  taskOutcome: "skipped",
};
const third: PracticeSessionResult = {
  problemId: "table-impossible-sums",
  problemTitle: "Невозможные суммы",
  summary,
  taskOutcome: "skipped",
};

describe("fixed Practice session navigation", () => {
  it("advances 0 → 1 → 2 and never beyond the third problem", () => {
    const start = startPracticeSession();
    const afterFirst = advancePracticeSession(start, first)!;
    const afterSecond = advancePracticeSession(afterFirst, second)!;
    expect([
      start.activeProblemIndex,
      afterFirst.activeProblemIndex,
      afterSecond.activeProblemIndex,
    ]).toEqual([0, 1, 2]);
    expect(advancePracticeSession(afterSecond, third)).toBeNull();
    expect(finishPracticeSession(afterSecond, third)).toEqual([
      first,
      second,
      third,
    ]);
    expect(skipFinalPracticeSession(afterSecond, third)).toEqual({
      sessionId: start.sessionId,
      status: "no-next",
      completedResults: [first, second, third],
    });
    expect(skipFinalPracticeSession(afterFirst, second)).toBeNull();
  });
});

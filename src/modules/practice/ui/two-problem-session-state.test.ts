import { describe, expect, it } from "vitest";

import type { LearnerSafePracticeProblem } from "../application/practice-problem-presentation";
import {
  recordAnswerResult,
  recordHintExposure,
  recordSolutionExposure,
} from "../application/practice-state";
import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";
import {
  advanceTwoProblemSession,
  createPracticeSessionResult,
  finishTwoProblemSession,
  isPracticeProblemNavigationComplete,
  startTwoProblemSession,
} from "./two-problem-session-state";

const problems = [
  {
    problemId: "coinciding-seats",
    title: "Совпадающие места",
  },
  {
    problemId: "guaranteed-sock-pair",
    title: "Носки в пакете",
  },
] as const;

function problem(value: (typeof problems)[number]): LearnerSafePracticeProblem {
  return {
    ...value,
    statement: "statement",
    hints: [
      { hintId: `${value.problemId}-focus`, level: "focus" },
      { hintId: `${value.problemId}-strategy`, level: "strategy" },
      { hintId: `${value.problemId}-next-step`, level: "next-step" },
    ],
    solution: { solutionId: `${value.problemId}-solution` },
  };
}

function withResult(
  state: ShortNumericAnswerState,
  outcome: "correct" | "incorrect",
): ShortNumericAnswerState {
  return {
    ...state,
    status: outcome,
    practice: recordAnswerResult(state.practice, {
      status: outcome,
      normalizedAnswer: outcome === "correct" ? "17" : "16",
    }),
  };
}

describe("fixed two-problem session", () => {
  it("starts on the first problem with no completed results", () => {
    expect(startTwoProblemSession()).toEqual({
      activeProblemIndex: 0,
      completedResults: [],
    });
  });

  it("allows navigation only after correct or solution exposure", () => {
    const initial = createShortNumericAnswerState();
    const incorrect = withResult(initial, "incorrect");
    const hinted: ShortNumericAnswerState = {
      ...incorrect,
      practice: recordHintExposure(incorrect.practice, {
        hintId: "focus",
        level: "focus",
      }),
    };
    const correct = withResult(hinted, "correct");
    const solutionExposed: ShortNumericAnswerState = {
      ...hinted,
      practice: recordSolutionExposure(hinted.practice, {
        solutionId: "solution",
      }),
    };

    expect(isPracticeProblemNavigationComplete(initial)).toBe(false);
    expect(isPracticeProblemNavigationComplete(incorrect)).toBe(false);
    expect(isPracticeProblemNavigationComplete(hinted)).toBe(false);
    expect(isPracticeProblemNavigationComplete(correct)).toBe(true);
    expect(isPracticeProblemNavigationComplete(solutionExposed)).toBe(true);
    expect(
      isPracticeProblemNavigationComplete({ ...correct, status: "loading" }),
    ).toBe(false);
    expect(
      isPracticeProblemNavigationComplete(
        editShortNumericAnswer(correct, "unsubmitted draft"),
      ),
    ).toBe(true);
    expect(
      isPracticeProblemNavigationComplete({
        ...initial,
        rawAnswer: "seven",
        status: "invalid",
      }),
    ).toBe(false);
  });

  it("preserves problem 1 result and advances exactly once", () => {
    const initial = startTwoProblemSession();
    const firstResult = createPracticeSessionResult(problem(problems[0]), {
      outcome: "eventually-correct",
      validSubmissionCount: 1,
      hintExposures: [],
      solutionExposure: null,
    });
    const advanced = advanceTwoProblemSession(initial, firstResult);

    expect(advanced).toEqual({
      activeProblemIndex: 1,
      completedResults: [firstResult],
    });
    expect(advanceTwoProblemSession(advanced!, firstResult)).toBeNull();
  });

  it("starts problem 2 with a completely fresh episode", () => {
    let first = withResult(createShortNumericAnswerState(), "incorrect");
    first = {
      ...first,
      practice: recordHintExposure(first.practice, {
        hintId: "problem-1-focus",
        level: "focus",
      }),
    };
    first = {
      ...first,
      practice: recordSolutionExposure(first.practice, {
        solutionId: "problem-1-solution",
      }),
    };
    first = editShortNumericAnswer(first, "draft");

    const second = createShortNumericAnswerState();

    expect(second).toMatchObject({
      rawAnswer: "",
      status: "typing",
      practice: {
        submissions: [],
        hintExposures: [],
        solutionExposure: null,
      },
    });
    expect(second.practice.submissions).not.toBe(first.practice.submissions);
    expect(second.practice.hintExposures).not.toBe(
      first.practice.hintExposures,
    );
  });

  it("finishes with ordered results for both problems", () => {
    const firstResult = createPracticeSessionResult(problem(problems[0]), {
      outcome: "eventually-correct",
      validSubmissionCount: 1,
      hintExposures: [],
      solutionExposure: null,
    });
    const secondResult = createPracticeSessionResult(problem(problems[1]), {
      outcome: "eventually-correct",
      validSubmissionCount: 2,
      hintExposures: [
        {
          hintId: "guaranteed-sock-pair-focus",
          level: "focus",
          validSubmissionCountAtOpen: 1,
        },
      ],
      solutionExposure: null,
    });
    const advanced = advanceTwoProblemSession(
      startTwoProblemSession(),
      firstResult,
    )!;

    expect(finishTwoProblemSession(advanced, secondResult)).toEqual([
      firstResult,
      secondResult,
    ]);
  });
});

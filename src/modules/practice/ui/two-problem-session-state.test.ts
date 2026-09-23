import { describe, expect, it, vi } from "vitest";

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
  isPracticeProblemSkipAvailable,
  requestPracticeSkip,
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

  it("offers Skip only for an unfinished problem with a next problem", () => {
    const initial = createShortNumericAnswerState();
    const invalid = {
      ...initial,
      rawAnswer: "seven",
      status: "invalid",
    } as const;
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

    expect(isPracticeProblemSkipAvailable(initial, true)).toBe(true);
    expect(isPracticeProblemSkipAvailable(invalid, true)).toBe(true);
    expect(isPracticeProblemSkipAvailable(incorrect, true)).toBe(true);
    expect(isPracticeProblemSkipAvailable(hinted, true)).toBe(true);
    expect(
      isPracticeProblemSkipAvailable({ ...initial, status: "loading" }, true),
    ).toBe(false);
    expect(isPracticeProblemSkipAvailable(initial, true, true)).toBe(false);
    expect(isPracticeProblemSkipAvailable(correct, true)).toBe(false);
    expect(isPracticeProblemSkipAvailable(solutionExposed, true)).toBe(false);
    expect(isPracticeProblemSkipAvailable(initial, false)).toBe(false);
  });

  it("creates a factual summary when skipping untouched, invalid, incorrect, or hinted work", () => {
    const initial = createShortNumericAnswerState();
    const invalid = {
      ...initial,
      rawAnswer: "seven",
      status: "invalid",
    } as const;
    const incorrect = withResult(initial, "incorrect");
    const hinted: ShortNumericAnswerState = {
      ...initial,
      practice: recordHintExposure(initial.practice, {
        hintId: "focus",
        level: "focus",
      }),
    };

    expect(requestPracticeSkip(initial, true, () => true)).toMatchObject({
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
      hintExposures: [],
    });
    expect(requestPracticeSkip(invalid, true, () => true)).toMatchObject({
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
    });
    expect(requestPracticeSkip(incorrect, true, () => true)).toMatchObject({
      outcome: "incorrect-only",
      validSubmissionCount: 1,
    });
    expect(requestPracticeSkip(hinted, true, () => true)).toMatchObject({
      outcome: "no-valid-submissions",
      hintExposures: [{ hintId: "focus", level: "focus" }],
    });
  });

  it("blocks Skip during pending work, after completion, and on problem 2", () => {
    const initial = createShortNumericAnswerState();
    const incorrect = withResult(initial, "incorrect");
    const correct = withResult(initial, "correct");
    const solutionExposed: ShortNumericAnswerState = {
      ...incorrect,
      practice: recordSolutionExposure(incorrect.practice, {
        solutionId: "solution",
      }),
    };
    const confirmDiscard = vi.fn(() => true);

    expect(
      requestPracticeSkip(
        { ...initial, status: "loading" },
        true,
        confirmDiscard,
      ),
    ).toBeNull();
    expect(requestPracticeSkip(initial, true, confirmDiscard, true)).toBeNull();
    expect(requestPracticeSkip(correct, true, confirmDiscard)).toBeNull();
    expect(
      requestPracticeSkip(solutionExposed, true, confirmDiscard),
    ).toBeNull();
    expect(requestPracticeSkip(initial, false, confirmDiscard)).toBeNull();
    expect(confirmDiscard).not.toHaveBeenCalled();
  });

  it("keeps a dirty draft and episode when Skip is cancelled", () => {
    const incorrect = withResult(createShortNumericAnswerState(), "incorrect");
    const hinted: ShortNumericAnswerState = {
      ...incorrect,
      practice: recordHintExposure(incorrect.practice, {
        hintId: "focus",
        level: "focus",
      }),
    };
    const dirty = editShortNumericAnswer(hinted, "draft");
    const confirmDiscard = vi.fn(() => false);

    expect(requestPracticeSkip(dirty, true, confirmDiscard)).toBeNull();
    expect(confirmDiscard).toHaveBeenCalledOnce();
    expect(dirty.rawAnswer).toBe("draft");
    expect(dirty.practice.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
    ]);
    expect(dirty.practice.hintExposures).toHaveLength(1);
  });

  it("confirms a dirty Skip and preserves factual episode evidence", () => {
    const incorrect = withResult(createShortNumericAnswerState(), "incorrect");
    const hinted: ShortNumericAnswerState = {
      ...incorrect,
      practice: recordHintExposure(incorrect.practice, {
        hintId: "focus",
        level: "focus",
      }),
    };
    const dirty = editShortNumericAnswer(hinted, "draft");
    const summary = requestPracticeSkip(dirty, true, () => true);

    expect(summary).toMatchObject({
      outcome: "incorrect-only",
      validSubmissionCount: 1,
      hintExposures: [{ hintId: "focus", level: "focus" }],
      solutionExposure: null,
    });

    const skippedResult = createPracticeSessionResult(
      problem(problems[0]),
      summary!,
      "skipped",
    );
    const advanced = advanceTwoProblemSession(
      startTwoProblemSession(),
      skippedResult,
    );

    expect(advanced).toEqual({
      activeProblemIndex: 1,
      completedResults: [skippedResult],
    });
    expect(skippedResult.taskOutcome).toBe("skipped");
  });

  it("does not infer Skip from a result without correctness", () => {
    const summary = requestPracticeSkip(
      createShortNumericAnswerState(),
      true,
      () => true,
    )!;

    expect(
      createPracticeSessionResult(problem(problems[0]), summary),
    ).not.toHaveProperty("taskOutcome");
    expect(
      createPracticeSessionResult(problem(problems[0]), summary, "skipped"),
    ).toHaveProperty("taskOutcome", "skipped");
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

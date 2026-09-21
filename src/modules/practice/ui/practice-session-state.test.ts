import { describe, expect, it, vi } from "vitest";

import { recordAnswerResult } from "../application/practice-state";
import {
  isFocusHintAvailable,
  isStrategyHintAvailable,
  openFocusHint,
  openStrategyHint,
  requestPracticeFinish,
} from "./practice-session-state";
import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";

const focusHintId = "coinciding-seats-focus-simultaneous-rules";
const strategyHintId = "coinciding-seats-strategy-repeat-interval";

function withAnswerResult(
  state: ShortNumericAnswerState,
  outcome: "correct" | "incorrect",
  normalizedAnswer: string,
): ShortNumericAnswerState {
  return {
    ...state,
    rawAnswer: normalizedAnswer,
    status: outcome,
    practice: recordAnswerResult(state.practice, {
      status: outcome,
      normalizedAnswer,
    }),
  };
}

describe("practice session finish", () => {
  it("finishes with no task outcome when there are no valid submissions", () => {
    const confirmDiscard = vi.fn(() => false);

    expect(
      requestPracticeFinish(createShortNumericAnswerState(), confirmDiscard),
    ).toEqual({
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
      hintExposures: [],
    });
    expect(confirmDiscard).not.toHaveBeenCalled();
  });

  it("treats a submitted invalid answer as no valid submissions", () => {
    const invalid: ShortNumericAnswerState = {
      ...createShortNumericAnswerState(),
      rawAnswer: "12,5",
      status: "invalid",
    };

    expect(requestPracticeFinish(invalid, () => false)).toEqual({
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
      hintExposures: [],
    });
  });

  it("finishes incorrect attempts without creating a task outcome", () => {
    const first = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "15",
    );
    const second = withAnswerResult(first, "incorrect", "16");

    expect(requestPracticeFinish(second, () => false)).toEqual({
      outcome: "incorrect-only",
      validSubmissionCount: 2,
      hintExposures: [],
    });
  });

  it("maps an incorrect attempt followed by a correct retry", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const correct = withAnswerResult(incorrect, "correct", "17");

    expect(requestPracticeFinish(correct, () => false)).toEqual({
      outcome: "eventually-correct",
      validSubmissionCount: 2,
      hintExposures: [],
    });
  });

  it("does not finish while answer submission is pending", () => {
    const pending: ShortNumericAnswerState = {
      ...editShortNumericAnswer(createShortNumericAnswerState(), "17"),
      status: "loading",
    };
    const confirmDiscard = vi.fn(() => true);

    expect(requestPracticeFinish(pending, confirmDiscard)).toBeNull();
    expect(confirmDiscard).not.toHaveBeenCalled();
    expect(pending.practice.status).toBe("active");
  });

  it("requires confirmation for a dirty answer and preserves active state when cancelled", () => {
    const dirty = editShortNumericAnswer(createShortNumericAnswerState(), "17");
    const submissionsBefore = dirty.practice.submissions;
    const confirmDiscard = vi.fn(() => false);

    expect(requestPracticeFinish(dirty, confirmDiscard)).toBeNull();
    expect(confirmDiscard).toHaveBeenCalledOnce();
    expect(dirty.practice).toEqual({
      status: "active",
      submissions: [],
      hintExposures: [],
    });
    expect(dirty.practice.submissions).toBe(submissionsBefore);
  });

  it("finishes after the learner confirms discarding a dirty answer", () => {
    const dirty = editShortNumericAnswer(createShortNumericAnswerState(), "17");

    expect(requestPracticeFinish(dirty, () => true)).toEqual({
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
      hintExposures: [],
    });
  });

  it("keeps an opened hint factual when only incorrect submissions exist", () => {
    const incorrect = withAnswerResult(
      openFocusHint(createShortNumericAnswerState(), focusHintId),
      "incorrect",
      "16",
    );

    expect(requestPracticeFinish(incorrect, () => false)).toMatchObject({
      outcome: "incorrect-only",
      validSubmissionCount: 1,
      hintExposures: [{ hintId: focusHintId, level: "focus" }],
    });
  });
});

describe("practice focus hint", () => {
  it("is available before the first valid submission", () => {
    expect(
      isFocusHintAvailable(createShortNumericAnswerState(), focusHintId),
    ).toBe(true);
  });

  it("remains available after an invalid submission", () => {
    const invalid: ShortNumericAnswerState = {
      ...createShortNumericAnswerState(),
      rawAnswer: "12,5",
      status: "invalid",
    };

    expect(isFocusHintAvailable(invalid, focusHintId)).toBe(true);
  });

  it("remains available after an incorrect submission and later editing", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const editing = editShortNumericAnswer(incorrect, "17");

    expect(isFocusHintAvailable(incorrect, focusHintId)).toBe(true);
    expect(isFocusHintAvailable(editing, focusHintId)).toBe(true);
  });

  it("is unavailable after a correct submission", () => {
    const correct = withAnswerResult(
      createShortNumericAnswerState(),
      "correct",
      "17",
    );

    expect(isFocusHintAvailable(correct, focusHintId)).toBe(false);
  });

  it("cannot open while answer submission is pending", () => {
    const pending: ShortNumericAnswerState = {
      ...editShortNumericAnswer(createShortNumericAnswerState(), "17"),
      status: "loading",
    };

    expect(isFocusHintAvailable(pending, focusHintId)).toBe(false);
    expect(openFocusHint(pending, focusHintId)).toBe(pending);
  });

  it("records the first actual opening once without altering submissions", () => {
    const initial = createShortNumericAnswerState();
    const opened = openFocusHint(initial, focusHintId);
    const reopened = openFocusHint(opened, focusHintId);

    expect(opened.practice.hintExposures).toEqual([
      { hintId: focusHintId, level: "focus", validSubmissionCountAtOpen: 0 },
    ]);
    expect(opened.practice.submissions).toBe(initial.practice.submissions);
    expect(opened.status).toBe(initial.status);
    expect(reopened).toBe(opened);
  });

  it("records one valid submission when opened after an incorrect answer", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );

    expect(
      openFocusHint(incorrect, focusHintId).practice.hintExposures,
    ).toEqual([
      {
        hintId: focusHintId,
        level: "focus",
        validSubmissionCountAtOpen: 1,
      },
    ]);
  });
});

describe("practice strategy hint", () => {
  it("is unavailable before focus exposure", () => {
    const initial = createShortNumericAnswerState();

    expect(isStrategyHintAvailable(initial, focusHintId, strategyHintId)).toBe(
      false,
    );
    expect(openStrategyHint(initial, focusHintId, strategyHintId)).toBe(
      initial,
    );
  });

  it("is available immediately after focus with no valid attempt required", () => {
    const focusOpened = openFocusHint(
      createShortNumericAnswerState(),
      focusHintId,
    );

    expect(
      isStrategyHintAvailable(focusOpened, focusHintId, strategyHintId),
    ).toBe(true);
  });

  it("records focus and strategy with zero submissions before an attempt", () => {
    const initial = createShortNumericAnswerState();
    const focusOpened = openFocusHint(initial, focusHintId);
    const strategyOpened = openStrategyHint(
      focusOpened,
      focusHintId,
      strategyHintId,
    );

    expect(strategyOpened.practice.hintExposures).toEqual([
      {
        hintId: focusHintId,
        level: "focus",
        validSubmissionCountAtOpen: 0,
      },
      {
        hintId: strategyHintId,
        level: "strategy",
        validSubmissionCountAtOpen: 0,
      },
    ]);
    expect(strategyOpened.practice.submissions).toBe(
      initial.practice.submissions,
    );
    expect(strategyOpened.status).toBe(initial.status);
  });

  it("records strategy after one incorrect submission with count one", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const focusOpened = openFocusHint(incorrect, focusHintId);
    const strategyOpened = openStrategyHint(
      focusOpened,
      focusHintId,
      strategyHintId,
    );

    expect(strategyOpened.practice.hintExposures).toEqual([
      {
        hintId: focusHintId,
        level: "focus",
        validSubmissionCountAtOpen: 1,
      },
      {
        hintId: strategyHintId,
        level: "strategy",
        validSubmissionCountAtOpen: 1,
      },
    ]);
  });

  it("ignores invalid input for strategy eligibility and exposure count", () => {
    const invalid: ShortNumericAnswerState = {
      ...openFocusHint(createShortNumericAnswerState(), focusHintId),
      rawAnswer: "12,5",
      status: "invalid",
    };
    const strategyOpened = openStrategyHint(
      invalid,
      focusHintId,
      strategyHintId,
    );

    expect(strategyOpened.practice.hintExposures[1]).toEqual({
      hintId: strategyHintId,
      level: "strategy",
      validSubmissionCountAtOpen: 0,
    });
  });

  it("cannot open while answer submission is pending", () => {
    const focusOpened = openFocusHint(
      editShortNumericAnswer(createShortNumericAnswerState(), "17"),
      focusHintId,
    );
    const pending: ShortNumericAnswerState = {
      ...focusOpened,
      status: "loading",
    };

    expect(isStrategyHintAvailable(pending, focusHintId, strategyHintId)).toBe(
      false,
    );
    expect(openStrategyHint(pending, focusHintId, strategyHintId)).toBe(
      pending,
    );
  });

  it("cannot open after a correct submission", () => {
    const focusOpened = openFocusHint(
      createShortNumericAnswerState(),
      focusHintId,
    );
    const correct = withAnswerResult(focusOpened, "correct", "17");

    expect(isStrategyHintAvailable(correct, focusHintId, strategyHintId)).toBe(
      false,
    );
    expect(openStrategyHint(correct, focusHintId, strategyHintId)).toBe(
      correct,
    );
  });

  it("records strategy once and exposes no further strategy action", () => {
    const focusOpened = openFocusHint(
      createShortNumericAnswerState(),
      focusHintId,
    );
    const strategyOpened = openStrategyHint(
      focusOpened,
      focusHintId,
      strategyHintId,
    );
    const reopened = openStrategyHint(
      strategyOpened,
      focusHintId,
      strategyHintId,
    );

    expect(strategyOpened.practice.hintExposures).toHaveLength(2);
    expect(
      isStrategyHintAvailable(strategyOpened, focusHintId, strategyHintId),
    ).toBe(false);
    expect(reopened).toBe(strategyOpened);
  });

  it("keeps both hint exposures through a later correct result and Finish", () => {
    const focusOpened = openFocusHint(
      createShortNumericAnswerState(),
      focusHintId,
    );
    const strategyOpened = openStrategyHint(
      focusOpened,
      focusHintId,
      strategyHintId,
    );
    const correct = withAnswerResult(strategyOpened, "correct", "17");

    expect(requestPracticeFinish(correct, () => false)).toMatchObject({
      outcome: "eventually-correct",
      hintExposures: [
        { hintId: focusHintId, level: "focus" },
        { hintId: strategyHintId, level: "strategy" },
      ],
    });
  });

  it("keeps incorrect-only without a task outcome after both hints", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const focusOpened = openFocusHint(incorrect, focusHintId);
    const strategyOpened = openStrategyHint(
      focusOpened,
      focusHintId,
      strategyHintId,
    );

    expect(requestPracticeFinish(strategyOpened, () => false)).toMatchObject({
      outcome: "incorrect-only",
      validSubmissionCount: 1,
      hintExposures: [
        { hintId: focusHintId, level: "focus" },
        { hintId: strategyHintId, level: "strategy" },
      ],
    });
  });
});

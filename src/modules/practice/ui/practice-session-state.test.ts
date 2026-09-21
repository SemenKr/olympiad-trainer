import { describe, expect, it, vi } from "vitest";

import { recordAnswerResult } from "../application/practice-state";
import {
  isFocusHintAvailable,
  openFocusHint,
  requestPracticeFinish,
} from "./practice-session-state";
import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";

const hintId = "coinciding-seats-focus-simultaneous-rules";

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
      openFocusHint(createShortNumericAnswerState(), hintId),
      "incorrect",
      "16",
    );

    expect(requestPracticeFinish(incorrect, () => false)).toMatchObject({
      outcome: "incorrect-only",
      validSubmissionCount: 1,
      hintExposures: [{ hintId, level: "focus" }],
    });
  });
});

describe("practice focus hint", () => {
  it("is available before the first valid submission", () => {
    expect(isFocusHintAvailable(createShortNumericAnswerState(), hintId)).toBe(
      true,
    );
  });

  it("remains available after an invalid submission", () => {
    const invalid: ShortNumericAnswerState = {
      ...createShortNumericAnswerState(),
      rawAnswer: "12,5",
      status: "invalid",
    };

    expect(isFocusHintAvailable(invalid, hintId)).toBe(true);
  });

  it("remains available after an incorrect submission and later editing", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const editing = editShortNumericAnswer(incorrect, "17");

    expect(isFocusHintAvailable(incorrect, hintId)).toBe(true);
    expect(isFocusHintAvailable(editing, hintId)).toBe(true);
  });

  it("is unavailable after a correct submission", () => {
    const correct = withAnswerResult(
      createShortNumericAnswerState(),
      "correct",
      "17",
    );

    expect(isFocusHintAvailable(correct, hintId)).toBe(false);
  });

  it("cannot open while answer submission is pending", () => {
    const pending: ShortNumericAnswerState = {
      ...editShortNumericAnswer(createShortNumericAnswerState(), "17"),
      status: "loading",
    };

    expect(isFocusHintAvailable(pending, hintId)).toBe(false);
    expect(openFocusHint(pending, hintId)).toBe(pending);
  });

  it("records the first actual opening once without altering submissions", () => {
    const initial = createShortNumericAnswerState();
    const opened = openFocusHint(initial, hintId);
    const reopened = openFocusHint(opened, hintId);

    expect(opened.practice.hintExposures).toEqual([
      { hintId, level: "focus", validSubmissionCountAtOpen: 0 },
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

    expect(openFocusHint(incorrect, hintId).practice.hintExposures).toEqual([
      { hintId, level: "focus", validSubmissionCountAtOpen: 1 },
    ]);
  });
});

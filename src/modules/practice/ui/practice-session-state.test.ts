import { describe, expect, it, vi } from "vitest";

import { recordAnswerResult } from "../application/practice-state";
import { requestPracticeFinish } from "./practice-session-state";
import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";

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
    expect(dirty.practice).toEqual({ status: "active", submissions: [] });
    expect(dirty.practice.submissions).toBe(submissionsBefore);
  });

  it("finishes after the learner confirms discarding a dirty answer", () => {
    const dirty = editShortNumericAnswer(createShortNumericAnswerState(), "17");

    expect(requestPracticeFinish(dirty, () => true)).toEqual({
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
    });
  });
});

import { describe, expect, it, vi } from "vitest";

import { recordAnswerResult } from "../application/practice-state";
import {
  isFocusHintAvailable,
  isNextStepHintAvailable,
  isSolutionAvailable,
  isStrategyHintAvailable,
  openFocusHint,
  openNextStepHint,
  openSolution,
  openStrategyHint,
  requestFocusHintReveal,
  requestNextStepHintReveal,
  requestPracticeFinish,
  requestSolutionReveal,
  requestStrategyHintReveal,
  runPracticeHintReveal,
  runPracticeSolutionReveal,
} from "./practice-session-state";
import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  runShortNumericAnswerSubmission,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";

const focusHintId = "coinciding-seats-focus-simultaneous-rules";
const strategyHintId = "coinciding-seats-strategy-repeat-interval";
const nextStepHintId = "coinciding-seats-next-step-list-common-seats";
const solutionId = "coinciding-seats-full-solution";

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

function withAllHintExposures(
  state: ShortNumericAnswerState = createShortNumericAnswerState(),
): ShortNumericAnswerState {
  const focusOpened = openFocusHint(state, focusHintId);
  const strategyOpened = openStrategyHint(
    focusOpened,
    focusHintId,
    strategyHintId,
  );

  return openNextStepHint(strategyOpened, strategyHintId, nextStepHintId);
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
      solutionExposure: null,
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
      solutionExposure: null,
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
      solutionExposure: null,
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
      solutionExposure: null,
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
      solutionExposure: null,
    });
    expect(dirty.practice.submissions).toBe(submissionsBefore);
  });

  it("finishes after the learner confirms discarding a dirty answer", () => {
    const dirty = editShortNumericAnswer(createShortNumericAnswerState(), "17");

    expect(requestPracticeFinish(dirty, () => true)).toEqual({
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
      hintExposures: [],
      solutionExposure: null,
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

  it("does not finish while a support reveal request is pending", () => {
    const active = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const confirmDiscard = vi.fn(() => true);

    expect(requestPracticeFinish(active, confirmDiscard, true)).toBeNull();
    expect(confirmDiscard).not.toHaveBeenCalled();
    expect(active.practice.status).toBe("active");
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

describe("practice next-step hint", () => {
  function withStrategyExposure(
    state: ShortNumericAnswerState = createShortNumericAnswerState(),
  ): ShortNumericAnswerState {
    return openStrategyHint(
      openFocusHint(state, focusHintId),
      focusHintId,
      strategyHintId,
    );
  }

  it("is unavailable before strategy exposure", () => {
    const focusOpened = openFocusHint(
      createShortNumericAnswerState(),
      focusHintId,
    );

    expect(
      isNextStepHintAvailable(focusOpened, strategyHintId, nextStepHintId),
    ).toBe(false);
    expect(openNextStepHint(focusOpened, strategyHintId, nextStepHintId)).toBe(
      focusOpened,
    );
  });

  it("is available immediately after strategy with no new attempt required", () => {
    const strategyOpened = withStrategyExposure();
    const editing = editShortNumericAnswer(strategyOpened, "12");

    expect(
      isNextStepHintAvailable(strategyOpened, strategyHintId, nextStepHintId),
    ).toBe(true);
    expect(
      isNextStepHintAvailable(editing, strategyHintId, nextStepHintId),
    ).toBe(true);
  });

  it("records all three hints with zero submissions before an attempt", () => {
    const initial = createShortNumericAnswerState();
    const strategyOpened = withStrategyExposure(initial);
    const nextStepOpened = openNextStepHint(
      strategyOpened,
      strategyHintId,
      nextStepHintId,
    );

    expect(nextStepOpened.practice.hintExposures).toEqual([
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
      {
        hintId: nextStepHintId,
        level: "next-step",
        validSubmissionCountAtOpen: 0,
      },
    ]);
    expect(nextStepOpened.practice.submissions).toBe(
      initial.practice.submissions,
    );
    expect(nextStepOpened.status).toBe(initial.status);
  });

  it("records next-step after one incorrect submission with count one", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const nextStepOpened = openNextStepHint(
      withStrategyExposure(incorrect),
      strategyHintId,
      nextStepHintId,
    );

    expect(nextStepOpened.practice.hintExposures.at(-1)).toEqual({
      hintId: nextStepHintId,
      level: "next-step",
      validSubmissionCountAtOpen: 1,
    });
  });

  it("ignores invalid input for next-step eligibility and exposure count", () => {
    const invalid: ShortNumericAnswerState = {
      ...withStrategyExposure(),
      rawAnswer: "12,5",
      status: "invalid",
    };
    const nextStepOpened = openNextStepHint(
      invalid,
      strategyHintId,
      nextStepHintId,
    );

    expect(nextStepOpened.practice.hintExposures.at(-1)).toEqual({
      hintId: nextStepHintId,
      level: "next-step",
      validSubmissionCountAtOpen: 0,
    });
  });

  it("cannot open while answer submission is pending", () => {
    const pending: ShortNumericAnswerState = {
      ...withStrategyExposure(
        editShortNumericAnswer(createShortNumericAnswerState(), "17"),
      ),
      status: "loading",
    };

    expect(
      isNextStepHintAvailable(pending, strategyHintId, nextStepHintId),
    ).toBe(false);
    expect(openNextStepHint(pending, strategyHintId, nextStepHintId)).toBe(
      pending,
    );
  });

  it("cannot open after a correct submission", () => {
    const correct = withAnswerResult(withStrategyExposure(), "correct", "17");

    expect(
      isNextStepHintAvailable(correct, strategyHintId, nextStepHintId),
    ).toBe(false);
    expect(openNextStepHint(correct, strategyHintId, nextStepHintId)).toBe(
      correct,
    );
  });

  it("records next-step once and exposes no further hint action", () => {
    const strategyOpened = withStrategyExposure();
    const nextStepOpened = openNextStepHint(
      strategyOpened,
      strategyHintId,
      nextStepHintId,
    );
    const reopened = openNextStepHint(
      nextStepOpened,
      strategyHintId,
      nextStepHintId,
    );

    expect(nextStepOpened.practice.hintExposures).toHaveLength(3);
    expect(
      isNextStepHintAvailable(nextStepOpened, strategyHintId, nextStepHintId),
    ).toBe(false);
    expect(reopened).toBe(nextStepOpened);
  });

  it("keeps all exposures through a later correct result and Finish", () => {
    const nextStepOpened = openNextStepHint(
      withStrategyExposure(),
      strategyHintId,
      nextStepHintId,
    );
    const correct = withAnswerResult(nextStepOpened, "correct", "17");

    expect(requestPracticeFinish(correct, () => false)).toMatchObject({
      outcome: "eventually-correct",
      hintExposures: [
        { hintId: focusHintId, level: "focus" },
        { hintId: strategyHintId, level: "strategy" },
        { hintId: nextStepHintId, level: "next-step" },
      ],
    });
  });

  it("keeps incorrect-only without a task outcome after all hints", () => {
    const incorrect = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const nextStepOpened = openNextStepHint(
      withStrategyExposure(incorrect),
      strategyHintId,
      nextStepHintId,
    );

    expect(requestPracticeFinish(nextStepOpened, () => false)).toMatchObject({
      outcome: "incorrect-only",
      validSubmissionCount: 1,
      hintExposures: [
        { hintId: focusHintId, level: "focus" },
        { hintId: strategyHintId, level: "strategy" },
        { hintId: nextStepHintId, level: "next-step" },
      ],
    });
  });
});

describe("practice full-solution reveal", () => {
  it("is unavailable until all hints and one valid incorrect submission exist", () => {
    const initial = createShortNumericAnswerState();
    const incorrect = withAnswerResult(initial, "incorrect", "16");
    const focusOnly = openFocusHint(incorrect, focusHintId);
    const strategyOpened = openStrategyHint(
      focusOnly,
      focusHintId,
      strategyHintId,
    );
    const allHintsWithoutAttempt = withAllHintExposures(initial);
    const invalid: ShortNumericAnswerState = {
      ...allHintsWithoutAttempt,
      rawAnswer: "12,5",
      status: "invalid",
    };

    expect(
      isSolutionAvailable(
        strategyOpened,
        focusHintId,
        strategyHintId,
        nextStepHintId,
      ),
    ).toBe(false);
    expect(
      isSolutionAvailable(
        allHintsWithoutAttempt,
        focusHintId,
        strategyHintId,
        nextStepHintId,
      ),
    ).toBe(false);
    expect(
      isSolutionAvailable(invalid, focusHintId, strategyHintId, nextStepHintId),
    ).toBe(false);

    const eligible = withAllHintExposures(incorrect);
    expect(
      isSolutionAvailable(
        eligible,
        focusHintId,
        strategyHintId,
        nextStepHintId,
      ),
    ).toBe(true);
  });

  it("is unavailable after correct or while answer submission is pending", () => {
    const eligible = withAllHintExposures(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "16"),
    );
    const correct = withAnswerResult(eligible, "correct", "17");
    const pending: ShortNumericAnswerState = {
      ...eligible,
      status: "loading",
    };

    expect(
      isSolutionAvailable(correct, focusHintId, strategyHintId, nextStepHintId),
    ).toBe(false);
    expect(
      isSolutionAvailable(pending, focusHintId, strategyHintId, nextStepHintId),
    ).toBe(false);
  });

  it("records one solution exposure at the current valid-submission count", () => {
    const secondIncorrect = withAnswerResult(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "15"),
      "incorrect",
      "16",
    );
    const eligible = withAllHintExposures(secondIncorrect);
    const submissionsBefore = eligible.practice.submissions;
    const hintsBefore = eligible.practice.hintExposures;
    const opened = openSolution(
      eligible,
      focusHintId,
      strategyHintId,
      nextStepHintId,
      solutionId,
    );
    const reopened = openSolution(
      opened,
      focusHintId,
      strategyHintId,
      nextStepHintId,
      "different-solution",
    );

    expect(opened.practice.solutionExposure).toEqual({
      solutionId,
      validSubmissionCountAtOpen: 2,
    });
    expect(opened.practice.submissions).toBe(submissionsBefore);
    expect(opened.practice.hintExposures).toBe(hintsBefore);
    expect(reopened).toBe(opened);
  });

  it("records exposure only after a successful matching reveal", async () => {
    let current = withAllHintExposures(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "16"),
    );
    let resolveReveal!: (value: { solutionId: string; text: string }) => void;
    const reveal = new Promise<{ solutionId: string; text: string }>(
      (resolve) => {
        resolveReveal = resolve;
      },
    );
    const request = requestSolutionReveal(
      () => current,
      focusHintId,
      strategyHintId,
      nextStepHintId,
      { solutionId },
      () => reveal,
    );

    expect(current.practice.solutionExposure).toBeNull();
    resolveReveal({ solutionId, text: "solution text" });

    const result = await request;
    current = result!.answerState;
    expect(current.practice.solutionExposure).toEqual({
      solutionId,
      validSubmissionCountAtOpen: 1,
    });
    expect(result!.revealedSolution).toEqual({
      solutionId,
      text: "solution text",
    });
  });

  it("records no exposure on failure or a mismatched solution ID", async () => {
    const current = withAllHintExposures(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "16"),
    );

    await expect(
      requestSolutionReveal(
        () => current,
        focusHintId,
        strategyHintId,
        nextStepHintId,
        { solutionId },
        async () => {
          throw new Error("Reveal unavailable");
        },
      ),
    ).rejects.toThrow("Reveal unavailable");
    await expect(
      requestSolutionReveal(
        () => current,
        focusHintId,
        strategyHintId,
        nextStepHintId,
        { solutionId },
        async () => ({
          solutionId: "unexpected-solution",
          text: "solution text",
        }),
      ),
    ).rejects.toThrow("Revealed solution does not match");
    expect(current.practice.solutionExposure).toBeNull();
  });

  it("discards a stale reveal when a correct answer arrives first", async () => {
    let current = withAllHintExposures(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "16"),
    );
    const request = requestSolutionReveal(
      () => current,
      focusHintId,
      strategyHintId,
      nextStepHintId,
      { solutionId },
      async () => {
        current = withAnswerResult(current, "correct", "17");
        return { solutionId, text: "solution text" };
      },
    );

    await expect(request).resolves.toBeNull();
    expect(current.practice.solutionExposure).toBeNull();
    expect(current.practice.submissions.at(-1)).toEqual({
      answer: "17",
      outcome: "correct",
    });
  });

  it("does not request or replace an already exposed solution", async () => {
    const eligible = withAllHintExposures(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "16"),
    );
    const current = openSolution(
      eligible,
      focusHintId,
      strategyHintId,
      nextStepHintId,
      solutionId,
    );
    const reveal = vi.fn(async () => ({ solutionId, text: "solution text" }));

    await expect(
      requestSolutionReveal(
        () => current,
        focusHintId,
        strategyHintId,
        nextStepHintId,
        { solutionId },
        reveal,
      ),
    ).resolves.toBeNull();
    expect(reveal).not.toHaveBeenCalled();
    expect(current.practice.solutionExposure?.solutionId).toBe(solutionId);
  });

  it("keeps prior evidence when a later submission becomes correct", async () => {
    const eligible = withAllHintExposures(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "16"),
    );
    const solutionOpened = openSolution(
      eligible,
      focusHintId,
      strategyHintId,
      nextStepHintId,
      solutionId,
    );
    let current = editShortNumericAnswer(solutionOpened, "17");

    const result = await runShortNumericAnswerSubmission({
      state: current,
      gate: { current: false },
      submit: async () => ({ status: "correct", normalizedAnswer: "17" }),
      onPending: (pending) => {
        current = pending;
      },
    });

    expect(result).toMatchObject({
      status: "correct",
      practice: {
        submissions: [
          { answer: "16", outcome: "incorrect" },
          { answer: "17", outcome: "correct" },
        ],
        solutionExposure: {
          solutionId,
          validSubmissionCountAtOpen: 1,
        },
      },
    });
    expect(result?.practice.hintExposures).toBe(
      solutionOpened.practice.hintExposures,
    );
  });

  it("gates duplicate requests and releases retry after a failure", async () => {
    const gate = { current: false };
    let resolveReveal!: (value: null) => void;
    let errors = 0;
    let starts = 0;
    let settled = 0;
    const first = runPracticeSolutionReveal({
      gate,
      requestReveal: () =>
        new Promise((resolve) => {
          resolveReveal = resolve;
        }),
      onStart: () => starts++,
      onSuccess: () => undefined,
      onError: () => errors++,
      onSettled: () => settled++,
    });

    await runPracticeSolutionReveal({
      gate,
      requestReveal: async () => {
        throw new Error("Duplicate request should not run");
      },
      onStart: () => starts++,
      onSuccess: () => undefined,
      onError: () => errors++,
      onSettled: () => settled++,
    });
    expect(starts).toBe(1);
    expect(errors).toBe(0);

    resolveReveal(null);
    await first;
    expect(gate.current).toBe(false);

    await runPracticeSolutionReveal({
      gate,
      requestReveal: async () => {
        throw new Error("Reveal unavailable");
      },
      onStart: () => starts++,
      onSuccess: () => undefined,
      onError: () => errors++,
      onSettled: () => settled++,
    });
    expect(starts).toBe(2);
    expect(errors).toBe(1);
    expect(settled).toBe(2);
    expect(gate.current).toBe(false);
  });

  it("clears a reveal error when retry starts and after it succeeds", async () => {
    let current = withAllHintExposures(
      withAnswerResult(createShortNumericAnswerState(), "incorrect", "16"),
    );
    const gate = { current: false };
    let errorVisible = false;
    const runReveal = (
      reveal: () => Promise<{ solutionId: string; text: string }>,
    ) =>
      runPracticeSolutionReveal({
        gate,
        requestReveal: () =>
          requestSolutionReveal(
            () => current,
            focusHintId,
            strategyHintId,
            nextStepHintId,
            { solutionId },
            reveal,
          ),
        onStart: () => {
          errorVisible = false;
        },
        onSuccess: (result) => {
          errorVisible = false;
          current = result.answerState;
        },
        onError: () => {
          errorVisible = true;
        },
        onSettled: () => undefined,
      });

    await runReveal(async () => {
      throw new Error("Reveal unavailable");
    });
    expect(errorVisible).toBe(true);
    expect(current.practice.solutionExposure).toBeNull();

    const retry = runReveal(async () => ({
      solutionId,
      text: "solution text",
    }));
    expect(errorVisible).toBe(false);
    await retry;

    expect(errorVisible).toBe(false);
    expect(current.practice.solutionExposure?.solutionId).toBe(solutionId);
  });
});

describe("practice hint reveal timing", () => {
  it("records focus exposure only after a successful reveal", async () => {
    const initial = createShortNumericAnswerState();
    let resolveReveal!: (value: {
      hintId: string;
      level: "focus";
      text: string;
    }) => void;
    const reveal = new Promise<{
      hintId: string;
      level: "focus";
      text: string;
    }>((resolve) => {
      resolveReveal = resolve;
    });
    const request = requestFocusHintReveal(
      () => initial,
      { hintId: focusHintId, level: "focus" },
      () => reveal,
    );

    expect(initial.practice.hintExposures).toEqual([]);

    resolveReveal({
      hintId: focusHintId,
      level: "focus",
      text: "focus text",
    });

    await expect(request).resolves.toMatchObject({
      answerState: {
        practice: {
          hintExposures: [
            {
              hintId: focusHintId,
              level: "focus",
              validSubmissionCountAtOpen: 0,
            },
          ],
        },
      },
      revealedHint: { hintId: focusHintId, level: "focus" },
    });
  });

  it("records no exposure when focus reveal fails", async () => {
    const initial = createShortNumericAnswerState();
    const submissionsBefore = initial.practice.submissions;

    await expect(
      requestFocusHintReveal(
        () => initial,
        { hintId: focusHintId, level: "focus" },
        async () => {
          throw new Error("Reveal unavailable");
        },
      ),
    ).rejects.toThrow("Reveal unavailable");
    expect(initial.practice.hintExposures).toEqual([]);
    expect(initial.practice.submissions).toBe(submissionsBefore);
    expect(initial.status).toBe("typing");
  });

  it("allows a failed reveal to be retried and clears its error on retry", async () => {
    let current = createShortNumericAnswerState();
    let errorVisible = false;
    let pendingHintId: string | null = null;
    const gate = { current: false };
    const runReveal = (
      requestReveal: () => ReturnType<typeof requestFocusHintReveal>,
    ) =>
      runPracticeHintReveal({
        gate,
        hintId: focusHintId,
        requestReveal,
        onStart: (hintId) => {
          errorVisible = false;
          pendingHintId = hintId;
        },
        onSuccess: (result) => {
          errorVisible = false;
          current = result.answerState;
        },
        onError: () => {
          errorVisible = true;
        },
        onSettled: () => {
          pendingHintId = null;
        },
      });

    await runReveal(() =>
      requestFocusHintReveal(
        () => current,
        { hintId: focusHintId, level: "focus" },
        async () => {
          throw new Error("Reveal unavailable");
        },
      ),
    );

    expect(errorVisible).toBe(true);
    expect(pendingHintId).toBeNull();
    expect(gate.current).toBe(false);
    expect(current.practice.hintExposures).toEqual([]);
    expect(current.practice.submissions).toEqual([]);

    const retry = runReveal(() =>
      requestFocusHintReveal(
        () => current,
        { hintId: focusHintId, level: "focus" },
        async () => ({
          hintId: focusHintId,
          level: "focus",
          text: "focus text",
        }),
      ),
    );

    expect(errorVisible).toBe(false);
    expect(pendingHintId).toBe(focusHintId);

    await retry;

    expect(errorVisible).toBe(false);
    expect(pendingHintId).toBeNull();
    expect(current.practice.hintExposures).toEqual([
      {
        hintId: focusHintId,
        level: "focus",
        validSubmissionCountAtOpen: 0,
      },
    ]);
  });

  it("does not request or duplicate an already exposed focus hint", async () => {
    let current = createShortNumericAnswerState();
    const firstReveal = vi.fn(async () => ({
      hintId: focusHintId,
      level: "focus" as const,
      text: "focus text",
    }));
    const first = await requestFocusHintReveal(
      () => current,
      { hintId: focusHintId, level: "focus" },
      firstReveal,
    );
    current = first!.answerState;
    const duplicateReveal = vi.fn(async () => ({
      hintId: focusHintId,
      level: "focus" as const,
      text: "focus text",
    }));

    await expect(
      requestFocusHintReveal(
        () => current,
        { hintId: focusHintId, level: "focus" },
        duplicateReveal,
      ),
    ).resolves.toBeNull();
    expect(current.practice.hintExposures).toHaveLength(1);
    expect(firstReveal).toHaveBeenCalledOnce();
    expect(duplicateReveal).not.toHaveBeenCalled();
  });

  it("keeps strategy ordering and counts from current Practice history", async () => {
    let current = withAnswerResult(
      createShortNumericAnswerState(),
      "incorrect",
      "16",
    );
    const strategyReveal = vi.fn(async () => ({
      hintId: strategyHintId,
      level: "strategy" as const,
      text: "strategy text",
    }));

    await expect(
      requestStrategyHintReveal(
        () => current,
        focusHintId,
        { hintId: strategyHintId, level: "strategy" },
        strategyReveal,
      ),
    ).resolves.toBeNull();
    expect(strategyReveal).not.toHaveBeenCalled();

    current = openFocusHint(current, focusHintId);
    const strategy = await requestStrategyHintReveal(
      () => current,
      focusHintId,
      { hintId: strategyHintId, level: "strategy" },
      strategyReveal,
    );

    expect(strategy?.answerState.practice.hintExposures).toEqual([
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
    expect(strategy?.answerState.practice.submissions).toBe(
      current.practice.submissions,
    );
  });

  it("records next-step only after a successful matching reveal", async () => {
    let current = openStrategyHint(
      openFocusHint(createShortNumericAnswerState(), focusHintId),
      focusHintId,
      strategyHintId,
    );
    const submissionsBefore = current.practice.submissions;
    let resolveReveal!: (value: {
      hintId: string;
      level: "next-step";
      text: string;
    }) => void;
    const reveal = new Promise<{
      hintId: string;
      level: "next-step";
      text: string;
    }>((resolve) => {
      resolveReveal = resolve;
    });
    const request = requestNextStepHintReveal(
      () => current,
      strategyHintId,
      { hintId: nextStepHintId, level: "next-step" },
      () => reveal,
    );

    expect(current.practice.hintExposures).toHaveLength(2);

    resolveReveal({
      hintId: nextStepHintId,
      level: "next-step",
      text: "next-step text",
    });

    const result = await request;
    current = result!.answerState;
    expect(current.practice.hintExposures.at(-1)).toEqual({
      hintId: nextStepHintId,
      level: "next-step",
      validSubmissionCountAtOpen: 0,
    });
    expect(current.practice.submissions).toBe(submissionsBefore);
    expect(result!.revealedHint).toEqual({
      hintId: nextStepHintId,
      level: "next-step",
      text: "next-step text",
    });
  });

  it("records no next-step exposure when reveal fails and allows retry", async () => {
    let current = openStrategyHint(
      openFocusHint(createShortNumericAnswerState(), focusHintId),
      focusHintId,
      strategyHintId,
    );
    const submissionsBefore = current.practice.submissions;

    await expect(
      requestNextStepHintReveal(
        () => current,
        strategyHintId,
        { hintId: nextStepHintId, level: "next-step" },
        async () => {
          throw new Error("Reveal unavailable");
        },
      ),
    ).rejects.toThrow("Reveal unavailable");
    expect(current.practice.hintExposures).toHaveLength(2);
    expect(current.practice.submissions).toBe(submissionsBefore);

    const retry = await requestNextStepHintReveal(
      () => current,
      strategyHintId,
      { hintId: nextStepHintId, level: "next-step" },
      async () => ({
        hintId: nextStepHintId,
        level: "next-step",
        text: "next-step text",
      }),
    );

    current = retry!.answerState;
    expect(current.practice.hintExposures).toHaveLength(3);
  });

  it.each([
    {
      hintId: "unexpected-next-step",
      level: "next-step" as const,
      text: "next-step text",
    },
    {
      hintId: nextStepHintId,
      level: "strategy" as const,
      text: "next-step text",
    },
  ])(
    "rejects a mismatched next-step reveal result: %j",
    async (revealedHint) => {
      const current = openStrategyHint(
        openFocusHint(createShortNumericAnswerState(), focusHintId),
        focusHintId,
        strategyHintId,
      );

      await expect(
        requestNextStepHintReveal(
          () => current,
          strategyHintId,
          { hintId: nextStepHintId, level: "next-step" },
          async () => revealedHint,
        ),
      ).rejects.toThrow("Revealed hint does not match the requested hint");
      expect(current.practice.hintExposures).toHaveLength(2);
    },
  );

  it("does not request or duplicate an already exposed next-step hint", async () => {
    let current = openStrategyHint(
      openFocusHint(createShortNumericAnswerState(), focusHintId),
      focusHintId,
      strategyHintId,
    );
    const first = await requestNextStepHintReveal(
      () => current,
      strategyHintId,
      { hintId: nextStepHintId, level: "next-step" },
      async () => ({
        hintId: nextStepHintId,
        level: "next-step",
        text: "next-step text",
      }),
    );
    current = first!.answerState;
    const duplicateReveal = vi.fn(async () => ({
      hintId: nextStepHintId,
      level: "next-step" as const,
      text: "next-step text",
    }));

    await expect(
      requestNextStepHintReveal(
        () => current,
        strategyHintId,
        { hintId: nextStepHintId, level: "next-step" },
        duplicateReveal,
      ),
    ).resolves.toBeNull();
    expect(current.practice.hintExposures).toHaveLength(3);
    expect(duplicateReveal).not.toHaveBeenCalled();
  });

  it("discards next-step reveal if correctness changes before it returns", async () => {
    let current = openStrategyHint(
      openFocusHint(createShortNumericAnswerState(), focusHintId),
      focusHintId,
      strategyHintId,
    );
    const request = requestNextStepHintReveal(
      () => current,
      strategyHintId,
      { hintId: nextStepHintId, level: "next-step" },
      async () => {
        current = withAnswerResult(current, "correct", "17");
        return {
          hintId: nextStepHintId,
          level: "next-step",
          text: "next-step text",
        };
      },
    );

    await expect(request).resolves.toBeNull();
    expect(current.practice.hintExposures).toHaveLength(2);
    expect(current.practice.submissions).toEqual([
      { answer: "17", outcome: "correct" },
    ]);
  });

  it("discards a successful reveal if correctness changes before it returns", async () => {
    let current = createShortNumericAnswerState();
    const request = requestFocusHintReveal(
      () => current,
      { hintId: focusHintId, level: "focus" },
      async () => {
        current = withAnswerResult(current, "correct", "17");
        return {
          hintId: focusHintId,
          level: "focus",
          text: "focus text",
        };
      },
    );

    await expect(request).resolves.toBeNull();
    expect(current.practice.hintExposures).toEqual([]);
    expect(current.practice.submissions).toEqual([
      { answer: "17", outcome: "correct" },
    ]);
  });
});

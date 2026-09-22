import { describe, expect, it, vi } from "vitest";

import { recordAnswerResult } from "../application/practice-state";
import {
  isFocusHintAvailable,
  isStrategyHintAvailable,
  openFocusHint,
  openStrategyHint,
  requestFocusHintReveal,
  requestPracticeFinish,
  requestStrategyHintReveal,
  runPracticeHintReveal,
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

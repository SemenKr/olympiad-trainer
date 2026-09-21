import { describe, expect, it } from "vitest";

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  recordHintExposure,
  startPractice,
} from "./practice-state";

describe("practice state", () => {
  it("starts active without submissions", () => {
    expect(startPractice()).toEqual({
      status: "active",
      submissions: [],
      hintExposures: [],
    });
  });

  it("does not record invalid input as a submission", () => {
    const active = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    });

    expect(recordAnswerResult(active, { status: "invalid" })).toBe(active);
    expect(active.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
    ]);
  });

  it("retains incorrect submissions in order", () => {
    const first = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "12",
    });
    const second = recordAnswerResult(first, {
      status: "incorrect",
      normalizedAnswer: "16",
    });

    expect(second.submissions).toEqual([
      { answer: "12", outcome: "incorrect" },
      { answer: "16", outcome: "incorrect" },
    ]);
    expect(first.submissions).toEqual([{ answer: "12", outcome: "incorrect" }]);
  });

  it("keeps an incorrect submission before a later correct one", () => {
    const incorrect = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    });
    const correct = recordAnswerResult(incorrect, {
      status: "correct",
      normalizedAnswer: "17",
    });

    expect(correct).toEqual({
      status: "active",
      submissions: [
        { answer: "16", outcome: "incorrect" },
        { answer: "17", outcome: "correct" },
      ],
      hintExposures: [],
    });
  });

  it("does not finish after a correct submission", () => {
    const active = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: "17",
    });

    expect(active.status).toBe("active");
  });

  it("explicitly finishes an empty practice", () => {
    expect(finishPractice(startPractice())).toEqual({
      status: "finished",
      submissions: [],
      hintExposures: [],
    });
  });

  it.each([
    [[], "no-valid-submissions"],
    [[{ answer: "16", outcome: "incorrect" }], "incorrect-only"],
    [
      [
        { answer: "16", outcome: "incorrect" },
        { answer: "17", outcome: "correct" },
      ],
      "eventually-correct",
    ],
  ] as const)("derives a summary for %j", (submissions, outcome) => {
    const finished = finishPractice({
      status: "active",
      submissions,
      hintExposures: [],
    });

    expect(getPracticeSummary(finished)).toEqual({
      outcome,
      validSubmissionCount: submissions.length,
      hintExposures: [],
    });
  });

  it("records one focus hint exposure with the valid submission count", () => {
    const attempted = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    });
    const opened = recordHintExposure(attempted, {
      hintId: "focus-simultaneous-rules",
      level: "focus",
    });
    const reopened = recordHintExposure(opened, {
      hintId: "focus-simultaneous-rules",
      level: "focus",
    });

    expect(opened.hintExposures).toEqual([
      {
        hintId: "focus-simultaneous-rules",
        level: "focus",
        validSubmissionCountAtOpen: 1,
      },
    ]);
    expect(opened.submissions).toBe(attempted.submissions);
    expect(reopened).toBe(opened);
  });

  it("records focus and strategy as separate support facts", () => {
    const focusOpened = recordHintExposure(startPractice(), {
      hintId: "focus-simultaneous-rules",
      level: "focus",
    });
    const strategyOpened = recordHintExposure(focusOpened, {
      hintId: "strategy-repeat-interval",
      level: "strategy",
    });

    expect(strategyOpened.hintExposures).toEqual([
      {
        hintId: "focus-simultaneous-rules",
        level: "focus",
        validSubmissionCountAtOpen: 0,
      },
      {
        hintId: "strategy-repeat-interval",
        level: "strategy",
        validSubmissionCountAtOpen: 0,
      },
    ]);
    expect(strategyOpened.submissions).toBe(focusOpened.submissions);
  });

  it("does not mutate input state when recording or finishing", () => {
    const submissions = Object.freeze([
      { answer: "16", outcome: "incorrect" } as const,
    ]);
    const hintExposures = Object.freeze([]);
    const active = Object.freeze({
      status: "active" as const,
      submissions,
      hintExposures,
    });

    const next = recordAnswerResult(active, {
      status: "correct",
      normalizedAnswer: "17",
    });
    const finished = finishPractice(active);

    expect(active.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
    ]);
    expect(next.submissions).toHaveLength(2);
    expect(finished.submissions).toEqual(active.submissions);
    expect(finished.hintExposures).toBe(hintExposures);
  });
});

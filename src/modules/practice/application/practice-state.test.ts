import { describe, expect, it } from "vitest";

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  recordHintExposure,
  recordSolutionExposure,
  startPractice,
} from "./practice-state";

describe("practice state", () => {
  it("starts active without submissions", () => {
    expect(startPractice()).toEqual({
      status: "active",
      submissions: [],
      hintExposures: [],
      solutionExposure: null,
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
      solutionExposure: null,
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
      solutionExposure: null,
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
      solutionExposure: null,
    });

    expect(getPracticeSummary(finished)).toEqual({
      outcome,
      validSubmissionCount: submissions.length,
      hintExposures: [],
      solutionExposure: null,
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

  it("records all three hint levels as separate support facts", () => {
    const focusOpened = recordHintExposure(startPractice(), {
      hintId: "focus-simultaneous-rules",
      level: "focus",
    });
    const strategyOpened = recordHintExposure(focusOpened, {
      hintId: "strategy-repeat-interval",
      level: "strategy",
    });
    const nextStepOpened = recordHintExposure(strategyOpened, {
      hintId: "next-step-list-common-seats",
      level: "next-step",
    });

    expect(nextStepOpened.hintExposures).toEqual([
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
      {
        hintId: "next-step-list-common-seats",
        level: "next-step",
        validSubmissionCountAtOpen: 0,
      },
    ]);
    expect(nextStepOpened.submissions).toBe(focusOpened.submissions);
  });

  it("records one solution exposure without changing attempts or hints", () => {
    const attempted = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    });
    const withHint = recordHintExposure(attempted, {
      hintId: "focus-simultaneous-rules",
      level: "focus",
    });
    const opened = recordSolutionExposure(withHint, {
      solutionId: "coinciding-seats-full-solution",
    });
    const reopened = recordSolutionExposure(opened, {
      solutionId: "different-solution",
    });

    expect(opened.solutionExposure).toEqual({
      solutionId: "coinciding-seats-full-solution",
      validSubmissionCountAtOpen: 1,
    });
    expect(opened.submissions).toBe(withHint.submissions);
    expect(opened.hintExposures).toBe(withHint.hintExposures);
    expect(reopened).toBe(opened);
  });

  it("keeps solution exposure and earlier attempts after a later correct result", () => {
    const incorrect = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    });
    const solutionOpened = recordSolutionExposure(incorrect, {
      solutionId: "coinciding-seats-full-solution",
    });
    const correct = recordAnswerResult(solutionOpened, {
      status: "correct",
      normalizedAnswer: "17",
    });

    expect(correct.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
      { answer: "17", outcome: "correct" },
    ]);
    expect(correct.solutionExposure).toBe(solutionOpened.solutionExposure);
    expect(getPracticeSummary(finishPractice(correct))).toMatchObject({
      outcome: "eventually-correct",
      solutionExposure: {
        solutionId: "coinciding-seats-full-solution",
        validSubmissionCountAtOpen: 1,
      },
    });
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
      solutionExposure: null,
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
    expect(finished.solutionExposure).toBeNull();
  });
});

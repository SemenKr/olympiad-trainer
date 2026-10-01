import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  recordAnswerResult,
  recordHintExposure,
  recordSolutionExposure,
  startPractice,
  finishPractice,
} from "../../practice/application/practice-state";
import {
  CARRIER_PROBLEM_ID,
  canRecommendLesson,
  requireOptionId,
  requireSessionId,
} from "./knowledge-support";
import { DIAGNOSTIC, MICRO_CHECK } from "./content";
import { MINI_LESSON } from "../server/content";
import { assessDiagnostic, assessMicroCheck } from "../server/assessment";
import { requireDiagnosticEligibility } from "../server/eligibility";

import {
  getProblemDefinition,
  getLearnerSafePracticeProblem,
} from "../../practice/server/problem-catalog";
import { checkNonnegativeIntegerAnswer } from "../../practice/domain/numeric-answer";

const carrier = getProblemDefinition(CARRIER_PROBLEM_ID);
if (carrier.assessment.kind !== "nonnegative-integer")
  throw new Error("Numeric carrier required");
const correctAnswer = carrier.assessment.expectedAnswer;
const focusHint = getLearnerSafePracticeProblem(CARRIER_PROBLEM_ID).hints[0];

const incorrect = recordAnswerResult(startPractice(), {
  status: "incorrect",
  normalizedAnswer: "7",
});
const focused = recordHintExposure(startPractice(), focusHint);
const eligible = (
  practice: import("../../practice/application/practice-state").PracticeState = incorrect,
  completed = false,
  problemId = CARRIER_PROBLEM_ID,
) =>
  !completed &&
  problemId === CARRIER_PROBLEM_ID &&
  practice.status === "active" &&
  practice.solutionExposure === null &&
  requireDiagnosticEligibility({ problemId, practice });

describe("bounded Knowledge Support rules", () => {
  it.each([incorrect, focused])(
    "Practice facts only enable a neutral invitation",
    (practice) => {
      const before = JSON.stringify(practice);
      expect(eligible(practice)).toBe(true);
      expect(
        requireDiagnosticEligibility({
          problemId: CARRIER_PROBLEM_ID,
          practice,
        }),
      ).toBe(true);
      expect(JSON.stringify(practice)).toBe(before);
      expect(practice).not.toHaveProperty("diagnosticOutcome");
      expect(practice).not.toHaveProperty("knowledgeInterpretation");
    },
  );
  it.each(["", " ", "abc", "-1", "1.5", "+7", "7 stones"])(
    "invalid numeric submission %j cannot enable the offer",
    (answer) => {
      const practice = {
        ...startPractice(),
        submissions: [{ answer, outcome: "incorrect" as const }],
      };
      expect(eligible(practice)).toBe(false);
      expect(
        requireDiagnosticEligibility({
          problemId: CARRIER_PROBLEM_ID,
          practice,
        }),
      ).toBe(false);
      const withFocus = recordHintExposure(practice, focusHint);
      expect(eligible(withFocus)).toBe(true);
      expect(
        requireDiagnosticEligibility({
          problemId: CARRIER_PROBLEM_ID,
          practice: withFocus,
        }),
      ).toBe(true);
    },
  );
  it.each(["0", "7", "007", " 7 ", "9007199254740993"])(
    "valid incorrect numeric submission %j enables only the offer",
    (answer) => {
      const practice = {
        ...startPractice(),
        submissions: [{ answer, outcome: "incorrect" as const }],
      };
      expect(eligible(practice)).toBe(true);
      expect(
        requireDiagnosticEligibility({
          problemId: CARRIER_PROBLEM_ID,
          practice,
        }),
      ).toBe(true);
    },
  );
  it.each(["60", "060", " 60 "])(
    "authoritative correct answer %j suppresses even a forged incorrect outcome and focus exposure",
    (answer) => {
      expect(checkNonnegativeIntegerAnswer(answer, correctAnswer).status).toBe(
        "correct",
      );
      const practice = {
        ...focused,
        submissions: [
          ...incorrect.submissions,
          { answer, outcome: "incorrect" as const },
        ],
      };
      expect(eligible(practice)).toBe(false);
    },
  );
  it("uses the assessed answer rather than a forged correct outcome", () => {
    expect(
      eligible({
        ...startPractice(),
        submissions: [{ answer: "7", outcome: "correct" }],
      }),
    ).toBe(true);
  });
  it.each([
    { hintId: "arbitrary", level: "focus" as const },
    {
      ...getLearnerSafePracticeProblem(CARRIER_PROBLEM_ID).hints[1],
      level: "focus" as const,
    },
    { ...focusHint, level: "strategy" as const },
  ])("rejects non-canonical focus exposure %j", (hint) => {
    expect(eligible(recordHintExposure(startPractice(), hint))).toBe(false);
  });
  it("requires every offer condition", () => {
    expect(eligible(startPractice())).toBe(false);
    expect(eligible(incorrect, true)).toBe(false);
    expect(eligible(incorrect, false, "another-problem")).toBe(false);
    expect(
      eligible(
        recordAnswerResult(incorrect, {
          status: "correct",
          normalizedAnswer: correctAnswer,
        }),
      ),
    ).toBe(false);
    expect(
      eligible(recordSolutionExposure(incorrect, { solutionId: "solution" })),
    ).toBe(false);
    expect(eligible(finishPractice(incorrect))).toBe(false);
    expect(
      eligible(recordAnswerResult(startPractice(), { status: "invalid" })),
    ).toBe(false);
    expect(
      eligible(
        recordHintExposure(startPractice(), {
          hintId: "strategy",
          level: "strategy",
        }),
      ),
    ).toBe(false);
  });
  it.each(["A", "B", "C", "D"] as const)(
    "only incorrect diagnostic %s may recommend a lesson",
    (option) => {
      const diagnosticOutcome = assessDiagnostic(option);
      expect(
        canRecommendLesson({
          diagnosticSelectedOptionId: option,
          diagnosticOutcome,
          lessonOpened: false,
          microCheckSelectedOptionId: null,
          microCheckOutcome: null,
        }),
      ).toBe(option !== "A");
      expect(assessMicroCheck(option)).toBe(
        option === "A" ? "correct" : "incorrect",
      );
    },
  );
  it("uses the specified fresh content and lesson numbers", () => {
    expect(DIAGNOSTIC.question).toContain("12 фишек");
    expect(MICRO_CHECK.question).toContain("24 фишки");
    expect(MICRO_CHECK.options.map((o) => o.text)).toEqual([
      "6 и 10",
      "20 и 24",
      "96 и 100",
      "6 и 2",
    ]);
    expect(MINI_LESSON).toContain("12 ÷ 3 = 4");
    expect(MINI_LESSON).not.toContain("камн");
  });
  it("rejects malformed boundary values and ineligible context", () => {
    for (const option of [null, "E", [], { id: "A" }])
      expect(() => requireOptionId(option)).toThrow();
    expect(() => requireSessionId("session")).toThrow();
    expect(() =>
      requireDiagnosticEligibility({ problemId: "other", practice: incorrect }),
    ).toThrow();
    expect(() =>
      requireDiagnosticEligibility({
        problemId: CARRIER_PROBLEM_ID,
        practice: { ...incorrect, submissions: [{ outcome: "wrong" }] },
      }),
    ).toThrow();
    expect(
      requireDiagnosticEligibility({
        problemId: CARRIER_PROBLEM_ID,
        practice: startPractice(),
      }),
    ).toBe(false);
  });
});

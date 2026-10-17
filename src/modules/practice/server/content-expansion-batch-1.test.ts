import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../simulation/server/assistance-guard", () => ({
  requireSimulationAssistanceAllowed: vi.fn(async () => {}),
}));

import { submitPracticeAnswer } from "../../../app/practice/actions";
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import { getPracticeProgressContribution } from "../application/practice-progress-evidence";
import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import {
  getLearnerSafePackProblems,
  getLearnerSafePracticeProblem,
  getProblemDefinition,
} from "./problem-catalog";

const cases = [
  { id: "winter-day-number", answer: "15", year: "2025/26", number: 1 },
  { id: "false-box-labels", answer: "3", year: "2025/26", number: 2 },
  {
    id: "pirate-coin-redistribution",
    answer: "84",
    year: "2025/26",
    number: 7,
  },
  { id: "crow-wire-positions", answer: "10", year: "2025/26", number: 8 },
  {
    id: "maximum-grid-neighbor-sum",
    answer: "51",
    year: "2024/25",
    number: 7,
  },
  {
    id: "six-position-colorings",
    answer: "30",
    year: "2023/24",
    number: 2,
  },
  {
    id: "rectangle-knight-count",
    answer: "40",
    year: "2022/23",
    number: 5,
  },
  { id: "bicycle-lock-code", answer: "459", year: "2024/25", number: 3 },
  {
    id: "five-lamp-pattern",
    answer: ["lamp-97-blue", "lamp-98-yellow", "lamp-99-blue", "lamp-100-blue"],
    year: "2021/22",
    number: 7,
  },
] as const;

describe("Content Expansion Batch 1", () => {
  it("adds nine distinct sourced problems in three ordered ordinary Packs", () => {
    expect(cases).toHaveLength(9);
    expect(new Set(cases.map(({ id }) => id)).size).toBe(9);
    expect(PRACTICE_PACKS.slice(12)).toEqual([
      {
        id: "pack-m",
        name: "Условия и выводы",
        problemIds: [
          "false-box-labels",
          "pirate-coin-redistribution",
          "bicycle-lock-code",
        ],
      },
      {
        id: "pack-n",
        name: "Позиции и подсчёт",
        problemIds: [
          "crow-wire-positions",
          "maximum-grid-neighbor-sum",
          "rectangle-knight-count",
        ],
      },
      {
        id: "pack-o",
        name: "Числа и закономерности",
        problemIds: [
          "winter-day-number",
          "six-position-colorings",
          "five-lamp-pattern",
        ],
      },
    ]);
    for (const item of cases) {
      expect(getProblemDefinition(item.id)).toMatchObject({
        id: item.id,
        grade: 5,
        subject: "mathematics",
        provenance: {
          academicYear: item.year,
          problemNumber: item.number,
          originalSource: { reference: "I", page: expect.any(Number) },
          officialSolution: { reference: "IS", page: expect.any(Number) },
        },
        hints: [
          { level: "focus" },
          { level: "strategy" },
          { level: "next-step" },
        ],
        solution: { kind: "training-adaptation" },
      });
    }
  });

  it.each(cases)(
    "checks $id through the existing protected answer path",
    async (item) => {
      const response =
        typeof item.answer === "string"
          ? item.answer
          : [...item.answer].reverse();
      const result = await submitPracticeAnswer(item.id, response);
      expect(result.status).toBe("correct");

      const summary = getPracticeSummary(
        finishPractice(recordAnswerResult(startPractice(), result)),
      );
      expect(
        getPracticeProgressContribution({ problemId: item.id, summary }),
      ).toBeNull();

      const learner = getLearnerSafePracticeProblem(item.id);
      expect(learner).not.toHaveProperty("assessment");
      expect(learner).not.toHaveProperty("provenance");
      expect(learner).not.toHaveProperty("hints.0.text");
      expect(learner).not.toHaveProperty("solution.text");
    },
  );

  it("resolves each new Pack from the learner-safe catalog projection", () => {
    const packs = getLearnerSafePackProblems();
    for (const pack of PRACTICE_PACKS.slice(12)) {
      expect(packs[pack.id]).toEqual(
        pack.problemIds.map(getLearnerSafePracticeProblem),
      );
    }
  });
});

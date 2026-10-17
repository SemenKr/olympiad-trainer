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
  {
    id: "cut-paper-triangle-count",
    answer: "68",
    year: "2019/20",
    number: 1,
  },
  {
    id: "reversed-number-tens-digit",
    answer: "9",
    year: "2019/20",
    number: 2,
  },
  {
    id: "colored-clay-piece-count",
    answer: "30",
    year: "2019/20",
    number: 3,
  },
  {
    id: "square-border-tile-count",
    answer: "36",
    year: "2019/20",
    number: 4,
  },
  {
    id: "constant-scale-error",
    answer: "13",
    year: "2019/20",
    number: 5,
  },
  {
    id: "rabbit-middle-cage",
    answer: "4",
    year: "2019/20",
    number: 6,
  },
  {
    id: "alternating-queue-swaps",
    answer: "36",
    year: "2019/20",
    number: 7,
  },
  {
    id: "corridor-single-layer",
    answer: "5",
    year: "2018/19",
    number: 2,
  },
  {
    id: "diamond-emerald-balance",
    answer: "3",
    year: "2018/19",
    number: 4,
  },
] as const;

describe("Content Expansion Batch 2", () => {
  it("adds nine distinct sourced problems in three ordered ordinary Packs", () => {
    expect(cases).toHaveLength(9);
    expect(new Set(cases.map(({ id }) => id)).size).toBe(9);
    expect(PRACTICE_PACKS.slice(15)).toEqual([
      {
        id: "pack-p",
        name: "Считаем части",
        problemIds: [
          "cut-paper-triangle-count",
          "colored-clay-piece-count",
          "square-border-tile-count",
        ],
      },
      {
        id: "pack-q",
        name: "Сравниваем условия",
        problemIds: [
          "diamond-emerald-balance",
          "constant-scale-error",
          "rabbit-middle-cage",
        ],
      },
      {
        id: "pack-r",
        name: "Порядок и изменения",
        problemIds: [
          "reversed-number-tens-digit",
          "corridor-single-layer",
          "alternating-queue-swaps",
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
      const response = item.answer;
      const result = await submitPracticeAnswer(item.id, response);
      expect(result.status).toBe("correct");
      expect((await submitPracticeAnswer(item.id, "0")).status).toBe(
        "incorrect",
      );
      expect((await submitPracticeAnswer(item.id, "1.5")).status).toBe(
        "invalid",
      );

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
    for (const pack of PRACTICE_PACKS.slice(15)) {
      expect(packs[pack.id]).toEqual(
        pack.problemIds.map(getLearnerSafePracticeProblem),
      );
    }
  });
});

// Enumerate feasible source cases independently of the authored answer definitions.
describe("Batch 2 mathematical edge cases", () => {
  it("keeps tens digit9 for every allowed distinct nonzero triple", () => {
    for (let a = 1; a <= 9; a++)
      for (let b = 1; b <= 9; b++)
        for (let c = 1; c <= 9; c++) {
          if (new Set([a, b, c]).size !== 3) continue;
          const difference = Math.abs(
            100 * a + 10 * b + c - (100 * c + 10 * b + a),
          );
          expect(Math.floor(difference / 10) % 10).toBe(9);
        }
  });
  it("has feasible cages and forces the same central occupancy", () => {
    const centers = new Set<number>();
    // Each occupancy is <=7: every cage has a nonempty neighbor and at most7 neighbors.
    for (let a = 1; a <= 7; a++)
      for (let b = 1; b <= 7; b++)
        for (let c = 1; c <= 7; c++)
          for (let d = 1; d <= 7; d++)
            for (let e = 1; e <= 7; e++) {
              const counts = [
                a + b - 1,
                a + b + c - 1,
                b + c + d - 1,
                c + d + e - 1,
                d + e - 1,
              ];
              if (counts.every((n) => n === 3 || n === 7)) centers.add(c);
            }
    expect([...centers]).toEqual([4]);
  });
  it("counts queue exchanges independently of the next allowed swap", () => {
    for (const chooseLast of [false, true]) {
      const queue = Array.from({ length: 16 }, (_, i) =>
        i % 2 === 0 ? "boy" : "girl",
      );
      let swaps = 0;
      for (;;) {
        const allowed = queue.flatMap((entry, i) =>
          entry === "boy" && queue[i + 1] === "girl" ? [i] : [],
        );
        if (!allowed.length) break;
        const i = chooseLast ? allowed[allowed.length - 1] : allowed[0];
        const boy = queue[i];
        queue[i] = queue[i + 1];
        queue[i + 1] = boy;
        swaps++;
      }
      expect(swaps).toBe(36);
      expect(queue).toEqual([
        ...Array<string>(8).fill("girl"),
        ...Array<string>(8).fill("boy"),
      ]);
    }
  });
});

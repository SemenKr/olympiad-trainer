import { describe, expect, it } from "vitest";
import {
  completedEpisodeFacts,
  validateCompletedEpisode,
  PACK_A_PROBLEM_IDS,
  PACK_B_PROBLEM_IDS,
  PACK_C_PROBLEM_IDS,
  PRACTICE_PACKS,
  packById,
  packHref,
  packProblemIds,
  packIdFromProblemIds,
  type PackId,
} from "./completed-practice-episode";

const empty = {
  outcome: "no-valid-submissions" as const,
  validSubmissionCount: 0,
  hintExposures: [],
  solutionExposure: null,
};
const coreIds = [
  "coinciding-seats",
  "guaranteed-sock-pair",
  "table-impossible-sums",
];

describe("completed Practice episode facts", () => {
  it("derives Pack identity, navigation, and strict reverse lookup from the learner-safe registry", () => {
    const ids: PackId[] = [
      "pack-a",
      "pack-b",
      "pack-c",
      "pack-d",
      "pack-e",
      "pack-f",
      "pack-g",
      "pack-h",
      "pack-i",
      "pack-j",
      "pack-k",
      "pack-l",
    ];
    expect(PRACTICE_PACKS).toEqual([
      {
        id: "pack-a",
        name: "Разные способы рассуждать",
        problemIds: [
          "granddaughters-first",
          "cutout-area-ratio",
          "domino-placements",
        ],
      },
      {
        id: "pack-b",
        name: "Связи и закономерности",
        problemIds: [
          "truck-car-same-arrival",
          "knights-all-or-none",
          "boastful-fisherman-streak",
        ],
      },
      {
        id: "pack-c",
        name: "Числа и структуры",
        problemIds: [
          "largest-valid-eight-digit",
          "three-numbers-digit-sums",
          "mountain-plain-flights",
        ],
      },
      {
        id: "pack-d",
        name: "Считаем по устройству",
        problemIds: [
          "exact-coin-payments",
          "odd-neighbor-sugar-cubes",
          "last-student-friends",
        ],
      },
      {
        id: "pack-e",
        name: "Условия и противоречия",
        problemIds: [
          "lineup-six-hooligans",
          "two-true-journalists",
          "neighbor-comparison-codes",
        ],
      },
      {
        id: "pack-f",
        name: "Модели и стратегии",
        problemIds: [
          "five-piles-stones",
          "untouched-matchstick-figures",
          "mountain-numbers-over-77777",
        ],
      },
      {
        id: "pack-g",
        name: "Границы и подсчёт",
        problemIds: [
          "nonadjacent-row-seating",
          "eighteen-piece-pie-cuts",
          "multiples-prefix-count",
        ],
      },
      {
        id: "pack-h",
        name: "Пропорции и баланс",
        problemIds: [
          "rabbit-carrot-shortfall",
          "grade-average-fives",
          "magic-forest-coin-difference",
        ],
      },
      {
        id: "pack-i",
        name: "Порядок и связи",
        problemIds: [
          "four-houses-distance-cases",
          "ivanov-older-brother-count",
          "cube-red-face-sums",
        ],
      },
      {
        id: "pack-j",
        name: "Набор J: считаем и сравниваем",
        problemIds: [
          "chocolate-promotion-price",
          "school-lesson-teacher-count",
          "soldier-figures-guarantee",
        ],
      },
      {
        id: "pack-k",
        name: "Набор K: выводы и доказательства",
        problemIds: [
          "apple-harvest-assignments",
          "liar-council-maximum",
          "central-coin-column",
        ],
      },
      {
        id: "pack-l",
        name: "Набор L: порядок и варианты",
        problemIds: [
          "five-fridays-calendar",
          "circular-table-seat-count",
          "balanced-six-groups",
        ],
      },
    ]);
    expect(PRACTICE_PACKS.map((pack) => pack.id)).toEqual(ids);
    expect(PRACTICE_PACKS.every((pack) => pack.problemIds.length === 3)).toBe(
      true,
    );
    for (const pack of PRACTICE_PACKS) {
      expect(packById(pack.id)).toBe(pack);
      expect(packProblemIds(pack.id)).toBe(pack.problemIds);
      expect(packIdFromProblemIds(pack.problemIds)).toBe(pack.id);
      expect(packHref(pack.id)).toBe(
        pack.id === "pack-a"
          ? "/practice/pack"
          : `/practice/pack?pack=${pack.id}`,
      );
    }
    expect(packById("unknown")).toBeNull();
    expect(packById(["pack-a"])).toBeNull();
    for (const invalid of [
      PACK_A_PROBLEM_IDS.slice(0, 2),
      [...PACK_A_PROBLEM_IDS].reverse(),
      [PACK_A_PROBLEM_IDS[0], PACK_B_PROBLEM_IDS[1], PACK_C_PROBLEM_IDS[2]],
      [PACK_A_PROBLEM_IDS[0], PACK_A_PROBLEM_IDS[0], PACK_A_PROBLEM_IDS[2]],
      [PACK_A_PROBLEM_IDS[0], PACK_A_PROBLEM_IDS[1], "unknown"],
    ])
      expect(packIdFromProblemIds(invalid)).toBeNull();
    for (const pack of PRACTICE_PACKS.slice(3)) {
      const next =
        PRACTICE_PACKS[
          (PRACTICE_PACKS.indexOf(pack) + 1) % PRACTICE_PACKS.length
        ];
      for (const invalid of [
        pack.problemIds.slice(0, 2),
        [...pack.problemIds].reverse(),
        [pack.problemIds[0], pack.problemIds[0], pack.problemIds[2]],
        [pack.problemIds[0], next.problemIds[1], pack.problemIds[2]],
        [pack.problemIds[0], pack.problemIds[1], "unknown"],
      ]) {
        expect(packIdFromProblemIds(invalid)).toBeNull();
        const facts = completedEpisodeFacts(
          invalid.map((problemId) => ({ problemId, summary: empty })),
        );
        expect(validateCompletedEpisode("pack", facts)).toBeNull();
      }
      const facts = completedEpisodeFacts(
        pack.problemIds.map((problemId) => ({ problemId, summary: empty })),
      );
      expect(validateCompletedEpisode("pack", facts)).toEqual(facts);
    }
  });
  it("accepts only the exact Pack C tuple as safe pack facts", () => {
    const facts = completedEpisodeFacts(
      PACK_C_PROBLEM_IDS.map((problemId) => ({ problemId, summary: empty })),
    );
    expect(packIdFromProblemIds(PACK_C_PROBLEM_IDS)).toBe("pack-c");
    expect(validateCompletedEpisode("pack", facts)).toEqual(facts);
    expect(facts.problems.map((problem) => problem.problemId)).toEqual(
      PACK_C_PROBLEM_IDS,
    );
    expect(facts.problems.every((problem) => problem.checkpoint === null)).toBe(
      true,
    );
    for (const ids of [
      [...PACK_C_PROBLEM_IDS].reverse(),
      [PACK_C_PROBLEM_IDS[0], PACK_B_PROBLEM_IDS[1], PACK_C_PROBLEM_IDS[2]],
      [PACK_C_PROBLEM_IDS[0], PACK_C_PROBLEM_IDS[1], "unknown"],
    ]) {
      expect(packIdFromProblemIds(ids)).toBeNull();
      expect(
        validateCompletedEpisode("pack", {
          ...facts,
          problems: ids.map((problemId) => ({
            ...facts.problems[0],
            problemId,
          })),
        }),
      ).toBeNull();
    }
  });
  it("accepts only the exact Pack B tuple while preserving Pack A", () => {
    const facts = completedEpisodeFacts(
      PACK_B_PROBLEM_IDS.map((problemId) => ({ problemId, summary: empty })),
    );
    expect(packIdFromProblemIds(PACK_A_PROBLEM_IDS)).toBe("pack-a");
    expect(packIdFromProblemIds(PACK_B_PROBLEM_IDS)).toBe("pack-b");
    expect(validateCompletedEpisode("pack", facts)).toEqual(facts);
    for (const ids of [
      [...PACK_B_PROBLEM_IDS].reverse(),
      [PACK_B_PROBLEM_IDS[0], PACK_A_PROBLEM_IDS[1], PACK_B_PROBLEM_IDS[2]],
      PACK_B_PROBLEM_IDS.slice(0, 2),
    ]) {
      expect(packIdFromProblemIds(ids)).toBeNull();
      expect(
        validateCompletedEpisode("pack", {
          ...facts,
          problems: ids.map((problemId) => ({
            ...facts.problems[0],
            problemId,
          })),
        }),
      ).toBeNull();
    }
  });
  it("accepts only exact Pack A order without checkpoints or protected data", () => {
    const facts = completedEpisodeFacts(
      PACK_A_PROBLEM_IDS.map((problemId) => ({
        problemId,
        summary: empty,
        answer: "private answer",
      })),
    );
    expect(validateCompletedEpisode("pack", facts)).toEqual(facts);
    expect(JSON.stringify(facts)).not.toContain("private answer");
    expect(
      validateCompletedEpisode("pack", {
        ...facts,
        problems: [...facts.problems].reverse(),
      }),
    ).toBeNull();
    expect(
      validateCompletedEpisode("pack", {
        ...facts,
        problems: [
          {
            ...facts.problems[0],
            checkpoint: { checkpointId: "made-up", outcome: "correct" },
          },
          ...facts.problems.slice(1),
        ],
      }),
    ).toBeNull();
  });
  it("constructs the exact core order without protected result content", () => {
    const facts = completedEpisodeFacts(
      coreIds.map((problemId) => ({
        problemId,
        problemTitle: "Must not persist",
        summary: empty,
        answer: "Must not persist",
      })),
    );
    expect(validateCompletedEpisode("core", facts)).toEqual(facts);
    expect(facts.problems.map((problem) => problem.problemId)).toEqual(coreIds);
    expect(JSON.stringify(facts)).not.toContain("Must not persist");
    expect(
      validateCompletedEpisode("core", {
        ...facts,
        problems: [...facts.problems].reverse(),
      }),
    ).toBeNull();
  });

  it.each([
    ["brothers-ages-products", "correct"],
    ["brothers-ages-products", "incorrect"],
    ["parrots-guaranteed-colors", "correct"],
    ["parrots-guaranteed-colors", "incorrect"],
  ] as const)(
    "accepts one %s transfer with %s checkpoint and strips selected option",
    (problemId, outcome) => {
      const facts = completedEpisodeFacts([
        {
          problemId,
          summary: {
            outcome: "eventually-correct",
            validSubmissionCount: 2,
            hintExposures: [
              {
                hintId: "secret",
                level: "focus",
                validSubmissionCountAtOpen: 1,
              },
            ],
            solutionExposure: null,
          },
          reasoningCheckpointObservation: {
            checkpointId:
              problemId === "brothers-ages-products"
                ? "brothers-ages-products-youngest-lower-bound"
                : "parrots-guaranteed-colors-guarantee-argument",
            selectedOptionId: "A",
            outcome,
            validSubmissionCountAtSubmit: 2,
          },
        },
      ]);
      expect(validateCompletedEpisode("transfer", facts)).toEqual(facts);
      expect(facts.problems[0]).toMatchObject({
        outcome: "eventually-correct",
        validSubmissionCount: 2,
        hintLevelsExposed: ["focus"],
        solutionExposed: false,
        checkpoint: { outcome },
      });
      expect(JSON.stringify(facts)).not.toMatch(
        /selectedOptionId|hintId|secret/,
      );
      expect(
        validateCompletedEpisode("transfer", {
          version: 1,
          problems: [
            {
              ...facts.problems[0],
              checkpoint: {
                ...facts.problems[0].checkpoint,
                selectedOptionId: "A",
              },
            },
          ],
        }),
      ).toBeNull();
    },
  );

  it("represents skip, solution exposure, and no valid submission as separate facts", () => {
    const skipped = completedEpisodeFacts([
      { problemId: coreIds[0], summary: empty, taskOutcome: "skipped" },
    ]).problems[0];
    const solution = completedEpisodeFacts([
      {
        problemId: coreIds[1],
        summary: {
          outcome: "incorrect-only",
          validSubmissionCount: 1,
          hintExposures: ["focus", "strategy", "next-step"].map((level) => ({
            hintId: "hidden",
            level: level as "focus" | "strategy" | "next-step",
            validSubmissionCountAtOpen: 1,
          })),
          solutionExposure: {
            solutionId: "hidden",
            validSubmissionCountAtOpen: 1,
          },
        },
      },
    ]).problems[0];
    expect(skipped).toMatchObject({
      skipped: true,
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
    });
    expect(solution).toMatchObject({
      solutionExposed: true,
      outcome: "incorrect-only",
    });
    expect(JSON.stringify(solution)).not.toContain("hidden");
  });
});

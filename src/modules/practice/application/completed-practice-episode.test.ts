import { describe, expect, it } from "vitest";
import {
  completedEpisodeFacts,
  validateCompletedEpisode,
  PACK_A_PROBLEM_IDS,
  PACK_B_PROBLEM_IDS,
  PACK_C_PROBLEM_IDS,
  packIdFromProblemIds,
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

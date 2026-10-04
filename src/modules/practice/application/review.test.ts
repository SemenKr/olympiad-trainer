import { describe, expect, it } from "vitest";
import { isEligibleReviewSource } from "./review";
import { validateCompletedEpisode } from "./completed-practice-episode";
const problem = {
  problemId: "coinciding-seats",
  outcome: "eventually-correct",
  skipped: false,
  validSubmissionCount: 1,
  hintLevelsExposed: [],
  solutionExposed: false,
  checkpoint: null,
};
const facts = {
  version: 1,
  problems: [
    problem,
    ...["guaranteed-sock-pair", "table-impossible-sums"].map((problemId) => ({
      ...problem,
      problemId,
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
    })),
  ],
};
describe("Review source and fact boundary", () => {
  it("accepts durable correct core carrier, including hints as support facts", () => {
    expect(isEligibleReviewSource("core", facts)).toBe(true);
    expect(
      isEligibleReviewSource("core", {
        ...facts,
        problems: [
          { ...problem, hintLevelsExposed: ["focus"] },
          ...facts.problems.slice(1),
        ],
      }),
    ).toBe(true);
  });
  it("excludes solution exposure, incorrect/no answer, Review sources and malformed episodes", () => {
    for (const patch of [
      {
        solutionExposed: true,
        hintLevelsExposed: ["focus", "strategy", "next-step"],
      },
      { outcome: "incorrect-only" },
      { outcome: "no-valid-submissions", validSubmissionCount: 0 },
    ])
      expect(
        isEligibleReviewSource("core", {
          ...facts,
          problems: [{ ...problem, ...patch }, ...facts.problems.slice(1)],
        }),
      ).toBe(false);
    expect(
      isEligibleReviewSource("review", { version: 1, problems: [problem] }),
    ).toBe(false);
    expect(
      isEligibleReviewSource("core", { version: 1, problems: [problem] }),
    ).toBe(false);
  });
  it("Review accepts only one carrier and no checkpoint while retaining support/Skip facts", () => {
    for (const patch of [
      {},
      {
        skipped: true,
        outcome: "no-valid-submissions",
        validSubmissionCount: 0,
      },
      { hintLevelsExposed: ["focus"] },
      {
        solutionExposed: true,
        hintLevelsExposed: ["focus", "strategy", "next-step"],
      },
    ])
      expect(
        validateCompletedEpisode("review", {
          version: 1,
          problems: [{ ...problem, ...patch }],
        }),
      ).not.toBeNull();
    expect(validateCompletedEpisode("review", facts)).toBeNull();
    expect(
      validateCompletedEpisode("review", {
        version: 1,
        problems: [
          {
            ...problem,
            checkpoint: { checkpointId: "invented", outcome: "correct" },
          },
        ],
      }),
    ).toBeNull();
  });
});

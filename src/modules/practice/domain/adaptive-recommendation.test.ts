import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_RULES,
  recommendAdaptiveWork,
  type AdaptiveInput,
} from "./adaptive-recommendation";

const empty: AdaptiveInput = {
  latestSourceCheckpoints: {
    "table-impossible-sums": null,
    "guaranteed-sock-pair": null,
  },
  hasEnumerationObservation: false,
  hasDurablePracticeFinish: false,
  closedTargets: [],
};
describe("bounded adaptive policy", () => {
  it("does not turn absent observations into weakness or a history prerequisite", () => {
    expect(recommendAdaptiveWork(empty)).toEqual({
      kind: "none",
      reason: "no-eligible-target",
    });
    expect(
      recommendAdaptiveWork({ ...empty, hasDurablePracticeFinish: true }),
    ).toMatchObject({
      purpose: "explore-unknown-capability",
      problemId: "pages-without-digit-one",
    });
    expect(
      recommendAdaptiveWork({
        ...empty,
        hasDurablePracticeFinish: true,
        hasEnumerationObservation: true,
      }).kind,
    ).toBe("none");
  });
  it.each([false, true])(
    "keeps stable table-before-sock ties, hinted=%s",
    (hinted) => {
      expect(
        recommendAdaptiveWork({
          ...empty,
          latestSourceCheckpoints: {
            "table-impossible-sums": {
              outcome: "correct",
              hintsBeforeCheckpoint: hinted,
            },
            "guaranteed-sock-pair": {
              outcome: "correct",
              hintsBeforeCheckpoint: hinted,
            },
          },
        }),
      ).toMatchObject({ problemId: "brothers-ages-products" });
    },
  );
  it("prioritizes hinted sock over unhinted table, without comparing independent sequences", () => {
    expect(
      recommendAdaptiveWork({
        ...empty,
        latestSourceCheckpoints: {
          "table-impossible-sums": {
            outcome: "correct",
            hintsBeforeCheckpoint: false,
          },
          "guaranteed-sock-pair": {
            outcome: "correct",
            hintsBeforeCheckpoint: true,
          },
        },
      }),
    ).toMatchObject({ problemId: "parrots-guaranteed-colors" });
  });
  it.each(ADAPTIVE_RULES)("cannot recommend closed $target", (rule) => {
    const result = recommendAdaptiveWork({
      ...empty,
      hasDurablePracticeFinish: true,
      closedTargets: [rule.target],
      latestSourceCheckpoints: {
        "table-impossible-sums": {
          outcome: "correct",
          hintsBeforeCheckpoint: false,
        },
        "guaranteed-sock-pair": {
          outcome: "correct",
          hintsBeforeCheckpoint: false,
        },
      },
    });
    if (result.kind === "recommendation")
      expect(result.problemId).not.toBe(rule.target);
  });
  it("distinguishes all bounded targets closed without making a mastery claim", () => {
    expect(
      recommendAdaptiveWork({
        ...empty,
        closedTargets: ADAPTIVE_RULES.map((rule) => rule.target),
      }),
    ).toEqual({ kind: "none", reason: "all-targets-closed" });
  });
});

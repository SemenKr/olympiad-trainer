import { describe, expect, it } from "vitest";
import {
  ADAPTIVE_RULES,
  getAdaptiveRecommendation,
  recommendationPresentation,
} from "./adaptive-recommendation";
import {
  appendGuaranteeEvidence,
  emptyGuaranteeProgressEvidence,
  type GuaranteeProgressEvidence,
} from "./guarantee-progress-evidence";
import {
  appendImpossibilityEvidence,
  emptyImpossibilityProgressEvidence,
  type ImpossibilityProgressEvidence,
} from "./impossibility-progress-evidence";
import {
  appendEnumerationEvidence,
  emptyEnumerationProgressEvidence,
} from "./enumeration-progress-evidence";
const states = ["absent", "hinted", "unhinted", "incorrect"] as const;
function evidence(
  table: (typeof states)[number],
  sock: (typeof states)[number],
) {
  let impossibility: ImpossibilityProgressEvidence =
    emptyImpossibilityProgressEvidence();
  let guarantee: GuaranteeProgressEvidence = emptyGuaranteeProgressEvidence();
  if (table !== "absent")
    impossibility = appendImpossibilityEvidence(impossibility, {
      problemId: "table-impossible-sums",
      observation: {
        checkpointId: "table-impossible-sums-impossibility-argument",
        selectedOptionId: table === "incorrect" ? "B" : "A",
        outcome: table === "incorrect" ? "incorrect" : "correct",
        validSubmissionCountAtSubmit: 1,
      },
      hintLevelsExposedBeforeCheckpoint: table === "hinted" ? ["focus"] : [],
      solutionExposedBeforeCheckpoint: false,
    })!;
  if (sock !== "absent")
    guarantee = appendGuaranteeEvidence(guarantee, {
      problemId: "guaranteed-sock-pair",
      observation: {
        checkpointId: "guaranteed-sock-pair-guarantee-argument",
        selectedOptionId: sock === "incorrect" ? "B" : "A",
        outcome: sock === "incorrect" ? "incorrect" : "correct",
        validSubmissionCountAtSubmit: 1,
      },
      hintLevelsExposedBeforeCheckpoint: sock === "hinted" ? ["focus"] : [],
      solutionExposedBeforeCheckpoint: false,
    })!;
  return { impossibility, guarantee };
}
describe("Adaptive v1 selection", () => {
  it("uses the latest observation of the source, including later incorrect and subsequent correct", () => {
    const initial = evidence("hinted", "absent");
    const contribution = {
      problemId: "table-impossible-sums" as const,
      observation: {
        checkpointId: "table-impossible-sums-impossibility-argument" as const,
        selectedOptionId: "B" as const,
        outcome: "incorrect" as const,
        validSubmissionCountAtSubmit: 1,
      },
      hintLevelsExposedBeforeCheckpoint: [] as const,
      solutionExposedBeforeCheckpoint: false as const,
    };
    const incorrect = appendImpossibilityEvidence(
      initial.impossibility,
      contribution,
    )!;
    const input = {
      guarantee: initial.guarantee,
      impossibility: incorrect,
      enumeration: emptyEnumerationProgressEvidence(),
      hasPracticeFinish: false,
      closedTargets: [],
    };
    expect(getAdaptiveRecommendation(input)).toEqual({ status: "none" });
    const correct = appendImpossibilityEvidence(incorrect, {
      ...contribution,
      observation: {
        ...contribution.observation,
        selectedOptionId: "A",
        outcome: "correct",
      },
    })!;
    expect(
      getAdaptiveRecommendation({ ...input, impossibility: correct }),
    ).toMatchObject({
      status: "recommendation",
      problemId: "brothers-ages-products",
    });
  });
  it.each(states.flatMap((table) => states.map((sock) => ({ table, sock }))))(
    "selects deterministically for table=$table sock=$sock",
    ({ table, sock }) => {
      const { guarantee, impossibility } = evidence(table, sock);
      const expected =
        table === "hinted"
          ? "brothers-ages-products"
          : sock === "hinted"
            ? "parrots-guaranteed-colors"
            : table === "unhinted"
              ? "brothers-ages-products"
              : sock === "unhinted"
                ? "parrots-guaranteed-colors"
                : "pages-without-digit-one";
      const result = getAdaptiveRecommendation({
        guarantee: guarantee,
        impossibility: impossibility,
        enumeration: emptyEnumerationProgressEvidence(),
        hasPracticeFinish: true,
        closedTargets: [],
      });
      expect(result).toMatchObject({
        status: "recommendation",
        problemId: expected,
      });
      expect(
        getAdaptiveRecommendation({
          guarantee: guarantee,
          impossibility: impossibility,
          enumeration: emptyEnumerationProgressEvidence(),
          hasPracticeFinish: true,
          closedTargets: [],
        }),
      ).toEqual(result);
    },
  );
  it.each(ADAPTIVE_RULES)(
    "a receipt closes $target without manufacturing an attempted flag",
    ({ target }) => {
      const { guarantee, impossibility } = evidence("hinted", "hinted");
      const result = getAdaptiveRecommendation({
        guarantee: guarantee,
        impossibility: impossibility,
        enumeration: emptyEnumerationProgressEvidence(),
        hasPracticeFinish: true,
        closedTargets: [target],
      });
      if (result.status === "recommendation")
        expect(result.problemId).not.toBe(target);
    },
  );
  it("does not call incorrect-only enumeration unknown/unobserved", () => {
    const enumeration = appendEnumerationEvidence(
      emptyEnumerationProgressEvidence(),
      {
        problemId: "pages-without-digit-one",
        observation: {
          checkpointId: "pages-without-digit-one-complete-enumeration",
          selectedOptionId: "B",
          outcome: "incorrect",
          validSubmissionCountAtSubmit: 1,
        },
        hintLevelsExposedBeforeCheckpoint: [],
        solutionExposedBeforeCheckpoint: false,
      },
    )!;
    expect(
      getAdaptiveRecommendation({
        guarantee: emptyGuaranteeProgressEvidence(),
        impossibility: emptyImpossibilityProgressEvidence(),
        enumeration: enumeration,
        hasPracticeFinish: true,
        closedTargets: [],
      }),
    ).toEqual({ status: "none" });
  });
  it("projects only safe keys and no strategy or assessment details", () => {
    for (const [table, sock] of [
      ["hinted", "unhinted"],
      ["absent", "hinted"],
      ["absent", "absent"],
    ] as const) {
      const { guarantee, impossibility } = evidence(table, sock);
      const result = getAdaptiveRecommendation({
        guarantee: guarantee,
        impossibility: impossibility,
        enumeration: emptyEnumerationProgressEvidence(),
        hasPracticeFinish: true,
        closedTargets: [],
      });
      expect(Object.keys(result).sort()).toEqual([
        "problemId",
        "reason",
        "status",
      ]);
      if (result.status !== "recommendation")
        throw new Error("Expected candidate");
      const view = recommendationPresentation(result);
      expect(Object.keys(view).sort()).toEqual(["href", "reason", "title"]);
      expect(JSON.stringify(result)).not.toMatch(
        /sequence|selectedOptionId|checkpoint|nextSequence|strategy|перебор|блок|наихудш|слаб|освоил|забыл/,
      );
    }
  });
});

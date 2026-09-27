import { describe, expect, it } from "vitest";

import {
  appendImpossibilityEvidence,
  deriveImpossibilityProgressInterpretation,
  emptyImpossibilityProgressEvidence,
  getImpossibilityEvidenceContribution,
  getImpossibilityTransferReason,
  impossibilityFacts,
  validateImpossibilityProgressEvidence,
  type ImpossibilityEvidenceContribution,
} from "./impossibility-progress-evidence";

function contribution(
  problemId: "table-impossible-sums" | "brothers-ages-products",
  outcome: "correct" | "incorrect" = "correct",
  hinted = false,
): ImpossibilityEvidenceContribution {
  return {
    problemId,
    observation: {
      checkpointId:
        problemId === "table-impossible-sums"
          ? "table-impossible-sums-impossibility-argument"
          : "brothers-ages-products-youngest-lower-bound",
      selectedOptionId: outcome === "correct" ? "A" : "B",
      outcome,
      validSubmissionCountAtSubmit: 1,
    },
    hintLevelsExposedBeforeCheckpoint: hinted ? ["focus"] : [],
    solutionExposedBeforeCheckpoint: false,
  };
}

describe("one explicit impossibility transfer", () => {
  it.each([
    [true, "В прошлой задаче", "Уже получается"],
    [false, "Раньше ты уже", "Получается в разных задачах"],
  ] as const)(
    "recommends from latest I-08 positive (%s) and bounds independent recognition",
    (hinted, reason, group) => {
      const prior = appendImpossibilityEvidence(
        emptyImpossibilityProgressEvidence(),
        contribution("table-impossible-sums", "correct", hinted),
      )!;
      expect(getImpossibilityTransferReason(prior)).toContain(reason);
      const next = appendImpossibilityEvidence(
        prior,
        contribution("brothers-ages-products"),
      )!;
      expect(next.version).toBe(2);
      expect(validateImpossibilityProgressEvidence(next)).not.toBeNull();
      expect(
        impossibilityFacts(next).map((fact) => [fact.problemId, fact.sequence]),
      ).toEqual([
        ["table-impossible-sums", 1],
        ["brothers-ages-products", 2],
      ]);
      expect(deriveImpossibilityProgressInterpretation(next)).toMatchObject({
        progressGroup: group,
      });
      expect(
        deriveImpossibilityProgressInterpretation(next).conclusion,
      ).toMatch(/построени|строить/);
    },
  );

  it("does not recommend from unknown, incorrect-only, or later incorrect I-08", () => {
    const empty = emptyImpossibilityProgressEvidence();
    expect(getImpossibilityTransferReason(empty)).toBeNull();
    const incorrect = appendImpossibilityEvidence(
      empty,
      contribution("table-impossible-sums", "incorrect"),
    )!;
    expect(getImpossibilityTransferReason(incorrect)).toBeNull();
    const positive = appendImpossibilityEvidence(
      incorrect,
      contribution("table-impossible-sums"),
    )!;
    expect(getImpossibilityTransferReason(positive)).not.toBeNull();
    const laterIncorrect = appendImpossibilityEvidence(
      positive,
      contribution("table-impossible-sums", "incorrect"),
    )!;
    expect(getImpossibilityTransferReason(laterIncorrect)).toBeNull();
  });

  it("hinted transfer stays bounded; incorrect transfer preserves I-08; solution/main-only makes no fact", () => {
    const prior = appendImpossibilityEvidence(
      emptyImpossibilityProgressEvidence(),
      contribution("table-impossible-sums"),
    )!;
    const hinted = appendImpossibilityEvidence(
      prior,
      contribution("brothers-ages-products", "correct", true),
    )!;
    expect(
      deriveImpossibilityProgressInterpretation(hinted).progressGroup,
    ).toBe("Начинаю разбираться");
    const incorrect = appendImpossibilityEvidence(
      prior,
      contribution("brothers-ages-products", "incorrect"),
    )!;
    expect(
      deriveImpossibilityProgressInterpretation(incorrect).progressGroup,
    ).toBe("Начинаю разбираться");
    expect(
      deriveImpossibilityProgressInterpretation(incorrect).conclusion,
    ).toContain("пока не подтверждает перенос");
    const summary = {
      outcome: "eventually-correct" as const,
      validSubmissionCount: 1,
      hintExposures: [],
      solutionExposure: null,
    };
    expect(
      getImpossibilityEvidenceContribution({
        problemId: "brothers-ages-products",
        summary,
      }),
    ).toBeNull();
    expect(
      getImpossibilityEvidenceContribution({
        problemId: "brothers-ages-products",
        summary: {
          ...summary,
          solutionExposure: {
            solutionId: "brothers-ages-products-full-solution",
            validSubmissionCountAtOpen: 1,
          },
        },
        reasoningCheckpointObservation: contribution("brothers-ages-products")
          .observation,
      }),
    ).toBeNull();
  });

  it.each([
    {
      priorHinted: true,
      laterHinted: false,
      group: "Уже получается",
    },
    {
      priorHinted: false,
      laterHinted: true,
      group: "Получается в разных задачах",
    },
  ] as const)(
    "keeps the original transfer basis after later I-08 success ($group)",
    ({ priorHinted, laterHinted, group }) => {
      const prior = appendImpossibilityEvidence(
        emptyImpossibilityProgressEvidence(),
        contribution("table-impossible-sums", "correct", priorHinted),
      )!;
      const transferred = appendImpossibilityEvidence(
        prior,
        contribution("brothers-ages-products"),
      )!;
      expect(transferred).toMatchObject({
        version: 2,
        tableBasisForBrothersWithoutHints: {
          sequence: 1,
          observation: contribution("table-impossible-sums").observation,
          hintLevelsExposedBeforeCheckpoint: priorHinted ? ["focus"] : [],
        },
      });
      const later = appendImpossibilityEvidence(
        transferred,
        contribution("table-impossible-sums", "correct", laterHinted),
      )!;
      expect(validateImpossibilityProgressEvidence(later)).not.toBeNull();
      expect(later).toMatchObject({
        version: 2,
        tableBasisForBrothersWithoutHints:
          transferred.version === 2
            ? transferred.tableBasisForBrothersWithoutHints
            : null,
      });
      expect(
        deriveImpossibilityProgressInterpretation(later).progressGroup,
      ).toBe(group);
      expect(
        impossibilityFacts(later)
          .map((fact) => fact.sequence)
          .sort(),
      ).toEqual([1, 2, 3].sort());
    },
  );

  it("rejects a transfer basis that reuses another checkpoint sequence", () => {
    const table = appendImpossibilityEvidence(
      emptyImpossibilityProgressEvidence(),
      contribution("table-impossible-sums"),
    )!;
    const hinted = appendImpossibilityEvidence(
      table,
      contribution("brothers-ages-products", "correct", true),
    )!;
    const independent = appendImpossibilityEvidence(
      hinted,
      contribution("brothers-ages-products"),
    )!;
    expect(independent.version).toBe(2);
    if (independent.version !== 2) return;
    expect(validateImpossibilityProgressEvidence(independent)).not.toBeNull();
    expect(
      validateImpossibilityProgressEvidence({
        ...independent,
        tableBasisForBrothersWithoutHints: {
          ...independent.tableBasisForBrothersWithoutHints,
          sequence: 2,
        },
      }),
    ).toBeNull();
  });
});

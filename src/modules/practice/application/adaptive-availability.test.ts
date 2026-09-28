import { describe, expect, it } from "vitest";

import {
  appendGuaranteeEvidence,
  emptyGuaranteeProgressEvidence,
} from "./guarantee-progress-evidence";
import {
  appendImpossibilityEvidence,
  emptyImpossibilityProgressEvidence,
} from "./impossibility-progress-evidence";
import { classifyAdaptiveAvailability } from "./adaptive-availability";

const unattempted = {
  brothersAttempted: false,
  brothersSolutionExposed: false,
  parrotsAttempted: false,
  parrotsSolutionExposed: false,
};
const sock = {
  problemId: "guaranteed-sock-pair" as const,
  observation: {
    checkpointId: "guaranteed-sock-pair-guarantee-argument" as const,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  hintLevelsExposedBeforeCheckpoint: [] as const,
  solutionExposedBeforeCheckpoint: false as const,
};
const table = {
  problemId: "table-impossible-sums" as const,
  observation: {
    checkpointId: "table-impossible-sums-impossibility-argument" as const,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  hintLevelsExposedBeforeCheckpoint: [] as const,
  solutionExposedBeforeCheckpoint: false as const,
};

describe("adaptive availability", () => {
  const emptyGuarantee = emptyGuaranteeProgressEvidence();
  const emptyImpossibility = emptyImpossibilityProgressEvidence();

  it("keeps I-08 first when both transfer paths qualify", () => {
    const guarantee = appendGuaranteeEvidence(emptyGuarantee, sock)!;
    const impossibility = appendImpossibilityEvidence(
      emptyImpossibility,
      table,
    )!;
    expect(
      classifyAdaptiveAvailability(guarantee, impossibility, unattempted),
    ).toMatchObject({
      status: "recommendation",
      problemId: "brothers-ages-products",
    });
    expect(
      classifyAdaptiveAvailability(guarantee, impossibility, {
        ...unattempted,
        brothersAttempted: true,
      }),
    ).toMatchObject({
      status: "recommendation",
      problemId: "parrots-guaranteed-colors",
    });
  });

  it("does not call one consumed transfer and one unsupported transfer exhausted", () => {
    expect(
      classifyAdaptiveAvailability(emptyGuarantee, emptyImpossibility, {
        ...unattempted,
        brothersAttempted: true,
      }),
    ).toEqual({ status: "insufficient-evidence" });
  });

  it("reports exhaustion only after both explicit targets are consumed", () => {
    expect(
      classifyAdaptiveAvailability(emptyGuarantee, emptyImpossibility, {
        ...unattempted,
        brothersAttempted: true,
        parrotsSolutionExposed: true,
      }),
    ).toEqual({ status: "transfer-exhausted" });
  });

  it("does not call incorrect or absent source evidence exhaustion", () => {
    const incorrect = appendImpossibilityEvidence(emptyImpossibility, {
      ...table,
      observation: {
        ...table.observation,
        selectedOptionId: "B",
        outcome: "incorrect",
      },
    })!;
    expect(
      classifyAdaptiveAvailability(emptyGuarantee, incorrect, unattempted),
    ).toEqual({ status: "insufficient-evidence" });
  });
});

import { describe, expect, it } from "vitest";

import {
  appendGuaranteeEvidence,
  deriveGuaranteeProgressInterpretation,
  emptyGuaranteeProgressEvidence,
  getGuaranteeEvidenceContribution,
  getGuaranteeTransferReason,
  guaranteeFacts,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceContribution,
} from "./guarantee-progress-evidence";

function contribution(
  problemId: GuaranteeEvidenceContribution["problemId"],
  outcome: "correct" | "incorrect" = "correct",
  hinted = false,
): GuaranteeEvidenceContribution {
  return {
    problemId,
    observation: {
      checkpointId:
        problemId === "guaranteed-sock-pair"
          ? "guaranteed-sock-pair-guarantee-argument"
          : "parrots-guaranteed-colors-guarantee-argument",
      selectedOptionId: outcome === "correct" ? "A" : "B",
      outcome,
      validSubmissionCountAtSubmit: 1,
    },
    hintLevelsExposedBeforeCheckpoint: hinted ? ["focus"] : [],
    solutionExposedBeforeCheckpoint: false,
  };
}

describe("explicit sock to parrots evidence", () => {
  it.each([
    [true, "Уже получается", "В прошлой задаче"],
    [false, "Получается в разных задачах", "Раньше ты уже"],
  ] as const)("freezes a %s hinted basis", (hinted, group, reasonStart) => {
    const sock = appendGuaranteeEvidence(
      emptyGuaranteeProgressEvidence(),
      contribution("guaranteed-sock-pair", "correct", hinted),
    )!;
    expect(getGuaranteeTransferReason(sock)).toContain(reasonStart);
    expect(getGuaranteeTransferReason(sock)).not.toMatch(/не-красн|не-жёлт/);
    const parrots = appendGuaranteeEvidence(
      sock,
      contribution("parrots-guaranteed-colors"),
    )!;
    expect(parrots.version).toBe(2);
    expect(validateGuaranteeProgressEvidence(parrots)).not.toBeNull();
    expect(deriveGuaranteeProgressInterpretation(parrots).progressGroup).toBe(
      group,
    );
    const laterSock = appendGuaranteeEvidence(
      parrots,
      contribution("guaranteed-sock-pair", "correct", !hinted),
    )!;
    expect(deriveGuaranteeProgressInterpretation(laterSock).progressGroup).toBe(
      group,
    );
    expect(guaranteeFacts(laterSock)).toContainEqual({
      sequence: 1,
      ...contribution("guaranteed-sock-pair", "correct", hinted),
    });
  });

  it("suppresses after a later sock incorrect and restores after a new correct", () => {
    const empty = emptyGuaranteeProgressEvidence();
    expect(getGuaranteeTransferReason(empty)).toBeNull();
    const incorrectOnly = appendGuaranteeEvidence(
      empty,
      contribution("guaranteed-sock-pair", "incorrect"),
    )!;
    expect(getGuaranteeTransferReason(incorrectOnly)).toBeNull();
    const positive = appendGuaranteeEvidence(
      incorrectOnly,
      contribution("guaranteed-sock-pair"),
    )!;
    expect(getGuaranteeTransferReason(positive)).not.toBeNull();
    const laterIncorrect = appendGuaranteeEvidence(
      positive,
      contribution("guaranteed-sock-pair", "incorrect"),
    )!;
    expect(getGuaranteeTransferReason(laterIncorrect)).toBeNull();
    expect(
      deriveGuaranteeProgressInterpretation(laterIncorrect).progressGroup,
    ).toBe("Начинаю разбираться");
    const restored = appendGuaranteeEvidence(
      laterIncorrect,
      contribution("guaranteed-sock-pair", "correct", true),
    )!;
    expect(getGuaranteeTransferReason(restored)).toContain("В прошлой задаче");
  });

  it("bounds hinted and incorrect parrots and gives no evidence for numeric-only or exposed work", () => {
    const sock = appendGuaranteeEvidence(
      emptyGuaranteeProgressEvidence(),
      contribution("guaranteed-sock-pair"),
    )!;
    const hinted = appendGuaranteeEvidence(
      sock,
      contribution("parrots-guaranteed-colors", "correct", true),
    )!;
    expect(deriveGuaranteeProgressInterpretation(hinted).progressGroup).toBe(
      "Начинаю разбираться",
    );
    const incorrect = appendGuaranteeEvidence(
      sock,
      contribution("parrots-guaranteed-colors", "incorrect"),
    )!;
    expect(deriveGuaranteeProgressInterpretation(incorrect)).toMatchObject({
      progressGroup: "Начинаю разбираться",
    });
    expect(
      deriveGuaranteeProgressInterpretation(incorrect).conclusion,
    ).toContain("не подтверждает перенос");
    const summary = {
      outcome: "eventually-correct" as const,
      validSubmissionCount: 1,
      hintExposures: [],
      solutionExposure: null,
    };
    expect(
      getGuaranteeEvidenceContribution({
        problemId: "parrots-guaranteed-colors",
        summary,
      }),
    ).toBeNull();
    expect(
      getGuaranteeEvidenceContribution({
        problemId: "parrots-guaranteed-colors",
        summary: {
          ...summary,
          solutionExposure: {
            solutionId: "parrots-guaranteed-colors-full-solution",
            validSubmissionCountAtOpen: 1,
          },
        },
        reasoningCheckpointObservation: contribution(
          "parrots-guaranteed-colors",
        ).observation,
      }),
    ).toBeNull();
  });

  it("reads legacy v1 and migrates on the first parrots fact", () => {
    const legacy = appendGuaranteeEvidence(
      emptyGuaranteeProgressEvidence(),
      contribution("guaranteed-sock-pair"),
    )!;
    expect(legacy.version).toBe(1);
    expect(validateGuaranteeProgressEvidence(legacy)).toEqual(legacy);
    const migrated = appendGuaranteeEvidence(
      legacy,
      contribution("parrots-guaranteed-colors"),
    )!;
    expect(migrated).toMatchObject({
      version: 2,
      nextSequence: 3,
      sockBasisForParrotsWithoutHints: { sequence: 1 },
      parrots: { latestCorrectWithoutHints: { sequence: 2 } },
    });
    expect(validateGuaranteeProgressEvidence(migrated)).toEqual(migrated);
  });
});

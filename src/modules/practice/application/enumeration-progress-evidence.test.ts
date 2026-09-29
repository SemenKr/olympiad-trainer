import { describe, expect, it } from "vitest";

import {
  appendEnumerationEvidence,
  deriveEnumerationProgressInterpretation,
  emptyEnumerationProgressEvidence,
  getEnumerationEvidenceContribution,
  validateEnumerationProgressEvidence,
} from "./enumeration-progress-evidence";
import { canAttemptReasoningCheckpoint } from "./reasoning-checkpoint";
import { recordAnswerResult, startPractice } from "./practice-state";

const observation = {
  checkpointId: "pages-without-digit-one-complete-enumeration" as const,
  selectedOptionId: "A" as const,
  outcome: "correct" as const,
  validSubmissionCountAtSubmit: 1,
};
const summary = {
  outcome: "eventually-correct" as const,
  validSubmissionCount: 1,
  hintExposures: [],
  solutionExposure: null,
};

describe("explicit enumeration evidence", () => {
  it("requires a correct main answer before the checkpoint", () => {
    expect(canAttemptReasoningCheckpoint(startPractice(), null)).toBe(false);
    const correct = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: "232",
    });
    expect(canAttemptReasoningCheckpoint(correct, null)).toBe(true);
  });

  it("bounds independent recognition without claiming construction", () => {
    const contribution = getEnumerationEvidenceContribution({
      problemId: "pages-without-digit-one",
      summary,
      reasoningCheckpointObservation: observation,
    })!;
    expect(Object.keys(contribution).sort()).toEqual([
      "hintLevelsExposedBeforeCheckpoint",
      "observation",
      "problemId",
      "solutionExposedBeforeCheckpoint",
    ]);
    const evidence = appendEnumerationEvidence(
      emptyEnumerationProgressEvidence(),
      contribution,
    )!;
    expect(deriveEnumerationProgressInterpretation(evidence)).toEqual({
      capability: "Систематически перебирать случаи и обосновывать полноту",
      learnerLabel: "Проверять все возможные случаи",
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Без подсказок ты верно выбрал способ перебора, в котором каждый подходящий случай учитывается ровно один раз. Пока это показывает распознавание полного перебора, а не умение самостоятельно строить такой разбор в новой задаче.",
    });
    expect(validateEnumerationProgressEvidence(evidence)).toEqual(evidence);
    expect(
      validateEnumerationProgressEvidence({ ...evidence, nextSequence: 1 }),
    ).toBeNull();
  });

  it("keeps hinted recognition bounded and incorrect-only neutral", () => {
    const hinted = getEnumerationEvidenceContribution({
      problemId: "pages-without-digit-one",
      summary: {
        ...summary,
        hintExposures: [
          {
            hintId: "pages-without-digit-one-focus-count",
            level: "focus" as const,
            validSubmissionCountAtOpen: 0,
          },
        ],
      },
      reasoningCheckpointObservation: observation,
    })!;
    const evidence = appendEnumerationEvidence(
      emptyEnumerationProgressEvidence(),
      hinted,
    )!;
    expect(deriveEnumerationProgressInterpretation(evidence)).toMatchObject({
      progressGroup: "Начинаю разбираться",
      conclusion:
        "После подсказок ты верно выбрал способ, который не пропускает подходящие случаи и не считает их дважды. Самостоятельное построение полного перебора пока не проверено.",
    });
    const incorrect = appendEnumerationEvidence(
      emptyEnumerationProgressEvidence(),
      {
        ...hinted,
        observation: {
          ...observation,
          selectedOptionId: "B",
          outcome: "incorrect",
        },
      },
    )!;
    expect(deriveEnumerationProgressInterpretation(incorrect)).toMatchObject({
      progressGroup: null,
      conclusion: "Проверенного выбора способа полного перебора пока нет.",
    });
  });

  it("does not create positive evidence from main answer, skipped work, or solution exposure", () => {
    const base = { problemId: "pages-without-digit-one", summary };
    expect(getEnumerationEvidenceContribution(base)).toBeNull();
    expect(
      getEnumerationEvidenceContribution({
        ...base,
        taskOutcome: "skipped",
        reasoningCheckpointObservation: observation,
      }),
    ).toBeNull();
    expect(
      getEnumerationEvidenceContribution({
        ...base,
        summary: {
          ...summary,
          solutionExposure: {
            solutionId: "pages-without-digit-one-full-solution",
            validSubmissionCountAtOpen: 1,
          },
        },
        reasoningCheckpointObservation: observation,
      }),
    ).toBeNull();
  });
});

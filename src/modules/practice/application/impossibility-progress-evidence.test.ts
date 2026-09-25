import { describe, expect, it } from "vitest";

import {
  appendImpossibilityEvidence,
  deriveImpossibilityProgressInterpretation,
  emptyImpossibilityProgressEvidence,
  getImpossibilityEvidenceContribution,
  validateImpossibilityProgressEvidence,
} from "./impossibility-progress-evidence";
import {
  appendPracticeProgressEvidence,
  emptyPracticeProgressEvidence,
  getPracticeProgressContribution,
  progressEvidenceBuckets,
  validatePracticeProgressEvidence,
} from "./practice-progress-evidence";
import {
  TABLE_REASONING_CHECKPOINT_ID,
  SOCK_REASONING_CHECKPOINT_ID,
} from "./reasoning-checkpoint";

const summary = {
  outcome: "eventually-correct" as const,
  validSubmissionCount: 1,
  hintExposures: [],
  solutionExposure: null,
};
const tableResult = {
  problemId: "table-impossible-sums",
  problemTitle: "Невозможные суммы",
  summary,
  reasoningCheckpointObservation: {
    checkpointId: TABLE_REASONING_CHECKPOINT_ID,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
};

describe("impossibility Progress bucket", () => {
  it("derives only bounded recognition from no-hint and hinted successes", () => {
    const noHint = getImpossibilityEvidenceContribution(tableResult)!;
    const first = appendImpossibilityEvidence(
      emptyImpossibilityProgressEvidence(),
      noHint,
    )!;
    expect(deriveImpossibilityProgressInterpretation(first)).toMatchObject({
      progressGroup: "Начинаю разбираться",
      conclusion: expect.stringContaining(
        "распознавание готового доказательства",
      ),
    });
    const hinted = getImpossibilityEvidenceContribution({
      ...tableResult,
      summary: {
        ...summary,
        hintExposures: [
          {
            hintId: "table-impossible-sums-focus-constraints",
            level: "focus" as const,
            validSubmissionCountAtOpen: 0,
          },
        ],
      },
    })!;
    const hintedOnly = appendImpossibilityEvidence(
      emptyImpossibilityProgressEvidence(),
      hinted,
    )!;
    expect(deriveImpossibilityProgressInterpretation(hintedOnly)).toMatchObject(
      {
        progressGroup: "Начинаю разбираться",
        conclusion: expect.stringContaining("Самостоятельное построение"),
      },
    );
    const incorrect = getImpossibilityEvidenceContribution({
      ...tableResult,
      reasoningCheckpointObservation: {
        ...tableResult.reasoningCheckpointObservation,
        selectedOptionId: "B" as const,
        outcome: "incorrect" as const,
      },
    })!;
    const later = appendImpossibilityEvidence(first, incorrect)!;
    expect(later.latestCorrectWithoutHints).toEqual(
      first.latestCorrectWithoutHints,
    );
    expect(deriveImpossibilityProgressInterpretation(later)).toMatchObject({
      progressGroup: "Начинаю разбираться",
      conclusion: expect.stringContaining("Пока рано говорить о стабильности"),
    });
    expect(
      deriveImpossibilityProgressInterpretation(
        appendImpossibilityEvidence(
          emptyImpossibilityProgressEvidence(),
          incorrect,
        )!,
      ),
    ).toMatchObject({
      progressGroup: null,
      conclusion: expect.stringContaining("Пока рано сказать"),
    });
    expect(validateImpossibilityProgressEvidence(later)).not.toBeNull();
  });

  it("excludes skip, absent checkpoint, main-only and solution exposure", () => {
    expect(
      getImpossibilityEvidenceContribution({
        ...tableResult,
        taskOutcome: "skipped" as const,
      }),
    ).toBeNull();
    expect(
      getImpossibilityEvidenceContribution({
        ...tableResult,
        reasoningCheckpointObservation: undefined,
      }),
    ).toBeNull();
    expect(
      getImpossibilityEvidenceContribution({
        ...tableResult,
        summary: {
          ...summary,
          solutionExposure: {
            solutionId: "table-impossible-sums-full-solution",
            validSubmissionCountAtOpen: 1,
          },
        },
      }),
    ).toBeNull();
  });

  it("migrates the guarantee-only shape on the first table contribution and keeps both buckets", () => {
    const sock = getPracticeProgressContribution({
      problemId: "guaranteed-sock-pair",
      summary,
      reasoningCheckpointObservation: {
        checkpointId: SOCK_REASONING_CHECKPOINT_ID,
        selectedOptionId: "A",
        outcome: "correct",
        validSubmissionCountAtSubmit: 1,
      },
    })!;
    const guaranteeOnly = appendPracticeProgressEvidence(
      emptyPracticeProgressEvidence(),
      sock,
    )!;
    expect(guaranteeOnly.version).toBe(1);
    const table = getPracticeProgressContribution(tableResult)!;
    const both = appendPracticeProgressEvidence(guaranteeOnly, table)!;
    expect(both.version).toBe(2);
    expect(validatePracticeProgressEvidence(both)).not.toBeNull();
    expect(
      progressEvidenceBuckets(both).guarantee.latestCorrectWithoutHints,
    ).not.toBeNull();
    expect(
      progressEvidenceBuckets(both).impossibility.latestCorrectWithoutHints,
    ).not.toBeNull();
  });
});

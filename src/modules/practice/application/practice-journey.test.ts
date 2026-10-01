import { describe, expect, it } from "vitest";
import {
  calculatePracticeJourneyFinish,
  getNextPracticeJourneyMilestone,
  getPracticeJourneyMilestones,
} from "./practice-journey";
import type { CompletedPracticeEpisodeFactsV1 } from "./completed-practice-episode";

function episode(
  ...problems: readonly Partial<
    CompletedPracticeEpisodeFactsV1["problems"][number]
  >[]
): CompletedPracticeEpisodeFactsV1 {
  return {
    version: 1,
    problems: problems.map((problem, index) => ({
      problemId: `problem-${index}`,
      outcome: "no-valid-submissions",
      skipped: false,
      validSubmissionCount: 0,
      hintLevelsExposed: [],
      solutionExposed: false,
      checkpoint: null,
      ...problem,
    })),
  };
}

describe("Practice Journey XP", () => {
  it.each([
    [
      "correct, no hints",
      { outcome: "eventually-correct", validSubmissionCount: 1 },
    ],
    [
      "correct with hints",
      {
        outcome: "eventually-correct",
        validSubmissionCount: 2,
        hintLevelsExposed: ["focus", "strategy"],
      },
    ],
    [
      "incorrect attempts",
      { outcome: "incorrect-only", validSubmissionCount: 3 },
    ],
    [
      "incorrect then correct",
      { outcome: "eventually-correct", validSubmissionCount: 4 },
    ],
    [
      "valid attempt then Skip",
      { outcome: "incorrect-only", validSubmissionCount: 1, skipped: true },
    ],
    ["full solution", { solutionExposed: true }],
    [
      "checkpoint",
      {
        outcome: "eventually-correct",
        validSubmissionCount: 1,
        checkpoint: { checkpointId: "checkpoint", outcome: "correct" },
      },
    ],
  ] as const)("awards exactly one problem reward for %s", (_label, problem) => {
    expect(calculatePracticeJourneyFinish(episode(problem), 0).earnedXp).toBe(
      10,
    );
  });

  it.each([
    ["Skip only", { skipped: true }],
    ["invalid-only answer", {}],
  ] as const)("awards no XP for %s", (_label, problem) => {
    expect(calculatePracticeJourneyFinish(episode(problem), 0).earnedXp).toBe(
      0,
    );
  });

  it("caps multiple submissions in one episode at one award per problem", () => {
    const facts = episode(
      { validSubmissionCount: 20 },
      {
        validSubmissionCount: 1,
        hintLevelsExposed: ["focus", "strategy", "next-step"],
      },
      { solutionExposed: true },
    );
    expect(calculatePracticeJourneyFinish(facts, 0).earnedXp).toBe(30);
  });

  it("treats support facts as unrelated and checkpoint as non-bonus", () => {
    const before = episode({ validSubmissionCount: 1 });
    const withCheckpointAndSupport = episode({
      validSubmissionCount: 1,
      checkpoint: { checkpointId: "checkpoint", outcome: "incorrect" },
    }) as CompletedPracticeEpisodeFactsV1 & {
      knowledgeSupport: { diagnosticOutcome: "incorrect"; lessonOpened: true };
    };
    withCheckpointAndSupport.knowledgeSupport = {
      diagnosticOutcome: "incorrect",
      lessonOpened: true,
    };
    expect(calculatePracticeJourneyFinish(before, 0).earnedXp).toBe(10);
    expect(
      calculatePracticeJourneyFinish(withCheckpointAndSupport, 0).earnedXp,
    ).toBe(10);
  });

  it.each([
    [0, 10, "Первый шаг"],
    [40, 50, "50 XP практики"],
    [90, 100, "100 XP практики"],
  ] as const)(
    "detects the %s → %s milestone crossing once",
    (prior, total, label) => {
      const result = calculatePracticeJourneyFinish(
        episode({ validSubmissionCount: 1 }),
        prior,
      );
      expect(result).toEqual({
        earnedXp: 10,
        totalXp: total,
        newlyReachedMilestone: label,
      });
      expect(
        calculatePracticeJourneyFinish(
          episode({ validSubmissionCount: 1 }),
          total,
        ).newlyReachedMilestone,
      ).toBeNull();
    },
  );

  it("keeps cumulative XP growing without inventing a milestone after 100", () => {
    expect(
      calculatePracticeJourneyFinish(episode({ validSubmissionCount: 1 }), 100),
    ).toEqual({
      earnedXp: 10,
      totalXp: 110,
      newlyReachedMilestone: null,
    });
    expect(getNextPracticeJourneyMilestone(100)).toBeNull();
    expect(
      getPracticeJourneyMilestones(110).map(({ reached }) => reached),
    ).toEqual([true, true, true]);
  });
});

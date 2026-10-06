import { describe, expect, it } from "vitest";
import {
  calculatePracticeJourneyFinish,
  getNextPracticeJourneyBadge,
  getNextPracticeJourneyLevel,
  getNextPracticeJourneyMilestone,
  getPracticeJourneyBadges,
  getPracticeJourneyLevel,
  getPracticeJourneyLevelProgress,
  getPracticeJourneyMilestones,
  getPracticeJourneyRewardDelta,
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

  it("keeps cumulative XP growing without inventing a legacy milestone after 100", () => {
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

describe("Practice Journey v1 projections", () => {
  it.each([
    [0, 1, "Старт"],
    [29, 1, "Старт"],
    [30, 2, "В движении"],
    [79, 2, "В движении"],
    [80, 3, "В ритме"],
    [150, 4, "Набираю ход"],
    [250, 5, "Держу темп"],
    [400, 6, "Длинная дистанция"],
    [999, 6, "Длинная дистанция"],
  ] as const)("maps %s XP to level %s", (xp, level, label) => {
    expect(getPracticeJourneyLevel(xp)).toMatchObject({ level, label });
  });

  it("derives progress to the next level without persistence", () => {
    expect(getPracticeJourneyLevelProgress(50)).toEqual({
      current: { level: 2, threshold: 30, label: "В движении" },
      next: { level: 3, threshold: 80, label: "В ритме" },
      xpToNext: 30,
      progressValue: 20,
      progressMax: 50,
      progressPercent: 40,
    });
    expect(getNextPracticeJourneyLevel(400)).toBeNull();
    expect(getPracticeJourneyLevelProgress(430).progressPercent).toBe(100);
  });

  it("derives badge collection and the next badge from total XP", () => {
    expect(
      getPracticeJourneyBadges(100).map(({ label, reached }) => [
        label,
        reached,
      ]),
    ).toEqual([
      ["Первый шаг", true],
      ["Начал разгон", true],
      ["Первая сотня", true],
      ["Стабильный темп", false],
      ["Большой путь", false],
    ]);
    expect(getNextPracticeJourneyBadge(100)).toEqual({
      threshold: 200,
      label: "Стабильный темп",
    });
    expect(getNextPracticeJourneyBadge(400)).toBeNull();
  });

  it("derives level and badge crossings from immutable Finish totals", () => {
    expect(getPracticeJourneyRewardDelta(70, 100)).toEqual({
      newLevel: { level: 3, threshold: 80, label: "В ритме" },
      newBadges: [{ threshold: 100, label: "Первая сотня" }],
    });
    expect(getPracticeJourneyRewardDelta(100, 110)).toEqual({
      newLevel: null,
      newBadges: [],
    });
  });

  it("treats v1 rewards as projections instead of changing XP rules", () => {
    const finish = calculatePracticeJourneyFinish(
      episode(
        { validSubmissionCount: 3 },
        { solutionExposed: true },
        { skipped: true },
      ),
      70,
    );
    expect(finish.earnedXp).toBe(20);
    expect(finish.totalXp).toBe(90);
    expect(getPracticeJourneyRewardDelta(70, finish.totalXp).newLevel).toEqual({
      level: 3,
      threshold: 80,
      label: "В ритме",
    });
  });
});

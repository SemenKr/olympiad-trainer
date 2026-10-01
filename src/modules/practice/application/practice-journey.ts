import type { CompletedPracticeEpisodeFactsV1 } from "./completed-practice-episode";

export const PRACTICE_XP_PER_PROBLEM = 10;

export const PRACTICE_JOURNEY_MILESTONES = [
  { threshold: 10, label: "Первый шаг" },
  { threshold: 50, label: "50 XP практики" },
  { threshold: 100, label: "100 XP практики" },
] as const;

export type PracticeJourneyMilestone =
  (typeof PRACTICE_JOURNEY_MILESTONES)[number]["label"];

export type PracticeJourneyFinish = Readonly<{
  earnedXp: number;
  totalXp: number;
  newlyReachedMilestone: PracticeJourneyMilestone | null;
}>;

export function calculatePracticeJourneyFinish(
  facts: CompletedPracticeEpisodeFactsV1,
  previousTotalXp: number,
): PracticeJourneyFinish {
  const earnedXp = facts.problems.reduce(
    (total, problem) =>
      total +
      (problem.validSubmissionCount > 0 || problem.solutionExposed
        ? PRACTICE_XP_PER_PROBLEM
        : 0),
    0,
  );
  const totalXp = previousTotalXp + earnedXp;
  const newlyReachedMilestone =
    PRACTICE_JOURNEY_MILESTONES.find(
      ({ threshold }) => previousTotalXp < threshold && totalXp >= threshold,
    )?.label ?? null;

  return { earnedXp, totalXp, newlyReachedMilestone };
}

export function getPracticeJourneyMilestones(totalXp: number) {
  return PRACTICE_JOURNEY_MILESTONES.map(({ threshold, label }) => ({
    threshold,
    label,
    reached: totalXp >= threshold,
  }));
}

export function getNextPracticeJourneyMilestone(totalXp: number) {
  return (
    PRACTICE_JOURNEY_MILESTONES.find(({ threshold }) => totalXp < threshold) ??
    null
  );
}

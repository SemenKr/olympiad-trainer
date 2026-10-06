import type { CompletedPracticeEpisodeFactsV1 } from "./completed-practice-episode";

export const PRACTICE_XP_PER_PROBLEM = 10;

export const PRACTICE_JOURNEY_MILESTONES = [
  { threshold: 10, label: "Первый шаг" },
  { threshold: 50, label: "50 XP практики" },
  { threshold: 100, label: "100 XP практики" },
] as const;

export const PRACTICE_JOURNEY_LEVELS = [
  { level: 1, threshold: 0, label: "Старт" },
  { level: 2, threshold: 30, label: "В движении" },
  { level: 3, threshold: 80, label: "В ритме" },
  { level: 4, threshold: 150, label: "Набираю ход" },
  { level: 5, threshold: 250, label: "Держу темп" },
  { level: 6, threshold: 400, label: "Длинная дистанция" },
] as const;

export const PRACTICE_JOURNEY_BADGES = [
  { threshold: 10, label: "Первый шаг" },
  { threshold: 50, label: "Начал разгон" },
  { threshold: 100, label: "Первая сотня" },
  { threshold: 200, label: "Стабильный темп" },
  { threshold: 350, label: "Большой путь" },
] as const;

export type PracticeJourneyMilestone =
  (typeof PRACTICE_JOURNEY_MILESTONES)[number]["label"];

export type PracticeJourneyLevel = (typeof PRACTICE_JOURNEY_LEVELS)[number];

export type PracticeJourneyBadge = (typeof PRACTICE_JOURNEY_BADGES)[number];

export type PracticeJourneyFinish = Readonly<{
  earnedXp: number;
  totalXp: number;
  newlyReachedMilestone: PracticeJourneyMilestone | null;
}>;

function normalizedXp(totalXp: number) {
  return Math.max(0, Math.floor(totalXp));
}

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

export function getPracticeJourneyLevel(totalXp: number): PracticeJourneyLevel {
  const xp = normalizedXp(totalXp);
  return (
    [...PRACTICE_JOURNEY_LEVELS]
      .reverse()
      .find(({ threshold }) => xp >= threshold) ?? PRACTICE_JOURNEY_LEVELS[0]
  );
}

export function getNextPracticeJourneyLevel(totalXp: number) {
  const current = getPracticeJourneyLevel(totalXp);
  return (
    PRACTICE_JOURNEY_LEVELS.find(({ level }) => level === current.level + 1) ??
    null
  );
}

export function getPracticeJourneyLevelProgress(totalXp: number) {
  const xp = normalizedXp(totalXp);
  const current = getPracticeJourneyLevel(xp);
  const next = getNextPracticeJourneyLevel(xp);

  if (!next) {
    return {
      current,
      next: null,
      xpToNext: 0,
      progressValue: 1,
      progressMax: 1,
      progressPercent: 100,
    } as const;
  }

  const progressValue = Math.max(0, xp - current.threshold);
  const progressMax = next.threshold - current.threshold;

  return {
    current,
    next,
    xpToNext: next.threshold - xp,
    progressValue,
    progressMax,
    progressPercent: Math.round((progressValue / progressMax) * 100),
  } as const;
}

export function getPracticeJourneyBadges(totalXp: number) {
  const xp = normalizedXp(totalXp);
  return PRACTICE_JOURNEY_BADGES.map((badge) => ({
    ...badge,
    reached: xp >= badge.threshold,
  }));
}

export function getNextPracticeJourneyBadge(totalXp: number) {
  const xp = normalizedXp(totalXp);
  return (
    PRACTICE_JOURNEY_BADGES.find(({ threshold }) => xp < threshold) ?? null
  );
}

export function getPracticeJourneyRewardDelta(
  previousTotalXp: number,
  totalXp: number,
) {
  const previous = normalizedXp(previousTotalXp);
  const current = normalizedXp(totalXp);

  if (current <= previous) {
    return { newLevel: null, newBadges: [] } as const;
  }

  const previousLevel = getPracticeJourneyLevel(previous);
  const currentLevel = getPracticeJourneyLevel(current);
  const newLevel =
    currentLevel.level > previousLevel.level ? currentLevel : null;
  const newBadges = PRACTICE_JOURNEY_BADGES.filter(
    ({ threshold }) => previous < threshold && current >= threshold,
  );

  return { newLevel, newBadges } as const;
}

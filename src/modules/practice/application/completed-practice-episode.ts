import type { PracticeSummary } from "./practice-state";
import type { ReasoningCheckpointObservation } from "./reasoning-checkpoint";

export const CORE_EPISODE_PROBLEM_IDS = [
  "coinciding-seats",
  "guaranteed-sock-pair",
  "table-impossible-sums",
] as const;
export const TRANSFER_EPISODE_PROBLEM_IDS = [
  "brothers-ages-products",
  "parrots-guaranteed-colors",
] as const;
export const EXPLORATION_EPISODE_PROBLEM_ID =
  "pages-without-digit-one" as const;
export const PRACTICE_PACKS = [
  {
    id: "pack-a",
    name: "Разные способы рассуждать",
    problemIds: [
      "granddaughters-first",
      "cutout-area-ratio",
      "domino-placements",
    ],
  },
  {
    id: "pack-b",
    name: "Связи и закономерности",
    problemIds: [
      "truck-car-same-arrival",
      "knights-all-or-none",
      "boastful-fisherman-streak",
    ],
  },
  {
    id: "pack-c",
    name: "Числа и структуры",
    problemIds: [
      "largest-valid-eight-digit",
      "three-numbers-digit-sums",
      "mountain-plain-flights",
    ],
  },
  {
    id: "pack-d",
    name: "Считаем по устройству",
    problemIds: [
      "exact-coin-payments",
      "odd-neighbor-sugar-cubes",
      "last-student-friends",
    ],
  },
  {
    id: "pack-e",
    name: "Условия и противоречия",
    problemIds: [
      "lineup-six-hooligans",
      "two-true-journalists",
      "neighbor-comparison-codes",
    ],
  },
  {
    id: "pack-f",
    name: "Модели и стратегии",
    problemIds: [
      "five-piles-stones",
      "untouched-matchstick-figures",
      "mountain-numbers-over-77777",
    ],
  },
  {
    id: "pack-g",
    name: "Границы и подсчёт",
    problemIds: [
      "nonadjacent-row-seating",
      "eighteen-piece-pie-cuts",
      "multiples-prefix-count",
    ],
  },
  {
    id: "pack-h",
    name: "Пропорции и баланс",
    problemIds: [
      "rabbit-carrot-shortfall",
      "grade-average-fives",
      "magic-forest-coin-difference",
    ],
  },
  {
    id: "pack-i",
    name: "Порядок и связи",
    problemIds: [
      "four-houses-distance-cases",
      "ivanov-older-brother-count",
      "cube-red-face-sums",
    ],
  },
  {
    id: "pack-j",
    name: "Набор J: считаем и сравниваем",
    problemIds: [
      "chocolate-promotion-price",
      "school-lesson-teacher-count",
      "soldier-figures-guarantee",
    ],
  },
  {
    id: "pack-k",
    name: "Набор K: выводы и доказательства",
    problemIds: [
      "apple-harvest-assignments",
      "liar-council-maximum",
      "central-coin-column",
    ],
  },
  {
    id: "pack-l",
    name: "Набор L: порядок и варианты",
    problemIds: [
      "five-fridays-calendar",
      "circular-table-seat-count",
      "balanced-six-groups",
    ],
  },
] as const satisfies readonly Readonly<{
  id: string;
  name: string;
  problemIds: readonly [string, string, string];
}>[];
export type PackId = (typeof PRACTICE_PACKS)[number]["id"];
export const PACK_A_PROBLEM_IDS = PRACTICE_PACKS[0].problemIds;
export const PACK_B_PROBLEM_IDS = PRACTICE_PACKS[1].problemIds;
export const PACK_C_PROBLEM_IDS = PRACTICE_PACKS[2].problemIds;

export function packById(
  value: unknown,
): (typeof PRACTICE_PACKS)[number] | null {
  return PRACTICE_PACKS.find((pack) => pack.id === value) ?? null;
}

export function packHref(packId: PackId): string {
  return packId === PRACTICE_PACKS[0].id
    ? "/practice/pack"
    : `/practice/pack?pack=${packId}`;
}

export function packProblemIds(packId: PackId) {
  return packById(packId)!.problemIds;
}

export function packIdFromProblemIds(
  problemIds: readonly string[],
): PackId | null {
  if (problemIds.length !== 3) return null;
  return (
    PRACTICE_PACKS.find((pack) =>
      pack.problemIds.every((id, index) => id === problemIds[index]),
    )?.id ?? null
  );
}

export type CompletedPracticeProblemFact = Readonly<{
  problemId: string;
  outcome: "no-valid-submissions" | "incorrect-only" | "eventually-correct";
  skipped: boolean;
  validSubmissionCount: number;
  hintLevelsExposed: readonly ("focus" | "strategy" | "next-step")[];
  solutionExposed: boolean;
  checkpoint: Readonly<{
    checkpointId: string;
    outcome: "correct" | "incorrect";
  }> | null;
}>;

export type CompletedPracticeEpisodeFactsV1 = Readonly<{
  version: 1;
  problems: readonly CompletedPracticeProblemFact[];
}>;
export type CompletedPracticeEpisodeMode =
  "core" | "transfer" | "exploration" | "pack";

type CompletedResult = Readonly<{
  problemId: string;
  summary: PracticeSummary;
  taskOutcome?: "skipped";
  reasoningCheckpointObservation?: ReasoningCheckpointObservation;
}>;

export function completedEpisodeFacts(
  results: readonly CompletedResult[],
): CompletedPracticeEpisodeFactsV1 {
  return {
    version: 1,
    problems: results.map((result) => ({
      problemId: result.problemId,
      outcome: result.summary.outcome,
      skipped: result.taskOutcome === "skipped",
      validSubmissionCount: result.summary.validSubmissionCount,
      hintLevelsExposed: result.summary.hintExposures.map((hint) => hint.level),
      solutionExposed: result.summary.solutionExposure !== null,
      checkpoint: result.reasoningCheckpointObservation
        ? {
            checkpointId: result.reasoningCheckpointObservation.checkpointId,
            outcome: result.reasoningCheckpointObservation.outcome,
          }
        : null,
    })),
  };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function denseArray(value: unknown): value is unknown[] {
  return (
    Array.isArray(value) &&
    Array.from(value.keys()).every((index) => Object.hasOwn(value, index))
  );
}

export function validateCompletedEpisode(
  mode: unknown,
  value: unknown,
): CompletedPracticeEpisodeFactsV1 | null {
  if (
    !record(value) ||
    !exactKeys(value, ["version", "problems"]) ||
    value.version !== 1 ||
    !denseArray(value.problems)
  )
    return null;
  const problems = value.problems;
  if (mode === "core") {
    if (
      problems.length !== CORE_EPISODE_PROBLEM_IDS.length ||
      !problems.every(
        (fact, index) =>
          record(fact) && fact.problemId === CORE_EPISODE_PROBLEM_IDS[index],
      )
    )
      return null;
  } else if (mode === "pack") {
    if (
      !packIdFromProblemIds(
        problems.map((fact) =>
          record(fact) && typeof fact.problemId === "string"
            ? fact.problemId
            : "",
        ),
      )
    )
      return null;
  } else if (mode === "transfer") {
    const first = problems[0];
    if (
      problems.length !== 1 ||
      !record(first) ||
      !TRANSFER_EPISODE_PROBLEM_IDS.some((id) => id === first.problemId)
    )
      return null;
  } else if (mode === "exploration") {
    if (
      problems.length !== 1 ||
      !record(problems[0]) ||
      problems[0].problemId !== EXPLORATION_EPISODE_PROBLEM_ID
    )
      return null;
  } else return null;

  for (const fact of problems) {
    if (
      !record(fact) ||
      !exactKeys(fact, [
        "problemId",
        "outcome",
        "skipped",
        "validSubmissionCount",
        "hintLevelsExposed",
        "solutionExposed",
        "checkpoint",
      ]) ||
      typeof fact.skipped !== "boolean" ||
      typeof fact.solutionExposed !== "boolean" ||
      !Number.isSafeInteger(fact.validSubmissionCount) ||
      (fact.validSubmissionCount as number) < 0 ||
      !denseArray(fact.hintLevelsExposed) ||
      fact.hintLevelsExposed.length > 3 ||
      !fact.hintLevelsExposed.every(
        (level, index) => level === ["focus", "strategy", "next-step"][index],
      )
    )
      return null;
    if (
      (fact.validSubmissionCount === 0 &&
        fact.outcome !== "no-valid-submissions") ||
      (fact.validSubmissionCount !== 0 &&
        fact.outcome !== "incorrect-only" &&
        fact.outcome !== "eventually-correct") ||
      (fact.skipped &&
        (fact.outcome === "eventually-correct" ||
          fact.solutionExposed ||
          fact.checkpoint !== null)) ||
      (fact.solutionExposed &&
        (fact.validSubmissionCount === 0 ||
          fact.hintLevelsExposed.length !== 3)) ||
      (mode === "pack" && fact.checkpoint !== null)
    )
      return null;
    if (
      fact.checkpoint !== null &&
      (!record(fact.checkpoint) ||
        !exactKeys(fact.checkpoint, ["checkpointId", "outcome"]) ||
        typeof fact.checkpoint.checkpointId !== "string" ||
        (fact.checkpoint.outcome !== "correct" &&
          fact.checkpoint.outcome !== "incorrect") ||
        fact.outcome !== "eventually-correct" ||
        fact.solutionExposed)
    )
      return null;
  }
  return value as CompletedPracticeEpisodeFactsV1;
}

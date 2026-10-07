import type {
  ActivePractice,
  PracticeHintExposure,
  PracticeSummary,
} from "../application/practice-state";
import {
  finishPractice,
  getPracticeSummary,
  startPractice,
} from "../application/practice-state";
import {
  appendPracticeProgressEvidence,
  emptyPracticeProgressEvidence,
  getPracticeProgressContribution,
  validatePracticeProgressEvidence,
  type PracticeProgressContribution,
  type PracticeProgressEvidence,
} from "../application/practice-progress-evidence";
import {
  completedEpisodeFacts,
  PRACTICE_PACKS,
  packProblemIds,
  packIdFromProblemIds,
  packIdFromCompletedProblemIds,
  validateCompletedEpisode,
  type CompletedPracticeEpisodeFactsV1,
  type CompletedPracticeEpisodeMode,
} from "../application/completed-practice-episode";
import {
  SOCK_REASONING_CHECKPOINT_ID,
  TABLE_REASONING_CHECKPOINT_ID,
  BROTHERS_REASONING_CHECKPOINT_ID,
  PARROTS_REASONING_CHECKPOINT_ID,
  PAGES_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
  type ReasoningCheckpointVerification,
} from "../application/reasoning-checkpoint";
import {
  isMultipleChoiceSetAnswerState,
  type PracticeAnswerState,
} from "./practice-answer-state";
import { normalizeMultipleChoiceSetAnswer } from "../domain/multiple-choice-set-answer";
import { PROGRESS_EVIDENCE_STORAGE_KEY } from "./progress-evidence-storage";
import type {
  AdaptiveNoNextPracticeSessionState,
  ActivePracticeSessionState,
  FinishedPracticeSessionState,
  PracticeSessionResult,
} from "./fixed-practice-session-state";

export const PRACTICE_SESSION_STORAGE_KEY = "olympiad-trainer:practice-session";
export const PRACTICE_LATEST_COMPLETED_STORAGE_KEY =
  "olympiad-trainer:practice-latest-completed";
const PRACTICE_PROGRESS_FINISH_PENDING_KEY =
  "olympiad-trainer:practice-progress-finish-pending";
const PRACTICE_SERVER_FINISH_REQUEST_KEY =
  "olympiad-trainer:practice-server-finish-request";
const PRACTICE_SESSION_MUTATION_LOCK =
  "olympiad-trainer:practice-session-mutation";

function withPracticeSessionLock<T>(operation: () => T): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks?.request)
    return Promise.reject(new Error("Practice session lock is unavailable."));
  return navigator.locks.request(
    PRACTICE_SESSION_MUTATION_LOCK,
    { mode: "exclusive" },
    operation,
  );
}

const problems = [
  {
    id: "coinciding-seats",
    title: "Совпадающие места",
    hints: [
      "coinciding-seats-focus-simultaneous-rules",
      "coinciding-seats-strategy-repeat-interval",
      "coinciding-seats-next-step-list-common-seats",
    ],
    solution: "coinciding-seats-full-solution",
  },
  {
    id: "guaranteed-sock-pair",
    title: "Носки в пакете",
    hints: [
      "guaranteed-sock-pair-focus-guarantee",
      "guaranteed-sock-pair-strategy-worst-case",
      "guaranteed-sock-pair-next-step-bound-without-pair",
    ],
    solution: "guaranteed-sock-pair-full-solution",
  },
  {
    id: "table-impossible-sums",
    title: "Невозможные суммы",
    hints: [
      "table-impossible-sums-focus-constraints",
      "table-impossible-sums-strategy-minimum",
      "table-impossible-sums-next-step-fives",
    ],
    solution: "table-impossible-sums-full-solution",
    optionIds: ["sum-20", "sum-21", "sum-23", "sum-25", "sum-26"],
  },
] as const;

const packProblemMetadata = {
  "granddaughters-first": {
    id: "granddaughters-first",
    title: "Кто пришёл первым?",
    hints: [
      "granddaughters-first-focus",
      "granddaughters-first-strategy",
      "granddaughters-first-next-step",
    ],
    solution: "granddaughters-first-full-solution",
    optionIds: ["anya", "bella", "valya", "galya", "dasha"],
  },
  "cutout-area-ratio": {
    id: "cutout-area-ratio",
    title: "Вырезанная фигура",
    hints: [
      "cutout-area-ratio-focus",
      "cutout-area-ratio-strategy",
      "cutout-area-ratio-next-step",
    ],
    solution: "cutout-area-ratio-full-solution",
  },
  "domino-placements": {
    id: "domino-placements",
    title: "Сколько прямоугольников?",
    hints: [
      "domino-placements-focus",
      "domino-placements-strategy",
      "domino-placements-next-step",
    ],
    solution: "domino-placements-full-solution",
  },
  "truck-car-same-arrival": {
    id: "truck-car-same-arrival",
    title: "Одновременно в город",
    hints: [
      "truck-car-same-arrival-focus",
      "truck-car-same-arrival-strategy",
      "truck-car-same-arrival-next-step",
    ],
    solution: "truck-car-same-arrival-full-solution",
  },
  "knights-all-or-none": {
    id: "knights-all-or-none",
    title: "Рыцари и лжецы",
    hints: [
      "knights-all-or-none-focus",
      "knights-all-or-none-strategy",
      "knights-all-or-none-next-step",
    ],
    solution: "knights-all-or-none-full-solution",
    optionIds: [
      "count-0",
      "count-1",
      "count-2",
      "count-3",
      "count-4",
      "count-5",
    ],
  },
  "boastful-fisherman-streak": {
    id: "boastful-fisherman-streak",
    title: "Хвастливый рыбак",
    hints: [
      "boastful-fisherman-streak-focus",
      "boastful-fisherman-streak-strategy",
      "boastful-fisherman-streak-next-step",
    ],
    solution: "boastful-fisherman-streak-full-solution",
  },
  "largest-valid-eight-digit": {
    id: "largest-valid-eight-digit",
    title: "Самое большое число",
    hints: [
      "largest-valid-eight-digit-focus",
      "largest-valid-eight-digit-strategy",
      "largest-valid-eight-digit-next-step",
    ],
    solution: "largest-valid-eight-digit-full-solution",
  },
  "three-numbers-digit-sums": {
    id: "three-numbers-digit-sums",
    title: "Три загадочных числа",
    hints: [
      "three-numbers-digit-sums-focus",
      "three-numbers-digit-sums-strategy",
      "three-numbers-digit-sums-next-step",
    ],
    solution: "three-numbers-digit-sums-full-solution",
  },
  "mountain-plain-flights": {
    id: "mountain-plain-flights",
    title: "Рейсы между городами",
    hints: [
      "mountain-plain-flights-focus",
      "mountain-plain-flights-strategy",
      "mountain-plain-flights-next-step",
    ],
    solution: "mountain-plain-flights-full-solution",
  },
  "exact-coin-payments": {
    id: "exact-coin-payments",
    title: "Пирожок без сдачи",
    hints: [
      "exact-coin-payments-focus",
      "exact-coin-payments-strategy",
      "exact-coin-payments-next-step",
    ],
    solution: "exact-coin-payments-full-solution",
  },
  "odd-neighbor-sugar-cubes": {
    id: "odd-neighbor-sugar-cubes",
    title: "Кубики с нечётным числом соседей",
    hints: [
      "odd-neighbor-sugar-cubes-focus",
      "odd-neighbor-sugar-cubes-strategy",
      "odd-neighbor-sugar-cubes-next-step",
    ],
    solution: "odd-neighbor-sugar-cubes-full-solution",
  },
  "last-student-friends": {
    id: "last-student-friends",
    title: "Сколько друзей у последнего?",
    hints: [
      "last-student-friends-focus",
      "last-student-friends-strategy",
      "last-student-friends-next-step",
    ],
    solution: "last-student-friends-full-solution",
  },
  "lineup-six-hooligans": {
    id: "lineup-six-hooligans",
    title: "Правдивые и лжецы в шеренге",
    hints: [
      "lineup-six-hooligans-focus",
      "lineup-six-hooligans-strategy",
      "lineup-six-hooligans-next-step",
    ],
    solution: "lineup-six-hooligans-full-solution",
  },
  "two-true-journalists": {
    id: "two-true-journalists",
    title: "Два правдивых журналиста",
    hints: [
      "two-true-journalists-focus",
      "two-true-journalists-strategy",
      "two-true-journalists-next-step",
    ],
    solution: "two-true-journalists-full-solution",
    optionIds: [
      "goals-10",
      "goals-11",
      "goals-12",
      "goals-13",
      "goals-14",
      "goals-15",
      "goals-16",
      "goals-17",
      "goals-18",
    ],
  },
  "neighbor-comparison-codes": {
    id: "neighbor-comparison-codes",
    title: "Код соседних цифр",
    hints: [
      "neighbor-comparison-codes-focus",
      "neighbor-comparison-codes-strategy",
      "neighbor-comparison-codes-next-step",
    ],
    solution: "neighbor-comparison-codes-full-solution",
    optionIds: [
      "code-0112102011",
      "code-1021021020",
      "code-1101111111",
      "code-1201201020",
    ],
  },
  "five-piles-stones": {
    id: "five-piles-stones",
    title: "Пять кучек камней",
    hints: [
      "five-piles-stones-focus",
      "five-piles-stones-strategy",
      "five-piles-stones-next-step",
    ],
    solution: "five-piles-stones-full-solution",
  },
  "untouched-matchstick-figures": {
    id: "untouched-matchstick-figures",
    title: "Нетронутые фигурки",
    hints: [
      "untouched-matchstick-figures-focus",
      "untouched-matchstick-figures-strategy",
      "untouched-matchstick-figures-next-step",
    ],
    solution: "untouched-matchstick-figures-full-solution",
  },
  "mountain-numbers-over-77777": {
    id: "mountain-numbers-over-77777",
    title: "Сколько чисел-горок?",
    hints: [
      "mountain-numbers-over-77777-focus",
      "mountain-numbers-over-77777-strategy",
      "mountain-numbers-over-77777-next-step",
    ],
    solution: "mountain-numbers-over-77777-full-solution",
  },
  "nonadjacent-row-seating": {
    id: "nonadjacent-row-seating",
    title: "Рассадка без соседей",
    hints: [
      "nonadjacent-row-seating-focus",
      "nonadjacent-row-seating-strategy",
      "nonadjacent-row-seating-next-step",
    ],
    solution: "nonadjacent-row-seating-full-solution",
  },
  "eighteen-piece-pie-cuts": {
    id: "eighteen-piece-pie-cuts",
    title: "18 кусков пирога",
    hints: [
      "eighteen-piece-pie-cuts-focus",
      "eighteen-piece-pie-cuts-strategy",
      "eighteen-piece-pie-cuts-next-step",
    ],
    solution: "eighteen-piece-pie-cuts-full-solution",
  },
  "multiples-prefix-count": {
    id: "multiples-prefix-count",
    title: "Числа на доске",
    hints: [
      "multiples-prefix-count-focus",
      "multiples-prefix-count-strategy",
      "multiples-prefix-count-next-step",
    ],
    solution: "multiples-prefix-count-full-solution",
  },
  "rabbit-carrot-shortfall": {
    id: "rabbit-carrot-shortfall",
    title: "Морковь для кроликов",
    hints: [
      "rabbit-carrot-shortfall-focus",
      "rabbit-carrot-shortfall-strategy",
      "rabbit-carrot-shortfall-next-step",
    ],
    solution: "rabbit-carrot-shortfall-full-solution",
  },
  "grade-average-fives": {
    id: "grade-average-fives",
    title: "Средний балл",
    hints: [
      "grade-average-fives-focus",
      "grade-average-fives-strategy",
      "grade-average-fives-next-step",
    ],
    solution: "grade-average-fives-full-solution",
  },
  "magic-forest-coin-difference": {
    id: "magic-forest-coin-difference",
    title: "Монеты на деревьях",
    hints: [
      "magic-forest-coin-difference-focus",
      "magic-forest-coin-difference-strategy",
      "magic-forest-coin-difference-next-step",
    ],
    solution: "magic-forest-coin-difference-full-solution",
  },
  "four-houses-distance-cases": {
    id: "four-houses-distance-cases",
    title: "Четыре дома",
    hints: [
      "four-houses-distance-cases-focus",
      "four-houses-distance-cases-strategy",
      "four-houses-distance-cases-next-step",
    ],
    solution: "four-houses-distance-cases-full-solution",
    optionIds: [
      "distance-600",
      "distance-900",
      "distance-1200",
      "distance-1800",
      "distance-2400",
    ],
  },
  "ivanov-older-brother-count": {
    id: "ivanov-older-brother-count",
    title: "Старший брат",
    hints: [
      "ivanov-older-brother-count-focus",
      "ivanov-older-brother-count-strategy",
      "ivanov-older-brother-count-next-step",
    ],
    solution: "ivanov-older-brother-count-full-solution",
    optionIds: [
      "children-4",
      "children-6",
      "children-8",
      "children-10",
      "children-12",
      "children-14",
    ],
  },
  "cube-red-face-sums": {
    id: "cube-red-face-sums",
    title: "Числа на гранях куба",
    hints: [
      "cube-red-face-sums-focus",
      "cube-red-face-sums-strategy",
      "cube-red-face-sums-next-step",
    ],
    solution: "cube-red-face-sums-full-solution",
  },
  "chocolate-promotion-price": {
    id: "chocolate-promotion-price",
    title: "Цена шоколадки",
    hints: [
      "chocolate-promotion-price-focus",
      "chocolate-promotion-price-strategy",
      "chocolate-promotion-price-next-step",
    ],
    solution: "chocolate-promotion-price-full-solution",
  },
  "school-lesson-teacher-count": {
    id: "school-lesson-teacher-count",
    title: "Сколько учителей?",
    hints: [
      "school-lesson-teacher-count-focus",
      "school-lesson-teacher-count-strategy",
      "school-lesson-teacher-count-next-step",
    ],
    solution: "school-lesson-teacher-count-full-solution",
  },
  "soldier-figures-guarantee": {
    id: "soldier-figures-guarantee",
    title: "Лучники и мечники",
    hints: [
      "soldier-figures-guarantee-focus",
      "soldier-figures-guarantee-strategy",
      "soldier-figures-guarantee-next-step",
    ],
    solution: "soldier-figures-guarantee-full-solution",
  },
  "apple-harvest-assignments": {
    id: "apple-harvest-assignments",
    title: "Урожай яблок",
    hints: [
      "apple-harvest-assignments-focus",
      "apple-harvest-assignments-strategy",
      "apple-harvest-assignments-next-step",
    ],
    solution: "apple-harvest-assignments-full-solution",
    optionIds: [
      "alena-19",
      "borya-11",
      "vera-11",
      "polina-24",
      "alena-24",
      "vera-17",
    ],
  },
  "liar-council-maximum": {
    id: "liar-council-maximum",
    title: "Заседание на острове",
    hints: [
      "liar-council-maximum-focus",
      "liar-council-maximum-strategy",
      "liar-council-maximum-next-step",
    ],
    solution: "liar-council-maximum-full-solution",
  },
  "central-coin-column": {
    id: "central-coin-column",
    title: "Монеты в среднем столбце",
    hints: [
      "central-coin-column-focus",
      "central-coin-column-strategy",
      "central-coin-column-next-step",
    ],
    solution: "central-coin-column-full-solution",
  },
  "five-fridays-calendar": {
    id: "five-fridays-calendar",
    title: "Пять пятниц",
    hints: [
      "five-fridays-calendar-focus",
      "five-fridays-calendar-strategy",
      "five-fridays-calendar-next-step",
    ],
    solution: "five-fridays-calendar-full-solution",
    optionIds: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
  },
  "circular-table-seat-count": {
    id: "circular-table-seat-count",
    title: "Места за круглым столом",
    hints: [
      "circular-table-seat-count-focus",
      "circular-table-seat-count-strategy",
      "circular-table-seat-count-next-step",
    ],
    solution: "circular-table-seat-count-full-solution",
  },
  "balanced-six-groups": {
    id: "balanced-six-groups",
    title: "Шесть групп кружка",
    hints: [
      "balanced-six-groups-focus",
      "balanced-six-groups-strategy",
      "balanced-six-groups-next-step",
    ],
    solution: "balanced-six-groups-full-solution",
    optionIds: [
      "total-74",
      "total-76",
      "total-77",
      "total-78",
      "total-79",
      "total-80",
      "total-82",
    ],
  },
} as const;

function storedPackProblems(problemIds: readonly string[]) {
  const packId = packIdFromProblemIds(problemIds);
  if (!packId) return null;
  return packProblemIds(packId).map((id) => packProblemMetadata[id]);
}

const transferProblem = {
  id: "brothers-ages-products",
  title: "Возраст братьев",
  hints: [
    "brothers-ages-products-focus-distinct-products",
    "brothers-ages-products-strategy-youngest",
    "brothers-ages-products-next-step-bound",
  ],
  solution: "brothers-ages-products-full-solution",
} as const;

const parrotsProblem = {
  id: "parrots-guaranteed-colors",
  title: "Попугаи в зоопарке",
  hints: [
    "parrots-guaranteed-colors-focus-worst-group",
    "parrots-guaranteed-colors-strategy-complements",
    "parrots-guaranteed-colors-next-step-overlap",
  ],
  solution: "parrots-guaranteed-colors-full-solution",
} as const;

const pagesProblem = {
  id: "pages-without-digit-one",
  title: "Страницы без цифры 1",
  hints: [
    "pages-without-digit-one-focus-count",
    "pages-without-digit-one-strategy-blocks",
    "pages-without-digit-one-next-step-count",
  ],
  solution: "pages-without-digit-one-full-solution",
} as const;

const transferProblems = [transferProblem, parrotsProblem] as const;
function storedTransferProblem(problemId: string) {
  return transferProblems.find((problem) => problem.id === problemId);
}
function storedAdaptiveProblem(problemId: string) {
  return (
    (problemId === problems[0].id ? problems[0] : undefined) ??
    storedTransferProblem(problemId) ??
    (problemId === pagesProblem.id ? pagesProblem : undefined)
  );
}

type StoredProblem =
  | (typeof problems)[number]
  | (typeof packProblemMetadata)[keyof typeof packProblemMetadata]
  | (typeof transferProblems)[number]
  | typeof pagesProblem;

type PracticeSessionSnapshotBase = Readonly<{
  sessionId: string;
  problemIds: readonly [string, string, string];
  activeProblemIndex: 0 | 1 | 2;
  completedResults: readonly PracticeSessionResult[];
  activePractice: ActivePractice;
  reasoningCheckpointObservation?: ReasoningCheckpointObservation;
}>;

type CorePracticeSessionSnapshot = PracticeSessionSnapshotBase &
  Readonly<{
    mode?: "pack";
    rawAnswer?: string;
    selectedOptionIds?: readonly string[];
  }>;

type AdaptivePracticeSessionSnapshot = Readonly<{
  sessionId: string;
  mode: "transfer" | "exploration" | "review";
  problemIds: readonly [
    | "brothers-ages-products"
    | "parrots-guaranteed-colors"
    | "pages-without-digit-one"
    | "coinciding-seats",
  ];
  activeProblemIndex: 0;
  completedResults: readonly [];
  activePractice: ActivePractice;
  rawAnswer: string;
  reasoningCheckpointObservation?: ReasoningCheckpointObservation;
}>;

export type PracticeSessionSnapshot =
  CorePracticeSessionSnapshot | AdaptivePracticeSessionSnapshot;

export type NoNextPracticeSessionSnapshot = FinishedPracticeSessionState;
export type UnfinishedPracticeSessionSnapshot =
  PracticeSessionSnapshot | NoNextPracticeSessionSnapshot;

type VerifyCheckpoint = (
  problemId: string,
  observation: ReasoningCheckpointObservation,
  summary: PracticeSummary,
) => Promise<ReasoningCheckpointVerification>;

type VerifiedCheckpointData<T> = Readonly<{
  value: T;
  interpretation: ReasoningCheckpointInterpretation | null;
  tableInterpretation?: ReasoningCheckpointInterpretation | null;
}>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return (
    Object.keys(value).every((key) => keys.includes(key)) &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function validCount(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximum
  );
}

function validSessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value,
    )
  );
}

function validExposures(
  value: unknown,
  problem: StoredProblem,
  submissionCount: number,
): value is PracticeHintExposure[] {
  if (!Array.isArray(value) || value.length > 3) return false;

  return value.every(
    (exposure, index) =>
      record(exposure) &&
      exactKeys(exposure, ["hintId", "level", "validSubmissionCountAtOpen"]) &&
      exposure.hintId === problem.hints[index] &&
      exposure.level === ["focus", "strategy", "next-step"][index] &&
      validCount(exposure.validSubmissionCountAtOpen, submissionCount) &&
      (index === 0 ||
        exposure.validSubmissionCountAtOpen >=
          value[index - 1].validSubmissionCountAtOpen),
  );
}

function validSolution(
  value: unknown,
  problem: StoredProblem,
  submissionCount: number,
  hintExposures: readonly PracticeHintExposure[],
): boolean {
  return (
    value === null ||
    (record(value) &&
      exactKeys(value, ["solutionId", "validSubmissionCountAtOpen"]) &&
      value.solutionId === problem.solution &&
      hintExposures.length === 3 &&
      submissionCount > 0 &&
      validCount(value.validSubmissionCountAtOpen, submissionCount) &&
      value.validSubmissionCountAtOpen > 0 &&
      value.validSubmissionCountAtOpen >=
        hintExposures[2].validSubmissionCountAtOpen)
  );
}

function validSummary(
  value: unknown,
  problem: StoredProblem,
): value is PracticeSummary {
  if (
    !record(value) ||
    !exactKeys(value, [
      "outcome",
      "validSubmissionCount",
      "hintExposures",
      "solutionExposure",
    ]) ||
    !validCount(value.validSubmissionCount, Number.MAX_SAFE_INTEGER) ||
    !validExposures(value.hintExposures, problem, value.validSubmissionCount) ||
    !validSolution(
      value.solutionExposure,
      problem,
      value.validSubmissionCount,
      value.hintExposures,
    )
  ) {
    return false;
  }

  if (value.validSubmissionCount === 0) {
    return value.outcome === "no-valid-submissions";
  }
  if (value.outcome === "incorrect-only") return true;
  if (value.outcome !== "eventually-correct") return false;

  // A correct submission must have happened after every recorded reveal.
  const summary = value as PracticeSummary;
  return (
    summary.hintExposures.every(
      (exposure) =>
        exposure.validSubmissionCountAtOpen < summary.validSubmissionCount,
    ) &&
    (summary.solutionExposure === null ||
      summary.solutionExposure.validSubmissionCountAtOpen <
        summary.validSubmissionCount)
  );
}

function validReasoningCheckpointObservation(
  value: unknown,
  problem: StoredProblem,
  submissionCount: number,
  firstCorrectSubmissionCount: number,
): value is ReasoningCheckpointObservation {
  return Boolean(
    (problem.id === "guaranteed-sock-pair"
      ? record(value) && value.checkpointId === SOCK_REASONING_CHECKPOINT_ID
      : (problem.id === "table-impossible-sums" &&
          record(value) &&
          value.checkpointId === TABLE_REASONING_CHECKPOINT_ID) ||
        (problem.id === "brothers-ages-products" &&
          record(value) &&
          value.checkpointId === BROTHERS_REASONING_CHECKPOINT_ID) ||
        (problem.id === "parrots-guaranteed-colors" &&
          record(value) &&
          value.checkpointId === PARROTS_REASONING_CHECKPOINT_ID) ||
        (problem.id === "pages-without-digit-one" &&
          record(value) &&
          value.checkpointId === PAGES_REASONING_CHECKPOINT_ID)) &&
    record(value) &&
    exactKeys(value, [
      "checkpointId",
      "selectedOptionId",
      "outcome",
      "validSubmissionCountAtSubmit",
    ]) &&
    (value.selectedOptionId === "A" ||
      value.selectedOptionId === "B" ||
      value.selectedOptionId === "C") &&
    (value.outcome === "correct" || value.outcome === "incorrect") &&
    validCount(value.validSubmissionCountAtSubmit, submissionCount) &&
    firstCorrectSubmissionCount > 0 &&
    value.validSubmissionCountAtSubmit >= firstCorrectSubmissionCount,
  );
}

function validResult(
  value: unknown,
  problem: StoredProblem,
  isFinal: boolean,
  allowFinalSkip = false,
): value is PracticeSessionResult {
  if (!record(value)) return false;
  const hasCheckpoint = Object.hasOwn(value, "reasoningCheckpointObservation");
  const keys = ["problemId", "problemTitle", "summary"];
  if (Object.hasOwn(value, "taskOutcome")) keys.push("taskOutcome");
  if (hasCheckpoint) {
    keys.push("reasoningCheckpointObservation", "firstCorrectSubmissionCount");
  }
  if (
    !exactKeys(value, keys) ||
    value.problemId !== problem.id ||
    value.problemTitle !== problem.title ||
    !validSummary(value.summary, problem)
  ) {
    return false;
  }

  const firstCorrectSubmissionCount = value.firstCorrectSubmissionCount;

  if (
    hasCheckpoint &&
    (value.taskOutcome !== undefined ||
      value.summary.outcome !== "eventually-correct" ||
      value.summary.solutionExposure !== null ||
      !validCount(
        firstCorrectSubmissionCount,
        value.summary.validSubmissionCount,
      ) ||
      value.summary.hintExposures.some(
        (exposure: PracticeHintExposure) =>
          exposure.validSubmissionCountAtOpen >= firstCorrectSubmissionCount,
      ) ||
      !validReasoningCheckpointObservation(
        value.reasoningCheckpointObservation,
        problem,
        value.summary.validSubmissionCount,
        firstCorrectSubmissionCount,
      ))
  ) {
    return false;
  }

  if (value.taskOutcome === "skipped") {
    return (
      (!isFinal || allowFinalSkip) &&
      value.summary.outcome !== "eventually-correct" &&
      value.summary.solutionExposure === null
    );
  }

  return (
    value.taskOutcome === undefined &&
    (isFinal ||
      value.summary.outcome === "eventually-correct" ||
      value.summary.solutionExposure !== null)
  );
}

export function validateLatestCompletedResults(
  value: unknown,
  mode?: "review",
): readonly PracticeSessionResult[] | null {
  const completedPackId = Array.isArray(value)
    ? packIdFromCompletedProblemIds(
        value.map((result) =>
          record(result) && typeof result.problemId === "string"
            ? result.problemId
            : "",
        ),
      )
    : null;
  const completedPackProblems =
    completedPackId && Array.isArray(value)
      ? storedPackProblems(packProblemIds(completedPackId))!.slice(
          0,
          value.length,
        )
      : null;
  if (
    Array.isArray(value) &&
    completedPackProblems &&
    value.every((result, index) =>
      validResult(
        result,
        completedPackProblems[index],
        index === completedPackProblems.length - 1,
        index === completedPackProblems.length - 1,
      ),
    )
  )
    return value as readonly PracticeSessionResult[];
  if (
    Array.isArray(value) &&
    value.length === 1 &&
    storedAdaptiveProblem(value[0]?.problemId) &&
    (value[0]?.problemId !== problems[0].id || mode === "review") &&
    validResult(
      value[0],
      storedAdaptiveProblem(value[0].problemId)!,
      true,
      true,
    )
  )
    return value as readonly PracticeSessionResult[];
  if (
    !Array.isArray(value) ||
    (value.length !== 1 &&
      value.length !== 2 &&
      value.length !== problems.length) ||
    !value.every((result, index) =>
      validResult(
        result,
        problems[index],
        index === value.length - 1,
        value.length > 1 && index === value.length - 1,
      ),
    )
  ) {
    return null;
  }

  return value as readonly PracticeSessionResult[];
}

function validActivePractice(
  value: unknown,
  problem: StoredProblem,
): value is ActivePractice {
  if (
    !record(value) ||
    !exactKeys(value, [
      "status",
      "submissions",
      "hintExposures",
      "solutionExposure",
    ]) ||
    value.status !== "active" ||
    !Array.isArray(value.submissions) ||
    !value.submissions.every(
      (submission) =>
        record(submission) &&
        exactKeys(submission, ["answer", "outcome"]) &&
        typeof submission.answer === "string" &&
        validStoredSubmissionAnswer(submission.answer, problem) &&
        (submission.outcome === "correct" ||
          submission.outcome === "incorrect"),
    ) ||
    !validExposures(value.hintExposures, problem, value.submissions.length) ||
    !validSolution(
      value.solutionExposure,
      problem,
      value.submissions.length,
      value.hintExposures,
    )
  ) {
    return false;
  }

  const firstCorrect = value.submissions.findIndex(
    (submission) => submission.outcome === "correct",
  );
  if (
    firstCorrect >= 0 &&
    value.hintExposures.some(
      (exposure) => exposure.validSubmissionCountAtOpen >= firstCorrect + 1,
    )
  )
    return false;
  const solutionExposure =
    value.solutionExposure as ActivePractice["solutionExposure"];
  if (
    solutionExposure &&
    (solutionExposure.validSubmissionCountAtOpen === 0 ||
      (firstCorrect >= 0 &&
        solutionExposure.validSubmissionCountAtOpen > firstCorrect))
  )
    return false;
  return true;
}

function validStoredSubmissionAnswer(
  answer: string,
  problem: StoredProblem,
): boolean {
  if (!("optionIds" in problem)) return /^(?:0|[1-9][0-9]*)$/.test(answer);
  try {
    return (
      normalizeMultipleChoiceSetAnswer(
        JSON.parse(answer),
        problem.optionIds,
      ) === answer
    );
  } catch {
    return false;
  }
}

function validSelectedOptionIds(
  value: unknown,
  problem: StoredProblem,
): value is string[] {
  if (!Array.isArray(value)) return false;
  if (!("optionIds" in problem)) return false;
  const known: readonly string[] = problem.optionIds;
  return (
    value.length <= known.length &&
    value.every((id) => typeof id === "string" && known.includes(id)) &&
    new Set(value).size === value.length &&
    JSON.stringify(value) ===
      JSON.stringify(known.filter((id) => value.includes(id)))
  );
}

function validateSessionShape(
  value: unknown,
  length: 2 | 3,
  mode?: "pack",
): Record<string, unknown> | null {
  const packIds =
    record(value) && mode === "pack"
      ? value.status === "no-next" && Array.isArray(value.completedResults)
        ? value.completedResults.map((result) =>
            record(result) && typeof result.problemId === "string"
              ? result.problemId
              : "",
          )
        : Array.isArray(value.problemIds)
          ? value.problemIds.map((id) => (typeof id === "string" ? id : ""))
          : []
      : [];
  const selectedPackProblems =
    mode === "pack" ? storedPackProblems(packIds) : null;
  if (mode === "pack" && !selectedPackProblems) return null;
  const sessionProblems: readonly StoredProblem[] =
    selectedPackProblems ?? problems;
  if (record(value) && value.status === "no-next") {
    return exactKeys(value, [
      "sessionId",
      ...(mode === "pack" ? ["mode"] : []),
      "status",
      "completedResults",
    ]) &&
      (mode === "pack"
        ? value.mode === "pack"
        : !Object.hasOwn(value, "mode")) &&
      validSessionId(value.sessionId) &&
      Array.isArray(value.completedResults) &&
      value.completedResults.length === length &&
      value.completedResults.every((result, index) =>
        validResult(
          result,
          sessionProblems[index],
          index === length - 1,
          index === length - 1,
        ),
      ) &&
      record(value.completedResults[length - 1]) &&
      value.completedResults[length - 1].taskOutcome === "skipped"
      ? value
      : null;
  }

  if (
    !record(value) ||
    !validSessionId(value.sessionId) ||
    !Array.isArray(value.problemIds) ||
    value.problemIds.length !== length ||
    !value.problemIds.every((id, index) => id === sessionProblems[index].id) ||
    (mode === "pack" ? value.mode !== "pack" : Object.hasOwn(value, "mode")) ||
    !validCount(value.activeProblemIndex, length - 1) ||
    !Array.isArray(value.completedResults) ||
    value.completedResults.length !== value.activeProblemIndex ||
    !value.completedResults.every((result, index) =>
      validResult(result, sessionProblems[index], false),
    ) ||
    !validActivePractice(
      value.activePractice,
      sessionProblems[value.activeProblemIndex],
    )
  )
    return null;

  const problem = sessionProblems[value.activeProblemIndex];
  const answerKey = "optionIds" in problem ? "selectedOptionIds" : "rawAnswer";
  const keys = [
    "sessionId",
    ...(mode === "pack" ? ["mode"] : []),
    "problemIds",
    "activeProblemIndex",
    "completedResults",
    "activePractice",
    answerKey,
  ];
  if (Object.hasOwn(value, "reasoningCheckpointObservation"))
    keys.push("reasoningCheckpointObservation");
  if (
    !exactKeys(value, keys) ||
    (Object.hasOwn(value, "reasoningCheckpointObservation") &&
      (value.activePractice.solutionExposure !== null ||
        !validReasoningCheckpointObservation(
          value.reasoningCheckpointObservation,
          problem,
          value.activePractice.submissions.length,
          value.activePractice.submissions.findIndex(
            (submission: { outcome: string }) =>
              submission.outcome === "correct",
          ) + 1,
        ))) ||
    (answerKey === "rawAnswer"
      ? typeof value.rawAnswer !== "string"
      : !validSelectedOptionIds(value.selectedOptionIds, problem))
  ) {
    return null;
  }

  return value;
}

export function validatePracticeSessionSnapshot(
  value: unknown,
): UnfinishedPracticeSessionSnapshot | null {
  if (record(value) && value.mode === "pack")
    return validateSessionShape(value, 3, "pack") as
      CorePracticeSessionSnapshot | NoNextPracticeSessionSnapshot | null;
  if (
    record(value) &&
    (value.mode === "transfer" ||
      value.mode === "exploration" ||
      value.mode === "review")
  ) {
    if (!validSessionId(value.sessionId)) return null;
    if (value.status === "no-next")
      return exactKeys(value, [
        "sessionId",
        "mode",
        "status",
        "completedResults",
      ]) &&
        Array.isArray(value.completedResults) &&
        value.completedResults.length === 1 &&
        storedAdaptiveProblem(value.completedResults[0]?.problemId) &&
        (value.mode === "review") ===
          (value.completedResults[0].problemId === problems[0].id) &&
        (value.mode === "exploration") ===
          (value.completedResults[0].problemId === pagesProblem.id) &&
        validResult(
          value.completedResults[0],
          storedAdaptiveProblem(value.completedResults[0].problemId)!,
          true,
          true,
        ) &&
        value.completedResults[0].taskOutcome === "skipped"
        ? (value as AdaptiveNoNextPracticeSessionState)
        : null;
    const keys = [
      "sessionId",
      "mode",
      "problemIds",
      "activeProblemIndex",
      "completedResults",
      "activePractice",
      "rawAnswer",
    ];
    if (Object.hasOwn(value, "reasoningCheckpointObservation"))
      keys.push("reasoningCheckpointObservation");
    return exactKeys(value, keys) &&
      Array.isArray(value.problemIds) &&
      value.problemIds.length === 1 &&
      storedAdaptiveProblem(value.problemIds[0]) !== undefined &&
      (value.mode === "exploration") ===
        (value.problemIds[0] === pagesProblem.id) &&
      (value.mode === "review") === (value.problemIds[0] === problems[0].id) &&
      value.activeProblemIndex === 0 &&
      Array.isArray(value.completedResults) &&
      value.completedResults.length === 0 &&
      validActivePractice(
        value.activePractice,
        storedAdaptiveProblem(value.problemIds[0])!,
      ) &&
      typeof value.rawAnswer === "string" &&
      (!Object.hasOwn(value, "reasoningCheckpointObservation") ||
        (value.activePractice.solutionExposure === null &&
          validReasoningCheckpointObservation(
            value.reasoningCheckpointObservation,
            storedAdaptiveProblem(value.problemIds[0])!,
            value.activePractice.submissions.length,
            value.activePractice.submissions.findIndex(
              (submission: { outcome: string }) =>
                submission.outcome === "correct",
            ) + 1,
          )))
      ? (value as AdaptivePracticeSessionSnapshot)
      : null;
  }
  return validateSessionShape(
    value,
    3,
  ) as UnfinishedPracticeSessionSnapshot | null;
}

function readPracticeSessionSnapshotWithRaw(store: Storage): Promise<{
  snapshot: UnfinishedPracticeSessionSnapshot;
  raw: string;
} | null> {
  return withPracticeSessionLock(() => {
    let raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
    const pendingRaw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
    if (pendingRaw !== null) {
      const pending = readPendingPracticeProgressFinish(pendingRaw);
      if (!pending) throw new Error("Practice Finish recovery is unresolved.");
      if (!pending.serverBacked) {
        if (raw !== null && raw !== pending.unfinishedBefore)
          throw new Error("Practice Finish recovery is unresolved.");
        if (raw === null) {
          const current = readPracticeFinishValues(store);
          if (
            !current ||
            (current.completed !== pending.completedBefore &&
              current.completed !== pending.completedAfter) ||
            (current.progress !== pending.progressBefore &&
              current.progress !== pending.progressAfter) ||
            !writeAndConfirm(
              store,
              PRACTICE_SESSION_STORAGE_KEY,
              pending.unfinishedBefore,
            )
          )
            throw new Error("Practice Finish recovery is unresolved.");
          raw = pending.unfinishedBefore;
        }
      } else if (raw === null) {
        if (
          reconcilePendingPracticeProgressFinish(
            store,
            pending.sessionId,
            pending.unfinishedBefore,
            pending.completedAfter,
          ) === "unresolved"
        )
          throw new Error("Practice Finish recovery is unresolved.");
        raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
      }
    }
    if (raw === null) {
      const requestRaw = store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY);
      if (requestRaw !== null) {
        const request = readServerPracticeFinishRequest(requestRaw);
        if (
          !request ||
          store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY) !==
            request.completedAfter ||
          !writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null)
        )
          throw new Error("Practice Finish recovery is unresolved.");
      }
    }
    if (raw === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      store.removeItem(PRACTICE_SESSION_STORAGE_KEY);
      return null;
    }
    const snapshot = validatePracticeSessionSnapshot(parsed);
    if (snapshot) return { snapshot, raw };

    const withSessionId =
      record(parsed) && !Object.hasOwn(parsed, "sessionId")
        ? { sessionId: crypto.randomUUID(), ...parsed }
        : parsed;
    const legacy = validateSessionShape(withSessionId, 2);
    const migrated = legacy
      ? legacy.status === "no-next"
        ? {
            sessionId: legacy.sessionId,
            problemIds: problems.map((problem) => problem.id),
            activeProblemIndex: 2,
            completedResults: legacy.completedResults,
            activePractice: startPractice(),
            selectedOptionIds: [],
          }
        : {
            ...legacy,
            problemIds: problems.map((problem) => problem.id),
          }
      : withSessionId;
    const validated = validatePracticeSessionSnapshot(migrated);
    if (validated) {
      const migratedRaw = JSON.stringify(migrated);
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, migratedRaw);
      if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== migratedRaw)
        throw new Error("Practice session migration was not persisted.");
      return { snapshot: validated, raw: migratedRaw };
    }

    store.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    return null;
  });
}

export async function readPracticeSessionSnapshot(
  storage?: Storage,
): Promise<UnfinishedPracticeSessionSnapshot | null> {
  try {
    return (
      (await readPracticeSessionSnapshotWithRaw(storage ?? window.localStorage))
        ?.snapshot ?? null
    );
  } catch {
    return null;
  }
}

async function verifyResultObservations(
  results: readonly PracticeSessionResult[],
  verifyCheckpoint: VerifyCheckpoint,
): Promise<readonly ReasoningCheckpointVerification[]> {
  const verifications: ReasoningCheckpointVerification[] = [];
  for (const result of results) {
    if (result.reasoningCheckpointObservation) {
      verifications.push(
        await verifyCheckpoint(
          result.problemId,
          result.reasoningCheckpointObservation,
          result.summary,
        ),
      );
    }
  }
  return verifications;
}

export async function readVerifiedPracticeSessionSnapshot(
  verifyCheckpoint: VerifyCheckpoint,
  storage?: Storage,
): Promise<VerifiedCheckpointData<UnfinishedPracticeSessionSnapshot | null>> {
  const store = storage ?? window.localStorage;
  const saved = await readPracticeSessionSnapshotWithRaw(store);
  if (!saved) return { value: null, interpretation: null };
  const { snapshot, raw } = saved;

  const resultVerification = await verifyResultObservations(
    snapshot.completedResults,
    verifyCheckpoint,
  );
  const activeVerification =
    "status" in snapshot || !snapshot.reasoningCheckpointObservation
      ? null
      : await verifyCheckpoint(
          ("mode" in snapshot && snapshot.mode !== "pack"
            ? storedAdaptiveProblem(snapshot.problemIds[0])!
            : snapshot.mode === "pack"
              ? storedPackProblems(snapshot.problemIds)![
                  snapshot.activeProblemIndex
                ]
              : problems[snapshot.activeProblemIndex]
          ).id,
          snapshot.reasoningCheckpointObservation,
          getPracticeSummary(finishPractice(snapshot.activePractice)),
        );
  if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== raw)
    throw new Error("Practice snapshot changed during verification.");
  if (
    resultVerification.some((verification) => !verification.valid) ||
    activeVerification?.valid === false
  ) {
    await withPracticeSessionLock(() => {
      if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== raw)
        throw new Error("Practice snapshot changed during verification.");
      store.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    });
    return { value: null, interpretation: null };
  }
  return {
    value: snapshot,
    interpretation: activeVerification?.valid
      ? activeVerification.interpretation
      : null,
  };
}

function activeSessionSnapshot(
  session: ActivePracticeSessionState,
  answer: PracticeAnswerState,
  reasoningCheckpointObservation?: ReasoningCheckpointObservation,
): PracticeSessionSnapshot {
  if (
    session.mode === "transfer" ||
    session.mode === "exploration" ||
    session.mode === "review"
  )
    return {
      sessionId: session.sessionId,
      mode: session.mode,
      problemIds: [session.problemId],
      activeProblemIndex: 0,
      completedResults: [],
      activePractice: answer.practice,
      rawAnswer: "rawAnswer" in answer ? answer.rawAnswer : "",
      ...(reasoningCheckpointObservation
        ? { reasoningCheckpointObservation }
        : {}),
    };
  return {
    sessionId: session.sessionId,
    ...(session.mode === "pack" ? { mode: "pack" as const } : {}),
    problemIds:
      session.mode === "pack"
        ? (session.problemIds ?? packProblemIds(PRACTICE_PACKS[0].id))
        : [problems[0].id, problems[1].id, problems[2].id],
    activeProblemIndex: session.activeProblemIndex,
    completedResults: session.completedResults,
    activePractice: answer.practice,
    ...(isMultipleChoiceSetAnswerState(answer)
      ? { selectedOptionIds: answer.selectedOptionIds }
      : { rawAnswer: answer.rawAnswer }),
    ...(reasoningCheckpointObservation
      ? { reasoningCheckpointObservation }
      : {}),
  };
}

function ownsPersistedPracticeSession(
  store: Storage,
  sessionId: string,
): boolean {
  const raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
  if (raw === null) return false;
  const persisted = validatePracticeSessionSnapshot(JSON.parse(raw));
  return persisted?.sessionId === sessionId;
}

export async function createPracticeSessionSnapshot(
  session: ActivePracticeSessionState,
  answer: PracticeAnswerState,
  storage?: Storage,
): Promise<boolean> {
  if (session.activeProblemIndex !== 0 || session.completedResults.length !== 0)
    return false;
  const snapshot = activeSessionSnapshot(session, answer);
  if (!validatePracticeSessionSnapshot(snapshot)) return false;
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      if (
        store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== null ||
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null
      )
        return false;
      const raw = JSON.stringify(snapshot);
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
      return store.getItem(PRACTICE_SESSION_STORAGE_KEY) === raw;
    });
  } catch {
    return false;
  }
}

export async function savePracticeSessionSnapshot(
  session: ActivePracticeSessionState,
  answer: PracticeAnswerState,
  storage?: Storage,
  reasoningCheckpointObservation?: ReasoningCheckpointObservation,
): Promise<boolean> {
  const snapshot = activeSessionSnapshot(
    session,
    answer,
    reasoningCheckpointObservation,
  );
  if (!validSessionId(session.sessionId)) return false;
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      if (
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null
      )
        return false;
      if (!ownsPersistedPracticeSession(store, session.sessionId)) return false;
      const raw = JSON.stringify(snapshot);
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
      return store.getItem(PRACTICE_SESSION_STORAGE_KEY) === raw;
    });
  } catch {
    return false;
  }
}

export async function saveNoNextPracticeSessionSnapshot(
  session: FinishedPracticeSessionState,
  storage?: Storage,
): Promise<boolean> {
  const validated = validatePracticeSessionSnapshot(session);
  if (!validated || !("status" in validated)) return false;
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      if (
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null
      )
        return false;
      if (!ownsPersistedPracticeSession(store, session.sessionId)) return false;
      const raw = JSON.stringify(session);
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
      return store.getItem(PRACTICE_SESSION_STORAGE_KEY) === raw;
    });
  } catch {
    return false;
  }
}

function clearPracticeSessionSnapshotInsideLock(storage: Storage): boolean {
  try {
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    return storage.getItem(PRACTICE_SESSION_STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

export async function clearPracticeSessionSnapshot(
  storage?: Storage,
): Promise<boolean> {
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(
      () =>
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) === null &&
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) === null &&
        clearPracticeSessionSnapshotInsideLock(store),
    );
  } catch {
    return false;
  }
}

type LatestCompletedSummary = Readonly<{
  mode?: "review";
  sessionId: string | null;
  results: readonly PracticeSessionResult[];
}>;

function validateLatestCompletedSummary(
  value: unknown,
): LatestCompletedSummary | null {
  if (Array.isArray(value)) {
    const results = validateLatestCompletedResults(value);
    return results ? { sessionId: null, results } : null;
  }
  if (
    !record(value) ||
    !exactKeys(value, [
      "sessionId",
      "results",
      ...(Object.hasOwn(value, "mode") ? ["mode"] : []),
    ]) ||
    !validSessionId(value.sessionId)
  )
    return null;
  const results = validateLatestCompletedResults(
    value.results,
    value.mode === "review" ? "review" : undefined,
  );
  if (
    Object.hasOwn(value, "mode") &&
    (value.mode !== "review" ||
      !results ||
      !validateCompletedEpisode("review", completedEpisodeFacts(results)))
  )
    return null;
  return results
    ? {
        sessionId: value.sessionId,
        results,
        ...(value.mode === "review" ? { mode: "review" as const } : {}),
      }
    : null;
}

function serializeLatestCompletedSummary(
  results: readonly PracticeSessionResult[],
  sessionId: string,
  mode?: "review",
) {
  return JSON.stringify({ sessionId, results, ...(mode ? { mode } : {}) });
}

export function readLatestCompletedResults(
  storage?: Storage,
): readonly PracticeSessionResult[] | null {
  try {
    const store = storage ?? window.localStorage;
    const raw = store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY);
    if (raw === null) return null;
    return validateLatestCompletedSummary(JSON.parse(raw))?.results ?? null;
  } catch {
    return null;
  }
}

export async function readVerifiedLatestCompletedResults(
  verifyCheckpoint: VerifyCheckpoint,
  storage?: Storage,
): Promise<
  VerifiedCheckpointData<readonly PracticeSessionResult[] | null> & {
    sessionId?: string | null;
    mode?: "review";
  }
> {
  const store = storage ?? window.localStorage;
  const raw = store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY);
  let summary: LatestCompletedSummary | null = null;
  try {
    summary =
      raw === null ? null : validateLatestCompletedSummary(JSON.parse(raw));
  } catch {
    return { value: null, interpretation: null };
  }
  const results = summary?.results;
  if (!results) return { value: null, interpretation: null };

  const verification = await verifyResultObservations(
    results,
    verifyCheckpoint,
  );
  if (store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY) !== raw)
    throw new Error("Completed Practice results changed during verification.");
  if (verification.some((item) => !item.valid)) {
    return { value: null, interpretation: null };
  }
  const interpretations = verification.flatMap((item) =>
    item.valid ? [item.interpretation] : [],
  );
  return {
    value: results,
    sessionId: summary?.sessionId ?? null,
    ...(summary?.mode ? { mode: summary.mode } : {}),
    interpretation:
      interpretations.find(
        (item) => item.learnerLabel === "Как гарантировать результат",
      ) ?? null,
    tableInterpretation:
      interpretations.find(
        (item) =>
          item.capability ===
          "Доказывать глобальную невозможность через ограничения",
      ) ?? null,
  };
}

export function saveLatestCompletedResults(
  results: readonly PracticeSessionResult[],
  storage?: Storage,
  sessionId?: string,
  mode?: "review",
): boolean {
  if (
    !validateLatestCompletedResults(results, mode) ||
    (sessionId !== undefined && !validSessionId(sessionId))
  )
    return false;
  try {
    (storage ?? window.localStorage).setItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      sessionId === undefined
        ? JSON.stringify(results)
        : serializeLatestCompletedSummary(results, sessionId, mode),
    );
    return true;
  } catch {
    return false;
  }
}

type PracticeFinishValues = Readonly<{
  unfinished: string | null;
  completed: string | null;
  progress: string | null;
}>;

type PendingPracticeProgressFinish = Readonly<{
  sessionId: string;
  unfinishedBefore: string;
  completedBefore: string | null;
  progressBefore: string | null;
  completedAfter: string;
  progressAfter: string | null;
  serverBacked?: true;
}>;

export type ServerPracticeFinishPayload = Readonly<{
  sessionId: string;
  contributions: readonly PracticeProgressContribution[];
  episodeMode?: CompletedPracticeEpisodeMode;
  episodeFacts?: CompletedPracticeEpisodeFactsV1;
  adaptiveFacts?: Readonly<{
    problemId:
      | "brothers-ages-products"
      | "parrots-guaranteed-colors"
      | "pages-without-digit-one";
    attempted: boolean;
    solutionExposed: boolean;
  }>;
}>;

type ServerPracticeFinishRequest = ServerPracticeFinishPayload &
  Readonly<{
    unfinishedBefore: string;
    completedBefore: string | null;
    progressBefore: string | null;
    completedAfter: string;
  }>;

function readServerPracticeFinishRequest(
  raw: string,
): ServerPracticeFinishRequest | null {
  try {
    const value: unknown = JSON.parse(raw);
    const requestKeys = [
      "sessionId",
      "contributions",
      "unfinishedBefore",
      "completedBefore",
      "progressBefore",
      "completedAfter",
    ];
    if (record(value) && Object.hasOwn(value, "adaptiveFacts"))
      requestKeys.push("adaptiveFacts");
    if (record(value) && Object.hasOwn(value, "episodeMode"))
      requestKeys.push("episodeMode", "episodeFacts");
    if (
      !record(value) ||
      !exactKeys(value, requestKeys) ||
      !validSessionId(value.sessionId) ||
      typeof value.unfinishedBefore !== "string" ||
      !(
        value.completedBefore === null ||
        typeof value.completedBefore === "string"
      ) ||
      !(
        value.progressBefore === null ||
        typeof value.progressBefore === "string"
      ) ||
      typeof value.completedAfter !== "string" ||
      !Array.isArray(value.contributions)
    )
      return null;
    const unfinished = validatePracticeSessionSnapshot(
      JSON.parse(value.unfinishedBefore),
    );
    const summary = validateLatestCompletedSummary(
      JSON.parse(value.completedAfter),
    );
    const results = summary?.results;
    if (summary?.sessionId && summary.sessionId !== value.sessionId)
      return null;
    if (!unfinished || unfinished.sessionId !== value.sessionId || !results)
      return null;
    const expected =
      "status" in unfinished
        ? expectedUnfinishedForFinish(unfinished, null, results)
        : expectedUnfinishedForFinish(
            {
              sessionId: unfinished.sessionId,
              ...(unfinished.mode === "pack"
                ? { problemIds: unfinished.problemIds }
                : {}),
              ...("mode" in unfinished && unfinished.mode !== "pack"
                ? {
                    mode: unfinished.mode,
                    problemId: unfinished.problemIds[0],
                  }
                : unfinished.mode === "pack"
                  ? { mode: "pack" as const }
                  : {}),
              activeProblemIndex: unfinished.activeProblemIndex,
              completedResults: unfinished.completedResults,
            } as ActivePracticeSessionState,
            restoreAnswerState(unfinished),
            results,
          );
    const contributions = results
      .map(getPracticeProgressContribution)
      .filter((entry) => entry !== null);
    const adaptiveFacts = adaptiveFinishFacts(unfinished, results);
    const mode = "mode" in unfinished ? unfinished.mode : "core";
    const expectedEpisode = completedEpisodeFacts(results);
    const legacyBrothersFacts =
      adaptiveFacts?.problemId === "brothers-ages-products"
        ? {
            attempted: adaptiveFacts.attempted,
            solutionExposed: adaptiveFacts.solutionExposed,
          }
        : null;
    if (
      expected !== value.unfinishedBefore ||
      contributions.length > 2 ||
      JSON.stringify(value.contributions) !== JSON.stringify(contributions) ||
      (JSON.stringify(value.adaptiveFacts) !== JSON.stringify(adaptiveFacts) &&
        JSON.stringify(value.adaptiveFacts) !==
          JSON.stringify(legacyBrothersFacts)) ||
      (Object.hasOwn(value, "episodeMode") &&
        (value.episodeMode !== mode ||
          !validateCompletedEpisode(value.episodeMode, value.episodeFacts) ||
          JSON.stringify(value.episodeFacts) !==
            JSON.stringify(expectedEpisode)))
    )
      return null;
    return value as ServerPracticeFinishRequest;
  } catch {
    return null;
  }
}

function adaptiveFinishFacts(
  session:
    | ActivePracticeSessionState
    | FinishedPracticeSessionState
    | UnfinishedPracticeSessionSnapshot,
  results: readonly PracticeSessionResult[],
): ServerPracticeFinishPayload["adaptiveFacts"] {
  if (session.mode !== "transfer" && session.mode !== "exploration")
    return undefined;
  const result = results.length === 1 ? results[0] : null;
  if (
    !result ||
    !storedAdaptiveProblem(result.problemId) ||
    (!("status" in session) &&
      result.problemId !==
        ("problemIds" in session ? session.problemIds[0] : session.problemId))
  )
    return undefined;
  return {
    problemId: result.problemId as
      | "brothers-ages-products"
      | "parrots-guaranteed-colors"
      | "pages-without-digit-one",
    attempted:
      result.problemId === "pages-without-digit-one" ||
      result.summary.validSubmissionCount > 0,
    solutionExposed: result.summary.solutionExposure !== null,
  };
}

function expectedUnfinishedForFinish(
  session: ActivePracticeSessionState | FinishedPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
): string | null {
  if ("status" in session) {
    return JSON.stringify(results) === JSON.stringify(session.completedResults)
      ? JSON.stringify(session)
      : null;
  }
  const currentResult = results.at(-1);
  if (
    !answer ||
    !currentResult ||
    results.length !== session.completedResults.length + 1 ||
    JSON.stringify(results.slice(0, -1)) !==
      JSON.stringify(session.completedResults) ||
    JSON.stringify(currentResult.summary) !==
      JSON.stringify(getPracticeSummary(finishPractice(answer.practice)))
  )
    return null;
  return JSON.stringify(
    activeSessionSnapshot(
      session,
      answer,
      currentResult.reasoningCheckpointObservation,
    ),
  );
}

export async function isCurrentPracticeFinish(
  session: ActivePracticeSessionState | FinishedPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
): Promise<boolean> {
  const expected = expectedUnfinishedForFinish(session, answer, results);
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      const currentUnfinished = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
      const requestRaw = store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY);
      if (requestRaw !== null) {
        const request = readServerPracticeFinishRequest(requestRaw);
        if (!request || request.sessionId !== session.sessionId) return false;
        if (currentUnfinished === null)
          return (
            store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY) ===
            request.completedAfter
          );
        const current = validatePracticeSessionSnapshot(
          JSON.parse(currentUnfinished),
        );
        return current?.sessionId === session.sessionId;
      }
      if (
        !expected ||
        !validateLatestCompletedResults(
          results,
          session.mode === "review" ? "review" : undefined,
        )
      )
        return false;
      const pendingRaw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
      if (pendingRaw === null) return currentUnfinished === expected;
      const pending = readPendingPracticeProgressFinish(pendingRaw);
      return (
        pending !== null &&
        pending.sessionId === session.sessionId &&
        pending.unfinishedBefore === expected &&
        pending.completedAfter === JSON.stringify(results) &&
        (currentUnfinished === expected || currentUnfinished === null)
      );
    });
  } catch {
    return false;
  }
}

function readPracticeFinishValues(store: Storage): PracticeFinishValues | null {
  try {
    return {
      unfinished: store.getItem(PRACTICE_SESSION_STORAGE_KEY),
      completed: store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
      progress: store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY),
    };
  } catch {
    return null;
  }
}

function writeAndConfirm(
  store: Storage,
  key: string,
  intended: string | null,
): boolean {
  try {
    if (intended === null) store.removeItem(key);
    else store.setItem(key, intended);
  } catch {
    // A storage implementation can mutate and then report failure.
  }
  try {
    return store.getItem(key) === intended;
  } catch {
    return false;
  }
}

function progressBeforeOrEmpty(raw: string | null) {
  if (raw === null) return emptyPracticeProgressEvidence();
  try {
    return (
      validatePracticeProgressEvidence(JSON.parse(raw)) ??
      emptyPracticeProgressEvidence()
    );
  } catch {
    return emptyPracticeProgressEvidence();
  }
}

function progressAfterResults(
  before: PracticeProgressEvidence,
  results: readonly PracticeSessionResult[],
): PracticeProgressEvidence | null {
  let current: PracticeProgressEvidence = before;
  for (const result of results) {
    const contribution = getPracticeProgressContribution(result);
    if (!contribution) continue;
    const next = appendPracticeProgressEvidence(current, contribution);
    if (!next) return null;
    current = next;
  }
  return current;
}

function hasProgressContribution(results: readonly PracticeSessionResult[]) {
  return results.some(
    (result) => getPracticeProgressContribution(result) !== null,
  );
}

function restorePracticeFinishValues(
  store: Storage,
  before: PracticeFinishValues,
  after: PracticeFinishValues,
): boolean {
  const current = readPracticeFinishValues(store);
  if (
    !current ||
    (current.unfinished !== before.unfinished &&
      current.unfinished !== after.unfinished) ||
    (current.completed !== before.completed &&
      current.completed !== after.completed) ||
    (current.progress !== before.progress &&
      current.progress !== after.progress)
  )
    return false;

  for (const [key, actual, previous] of [
    [PROGRESS_EVIDENCE_STORAGE_KEY, current.progress, before.progress],
    [
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      current.completed,
      before.completed,
    ],
    [PRACTICE_SESSION_STORAGE_KEY, current.unfinished, before.unfinished],
  ] as const) {
    if (actual !== previous && !writeAndConfirm(store, key, previous))
      return false;
  }
  const restored = readPracticeFinishValues(store);
  return (
    restored !== null &&
    restored.unfinished === before.unfinished &&
    restored.completed === before.completed &&
    restored.progress === before.progress
  );
}

function readPendingPracticeProgressFinish(
  raw: string,
): PendingPracticeProgressFinish | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !record(value) ||
      !exactKeys(value, [
        "sessionId",
        "unfinishedBefore",
        "completedBefore",
        "progressBefore",
        "completedAfter",
        "progressAfter",
        ...(value.serverBacked === true ? ["serverBacked"] : []),
      ]) ||
      !validSessionId(value.sessionId) ||
      typeof value.unfinishedBefore !== "string" ||
      !(
        value.completedBefore === null ||
        typeof value.completedBefore === "string"
      ) ||
      !(
        value.progressBefore === null ||
        typeof value.progressBefore === "string"
      ) ||
      typeof value.completedAfter !== "string" ||
      !(value.progressAfter === null || typeof value.progressAfter === "string")
    )
      return null;
    const unfinished = validatePracticeSessionSnapshot(
      JSON.parse(value.unfinishedBefore),
    );
    const summary = validateLatestCompletedSummary(
      JSON.parse(value.completedAfter),
    );
    const completed = summary?.results;
    if (summary?.sessionId && summary.sessionId !== value.sessionId)
      return null;
    const serverBacked = value.serverBacked === true;
    const progressAfter = serverBacked
      ? null
      : typeof value.progressAfter === "string"
        ? validatePracticeProgressEvidence(JSON.parse(value.progressAfter))
        : null;
    const progressBefore = progressBeforeOrEmpty(value.progressBefore);
    const hasContribution = completed
      ? hasProgressContribution(completed)
      : false;
    if (
      !unfinished ||
      unfinished.sessionId !== value.sessionId ||
      !completed ||
      (!serverBacked && (!progressAfter || !hasContribution)) ||
      (serverBacked && value.progressAfter !== value.progressBefore) ||
      ("status" in unfinished
        ? expectedUnfinishedForFinish(unfinished, null, completed)
        : expectedUnfinishedForFinish(
            {
              sessionId: unfinished.sessionId,
              ...(unfinished.mode === "pack"
                ? { problemIds: unfinished.problemIds }
                : {}),
              ...("mode" in unfinished && unfinished.mode !== "pack"
                ? {
                    mode: unfinished.mode,
                    problemId: unfinished.problemIds[0],
                  }
                : unfinished.mode === "pack"
                  ? { mode: "pack" as const }
                  : {}),
              activeProblemIndex: unfinished.activeProblemIndex,
              completedResults: unfinished.completedResults,
            } as ActivePracticeSessionState,
            restoreAnswerState(unfinished),
            completed,
          )) !== value.unfinishedBefore ||
      (!serverBacked &&
        JSON.stringify(progressAfterResults(progressBefore, completed)) !==
          value.progressAfter)
    )
      return null;
    return value as PendingPracticeProgressFinish;
  } catch {
    return null;
  }
}

function reconcilePendingPracticeProgressFinish(
  store: Storage,
  expectedSessionId: string,
  expectedUnfinished: string,
  completedAfter: string,
): "ready" | "completed" | "unresolved" {
  let raw: string | null;
  try {
    raw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
  } catch {
    return "unresolved";
  }
  if (raw === null) return "ready";
  const pending = readPendingPracticeProgressFinish(raw);
  if (!pending) return "unresolved";

  const before = {
    unfinished: pending.unfinishedBefore,
    completed: pending.completedBefore,
    progress: pending.progressBefore,
  };
  const after = {
    unfinished: null,
    completed: pending.completedAfter,
    progress: pending.progressAfter,
  };
  const current = readPracticeFinishValues(store);
  if (!current) return "unresolved";
  if (current.unfinished === null && pending.sessionId !== expectedSessionId)
    return "unresolved";
  const sameEpisode =
    pending.sessionId === expectedSessionId &&
    pending.unfinishedBefore === expectedUnfinished &&
    pending.completedAfter === completedAfter;

  if (
    current.completed === after.completed &&
    current.progress === after.progress
  ) {
    const canCompleteThisEpisode =
      sameEpisode &&
      (current.unfinished === null || current.unfinished === before.unfinished);
    if (
      current.unfinished === before.unfinished &&
      (!sameEpisode ||
        !writeAndConfirm(store, PRACTICE_SESSION_STORAGE_KEY, null))
    )
      return "unresolved";
    if (!writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null))
      return "unresolved";
    return canCompleteThisEpisode ? "completed" : "ready";
  }

  if (!restorePracticeFinishValues(store, before, after)) return "unresolved";
  return writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null)
    ? "ready"
    : "unresolved";
}

// Called only while the shared Practice mutation lock is held. Keep the
// legacy pending marker until the server acknowledges its resulting bytes.
export function recoverLegacyFinishBeforeImportInsideLock(
  store: Storage,
): { sessionId: string; pendingRaw: string } | null {
  const pendingRaw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
  if (pendingRaw === null) return null;
  const pending = readPendingPracticeProgressFinish(pendingRaw);
  if (!pending) throw new Error("Practice Finish recovery is unresolved.");
  if (pending.serverBacked) return null;
  if (pending.progressBefore !== null) {
    let priorEvidence: PracticeProgressEvidence | null;
    try {
      priorEvidence = validatePracticeProgressEvidence(
        JSON.parse(pending.progressBefore),
      );
    } catch {
      priorEvidence = null;
    }
    if (!priorEvidence)
      throw new Error("Legacy Progress data could not be verified.");
  }
  const current = readPracticeFinishValues(store);
  if (
    !current ||
    (current.unfinished !== pending.unfinishedBefore &&
      current.unfinished !== null) ||
    (current.completed !== pending.completedBefore &&
      current.completed !== pending.completedAfter) ||
    (current.progress !== pending.progressBefore &&
      current.progress !== pending.progressAfter)
  )
    throw new Error("Practice Finish recovery is unresolved.");
  if (
    !writeAndConfirm(
      store,
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      pending.completedAfter,
    ) ||
    !writeAndConfirm(
      store,
      PROGRESS_EVIDENCE_STORAGE_KEY,
      pending.progressAfter,
    ) ||
    !writeAndConfirm(store, PRACTICE_SESSION_STORAGE_KEY, null)
  )
    throw new Error("Practice Finish recovery is unresolved.");
  return { sessionId: pending.sessionId, pendingRaw };
}

export function acknowledgeLegacyFinishImportInsideLock(
  store: Storage,
  pendingRaw: string,
): boolean {
  return (
    store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) === pendingRaw &&
    writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null)
  );
}

async function completeServerBackedPracticeSession(
  session: ActivePracticeSessionState | FinishedPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
  store: Storage,
  serverPersist: (request: ServerPracticeFinishPayload) => Promise<unknown>,
): Promise<boolean> {
  return withPracticeSessionLock(async () => {
    const requestRaw = store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY);
    let request =
      requestRaw === null ? null : readServerPracticeFinishRequest(requestRaw);
    if (
      requestRaw !== null &&
      (!request || request.sessionId !== session.sessionId)
    )
      return false;
    if (!request) {
      const completedAfter = serializeLatestCompletedSummary(
        results,
        session.sessionId,
        session.mode === "review" ? "review" : undefined,
      );
      const unfinishedBefore = expectedUnfinishedForFinish(
        session,
        answer,
        results,
      );
      const before = readPracticeFinishValues(store);
      const contributions = results
        .map(getPracticeProgressContribution)
        .filter((entry) => entry !== null);
      const adaptiveFacts = adaptiveFinishFacts(session, results);
      const episodeMode = "mode" in session ? session.mode : "core";
      const episodeFacts = completedEpisodeFacts(results);
      if (
        !validateLatestCompletedResults(
          results,
          session.mode === "review" ? "review" : undefined,
        ) ||
        !validateCompletedEpisode(episodeMode, episodeFacts) ||
        !unfinishedBefore ||
        !before ||
        before.unfinished !== unfinishedBefore ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null ||
        contributions.length > 2
      )
        return false;
      request = {
        sessionId: session.sessionId,
        contributions,
        ...(adaptiveFacts ? { adaptiveFacts } : {}),
        episodeMode,
        episodeFacts,
        unfinishedBefore,
        completedBefore: before.completed,
        progressBefore: before.progress,
        completedAfter,
      };
      if (
        !writeAndConfirm(
          store,
          PRACTICE_SERVER_FINISH_REQUEST_KEY,
          JSON.stringify(request),
        )
      )
        return false;
    }

    const reconciliation = reconcilePendingPracticeProgressFinish(
      store,
      request.sessionId,
      request.unfinishedBefore,
      request.completedAfter,
    );
    if (reconciliation === "unresolved") return false;
    if (reconciliation === "completed")
      return writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null);

    const before = readPracticeFinishValues(store);
    if (
      before?.unfinished === null &&
      before.completed === request.completedAfter &&
      before.progress === request.progressBefore
    ) {
      await serverPersist({
        sessionId: request.sessionId,
        contributions: request.contributions,
        ...(request.adaptiveFacts
          ? { adaptiveFacts: request.adaptiveFacts }
          : {}),
        ...(request.episodeFacts
          ? {
              episodeMode: request.episodeMode,
              episodeFacts: request.episodeFacts,
            }
          : {}),
      });
      return writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null);
    }
    if (
      !before ||
      before.completed !== request.completedBefore ||
      before.progress !== request.progressBefore ||
      before.unfinished === null
    )
      return false;
    const current = validatePracticeSessionSnapshot(
      JSON.parse(before.unfinished),
    );
    if (current?.sessionId !== request.sessionId) return false;

    await serverPersist({
      sessionId: request.sessionId,
      contributions: request.contributions,
      ...(request.adaptiveFacts
        ? { adaptiveFacts: request.adaptiveFacts }
        : {}),
      ...(request.episodeFacts
        ? {
            episodeMode: request.episodeMode,
            episodeFacts: request.episodeFacts,
          }
        : {}),
    });
    const unchanged = readPracticeFinishValues(store);
    if (
      !unchanged ||
      unchanged.unfinished !== before.unfinished ||
      unchanged.completed !== before.completed ||
      unchanged.progress !== before.progress
    )
      return false;
    if (
      before.unfinished !== request.unfinishedBefore &&
      !writeAndConfirm(
        store,
        PRACTICE_SESSION_STORAGE_KEY,
        request.unfinishedBefore,
      )
    )
      return false;

    const pending: PendingPracticeProgressFinish = {
      sessionId: request.sessionId,
      unfinishedBefore: request.unfinishedBefore,
      completedBefore: request.completedBefore,
      progressBefore: request.progressBefore,
      completedAfter: request.completedAfter,
      progressAfter: request.progressBefore,
      serverBacked: true,
    };
    if (
      !writeAndConfirm(
        store,
        PRACTICE_PROGRESS_FINISH_PENDING_KEY,
        JSON.stringify(pending),
      )
    )
      return false;
    const original = {
      unfinished: request.unfinishedBefore,
      completed: request.completedBefore,
      progress: request.progressBefore,
    };
    const after = {
      unfinished: null,
      completed: request.completedAfter,
      progress: request.progressBefore,
    };
    const rollback = () => {
      if (restorePracticeFinishValues(store, original, after))
        writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null);
      return false;
    };
    const completed = validateLatestCompletedSummary(
      JSON.parse(request.completedAfter),
    );
    if (
      !completed ||
      !saveLatestCompletedResults(
        completed.results,
        store,
        completed.sessionId ?? undefined,
        completed.mode,
      )
    )
      return rollback();
    if (!clearPracticeSessionSnapshotInsideLock(store)) return rollback();
    const durable = readPracticeFinishValues(store);
    if (
      !durable ||
      durable.unfinished !== null ||
      durable.completed !== request.completedAfter ||
      durable.progress !== request.progressBefore
    )
      return rollback();
    return (
      writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null) &&
      writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null)
    );
  });
}

export function completePracticeSession(
  session: ActivePracticeSessionState,
  answer: PracticeAnswerState,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
  serverPersist?: (request: ServerPracticeFinishPayload) => Promise<unknown>,
): Promise<boolean>;
export function completePracticeSession(
  session: FinishedPracticeSessionState,
  answer: null,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
  serverPersist?: (request: ServerPracticeFinishPayload) => Promise<unknown>,
): Promise<boolean>;
export async function completePracticeSession(
  session: ActivePracticeSessionState | FinishedPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
  serverPersist?: (request: ServerPracticeFinishPayload) => Promise<unknown>,
): Promise<boolean> {
  if (
    !serverPersist &&
    (session.mode === "review" || !validateLatestCompletedResults(results))
  )
    return false;
  if ("status" in session && !validatePracticeSessionSnapshot(session))
    return false;
  if (!("status" in session) && !answer) return false;

  const expectedUnfinished = expectedUnfinishedForFinish(
    session,
    answer,
    results,
  );
  if (expectedUnfinished === null && !serverPersist) return false;
  let store: Storage;
  try {
    store = storage ?? window.localStorage;
  } catch {
    return false;
  }
  if (serverPersist) {
    try {
      return await completeServerBackedPracticeSession(
        session,
        answer,
        results,
        store,
        serverPersist,
      );
    } catch {
      return false;
    }
  }
  if (expectedUnfinished === null) return false;
  try {
    return await withPracticeSessionLock(async () => {
      if (store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null)
        return false;
      const completedAfter = JSON.stringify(results);
      const hasContribution = hasProgressContribution(results);
      const beforeReconciliation = readPracticeFinishValues(store);
      if (!beforeReconciliation) return false;
      if (beforeReconciliation.unfinished !== null) {
        try {
          const persisted = validatePracticeSessionSnapshot(
            JSON.parse(beforeReconciliation.unfinished),
          );
          if (
            !persisted ||
            persisted.sessionId !== session.sessionId ||
            JSON.stringify(persisted) !== expectedUnfinished
          )
            return false;
        } catch {
          return false;
        }
      }
      const reconciliation = reconcilePendingPracticeProgressFinish(
        store,
        session.sessionId,
        expectedUnfinished,
        completedAfter,
      );
      if (reconciliation === "completed") return true;
      if (reconciliation === "unresolved") return false;

      const before = readPracticeFinishValues(store);
      if (!before?.unfinished) return false;
      try {
        const persisted = validatePracticeSessionSnapshot(
          JSON.parse(before.unfinished),
        );
        if (!persisted || JSON.stringify(persisted) !== expectedUnfinished)
          return false;
      } catch {
        return false;
      }

      if (hasContribution) {
        const progress = progressBeforeOrEmpty(before.progress);
        const nextProgress = progressAfterResults(progress, results);
        if (!nextProgress) return false;
        const after = {
          unfinished: null,
          completed: completedAfter,
          progress: JSON.stringify(nextProgress),
        };
        const pending: PendingPracticeProgressFinish = {
          sessionId: session.sessionId,
          unfinishedBefore: before.unfinished,
          completedBefore: before.completed,
          progressBefore: before.progress,
          completedAfter,
          progressAfter: after.progress,
        };
        const pendingRaw = JSON.stringify(pending);
        if (
          !writeAndConfirm(
            store,
            PRACTICE_PROGRESS_FINISH_PENDING_KEY,
            pendingRaw,
          )
        )
          return false;
        const stillCurrent = readPracticeFinishValues(store);
        if (
          !stillCurrent ||
          stillCurrent.unfinished !== before.unfinished ||
          stillCurrent.completed !== before.completed ||
          stillCurrent.progress !== before.progress
        ) {
          try {
            if (
              store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) === pendingRaw
            )
              writeAndConfirm(
                store,
                PRACTICE_PROGRESS_FINISH_PENDING_KEY,
                null,
              );
          } catch {
            // Leave the pending record to block an uncertain retry.
          }
          return false;
        }

        const rollback = () => {
          if (restorePracticeFinishValues(store, before, after))
            writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null);
          return false;
        };
        if (!clearPracticeSessionSnapshotInsideLock(store)) {
          return rollback();
        }
        const cleared = readPracticeFinishValues(store);
        if (
          !cleared ||
          cleared.unfinished !== null ||
          cleared.completed !== before.completed ||
          cleared.progress !== before.progress
        )
          return rollback();
        if (!saveLatestCompletedResults(results, store)) {
          return rollback();
        }
        const completed = readPracticeFinishValues(store);
        if (
          !completed ||
          completed.unfinished !== null ||
          completed.completed !== after.completed ||
          completed.progress !== before.progress
        )
          return rollback();
        try {
          store.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, after.progress);
        } catch {
          // Read back before deciding whether the write succeeded.
        }
        const durable = readPracticeFinishValues(store);
        if (
          !durable ||
          durable.unfinished !== after.unfinished ||
          durable.completed !== after.completed ||
          durable.progress !== after.progress
        )
          return rollback();
        return writeAndConfirm(
          store,
          PRACTICE_PROGRESS_FINISH_PENDING_KEY,
          null,
        );
      }

      if (!clearPracticeSessionSnapshotInsideLock(store)) return false;
      if (saveLatestCompletedResults(results, store)) return true;
      try {
        if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) === null)
          writeAndConfirm(
            store,
            PRACTICE_SESSION_STORAGE_KEY,
            before.unfinished,
          );
      } catch {
        // Leave the current storage value untouched when it cannot be inspected.
      }
      return false;
    });
  } catch {
    return false;
  }
}

export function restoreAnswerState(
  snapshot: PracticeSessionSnapshot,
): PracticeAnswerState {
  const lastSubmission = snapshot.activePractice.submissions.at(-1);
  if ("selectedOptionIds" in snapshot && snapshot.selectedOptionIds) {
    const answer = JSON.stringify(snapshot.selectedOptionIds);
    return {
      practice: snapshot.activePractice,
      selectedOptionIds: snapshot.selectedOptionIds,
      status:
        lastSubmission && answer === lastSubmission.answer
          ? lastSubmission.outcome
          : "typing",
    };
  }
  return {
    practice: snapshot.activePractice,
    rawAnswer: snapshot.rawAnswer ?? "",
    status:
      lastSubmission && snapshot.rawAnswer === lastSubmission.answer
        ? lastSubmission.outcome
        : "typing",
  };
}

export function getStoredProblemTitle(
  snapshot: PracticeSessionSnapshot,
): string {
  return "mode" in snapshot && snapshot.mode !== "pack"
    ? storedAdaptiveProblem(snapshot.problemIds[0])!.title
    : snapshot.mode === "pack"
      ? storedPackProblems(snapshot.problemIds)![snapshot.activeProblemIndex]
          .title
      : problems[snapshot.activeProblemIndex].title;
}

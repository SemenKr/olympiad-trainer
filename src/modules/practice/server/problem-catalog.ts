import "server-only";

import type {
  LearnerSafePracticeProblem,
  RevealedPracticeHint,
  RevealedPracticeSolution,
  RevealedReasoningCheckpoint,
} from "../application/practice-problem-presentation";
import type { ReasoningCheckpointOptionId } from "../application/reasoning-checkpoint";

type SourceReference = Readonly<{
  reference: "I" | "IS";
  url: string;
  page: number;
}>;

type ProblemProvenance = Readonly<{
  olympiad: "Всероссийская олимпиада школьников";
  subject: "mathematics";
  academicYear: "2025/26";
  stage: "invitational";
  region: "Moscow";
  sourceArchive: "vos.olimpiada.ru";
  grade: 5;
  problemNumber: number;
  variant: 1;
  originalSource: SourceReference;
  officialSolution: SourceReference;
}>;

type FocusHintDefinition = Readonly<{
  id: string;
  level: "focus";
  text: string;
}>;

type StrategyHintDefinition = Readonly<{
  id: string;
  level: "strategy";
  text: string;
}>;

type NextStepHintDefinition = Readonly<{
  id: string;
  level: "next-step";
  text: string;
}>;

type TrainingSolutionDefinition = Readonly<{
  id: string;
  kind: "training-adaptation";
  text: string;
}>;

type ReasoningCheckpointDefinition = Readonly<{
  id: string;
  heading: string;
  question: string;
  options: readonly Readonly<{
    id: ReasoningCheckpointOptionId;
    text: string;
  }>[];
  correctOptionId: ReasoningCheckpointOptionId;
}>;

export type ProblemDefinition = Readonly<{
  id: string;
  grade: 5;
  subject: "mathematics";
  title: string;
  statement: string;
  provenance: ProblemProvenance;
  assessment:
    | Readonly<{ kind: "nonnegative-integer"; expectedAnswer: string }>
    | Readonly<{
        kind: "multiple-choice-set";
        options: readonly Readonly<{ id: string; label: string }>[];
        expectedOptionIds: readonly string[];
      }>;
  hints: readonly [
    FocusHintDefinition,
    StrategyHintDefinition,
    NextStepHintDefinition,
  ];
  solution: TrainingSolutionDefinition;
  reasoningCheckpoint?: ReasoningCheckpointDefinition;
}>;

export const CURRENT_PRACTICE_PROBLEM_ID = "coinciding-seats";
export const PRACTICE_SESSION_PROBLEM_IDS = [
  CURRENT_PRACTICE_PROBLEM_ID,
  "guaranteed-sock-pair",
  "table-impossible-sums",
] as const;

const coincidingSeatsProblem = {
  id: CURRENT_PRACTICE_PROBLEM_ID,
  grade: 5,
  subject: "mathematics",
  title: "Совпадающие места",
  statement:
    "В зале 102 места, пронумерованных от 1 до 102. Для одной группы отмечают каждое второе место, а для другой — каждое третье. Сколько мест окажутся отмечены для обеих групп?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 1,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 1,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "17",
  },
  hints: [
    {
      id: "coinciding-seats-focus-simultaneous-rules",
      level: "focus",
      text: "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.",
    },
    {
      id: "coinciding-seats-strategy-repeat-interval",
      level: "strategy",
      text: "Подумай, через сколько мест отметки по обоим правилам снова совпадут.",
    },
    {
      id: "coinciding-seats-next-step-list-common-seats",
      level: "next-step",
      text: "Выпиши первые несколько мест, которые отмечены по обоим правилам. Затем продолжай тот же шаг, пока номер места не превысит 102.",
    },
  ],
  solution: {
    id: "coinciding-seats-full-solution",
    kind: "training-adaptation",
    text: "Подходят места, номер которых делится и на 2, и на 3. Такие места идут через 6: 6, 12, 18, …, 102. Число 102 равно 6 × 17, значит, совпадающих мест 17. Ответ: 17.",
  },
} as const satisfies ProblemDefinition;

const guaranteedSockPairProblem = {
  id: "guaranteed-sock-pair",
  grade: 5,
  subject: "mathematics",
  title: "Носки в пакете",
  statement:
    "В пакете лежат 4 красных, 3 синих и 5 жёлтых носков. Ровно три из них дырявые. Какое наименьшее число носков нужно достать не глядя, чтобы среди вынутых наверняка нашлись два целых носка одного цвета?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 4,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 4,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "7",
  },
  hints: [
    {
      id: "guaranteed-sock-pair-focus-guarantee",
      level: "focus",
      text: "Обрати внимание на слово «наверняка»: нужная пара должна получиться при любом возможном наборе вынутых носков.",
    },
    {
      id: "guaranteed-sock-pair-strategy-worst-case",
      level: "strategy",
      text: "Рассмотри самый неудачный случай: сколько носков можно вынуть и всё ещё остаться без двух целых носков одного цвета?",
    },
    {
      id: "guaranteed-sock-pair-next-step-bound-without-pair",
      level: "next-step",
      text: "Если нужной пары нет, целых носков каждого цвета может быть не больше одного. Учти ещё три дырявых носка и проверь, можно ли такой предельный набор действительно составить.",
    },
  ],
  solution: {
    id: "guaranteed-sock-pair-full-solution",
    kind: "training-adaptation",
    text: "Шесть носков ещё недостаточно: можно вынуть по два носка каждого цвета, причём по одному носку каждого цвета окажется дырявым. Тогда целых носков одного цвета будет не больше одного. Теперь рассмотрим семь вынутых носков. Если бы среди них не было двух целых носков одного цвета, то целых носков было бы не больше трёх — по одному каждого цвета. Дырявых носков всего три, значит, всего можно было бы вынуть не больше шести носков. Противоречие. Поэтому семь носков гарантируют нужную пару, а шесть — нет. Ответ: 7.",
  },
  reasoningCheckpoint: {
    id: "guaranteed-sock-pair-guarantee-argument",
    heading: "Проверь рассуждение",
    question: "Почему 7 носков уже гарантируют нужную пару?",
    options: [
      {
        id: "A",
        text: "Если нужной пары нет, целых носков каждого цвета может быть не больше одного. Значит, целых носков не больше 3, а вместе с тремя дырявыми можно вынуть не больше 6.",
      },
      {
        id: "B",
        text: "Среди любых 7 носков обязательно найдутся два носка одного цвета.",
      },
      {
        id: "C",
        text: "Дырявых носков всего три, значит остальные четыре обязательно будут одного цвета.",
      },
    ],
    correctOptionId: "A",
  },
} as const satisfies ProblemDefinition;

const tableImpossibleSumsProblem = {
  id: "table-impossible-sums",
  grade: 5,
  subject: "mathematics",
  title: "Невозможные суммы",
  statement:
    "Петя заполнил таблицу 4 × 5 числами от 1 до 5. В каждой строке все пять чисел различны, и в каждом столбце числа тоже не повторяются. Затем он сложил все числа из первого и последнего столбцов. Какие из сумм он не сможет получить? Выбери все подходящие варианты: 20, 21, 23, 25, 26.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 5,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 7,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      { id: "sum-20", label: "20" },
      { id: "sum-21", label: "21" },
      { id: "sum-23", label: "23" },
      { id: "sum-25", label: "25" },
      { id: "sum-26", label: "26" },
    ],
    expectedOptionIds: ["sum-20"],
  },
  hints: [
    {
      id: "table-impossible-sums-focus-constraints",
      level: "focus",
      text: "Обрати внимание: в каждой строке стоят все числа от 1 до 5 по одному разу. Ограничения строк и столбцов нужно учитывать вместе.",
    },
    {
      id: "table-impossible-sums-strategy-minimum",
      level: "strategy",
      text: "Начни с самой маленькой из предложенных сумм. Подумай, какие четыре разных числа должны стоять в каждом крайнем столбце, чтобы получить её.",
    },
    {
      id: "table-impossible-sums-next-step-fives",
      level: "next-step",
      text: "Если в обоих крайних столбцах нет числа 5, все четыре пятёрки должны оказаться в трёх средних столбцах. Проверь, возможно ли это без повторения числа в одном столбце.",
    },
  ],
  solution: {
    id: "table-impossible-sums-full-solution",
    kind: "training-adaptation",
    text: "Минимальная сумма чисел в одном столбце равна 10. Поэтому сумма 20 возможна только тогда, когда и первый, и последний столбцы содержат числа 1, 2, 3, 4 и не содержат 5. Но в каждой из четырёх строк есть одна пятёрка. Значит, все четыре пятёрки пришлось бы разместить в трёх средних столбцах. Тогда в одном из этих столбцов пятёрка повторилась бы, что запрещено. Поэтому сумму 20 получить нельзя. Остальные предложенные суммы получить можно. Например, строки 1 2 3 4 5; 2 3 4 5 1; 3 4 5 1 2; 4 5 1 2 3 дают суммы столбцов 10, 14, 13, 12, 11. Переставляя столбцы, можно получить суммы крайних столбцов 21, 23, 25 и 26. Ответ: 20.",
  },
  reasoningCheckpoint: {
    id: "table-impossible-sums-impossibility-argument",
    heading: "Проверь рассуждение",
    question:
      "Если сумма крайних столбцов равна 20, в них нет пятёрок. Что завершает доказательство невозможности?",
    options: [
      {
        id: "A",
        text: "В каждой из четырёх строк есть одна пятёрка. Все четыре пятёрки должны оказаться в трёх средних столбцах, поэтому в каком-то столбце пятёрка повторится, а это запрещено.",
      },
      {
        id: "B",
        text: "Раз в крайних столбцах нет пятёрок, сумма каждого среднего столбца обязательно равна 14.",
      },
      {
        id: "C",
        text: "Первый и последний столбцы содержат одинаковый набор чисел, а два столбца с одинаковым набором запрещены.",
      },
    ],
    correctOptionId: "A",
  },
} as const satisfies ProblemDefinition;

const problemCatalog: Readonly<Record<string, ProblemDefinition>> = {
  [coincidingSeatsProblem.id]: coincidingSeatsProblem,
  [guaranteedSockPairProblem.id]: guaranteedSockPairProblem,
  [tableImpossibleSumsProblem.id]: tableImpossibleSumsProblem,
};

export function getProblemDefinition(problemId: string): ProblemDefinition {
  if (!Object.prototype.hasOwnProperty.call(problemCatalog, problemId)) {
    throw new Error(`Unknown practice problem: ${problemId}`);
  }

  const problem = problemCatalog[problemId];

  if (!problem) {
    throw new Error(`Unknown practice problem: ${problemId}`);
  }

  return problem;
}

export function getLearnerSafePracticeProblem(
  problemId: string,
): LearnerSafePracticeProblem {
  const problem = getProblemDefinition(problemId);
  const [focusHint, strategyHint, nextStepHint] = problem.hints;

  return {
    problemId: problem.id,
    title: problem.title,
    statement: problem.statement,
    response:
      problem.assessment.kind === "multiple-choice-set"
        ? {
            kind: "multiple-choice-set",
            options: problem.assessment.options.map(({ id, label }) => ({
              id,
              label,
            })),
          }
        : { kind: "short-numeric" },
    hints: [
      { hintId: focusHint.id, level: focusHint.level },
      { hintId: strategyHint.id, level: strategyHint.level },
      { hintId: nextStepHint.id, level: nextStepHint.level },
    ],
    solution: { solutionId: problem.solution.id },
    ...(problem.reasoningCheckpoint
      ? {
          reasoningCheckpoint: { checkpointId: problem.reasoningCheckpoint.id },
        }
      : {}),
  };
}

function getReasoningCheckpointDefinition(
  problemId: string,
  checkpointId: string,
): ReasoningCheckpointDefinition {
  const checkpoint = getProblemDefinition(problemId).reasoningCheckpoint;
  if (!checkpoint || checkpoint.id !== checkpointId) {
    throw new Error(`Unknown reasoning checkpoint: ${checkpointId}`);
  }
  return checkpoint;
}

export function getRevealedReasoningCheckpoint(
  problemId: string,
  checkpointId: string,
): RevealedReasoningCheckpoint {
  const checkpoint = getReasoningCheckpointDefinition(problemId, checkpointId);
  return {
    checkpointId: checkpoint.id,
    heading: checkpoint.heading,
    question: checkpoint.question,
    options: checkpoint.options.map(({ id, text }) => ({ id, text })),
  };
}

export function assessReasoningCheckpointOption(
  problemId: string,
  checkpointId: string,
  selectedOptionId: string,
): { outcome: "correct" | "incorrect" } {
  const checkpoint = getReasoningCheckpointDefinition(problemId, checkpointId);
  if (!checkpoint.options.some((option) => option.id === selectedOptionId)) {
    throw new Error(`Unknown reasoning option: ${selectedOptionId}`);
  }
  return {
    outcome:
      checkpoint.correctOptionId === selectedOptionId ? "correct" : "incorrect",
  };
}

export function getRevealedPracticeHint(
  problemId: string,
  hintId: string,
): RevealedPracticeHint {
  const problem = getProblemDefinition(problemId);
  const hint = problem.hints.find((candidate) => candidate.id === hintId);

  if (!hint) {
    throw new Error(`Unknown hint for practice problem: ${hintId}`);
  }

  return { hintId: hint.id, level: hint.level, text: hint.text };
}

export function getRevealedPracticeSolution(
  problemId: string,
  solutionId: string,
): RevealedPracticeSolution {
  const problem = getProblemDefinition(problemId);

  if (problem.solution.id !== solutionId) {
    throw new Error(`Unknown solution for practice problem: ${solutionId}`);
  }

  return { solutionId: problem.solution.id, text: problem.solution.text };
}

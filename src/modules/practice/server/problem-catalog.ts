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
  assessment: Readonly<{
    kind: "nonnegative-integer";
    expectedAnswer: string;
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

const problemCatalog: Readonly<Record<string, ProblemDefinition>> = {
  [coincidingSeatsProblem.id]: coincidingSeatsProblem,
  [guaranteedSockPairProblem.id]: guaranteedSockPairProblem,
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

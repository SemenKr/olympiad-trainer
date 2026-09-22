import "server-only";

import type {
  LearnerSafePracticeProblem,
  RevealedPracticeHint,
} from "../application/practice-problem-presentation";

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
  problemNumber: 1;
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
  hints: readonly [FocusHintDefinition, StrategyHintDefinition];
}>;

export const CURRENT_PRACTICE_PROBLEM_ID = "coinciding-seats";

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
  ],
} as const satisfies ProblemDefinition;

const problemCatalog: Readonly<Record<string, ProblemDefinition>> = {
  [coincidingSeatsProblem.id]: coincidingSeatsProblem,
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
  const [focusHint, strategyHint] = problem.hints;

  return {
    problemId: problem.id,
    title: problem.title,
    statement: problem.statement,
    hints: [
      { hintId: focusHint.id, level: focusHint.level },
      { hintId: strategyHint.id, level: strategyHint.level },
    ],
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

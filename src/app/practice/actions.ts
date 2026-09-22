"use server";

import type {
  RevealedPracticeHint,
  RevealedPracticeSolution,
} from "../../modules/practice/application/practice-problem-presentation";
import {
  checkNonnegativeIntegerAnswer,
  type NumericAnswerResult,
} from "../../modules/practice/domain/numeric-answer";
import {
  getProblemDefinition,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
} from "../../modules/practice/server/problem-catalog";

function requireIdentifier(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return value;
}

export async function submitPracticeAnswer(
  problemId: unknown,
  rawAnswer: unknown,
): Promise<NumericAnswerResult> {
  const problem = getProblemDefinition(
    requireIdentifier(problemId, "practice problem ID"),
  );

  if (typeof rawAnswer !== "string") {
    return { status: "invalid" };
  }

  return checkNonnegativeIntegerAnswer(
    rawAnswer,
    problem.assessment.expectedAnswer,
  );
}

export async function revealPracticeHint(
  problemId: unknown,
  hintId: unknown,
): Promise<RevealedPracticeHint> {
  return getRevealedPracticeHint(
    requireIdentifier(problemId, "practice problem ID"),
    requireIdentifier(hintId, "hint ID"),
  );
}

export async function revealPracticeSolution(
  problemId: unknown,
  solutionId: unknown,
): Promise<RevealedPracticeSolution> {
  return getRevealedPracticeSolution(
    requireIdentifier(problemId, "practice problem ID"),
    requireIdentifier(solutionId, "solution ID"),
  );
}

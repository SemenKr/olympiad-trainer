"use server";

import type {
  RevealedPracticeHint,
  RevealedPracticeSolution,
  RevealedReasoningCheckpoint,
} from "../../modules/practice/application/practice-problem-presentation";
import type { PracticeSummary } from "../../modules/practice/application/practice-state";
import type {
  ReasoningCheckpointInterpretation,
  ReasoningCheckpointVerification,
} from "../../modules/practice/application/reasoning-checkpoint";
import {
  checkNonnegativeIntegerAnswer,
  type NumericAnswerResult,
} from "../../modules/practice/domain/numeric-answer";
import { checkMultipleChoiceSetAnswer } from "../../modules/practice/domain/multiple-choice-set-answer";
import {
  getProblemDefinition,
  getRevealedReasoningCheckpoint,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
  assessReasoningCheckpointOption,
} from "../../modules/practice/server/problem-catalog";
import { getReasoningCheckpointInterpretation } from "../../modules/practice/server/reasoning-checkpoint-interpretation";

function requireIdentifier(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return value;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireReasoningSummary(value: unknown): PracticeSummary {
  if (
    !record(value) ||
    value.outcome !== "eventually-correct" ||
    !Number.isSafeInteger(value.validSubmissionCount) ||
    typeof value.validSubmissionCount !== "number" ||
    value.validSubmissionCount < 1 ||
    !Array.isArray(value.hintExposures) ||
    !(value.solutionExposure === null || record(value.solutionExposure))
  ) {
    throw new Error("Invalid reasoning checkpoint context.");
  }
  return value as PracticeSummary;
}

export async function submitPracticeAnswer(
  problemId: unknown,
  rawAnswer: unknown,
): Promise<NumericAnswerResult> {
  const problem = getProblemDefinition(
    requireIdentifier(problemId, "practice problem ID"),
  );

  if (problem.assessment.kind === "multiple-choice-set")
    return checkMultipleChoiceSetAnswer(
      rawAnswer,
      problem.assessment.options.map((option) => option.id),
      problem.assessment.expectedOptionIds,
    );
  return typeof rawAnswer === "string"
    ? checkNonnegativeIntegerAnswer(
        rawAnswer,
        problem.assessment.expectedAnswer,
      )
    : { status: "invalid" };
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

export async function revealReasoningCheckpoint(
  problemId: unknown,
  checkpointId: unknown,
): Promise<RevealedReasoningCheckpoint> {
  return getRevealedReasoningCheckpoint(
    requireIdentifier(problemId, "practice problem ID"),
    requireIdentifier(checkpointId, "reasoning checkpoint ID"),
  );
}

export async function submitReasoningCheckpointOption(
  problemId: unknown,
  checkpointId: unknown,
  selectedOptionId: unknown,
  summary: unknown,
): Promise<{
  outcome: "correct" | "incorrect";
  interpretation: ReasoningCheckpointInterpretation;
}> {
  const context = requireReasoningSummary(summary);
  const assessed = assessReasoningCheckpointOption(
    requireIdentifier(problemId, "practice problem ID"),
    requireIdentifier(checkpointId, "reasoning checkpoint ID"),
    requireIdentifier(selectedOptionId, "reasoning option ID"),
  );
  return {
    ...assessed,
    interpretation: getReasoningCheckpointInterpretation(
      context,
      assessed.outcome,
      requireIdentifier(problemId, "practice problem ID"),
    ),
  };
}

export async function verifyPersistedReasoningCheckpointObservation(
  problemId: unknown,
  observation: unknown,
  summary: unknown,
): Promise<ReasoningCheckpointVerification> {
  if (
    !record(observation) ||
    typeof observation.checkpointId !== "string" ||
    typeof observation.selectedOptionId !== "string" ||
    (observation.outcome !== "correct" && observation.outcome !== "incorrect")
  )
    return { valid: false };

  try {
    const context = requireReasoningSummary(summary);
    const assessed = assessReasoningCheckpointOption(
      requireIdentifier(problemId, "practice problem ID"),
      observation.checkpointId,
      observation.selectedOptionId,
    );
    if (assessed.outcome !== observation.outcome) return { valid: false };
    return {
      valid: true,
      interpretation: getReasoningCheckpointInterpretation(
        context,
        assessed.outcome,
        requireIdentifier(problemId, "practice problem ID"),
      ),
    };
  } catch {
    return { valid: false };
  }
}

export async function verifyPersistedGuaranteeEvidenceFacts(
  facts: unknown,
): Promise<boolean> {
  if (!Array.isArray(facts) || facts.length > 3) return false;

  let valid = true;
  for (const fact of facts) {
    if (
      !record(fact) ||
      fact.problemId !== "guaranteed-sock-pair" ||
      !record(fact.observation) ||
      typeof fact.observation.checkpointId !== "string" ||
      typeof fact.observation.selectedOptionId !== "string" ||
      (fact.observation.outcome !== "correct" &&
        fact.observation.outcome !== "incorrect")
    ) {
      valid = false;
      continue;
    }
    try {
      const assessed = assessReasoningCheckpointOption(
        fact.problemId,
        fact.observation.checkpointId,
        fact.observation.selectedOptionId,
      );
      if (assessed.outcome !== fact.observation.outcome) valid = false;
    } catch {
      valid = false;
    }
  }
  return valid;
}

export async function verifyPersistedPracticeProgressEvidenceFacts(
  facts: unknown,
): Promise<boolean> {
  if (!Array.isArray(facts) || facts.length > 6) return false;
  let valid = true;
  for (const fact of facts) {
    if (
      !record(fact) ||
      (fact.problemId !== "guaranteed-sock-pair" &&
        fact.problemId !== "table-impossible-sums") ||
      !record(fact.observation) ||
      typeof fact.observation.checkpointId !== "string" ||
      typeof fact.observation.selectedOptionId !== "string" ||
      (fact.observation.outcome !== "correct" &&
        fact.observation.outcome !== "incorrect")
    ) {
      valid = false;
      continue;
    }
    try {
      const assessed = assessReasoningCheckpointOption(
        fact.problemId,
        fact.observation.checkpointId,
        fact.observation.selectedOptionId,
      );
      if (assessed.outcome !== fact.observation.outcome) valid = false;
    } catch {
      valid = false;
    }
  }
  return valid;
}

import "server-only";
import { checkNonnegativeIntegerAnswer } from "../../practice/domain/numeric-answer";
import {
  getProblemDefinition,
  getLearnerSafePracticeProblem,
} from "../../practice/server/problem-catalog";

import { CARRIER_PROBLEM_ID } from "../domain/knowledge-support";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Like existing Practice evidence, these local episode facts are client-attested.
// Validate the boundary; only the protected diagnostic can recommend a lesson.
export function requireDiagnosticEligibility(value: unknown): boolean {
  if (
    !record(value) ||
    value.problemId !== CARRIER_PROBLEM_ID ||
    !record(value.practice)
  )
    throw new Error("Invalid diagnostic context.");
  const practice = value.practice;
  const submissions = practice.submissions;
  const hints = practice.hintExposures;
  if (
    practice.status !== "active" ||
    practice.solutionExposure !== null ||
    !Array.isArray(submissions) ||
    !Array.isArray(hints) ||
    !submissions.every(
      (s: unknown) =>
        record(s) &&
        typeof s.answer === "string" &&
        (s.outcome === "correct" || s.outcome === "incorrect"),
    ) ||
    !hints.every(
      (h: unknown) =>
        record(h) &&
        typeof h.hintId === "string" &&
        (h.level === "focus" ||
          h.level === "strategy" ||
          h.level === "next-step") &&
        typeof h.validSubmissionCountAtOpen === "number" &&
        Number.isSafeInteger(h.validSubmissionCountAtOpen) &&
        h.validSubmissionCountAtOpen >= 0 &&
        h.validSubmissionCountAtOpen <= submissions.length,
    )
  )
    throw new Error("Invalid diagnostic Practice facts.");
  const carrier = getProblemDefinition(CARRIER_PROBLEM_ID);
  if (carrier.assessment.kind !== "nonnegative-integer")
    throw new Error("Knowledge Support requires the numeric carrier.");
  const assessment = carrier.assessment;
  const outcomes = submissions.map(
    (submission) =>
      checkNonnegativeIntegerAnswer(
        submission.answer,
        assessment.expectedAnswer,
      ).status,
  );
  const focusHint = getLearnerSafePracticeProblem(
    CARRIER_PROBLEM_ID,
  ).hints.find((hint) => hint.level === "focus");
  return (
    !outcomes.includes("correct") &&
    (outcomes.includes("incorrect") ||
      hints.some(
        (hint) =>
          focusHint !== undefined &&
          hint.hintId === focusHint.hintId &&
          hint.level === focusHint.level,
      ))
  );
}

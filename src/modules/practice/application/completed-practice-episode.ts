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
export type CompletedPracticeEpisodeMode = "core" | "transfer";

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
  } else if (mode === "transfer") {
    const first = problems[0];
    if (
      problems.length !== 1 ||
      !record(first) ||
      !TRANSFER_EPISODE_PROBLEM_IDS.some((id) => id === first.problemId)
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
          fact.hintLevelsExposed.length !== 3))
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

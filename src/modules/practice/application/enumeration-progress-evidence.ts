import type { PracticeSummary } from "./practice-state";
import {
  PAGES_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
} from "./reasoning-checkpoint";

const hintLevels = ["focus", "strategy", "next-step"] as const;
const slotNames = [
  "latestCorrectWithoutHints",
  "latestCorrectWithHints",
  "latestIncorrect",
] as const;

export type EnumerationEvidenceFact = Readonly<{
  sequence: number;
  problemId: "pages-without-digit-one";
  observation: ReasoningCheckpointObservation;
  hintLevelsExposedBeforeCheckpoint: readonly (typeof hintLevels)[number][];
  solutionExposedBeforeCheckpoint: false;
}>;

export type EnumerationEvidenceContribution = Omit<
  EnumerationEvidenceFact,
  "sequence"
>;

export type EnumerationProgressEvidence = Readonly<{
  version: 1;
  nextSequence: number;
  latestCorrectWithoutHints: EnumerationEvidenceFact | null;
  latestCorrectWithHints: EnumerationEvidenceFact | null;
  latestIncorrect: EnumerationEvidenceFact | null;
}>;

export function emptyEnumerationProgressEvidence(): EnumerationProgressEvidence {
  return {
    version: 1,
    nextSequence: 1,
    latestCorrectWithoutHints: null,
    latestCorrectWithHints: null,
    latestIncorrect: null,
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

function positiveSequence(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function validFact(
  value: unknown,
  slot: (typeof slotNames)[number],
): value is EnumerationEvidenceFact {
  if (
    !record(value) ||
    !exactKeys(value, [
      "sequence",
      "problemId",
      "observation",
      "hintLevelsExposedBeforeCheckpoint",
      "solutionExposedBeforeCheckpoint",
    ]) ||
    !positiveSequence(value.sequence) ||
    value.problemId !== "pages-without-digit-one" ||
    value.solutionExposedBeforeCheckpoint !== false ||
    !Array.isArray(value.hintLevelsExposedBeforeCheckpoint) ||
    value.hintLevelsExposedBeforeCheckpoint.length > 3 ||
    !value.hintLevelsExposedBeforeCheckpoint.every(
      (level, index) => level === hintLevels[index],
    ) ||
    !record(value.observation) ||
    !exactKeys(value.observation, [
      "checkpointId",
      "selectedOptionId",
      "outcome",
      "validSubmissionCountAtSubmit",
    ]) ||
    value.observation.checkpointId !== PAGES_REASONING_CHECKPOINT_ID ||
    (value.observation.selectedOptionId !== "A" &&
      value.observation.selectedOptionId !== "B" &&
      value.observation.selectedOptionId !== "C") ||
    (value.observation.outcome !== "correct" &&
      value.observation.outcome !== "incorrect") ||
    !positiveSequence(value.observation.validSubmissionCountAtSubmit)
  )
    return false;
  return slot === "latestIncorrect"
    ? value.observation.outcome === "incorrect"
    : value.observation.outcome === "correct" &&
        (slot === "latestCorrectWithoutHints"
          ? value.hintLevelsExposedBeforeCheckpoint.length === 0
          : value.hintLevelsExposedBeforeCheckpoint.length > 0);
}

export function validateEnumerationProgressEvidence(
  value: unknown,
): EnumerationProgressEvidence | null {
  if (
    !record(value) ||
    !exactKeys(value, ["version", "nextSequence", ...slotNames]) ||
    value.version !== 1 ||
    !positiveSequence(value.nextSequence) ||
    !slotNames.every(
      (slot) => value[slot] === null || validFact(value[slot], slot),
    )
  )
    return null;
  const facts = slotNames
    .map((slot) => value[slot])
    .filter((fact) => fact !== null) as EnumerationEvidenceFact[];
  if (
    new Set(facts.map((fact) => fact.sequence)).size !== facts.length ||
    facts.some((fact) => fact.sequence >= (value.nextSequence as number))
  )
    return null;
  return value as EnumerationProgressEvidence;
}

export function enumerationFacts(
  evidence: EnumerationProgressEvidence,
): EnumerationEvidenceFact[] {
  return slotNames
    .map((slot) => evidence[slot])
    .filter((fact): fact is EnumerationEvidenceFact => fact !== null);
}

export function getEnumerationEvidenceContribution(
  result:
    | {
        problemId: string;
        taskOutcome?: "skipped";
        summary: PracticeSummary;
        reasoningCheckpointObservation?: ReasoningCheckpointObservation;
      }
    | undefined,
): EnumerationEvidenceContribution | null {
  if (
    result?.problemId !== "pages-without-digit-one" ||
    result.taskOutcome !== undefined ||
    result.summary.outcome !== "eventually-correct" ||
    result.summary.solutionExposure !== null ||
    result.reasoningCheckpointObservation?.checkpointId !==
      PAGES_REASONING_CHECKPOINT_ID
  )
    return null;
  const observation = result.reasoningCheckpointObservation;
  return {
    problemId: "pages-without-digit-one",
    observation,
    hintLevelsExposedBeforeCheckpoint: result.summary.hintExposures
      .filter(
        (exposure) =>
          exposure.validSubmissionCountAtOpen <=
          observation.validSubmissionCountAtSubmit,
      )
      .map((exposure) => exposure.level),
    solutionExposedBeforeCheckpoint: false,
  };
}

export function appendEnumerationEvidence(
  current: EnumerationProgressEvidence,
  contribution: EnumerationEvidenceContribution,
): EnumerationProgressEvidence | null {
  if (
    !validateEnumerationProgressEvidence(current) ||
    !Number.isSafeInteger(current.nextSequence + 1)
  )
    return null;
  const slot =
    contribution.observation.outcome === "incorrect"
      ? "latestIncorrect"
      : contribution.hintLevelsExposedBeforeCheckpoint.length === 0
        ? "latestCorrectWithoutHints"
        : "latestCorrectWithHints";
  const next = {
    ...current,
    nextSequence: current.nextSequence + 1,
    [slot]: { sequence: current.nextSequence, ...contribution },
  };
  return validateEnumerationProgressEvidence(next);
}

export function deriveEnumerationProgressInterpretation(
  evidence: EnumerationProgressEvidence,
): ReasoningCheckpointInterpretation {
  const base = {
    capability: "Систематически перебирать случаи и обосновывать полноту",
    learnerLabel: "Проверять все возможные случаи",
  };
  const independent = evidence.latestCorrectWithoutHints;
  const hinted = evidence.latestCorrectWithHints;
  if (independent || hinted)
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        independent && (!hinted || independent.sequence > hinted.sequence)
          ? "Без подсказок ты верно выбрал способ перебора, в котором каждый подходящий случай учитывается ровно один раз. Пока это показывает распознавание полного перебора, а не умение самостоятельно строить такой разбор в новой задаче."
          : "После подсказок ты верно выбрал способ, который не пропускает подходящие случаи и не считает их дважды. Самостоятельное построение полного перебора пока не проверено.",
    };
  return {
    ...base,
    progressGroup: null,
    conclusion: "Проверенного выбора способа полного перебора пока нет.",
  };
}

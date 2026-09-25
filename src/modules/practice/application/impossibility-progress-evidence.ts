import type { PracticeSummary } from "./practice-state";
import {
  TABLE_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
} from "./reasoning-checkpoint";

const hintLevels = ["focus", "strategy", "next-step"] as const;

export type ImpossibilityEvidenceFact = Readonly<{
  sequence: number;
  problemId: "table-impossible-sums";
  observation: ReasoningCheckpointObservation & {
    checkpointId: typeof TABLE_REASONING_CHECKPOINT_ID;
  };
  hintLevelsExposedBeforeCheckpoint: readonly (
    "focus" | "strategy" | "next-step"
  )[];
  solutionExposedBeforeCheckpoint: false;
}>;

export type ImpossibilityProgressEvidenceV0 = Readonly<{
  version: 1;
  nextSequence: number;
  latestCorrectWithoutHints: ImpossibilityEvidenceFact | null;
  latestCorrectWithHints: ImpossibilityEvidenceFact | null;
  latestIncorrect: ImpossibilityEvidenceFact | null;
}>;

export type ImpossibilityEvidenceContribution = Omit<
  ImpossibilityEvidenceFact,
  "sequence"
>;

export function emptyImpossibilityProgressEvidence(): ImpossibilityProgressEvidenceV0 {
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
    Object.keys(value).every((key) => keys.includes(key)) &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function positiveSequence(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function validFact(
  value: unknown,
  slot:
    "latestCorrectWithoutHints" | "latestCorrectWithHints" | "latestIncorrect",
): value is ImpossibilityEvidenceFact {
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
    value.problemId !== "table-impossible-sums" ||
    value.solutionExposedBeforeCheckpoint !== false ||
    !Array.isArray(value.hintLevelsExposedBeforeCheckpoint) ||
    value.hintLevelsExposedBeforeCheckpoint.length > hintLevels.length ||
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
    value.observation.checkpointId !== TABLE_REASONING_CHECKPOINT_ID ||
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

export function validateImpossibilityProgressEvidence(
  value: unknown,
): ImpossibilityProgressEvidenceV0 | null {
  if (
    !record(value) ||
    !exactKeys(value, [
      "version",
      "nextSequence",
      "latestCorrectWithoutHints",
      "latestCorrectWithHints",
      "latestIncorrect",
    ]) ||
    value.version !== 1 ||
    !positiveSequence(value.nextSequence)
  )
    return null;
  const slots = [
    "latestCorrectWithoutHints",
    "latestCorrectWithHints",
    "latestIncorrect",
  ] as const;
  const facts: ImpossibilityEvidenceFact[] = [];
  for (const slot of slots) {
    const fact = value[slot];
    if (fact === null) continue;
    if (!validFact(fact, slot)) return null;
    facts.push(fact);
  }
  const sequences = facts.map((fact) => fact.sequence);
  if (
    new Set(sequences).size !== sequences.length ||
    sequences.some((sequence) => sequence >= (value.nextSequence as number))
  )
    return null;
  return value as ImpossibilityProgressEvidenceV0;
}

export function getImpossibilityEvidenceContribution(
  result:
    | {
        problemId: string;
        taskOutcome?: "skipped";
        summary: PracticeSummary;
        reasoningCheckpointObservation?: ReasoningCheckpointObservation;
      }
    | undefined,
): ImpossibilityEvidenceContribution | null {
  if (
    result?.problemId !== "table-impossible-sums" ||
    result.taskOutcome !== undefined ||
    result.summary.outcome !== "eventually-correct" ||
    result.summary.solutionExposure !== null ||
    result.reasoningCheckpointObservation?.checkpointId !==
      TABLE_REASONING_CHECKPOINT_ID
  )
    return null;
  const observation =
    result.reasoningCheckpointObservation as ImpossibilityEvidenceFact["observation"];
  return {
    problemId: "table-impossible-sums",
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

export function appendImpossibilityEvidence(
  current: ImpossibilityProgressEvidenceV0,
  contribution: ImpossibilityEvidenceContribution,
): ImpossibilityProgressEvidenceV0 | null {
  if (current.nextSequence >= Number.MAX_SAFE_INTEGER) return null;
  const fact: ImpossibilityEvidenceFact = {
    sequence: current.nextSequence,
    ...contribution,
  };
  const slot =
    fact.observation.outcome === "incorrect"
      ? "latestIncorrect"
      : fact.hintLevelsExposedBeforeCheckpoint.length === 0
        ? "latestCorrectWithoutHints"
        : "latestCorrectWithHints";
  return { ...current, nextSequence: current.nextSequence + 1, [slot]: fact };
}

export function deriveImpossibilityProgressInterpretation(
  evidence: ImpossibilityProgressEvidenceV0,
): ReasoningCheckpointInterpretation {
  const base = {
    capability: "Доказывать глобальную невозможность через ограничения",
    learnerLabel: "Доказывать, что что-то невозможно",
  };
  const withoutHints = evidence.latestCorrectWithoutHints;
  const withHints = evidence.latestCorrectWithHints;
  if (!withoutHints && !withHints)
    return {
      ...base,
      progressGroup: null,
      conclusion:
        "Пока рано сказать: в сохранённых тренировках ещё нет верно выполненной проверки этого шага рассуждения.",
    };
  const latestPositiveSequence = Math.max(
    withoutHints?.sequence ?? 0,
    withHints?.sequence ?? 0,
  );
  const conclusion =
    (evidence.latestIncorrect?.sequence ?? 0) > latestPositiveSequence
      ? "Раньше ты верно выбирал подходящее рассуждение, но в более поздней такой проверке ответ был другим. Пока рано говорить о стабильности."
      : withoutHints
        ? "Без открытых подсказок ты верно выбрал рассуждение, которое показывает, почему сумма 20 невозможна. Пока это показывает распознавание готового доказательства, а не самостоятельное построение."
        : "После открытых подсказок ты верно выбрал рассуждение, которое показывает, почему сумма 20 невозможна. Самостоятельное построение такого доказательства пока не проверено.";
  return { ...base, progressGroup: "Начинаю разбираться", conclusion };
}

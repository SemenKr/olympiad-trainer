import type { PracticeSummary } from "./practice-state";
import {
  SOCK_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
} from "./reasoning-checkpoint";

const hintLevels = ["focus", "strategy", "next-step"] as const;

export type GuaranteeEvidenceFact = Readonly<{
  sequence: number;
  problemId: "guaranteed-sock-pair";
  observation: ReasoningCheckpointObservation;
  hintLevelsExposedBeforeCheckpoint: readonly (
    "focus" | "strategy" | "next-step"
  )[];
  solutionExposedBeforeCheckpoint: false;
}>;

export type GuaranteeProgressEvidenceV0 = Readonly<{
  version: 1;
  nextSequence: number;
  latestCorrectWithoutHints: GuaranteeEvidenceFact | null;
  latestCorrectWithHints: GuaranteeEvidenceFact | null;
  latestIncorrect: GuaranteeEvidenceFact | null;
}>;

export type GuaranteeEvidenceContribution = Omit<
  GuaranteeEvidenceFact,
  "sequence"
>;

export function emptyGuaranteeProgressEvidence(): GuaranteeProgressEvidenceV0 {
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
): value is GuaranteeEvidenceFact {
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
    value.problemId !== "guaranteed-sock-pair" ||
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
    value.observation.checkpointId !== SOCK_REASONING_CHECKPOINT_ID ||
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

export function validateGuaranteeProgressEvidence(
  value: unknown,
): GuaranteeProgressEvidenceV0 | null {
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
  const facts: GuaranteeEvidenceFact[] = [];
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

  return value as GuaranteeProgressEvidenceV0;
}

export function getGuaranteeEvidenceContribution(
  result:
    | {
        problemId: string;
        taskOutcome?: "skipped";
        summary: PracticeSummary;
        reasoningCheckpointObservation?: ReasoningCheckpointObservation;
      }
    | undefined,
): GuaranteeEvidenceContribution | null {
  if (
    result?.problemId !== "guaranteed-sock-pair" ||
    result.taskOutcome !== undefined ||
    result.summary.outcome !== "eventually-correct" ||
    result.summary.solutionExposure !== null ||
    !result.reasoningCheckpointObservation
  )
    return null;

  const observation = result.reasoningCheckpointObservation;
  return {
    problemId: "guaranteed-sock-pair",
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

export function appendGuaranteeEvidence(
  current: GuaranteeProgressEvidenceV0,
  contribution: GuaranteeEvidenceContribution,
): GuaranteeProgressEvidenceV0 | null {
  if (current.nextSequence >= Number.MAX_SAFE_INTEGER) return null;
  const fact: GuaranteeEvidenceFact = {
    sequence: current.nextSequence,
    ...contribution,
  };
  const slot =
    fact.observation.outcome === "incorrect"
      ? "latestIncorrect"
      : fact.hintLevelsExposedBeforeCheckpoint.length === 0
        ? "latestCorrectWithoutHints"
        : "latestCorrectWithHints";
  return {
    ...current,
    nextSequence: current.nextSequence + 1,
    [slot]: fact,
  };
}

export function deriveGuaranteeProgressInterpretation(
  evidence: GuaranteeProgressEvidenceV0,
): ReasoningCheckpointInterpretation {
  const base = {
    capability:
      "Обосновывать гарантированный результат при неблагоприятном выборе",
    learnerLabel: "Как гарантировать результат",
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
      ? "Раньше ты верно выбирал подходящее объяснение, но в более поздней такой проверке ответ был другим. Пока рано говорить о стабильности."
      : withoutHints
        ? "Без открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Это пока показывает распознавание готового аргумента, а не самостоятельное доказательство."
        : "После открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Самостоятельное построение такого доказательства пока не проверено.";
  return { ...base, progressGroup: "Начинаю разбираться", conclusion };
}

import type { PracticeSummary } from "./practice-state";
import {
  BROTHERS_REASONING_CHECKPOINT_ID,
  TABLE_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
} from "./reasoning-checkpoint";

const hintLevels = ["focus", "strategy", "next-step"] as const;

type ImpossibilityEvidenceBase = Readonly<{
  sequence: number;
  hintLevelsExposedBeforeCheckpoint: readonly (
    "focus" | "strategy" | "next-step"
  )[];
  solutionExposedBeforeCheckpoint: false;
}>;

export type ImpossibilityEvidenceFact = ImpossibilityEvidenceBase &
  Readonly<{
    problemId: "table-impossible-sums" | "brothers-ages-products";
    observation: ReasoningCheckpointObservation;
  }>;

type Slots = Readonly<{
  latestCorrectWithoutHints: ImpossibilityEvidenceFact | null;
  latestCorrectWithHints: ImpossibilityEvidenceFact | null;
  latestIncorrect: ImpossibilityEvidenceFact | null;
}>;

// A verified I-08 observation remains available after its three-slot section
// replaces that fact with newer work.
type TableTransferBasis = Readonly<{
  sequence: number;
  observation: ReasoningCheckpointObservation;
  hintLevelsExposedBeforeCheckpoint: ImpossibilityEvidenceBase["hintLevelsExposedBeforeCheckpoint"];
}>;

export type ImpossibilityProgressEvidenceV0 = Readonly<{
  version: 1;
  nextSequence: number;
}> &
  Slots;

export type ImpossibilityProgressEvidenceV1 = Readonly<{
  version: 2;
  nextSequence: number;
  table: Slots;
  brothers: Slots;
  tableBasisForBrothersWithoutHints: TableTransferBasis | null;
}>;

export type ImpossibilityProgressEvidence =
  ImpossibilityProgressEvidenceV0 | ImpossibilityProgressEvidenceV1;

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
  problemId: ImpossibilityEvidenceFact["problemId"],
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
    value.problemId !== problemId ||
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
    value.observation.checkpointId !==
      (problemId === "table-impossible-sums"
        ? TABLE_REASONING_CHECKPOINT_ID
        : BROTHERS_REASONING_CHECKPOINT_ID) ||
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

const slotNames = [
  "latestCorrectWithoutHints",
  "latestCorrectWithHints",
  "latestIncorrect",
] as const;

function validSlots(
  value: unknown,
  problemId: ImpossibilityEvidenceFact["problemId"],
): value is Slots {
  if (!record(value) || !exactKeys(value, slotNames)) return false;
  return slotNames.every(
    (slot) => value[slot] === null || validFact(value[slot], slot, problemId),
  );
}

function tableBasisAsFact(
  basis: TableTransferBasis,
): ImpossibilityEvidenceFact {
  return {
    sequence: basis.sequence,
    problemId: "table-impossible-sums",
    observation: basis.observation,
    hintLevelsExposedBeforeCheckpoint: basis.hintLevelsExposedBeforeCheckpoint,
    solutionExposedBeforeCheckpoint: false,
  };
}

function validTableTransferBasis(value: unknown): value is TableTransferBasis {
  if (
    !record(value) ||
    !exactKeys(value, [
      "sequence",
      "observation",
      "hintLevelsExposedBeforeCheckpoint",
    ]) ||
    !Array.isArray(value.hintLevelsExposedBeforeCheckpoint)
  )
    return false;
  const fact = tableBasisAsFact(value as TableTransferBasis);
  return validFact(
    fact,
    value.hintLevelsExposedBeforeCheckpoint.length === 0
      ? "latestCorrectWithoutHints"
      : "latestCorrectWithHints",
    "table-impossible-sums",
  );
}

function sameTableBasisFact(
  fact: ImpossibilityEvidenceFact,
  basis: TableTransferBasis,
) {
  return (
    fact.problemId === "table-impossible-sums" &&
    fact.sequence === basis.sequence &&
    fact.observation.checkpointId === basis.observation.checkpointId &&
    fact.observation.selectedOptionId === basis.observation.selectedOptionId &&
    fact.observation.outcome === basis.observation.outcome &&
    fact.observation.validSubmissionCountAtSubmit ===
      basis.observation.validSubmissionCountAtSubmit &&
    fact.hintLevelsExposedBeforeCheckpoint.length ===
      basis.hintLevelsExposedBeforeCheckpoint.length &&
    fact.hintLevelsExposedBeforeCheckpoint.every(
      (level, index) =>
        level === basis.hintLevelsExposedBeforeCheckpoint[index],
    )
  );
}

export function impossibilityFacts(
  evidence: ImpossibilityProgressEvidence,
): ImpossibilityEvidenceFact[] {
  const sections =
    evidence.version === 1 ? [evidence] : [evidence.table, evidence.brothers];
  const retained = sections.flatMap((section) =>
    slotNames
      .map((slot) => section[slot])
      .filter((fact): fact is ImpossibilityEvidenceFact => fact !== null),
  );
  if (
    evidence.version !== 2 ||
    !evidence.tableBasisForBrothersWithoutHints ||
    slotNames.some(
      (slot) =>
        evidence.table[slot]?.sequence ===
        evidence.tableBasisForBrothersWithoutHints?.sequence,
    )
  )
    return retained;
  return [
    ...retained,
    tableBasisAsFact(evidence.tableBasisForBrothersWithoutHints),
  ];
}

export function validateImpossibilityProgressEvidence(
  value: unknown,
): ImpossibilityProgressEvidence | null {
  if (!record(value) || !positiveSequence(value.nextSequence)) return null;
  if (value.version === 1) {
    if (!exactKeys(value, ["version", "nextSequence", ...slotNames]))
      return null;
    if (
      !slotNames.every(
        (slot) =>
          value[slot] === null ||
          validFact(value[slot], slot, "table-impossible-sums"),
      )
    )
      return null;
  } else if (value.version === 2) {
    if (
      !exactKeys(value, [
        "version",
        "nextSequence",
        "table",
        "brothers",
        "tableBasisForBrothersWithoutHints",
      ]) ||
      !validSlots(value.table, "table-impossible-sums") ||
      !validSlots(value.brothers, "brothers-ages-products") ||
      (value.tableBasisForBrothersWithoutHints !== null &&
        !validTableTransferBasis(value.tableBasisForBrothersWithoutHints))
    )
      return null;
    const basis = value.tableBasisForBrothersWithoutHints;
    const brothers = value.brothers;
    const brothersWithoutHints = brothers.latestCorrectWithoutHints;
    if (
      (basis !== null &&
        (!brothersWithoutHints ||
          basis.sequence >= brothersWithoutHints.sequence)) ||
      (basis !== null &&
        [
          value.table.latestCorrectWithoutHints,
          value.table.latestCorrectWithHints,
          value.table.latestIncorrect,
        ].some(
          (fact) =>
            fact !== null &&
            fact.sequence === basis.sequence &&
            !sameTableBasisFact(fact, basis),
        )) ||
      (basis !== null &&
        slotNames.some((slot) => brothers[slot]?.sequence === basis.sequence))
    )
      return null;
  } else return null;
  const facts: ImpossibilityEvidenceFact[] = [];
  const sections =
    value.version === 1 ? [value] : [value.table, value.brothers];
  for (const section of sections)
    for (const slot of slotNames) {
      const fact = (section as Record<string, unknown>)[slot];
      if (fact === null) continue;
      facts.push(fact as ImpossibilityEvidenceFact);
    }
  const sequences = facts.map((fact) => fact.sequence);
  if (
    new Set(sequences).size !== sequences.length ||
    sequences.some((sequence) => sequence >= (value.nextSequence as number))
  )
    return null;
  return value as ImpossibilityProgressEvidence;
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
    (result?.problemId !== "table-impossible-sums" &&
      result?.problemId !== "brothers-ages-products") ||
    result.taskOutcome !== undefined ||
    result.summary.outcome !== "eventually-correct" ||
    result.summary.solutionExposure !== null ||
    result.reasoningCheckpointObservation?.checkpointId !==
      (result.problemId === "table-impossible-sums"
        ? TABLE_REASONING_CHECKPOINT_ID
        : BROTHERS_REASONING_CHECKPOINT_ID)
  )
    return null;
  const observation =
    result.reasoningCheckpointObservation as ImpossibilityEvidenceFact["observation"];
  return {
    problemId: result.problemId,
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
  current: ImpossibilityProgressEvidence,
  contribution: ImpossibilityEvidenceContribution,
): ImpossibilityProgressEvidence | null {
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
  if (
    contribution.problemId === "table-impossible-sums" &&
    current.version === 1
  )
    return { ...current, nextSequence: current.nextSequence + 1, [slot]: fact };
  const migrated: ImpossibilityProgressEvidenceV1 =
    current.version === 2
      ? current
      : {
          version: 2,
          nextSequence: current.nextSequence,
          table: {
            latestCorrectWithoutHints: current.latestCorrectWithoutHints,
            latestCorrectWithHints: current.latestCorrectWithHints,
            latestIncorrect: current.latestIncorrect,
          },
          brothers: {
            latestCorrectWithoutHints: null,
            latestCorrectWithHints: null,
            latestIncorrect: null,
          },
          tableBasisForBrothersWithoutHints: null,
        };
  const section =
    contribution.problemId === "table-impossible-sums" ? "table" : "brothers";
  const basis =
    section === "brothers" && slot === "latestCorrectWithoutHints"
      ? latestEligibleTablePositive(migrated.table)
      : null;
  return {
    ...migrated,
    nextSequence: migrated.nextSequence + 1,
    [section]: { ...migrated[section], [slot]: fact },
    ...(section === "brothers" && slot === "latestCorrectWithoutHints"
      ? {
          tableBasisForBrothersWithoutHints: basis
            ? {
                sequence: basis.sequence,
                observation: basis.observation,
                hintLevelsExposedBeforeCheckpoint:
                  basis.hintLevelsExposedBeforeCheckpoint,
              }
            : null,
        }
      : {}),
  };
}

function latestEligibleTablePositive(table: Slots) {
  const latest = [table.latestCorrectWithoutHints, table.latestCorrectWithHints]
    .filter((fact): fact is ImpossibilityEvidenceFact => fact !== null)
    .sort((a, b) => b.sequence - a.sequence)[0];
  return latest && (table.latestIncorrect?.sequence ?? 0) <= latest.sequence
    ? latest
    : null;
}

export function deriveImpossibilityProgressInterpretation(
  evidence: ImpossibilityProgressEvidence,
): ReasoningCheckpointInterpretation {
  const base = {
    capability: "Доказывать глобальную невозможность через ограничения",
    learnerLabel: "Доказывать, что что-то невозможно",
  };
  const table = evidence.version === 1 ? evidence : evidence.table;
  const brothers = evidence.version === 1 ? null : evidence.brothers;
  const withoutHints = table.latestCorrectWithoutHints;
  const withHints = table.latestCorrectWithHints;
  const latestTablePositive = [withoutHints, withHints]
    .filter((fact): fact is ImpossibilityEvidenceFact => fact !== null)
    .sort((a, b) => b.sequence - a.sequence)[0];
  const transferWithoutHints = brothers?.latestCorrectWithoutHints;
  const transferBasis =
    evidence.version === 2 ? evidence.tableBasisForBrothersWithoutHints : null;
  if (
    transferWithoutHints &&
    transferBasis &&
    transferWithoutHints.sequence > transferBasis.sequence
  ) {
    return transferBasis.hintLevelsExposedBeforeCheckpoint.length > 0
      ? {
          ...base,
          progressGroup: "Уже получается",
          conclusion:
            "В новой задаче ты без подсказок верно распознал подходящее рассуждение после предыдущей проверки с подсказкой. Самостоятельное построение доказательства пока не проверено.",
        }
      : {
          ...base,
          progressGroup: "Получается в разных задачах",
          conclusion:
            "Без подсказок ты верно распознал рассуждения о невозможности в разных задачах. Это ещё не показывает, что ты умеешь самостоятельно строить доказательства или делаешь это стабильно.",
        };
  }
  if (brothers?.latestCorrectWithHints)
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        "После подсказок ты верно распознал рассуждение о невозможности в новой задаче. Самостоятельный перенос и построение доказательства пока не проверены.",
    };
  if (transferWithoutHints)
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Без подсказок ты верно распознал рассуждение о невозможности в этой задаче. Самостоятельное построение доказательства пока не проверено.",
    };
  if (brothers?.latestIncorrect && latestTablePositive)
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Раньше ты верно распознал рассуждение о невозможности. Проверка в новой задаче пока не подтверждает перенос; самостоятельное построение доказательства ещё не проверено.",
    };
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
    (table.latestIncorrect?.sequence ?? 0) > latestPositiveSequence
      ? "Раньше ты верно выбирал подходящее рассуждение, но в более поздней такой проверке ответ был другим. Пока рано говорить о стабильности."
      : withoutHints
        ? "Без открытых подсказок ты верно выбрал рассуждение, которое показывает, почему сумма 20 невозможна. Пока это показывает распознавание готового доказательства, а не самостоятельное построение."
        : "После открытых подсказок ты верно выбрал рассуждение, которое показывает, почему сумма 20 невозможна. Самостоятельное построение такого доказательства пока не проверено.";
  return { ...base, progressGroup: "Начинаю разбираться", conclusion };
}

export function getImpossibilityTransferReason(
  evidence: ImpossibilityProgressEvidence,
): string | null {
  const table = evidence.version === 1 ? evidence : evidence.table;
  const latest = latestEligibleTablePositive(table);
  if (!latest) return null;
  return latest.hintLevelsExposedBeforeCheckpoint.length > 0
    ? "В прошлой задаче у тебя получилось проверить рассуждение с подсказкой. Здесь условия совсем другие — попробуй разобраться без готового хода."
    : "Раньше ты уже верно проверил рассуждение без подсказок. Здесь условия совсем другие — посмотрим, получится ли так же в новой ситуации.";
}

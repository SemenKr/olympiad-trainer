import type { PracticeSummary } from "./practice-state";
import {
  PARROTS_REASONING_CHECKPOINT_ID,
  SOCK_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
} from "./reasoning-checkpoint";

const hintLevels = ["focus", "strategy", "next-step"] as const;

type GuaranteeEvidenceBase = Readonly<{
  sequence: number;
  hintLevelsExposedBeforeCheckpoint: readonly (
    "focus" | "strategy" | "next-step"
  )[];
  solutionExposedBeforeCheckpoint: false;
}>;

export type GuaranteeEvidenceFact = GuaranteeEvidenceBase &
  Readonly<{
    problemId: "guaranteed-sock-pair" | "parrots-guaranteed-colors";
    observation: ReasoningCheckpointObservation;
  }>;

type Slots = Readonly<{
  latestCorrectWithoutHints: GuaranteeEvidenceFact | null;
  latestCorrectWithHints: GuaranteeEvidenceFact | null;
  latestIncorrect: GuaranteeEvidenceFact | null;
}>;

// A verified sock observation remains available after its three-slot section
// replaces that fact with newer work.
type SockTransferBasis = Readonly<{
  sequence: number;
  observation: ReasoningCheckpointObservation;
  hintLevelsExposedBeforeCheckpoint: GuaranteeEvidenceBase["hintLevelsExposedBeforeCheckpoint"];
}>;

export function guaranteeSockSlots(evidence: GuaranteeProgressEvidence): Slots {
  return evidence.version === 1 ? evidence : evidence.sock;
}

export type GuaranteeProgressEvidenceV0 = Readonly<{
  version: 1;
  nextSequence: number;
}> &
  Slots;

export type GuaranteeProgressEvidenceV1 = Readonly<{
  version: 2;
  nextSequence: number;
  sock: Slots;
  parrots: Slots;
  sockBasisForParrotsWithoutHints: SockTransferBasis | null;
}>;

export type GuaranteeProgressEvidence =
  GuaranteeProgressEvidenceV0 | GuaranteeProgressEvidenceV1;

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
  problemId: GuaranteeEvidenceFact["problemId"],
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
      (problemId === "guaranteed-sock-pair"
        ? SOCK_REASONING_CHECKPOINT_ID
        : PARROTS_REASONING_CHECKPOINT_ID) ||
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
  problemId: GuaranteeEvidenceFact["problemId"],
): value is Slots {
  if (!record(value) || !exactKeys(value, slotNames)) return false;
  return slotNames.every(
    (slot) => value[slot] === null || validFact(value[slot], slot, problemId),
  );
}

function sockBasisAsFact(basis: SockTransferBasis): GuaranteeEvidenceFact {
  return {
    sequence: basis.sequence,
    problemId: "guaranteed-sock-pair",
    observation: basis.observation,
    hintLevelsExposedBeforeCheckpoint: basis.hintLevelsExposedBeforeCheckpoint,
    solutionExposedBeforeCheckpoint: false,
  };
}

function validSockTransferBasis(value: unknown): value is SockTransferBasis {
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
  const fact = sockBasisAsFact(value as SockTransferBasis);
  return validFact(
    fact,
    value.hintLevelsExposedBeforeCheckpoint.length === 0
      ? "latestCorrectWithoutHints"
      : "latestCorrectWithHints",
    "guaranteed-sock-pair",
  );
}

function sameSockBasisFact(
  fact: GuaranteeEvidenceFact,
  basis: SockTransferBasis,
) {
  return (
    fact.problemId === "guaranteed-sock-pair" &&
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

export function guaranteeFacts(
  evidence: GuaranteeProgressEvidence,
): GuaranteeEvidenceFact[] {
  const sections =
    evidence.version === 1 ? [evidence] : [evidence.sock, evidence.parrots];
  const retained = sections.flatMap((section) =>
    slotNames
      .map((slot) => section[slot])
      .filter((fact): fact is GuaranteeEvidenceFact => fact !== null),
  );
  if (
    evidence.version !== 2 ||
    !evidence.sockBasisForParrotsWithoutHints ||
    slotNames.some(
      (slot) =>
        evidence.sock[slot]?.sequence ===
        evidence.sockBasisForParrotsWithoutHints?.sequence,
    )
  )
    return retained;
  return [
    ...retained,
    sockBasisAsFact(evidence.sockBasisForParrotsWithoutHints),
  ];
}

export function validateGuaranteeProgressEvidence(
  value: unknown,
): GuaranteeProgressEvidence | null {
  if (!record(value) || !positiveSequence(value.nextSequence)) return null;
  if (value.version === 1) {
    if (!exactKeys(value, ["version", "nextSequence", ...slotNames]))
      return null;
    if (
      !slotNames.every(
        (slot) =>
          value[slot] === null ||
          validFact(value[slot], slot, "guaranteed-sock-pair"),
      )
    )
      return null;
  } else if (value.version === 2) {
    if (
      !exactKeys(value, [
        "version",
        "nextSequence",
        "sock",
        "parrots",
        "sockBasisForParrotsWithoutHints",
      ]) ||
      !validSlots(value.sock, "guaranteed-sock-pair") ||
      !validSlots(value.parrots, "parrots-guaranteed-colors") ||
      (value.sockBasisForParrotsWithoutHints !== null &&
        !validSockTransferBasis(value.sockBasisForParrotsWithoutHints))
    )
      return null;
    const basis = value.sockBasisForParrotsWithoutHints;
    const parrots = value.parrots;
    const parrotsWithoutHints = parrots.latestCorrectWithoutHints;
    if (
      (basis !== null &&
        (!parrotsWithoutHints ||
          basis.sequence >= parrotsWithoutHints.sequence)) ||
      (basis !== null &&
        [
          value.sock.latestCorrectWithoutHints,
          value.sock.latestCorrectWithHints,
          value.sock.latestIncorrect,
        ].some(
          (fact) =>
            fact !== null &&
            fact.sequence === basis.sequence &&
            !sameSockBasisFact(fact, basis),
        )) ||
      (basis !== null &&
        slotNames.some((slot) => parrots[slot]?.sequence === basis.sequence))
    )
      return null;
  } else return null;
  const facts: GuaranteeEvidenceFact[] = [];
  const sections = value.version === 1 ? [value] : [value.sock, value.parrots];
  for (const section of sections)
    for (const slot of slotNames) {
      const fact = (section as Record<string, unknown>)[slot];
      if (fact === null) continue;
      facts.push(fact as GuaranteeEvidenceFact);
    }
  const sequences = facts.map((fact) => fact.sequence);
  if (
    new Set(sequences).size !== sequences.length ||
    sequences.some((sequence) => sequence >= (value.nextSequence as number))
  )
    return null;
  return value as GuaranteeProgressEvidence;
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
    (result?.problemId !== "guaranteed-sock-pair" &&
      result?.problemId !== "parrots-guaranteed-colors") ||
    result.taskOutcome !== undefined ||
    result.summary.outcome !== "eventually-correct" ||
    result.summary.solutionExposure !== null ||
    result.reasoningCheckpointObservation?.checkpointId !==
      (result.problemId === "guaranteed-sock-pair"
        ? SOCK_REASONING_CHECKPOINT_ID
        : PARROTS_REASONING_CHECKPOINT_ID)
  )
    return null;
  const observation =
    result.reasoningCheckpointObservation as GuaranteeEvidenceFact["observation"];
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

export function appendGuaranteeEvidence(
  current: GuaranteeProgressEvidence,
  contribution: GuaranteeEvidenceContribution,
): GuaranteeProgressEvidence | null {
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
  if (
    contribution.problemId === "guaranteed-sock-pair" &&
    current.version === 1
  )
    return { ...current, nextSequence: current.nextSequence + 1, [slot]: fact };
  const migrated: GuaranteeProgressEvidenceV1 =
    current.version === 2
      ? current
      : {
          version: 2,
          nextSequence: current.nextSequence,
          sock: {
            latestCorrectWithoutHints: current.latestCorrectWithoutHints,
            latestCorrectWithHints: current.latestCorrectWithHints,
            latestIncorrect: current.latestIncorrect,
          },
          parrots: {
            latestCorrectWithoutHints: null,
            latestCorrectWithHints: null,
            latestIncorrect: null,
          },
          sockBasisForParrotsWithoutHints: null,
        };
  const section =
    contribution.problemId === "guaranteed-sock-pair" ? "sock" : "parrots";
  const basis =
    section === "parrots" && slot === "latestCorrectWithoutHints"
      ? latestEligibleSockPositive(migrated.sock)
      : null;
  return {
    ...migrated,
    nextSequence: migrated.nextSequence + 1,
    [section]: { ...migrated[section], [slot]: fact },
    ...(section === "parrots" && slot === "latestCorrectWithoutHints"
      ? {
          sockBasisForParrotsWithoutHints: basis
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

function latestEligibleSockPositive(sock: Slots) {
  const latest = [sock.latestCorrectWithoutHints, sock.latestCorrectWithHints]
    .filter((fact): fact is GuaranteeEvidenceFact => fact !== null)
    .sort((a, b) => b.sequence - a.sequence)[0];
  return latest && (sock.latestIncorrect?.sequence ?? 0) <= latest.sequence
    ? latest
    : null;
}

export function deriveGuaranteeProgressInterpretation(
  evidence: GuaranteeProgressEvidence,
): ReasoningCheckpointInterpretation {
  const base = {
    capability:
      "Обосновывать гарантированный результат при неблагоприятном выборе",
    learnerLabel: "Как гарантировать результат",
  };
  const sock = evidence.version === 1 ? evidence : evidence.sock;
  const parrots = evidence.version === 1 ? null : evidence.parrots;
  const withoutHints = sock.latestCorrectWithoutHints;
  const withHints = sock.latestCorrectWithHints;
  const latestSockPositive = [withoutHints, withHints]
    .filter((fact): fact is GuaranteeEvidenceFact => fact !== null)
    .sort((a, b) => b.sequence - a.sequence)[0];
  const transferWithoutHints = parrots?.latestCorrectWithoutHints;
  const transferBasis =
    evidence.version === 2 ? evidence.sockBasisForParrotsWithoutHints : null;
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
            "В новой задаче ты без подсказок верно распознал обоснование гарантии после предыдущей проверки с подсказкой. Самостоятельное построение доказательства пока не проверено.",
        }
      : {
          ...base,
          progressGroup: "Получается в разных задачах",
          conclusion:
            "Без подсказок ты верно распознал обоснования гарантии в разных задачах. Это ещё не показывает, что ты умеешь самостоятельно строить доказательства или делаешь это стабильно.",
        };
  }
  if (parrots?.latestCorrectWithHints)
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        "После подсказок ты верно распознал обоснование гарантии в новой задаче. Самостоятельный перенос и построение доказательства пока не проверены.",
    };
  if (transferWithoutHints)
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Без подсказок ты верно распознал обоснование гарантии в этой задаче. Самостоятельное построение доказательства пока не проверено.",
    };
  if (parrots?.latestIncorrect && latestSockPositive)
    return {
      ...base,
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Раньше ты верно распознал обоснование гарантии. Проверка в новой задаче пока не подтверждает перенос; самостоятельное построение доказательства ещё не проверено.",
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
    (sock.latestIncorrect?.sequence ?? 0) > latestPositiveSequence
      ? "Раньше ты верно выбирал подходящее объяснение, но в более поздней такой проверке ответ был другим. Пока рано говорить о стабильности."
      : withoutHints
        ? "Без открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Это пока показывает распознавание готового аргумента, а не самостоятельное доказательство."
        : "После открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Самостоятельное построение такого доказательства пока не проверено.";
  return { ...base, progressGroup: "Начинаю разбираться", conclusion };
}

export function getGuaranteeTransferReason(
  evidence: GuaranteeProgressEvidence,
): string | null {
  const sock = evidence.version === 1 ? evidence : evidence.sock;
  const latest = latestEligibleSockPositive(sock);
  if (!latest) return null;
  return latest.hintLevelsExposedBeforeCheckpoint.length > 0
    ? "В прошлой задаче у тебя получилось проверить рассуждение с подсказкой. Здесь выбор устроен иначе — попробуй разобраться без готового хода."
    : "Раньше ты уже верно проверил рассуждение без подсказок. Здесь выбор устроен иначе — посмотрим, получится ли так же в новой ситуации.";
}

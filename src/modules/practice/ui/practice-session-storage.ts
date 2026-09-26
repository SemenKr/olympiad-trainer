import type {
  ActivePractice,
  PracticeHintExposure,
  PracticeSummary,
} from "../application/practice-state";
import {
  finishPractice,
  getPracticeSummary,
  startPractice,
} from "../application/practice-state";
import {
  appendPracticeProgressEvidence,
  emptyPracticeProgressEvidence,
  getPracticeProgressContribution,
  validatePracticeProgressEvidence,
  type PracticeProgressContribution,
  type PracticeProgressEvidence,
} from "../application/practice-progress-evidence";
import {
  SOCK_REASONING_CHECKPOINT_ID,
  TABLE_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
  type ReasoningCheckpointVerification,
} from "../application/reasoning-checkpoint";
import {
  isMultipleChoiceSetAnswerState,
  type PracticeAnswerState,
} from "./practice-answer-state";
import { normalizeMultipleChoiceSetAnswer } from "../domain/multiple-choice-set-answer";
import { PROGRESS_EVIDENCE_STORAGE_KEY } from "./progress-evidence-storage";
import type {
  NoNextPracticeSessionState,
  PracticeSessionResult,
  PracticeSessionState,
} from "./fixed-practice-session-state";

export const PRACTICE_SESSION_STORAGE_KEY = "olympiad-trainer:practice-session";
export const PRACTICE_LATEST_COMPLETED_STORAGE_KEY =
  "olympiad-trainer:practice-latest-completed";
const PRACTICE_PROGRESS_FINISH_PENDING_KEY =
  "olympiad-trainer:practice-progress-finish-pending";
const PRACTICE_SERVER_FINISH_REQUEST_KEY =
  "olympiad-trainer:practice-server-finish-request";
const PRACTICE_SESSION_MUTATION_LOCK =
  "olympiad-trainer:practice-session-mutation";

function withPracticeSessionLock<T>(operation: () => T): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks?.request)
    return Promise.reject(new Error("Practice session lock is unavailable."));
  return navigator.locks.request(
    PRACTICE_SESSION_MUTATION_LOCK,
    { mode: "exclusive" },
    operation,
  );
}

const problems = [
  {
    id: "coinciding-seats",
    title: "Совпадающие места",
    hints: [
      "coinciding-seats-focus-simultaneous-rules",
      "coinciding-seats-strategy-repeat-interval",
      "coinciding-seats-next-step-list-common-seats",
    ],
    solution: "coinciding-seats-full-solution",
  },
  {
    id: "guaranteed-sock-pair",
    title: "Носки в пакете",
    hints: [
      "guaranteed-sock-pair-focus-guarantee",
      "guaranteed-sock-pair-strategy-worst-case",
      "guaranteed-sock-pair-next-step-bound-without-pair",
    ],
    solution: "guaranteed-sock-pair-full-solution",
  },
  {
    id: "table-impossible-sums",
    title: "Невозможные суммы",
    hints: [
      "table-impossible-sums-focus-constraints",
      "table-impossible-sums-strategy-minimum",
      "table-impossible-sums-next-step-fives",
    ],
    solution: "table-impossible-sums-full-solution",
    optionIds: ["sum-20", "sum-21", "sum-23", "sum-25", "sum-26"],
  },
] as const;

type PracticeSessionSnapshotBase = Readonly<{
  sessionId: string;
  problemIds: readonly [string, string, string];
  activeProblemIndex: 0 | 1 | 2;
  completedResults: readonly PracticeSessionResult[];
  activePractice: ActivePractice;
  reasoningCheckpointObservation?: ReasoningCheckpointObservation;
}>;

export type PracticeSessionSnapshot = PracticeSessionSnapshotBase &
  Readonly<{ rawAnswer?: string; selectedOptionIds?: readonly string[] }>;

export type NoNextPracticeSessionSnapshot = NoNextPracticeSessionState;
export type UnfinishedPracticeSessionSnapshot =
  PracticeSessionSnapshot | NoNextPracticeSessionSnapshot;

type VerifyCheckpoint = (
  problemId: string,
  observation: ReasoningCheckpointObservation,
  summary: PracticeSummary,
) => Promise<ReasoningCheckpointVerification>;

type VerifiedCheckpointData<T> = Readonly<{
  value: T;
  interpretation: ReasoningCheckpointInterpretation | null;
  tableInterpretation?: ReasoningCheckpointInterpretation | null;
}>;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return (
    Object.keys(value).every((key) => keys.includes(key)) &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function validCount(value: unknown, maximum: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= maximum
  );
}

function validSessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value,
    )
  );
}

function validExposures(
  value: unknown,
  problem: (typeof problems)[number],
  submissionCount: number,
): value is PracticeHintExposure[] {
  if (!Array.isArray(value) || value.length > 3) return false;

  return value.every(
    (exposure, index) =>
      record(exposure) &&
      exactKeys(exposure, ["hintId", "level", "validSubmissionCountAtOpen"]) &&
      exposure.hintId === problem.hints[index] &&
      exposure.level === ["focus", "strategy", "next-step"][index] &&
      validCount(exposure.validSubmissionCountAtOpen, submissionCount) &&
      (index === 0 ||
        exposure.validSubmissionCountAtOpen >=
          value[index - 1].validSubmissionCountAtOpen),
  );
}

function validSolution(
  value: unknown,
  problem: (typeof problems)[number],
  submissionCount: number,
  hintExposures: readonly PracticeHintExposure[],
): boolean {
  return (
    value === null ||
    (record(value) &&
      exactKeys(value, ["solutionId", "validSubmissionCountAtOpen"]) &&
      value.solutionId === problem.solution &&
      hintExposures.length === 3 &&
      submissionCount > 0 &&
      validCount(value.validSubmissionCountAtOpen, submissionCount) &&
      value.validSubmissionCountAtOpen > 0 &&
      value.validSubmissionCountAtOpen >=
        hintExposures[2].validSubmissionCountAtOpen)
  );
}

function validSummary(
  value: unknown,
  problem: (typeof problems)[number],
): value is PracticeSummary {
  if (
    !record(value) ||
    !exactKeys(value, [
      "outcome",
      "validSubmissionCount",
      "hintExposures",
      "solutionExposure",
    ]) ||
    !validCount(value.validSubmissionCount, Number.MAX_SAFE_INTEGER) ||
    !validExposures(value.hintExposures, problem, value.validSubmissionCount) ||
    !validSolution(
      value.solutionExposure,
      problem,
      value.validSubmissionCount,
      value.hintExposures,
    )
  ) {
    return false;
  }

  if (value.validSubmissionCount === 0) {
    return value.outcome === "no-valid-submissions";
  }
  if (value.outcome === "incorrect-only") return true;
  if (value.outcome !== "eventually-correct") return false;

  // A correct submission must have happened after every recorded reveal.
  const summary = value as PracticeSummary;
  return (
    summary.hintExposures.every(
      (exposure) =>
        exposure.validSubmissionCountAtOpen < summary.validSubmissionCount,
    ) &&
    (summary.solutionExposure === null ||
      summary.solutionExposure.validSubmissionCountAtOpen <
        summary.validSubmissionCount)
  );
}

function validReasoningCheckpointObservation(
  value: unknown,
  problem: (typeof problems)[number],
  submissionCount: number,
  firstCorrectSubmissionCount: number,
): value is ReasoningCheckpointObservation {
  return Boolean(
    (problem.id === "guaranteed-sock-pair"
      ? record(value) && value.checkpointId === SOCK_REASONING_CHECKPOINT_ID
      : problem.id === "table-impossible-sums" &&
        record(value) &&
        value.checkpointId === TABLE_REASONING_CHECKPOINT_ID) &&
    record(value) &&
    exactKeys(value, [
      "checkpointId",
      "selectedOptionId",
      "outcome",
      "validSubmissionCountAtSubmit",
    ]) &&
    (value.selectedOptionId === "A" ||
      value.selectedOptionId === "B" ||
      value.selectedOptionId === "C") &&
    (value.outcome === "correct" || value.outcome === "incorrect") &&
    validCount(value.validSubmissionCountAtSubmit, submissionCount) &&
    firstCorrectSubmissionCount > 0 &&
    value.validSubmissionCountAtSubmit >= firstCorrectSubmissionCount,
  );
}

function validResult(
  value: unknown,
  problem: (typeof problems)[number],
  isFinal: boolean,
  allowFinalSkip = false,
): value is PracticeSessionResult {
  if (!record(value)) return false;
  const hasCheckpoint = Object.hasOwn(value, "reasoningCheckpointObservation");
  const keys = ["problemId", "problemTitle", "summary"];
  if (Object.hasOwn(value, "taskOutcome")) keys.push("taskOutcome");
  if (hasCheckpoint) {
    keys.push("reasoningCheckpointObservation", "firstCorrectSubmissionCount");
  }
  if (
    !exactKeys(value, keys) ||
    value.problemId !== problem.id ||
    value.problemTitle !== problem.title ||
    !validSummary(value.summary, problem)
  ) {
    return false;
  }

  const firstCorrectSubmissionCount = value.firstCorrectSubmissionCount;

  if (
    hasCheckpoint &&
    (value.taskOutcome !== undefined ||
      value.summary.outcome !== "eventually-correct" ||
      value.summary.solutionExposure !== null ||
      !validCount(
        firstCorrectSubmissionCount,
        value.summary.validSubmissionCount,
      ) ||
      value.summary.hintExposures.some(
        (exposure: PracticeHintExposure) =>
          exposure.validSubmissionCountAtOpen >= firstCorrectSubmissionCount,
      ) ||
      !validReasoningCheckpointObservation(
        value.reasoningCheckpointObservation,
        problem,
        value.summary.validSubmissionCount,
        firstCorrectSubmissionCount,
      ))
  ) {
    return false;
  }

  if (value.taskOutcome === "skipped") {
    return (
      (!isFinal || allowFinalSkip) &&
      value.summary.outcome !== "eventually-correct" &&
      value.summary.solutionExposure === null
    );
  }

  return (
    value.taskOutcome === undefined &&
    (isFinal ||
      value.summary.outcome === "eventually-correct" ||
      value.summary.solutionExposure !== null)
  );
}

export function validateLatestCompletedResults(
  value: unknown,
): readonly PracticeSessionResult[] | null {
  if (
    !Array.isArray(value) ||
    (value.length !== 1 &&
      value.length !== 2 &&
      value.length !== problems.length) ||
    !value.every((result, index) =>
      validResult(
        result,
        problems[index],
        index === value.length - 1,
        value.length > 1 && index === value.length - 1,
      ),
    )
  ) {
    return null;
  }

  return value as readonly PracticeSessionResult[];
}

function validActivePractice(
  value: unknown,
  problem: (typeof problems)[number],
): value is ActivePractice {
  if (
    !record(value) ||
    !exactKeys(value, [
      "status",
      "submissions",
      "hintExposures",
      "solutionExposure",
    ]) ||
    value.status !== "active" ||
    !Array.isArray(value.submissions) ||
    !value.submissions.every(
      (submission) =>
        record(submission) &&
        exactKeys(submission, ["answer", "outcome"]) &&
        typeof submission.answer === "string" &&
        validStoredSubmissionAnswer(submission.answer, problem) &&
        (submission.outcome === "correct" ||
          submission.outcome === "incorrect"),
    ) ||
    !validExposures(value.hintExposures, problem, value.submissions.length) ||
    !validSolution(
      value.solutionExposure,
      problem,
      value.submissions.length,
      value.hintExposures,
    )
  ) {
    return false;
  }

  const firstCorrect = value.submissions.findIndex(
    (submission) => submission.outcome === "correct",
  );
  if (
    firstCorrect >= 0 &&
    value.hintExposures.some(
      (exposure) => exposure.validSubmissionCountAtOpen >= firstCorrect + 1,
    )
  )
    return false;
  const solutionExposure =
    value.solutionExposure as ActivePractice["solutionExposure"];
  if (
    solutionExposure &&
    (solutionExposure.validSubmissionCountAtOpen === 0 ||
      (firstCorrect >= 0 &&
        solutionExposure.validSubmissionCountAtOpen > firstCorrect))
  )
    return false;
  return true;
}

function validStoredSubmissionAnswer(
  answer: string,
  problem: (typeof problems)[number],
): boolean {
  if (problem.id !== "table-impossible-sums")
    return /^(?:0|[1-9][0-9]*)$/.test(answer);
  try {
    return (
      normalizeMultipleChoiceSetAnswer(
        JSON.parse(answer),
        problem.optionIds,
      ) === answer
    );
  } catch {
    return false;
  }
}

function validSelectedOptionIds(value: unknown): value is string[] {
  if (!Array.isArray(value)) return false;
  const known = problems[2].optionIds;
  return (
    value.length <= known.length &&
    value.every(
      (id) =>
        typeof id === "string" && known.includes(id as (typeof known)[number]),
    ) &&
    new Set(value).size === value.length &&
    JSON.stringify(value) ===
      JSON.stringify(known.filter((id) => value.includes(id)))
  );
}

function validateSessionShape(
  value: unknown,
  length: 2 | 3,
): Record<string, unknown> | null {
  if (record(value) && value.status === "no-next") {
    return exactKeys(value, ["sessionId", "status", "completedResults"]) &&
      validSessionId(value.sessionId) &&
      Array.isArray(value.completedResults) &&
      value.completedResults.length === length &&
      value.completedResults.every((result, index) =>
        validResult(
          result,
          problems[index],
          index === length - 1,
          index === length - 1,
        ),
      ) &&
      record(value.completedResults[length - 1]) &&
      value.completedResults[length - 1].taskOutcome === "skipped"
      ? value
      : null;
  }

  if (
    !record(value) ||
    !validSessionId(value.sessionId) ||
    !Array.isArray(value.problemIds) ||
    value.problemIds.length !== length ||
    !value.problemIds.every((id, index) => id === problems[index].id) ||
    !validCount(value.activeProblemIndex, length - 1) ||
    !Array.isArray(value.completedResults) ||
    value.completedResults.length !== value.activeProblemIndex ||
    !value.completedResults.every((result, index) =>
      validResult(result, problems[index], false),
    ) ||
    !validActivePractice(
      value.activePractice,
      problems[value.activeProblemIndex],
    )
  )
    return null;

  const problem = problems[value.activeProblemIndex];
  const answerKey =
    problem.id === "table-impossible-sums" ? "selectedOptionIds" : "rawAnswer";
  const keys = [
    "sessionId",
    "problemIds",
    "activeProblemIndex",
    "completedResults",
    "activePractice",
    answerKey,
  ];
  if (Object.hasOwn(value, "reasoningCheckpointObservation"))
    keys.push("reasoningCheckpointObservation");
  if (
    !exactKeys(value, keys) ||
    (Object.hasOwn(value, "reasoningCheckpointObservation") &&
      (value.activePractice.solutionExposure !== null ||
        !validReasoningCheckpointObservation(
          value.reasoningCheckpointObservation,
          problem,
          value.activePractice.submissions.length,
          value.activePractice.submissions.findIndex(
            (submission: { outcome: string }) =>
              submission.outcome === "correct",
          ) + 1,
        ))) ||
    (answerKey === "rawAnswer"
      ? typeof value.rawAnswer !== "string"
      : !validSelectedOptionIds(value.selectedOptionIds))
  ) {
    return null;
  }

  return value;
}

export function validatePracticeSessionSnapshot(
  value: unknown,
): UnfinishedPracticeSessionSnapshot | null {
  return validateSessionShape(
    value,
    3,
  ) as UnfinishedPracticeSessionSnapshot | null;
}

function readPracticeSessionSnapshotWithRaw(store: Storage): Promise<{
  snapshot: UnfinishedPracticeSessionSnapshot;
  raw: string;
} | null> {
  return withPracticeSessionLock(() => {
    let raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
    const pendingRaw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
    if (pendingRaw !== null) {
      const pending = readPendingPracticeProgressFinish(pendingRaw);
      if (!pending) throw new Error("Practice Finish recovery is unresolved.");
      if (!pending.serverBacked) {
        if (raw !== null && raw !== pending.unfinishedBefore)
          throw new Error("Practice Finish recovery is unresolved.");
        if (raw === null) {
          const current = readPracticeFinishValues(store);
          if (
            !current ||
            (current.completed !== pending.completedBefore &&
              current.completed !== pending.completedAfter) ||
            (current.progress !== pending.progressBefore &&
              current.progress !== pending.progressAfter) ||
            !writeAndConfirm(
              store,
              PRACTICE_SESSION_STORAGE_KEY,
              pending.unfinishedBefore,
            )
          )
            throw new Error("Practice Finish recovery is unresolved.");
          raw = pending.unfinishedBefore;
        }
      } else if (raw === null) {
        if (
          reconcilePendingPracticeProgressFinish(
            store,
            pending.sessionId,
            pending.unfinishedBefore,
            pending.completedAfter,
          ) === "unresolved"
        )
          throw new Error("Practice Finish recovery is unresolved.");
        raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
      }
    }
    if (raw === null) {
      const requestRaw = store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY);
      if (requestRaw !== null) {
        const request = readServerPracticeFinishRequest(requestRaw);
        if (
          !request ||
          store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY) !==
            request.completedAfter ||
          !writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null)
        )
          throw new Error("Practice Finish recovery is unresolved.");
      }
    }
    if (raw === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      store.removeItem(PRACTICE_SESSION_STORAGE_KEY);
      return null;
    }
    const snapshot = validatePracticeSessionSnapshot(parsed);
    if (snapshot) return { snapshot, raw };

    const withSessionId =
      record(parsed) && !Object.hasOwn(parsed, "sessionId")
        ? { sessionId: crypto.randomUUID(), ...parsed }
        : parsed;
    const legacy = validateSessionShape(withSessionId, 2);
    const migrated = legacy
      ? legacy.status === "no-next"
        ? {
            sessionId: legacy.sessionId,
            problemIds: problems.map((problem) => problem.id),
            activeProblemIndex: 2,
            completedResults: legacy.completedResults,
            activePractice: startPractice(),
            selectedOptionIds: [],
          }
        : {
            ...legacy,
            problemIds: problems.map((problem) => problem.id),
          }
      : withSessionId;
    const validated = validatePracticeSessionSnapshot(migrated);
    if (validated) {
      const migratedRaw = JSON.stringify(migrated);
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, migratedRaw);
      if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== migratedRaw)
        throw new Error("Practice session migration was not persisted.");
      return { snapshot: validated, raw: migratedRaw };
    }

    store.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    return null;
  });
}

export async function readPracticeSessionSnapshot(
  storage?: Storage,
): Promise<UnfinishedPracticeSessionSnapshot | null> {
  try {
    return (
      (await readPracticeSessionSnapshotWithRaw(storage ?? window.localStorage))
        ?.snapshot ?? null
    );
  } catch {
    return null;
  }
}

async function verifyResultObservations(
  results: readonly PracticeSessionResult[],
  verifyCheckpoint: VerifyCheckpoint,
): Promise<readonly ReasoningCheckpointVerification[]> {
  const verifications: ReasoningCheckpointVerification[] = [];
  for (const result of results) {
    if (result.reasoningCheckpointObservation) {
      verifications.push(
        await verifyCheckpoint(
          result.problemId,
          result.reasoningCheckpointObservation,
          result.summary,
        ),
      );
    }
  }
  return verifications;
}

export async function readVerifiedPracticeSessionSnapshot(
  verifyCheckpoint: VerifyCheckpoint,
  storage?: Storage,
): Promise<VerifiedCheckpointData<UnfinishedPracticeSessionSnapshot | null>> {
  const store = storage ?? window.localStorage;
  const saved = await readPracticeSessionSnapshotWithRaw(store);
  if (!saved) return { value: null, interpretation: null };
  const { snapshot, raw } = saved;

  const resultVerification = await verifyResultObservations(
    snapshot.completedResults,
    verifyCheckpoint,
  );
  const activeVerification =
    "status" in snapshot || !snapshot.reasoningCheckpointObservation
      ? null
      : await verifyCheckpoint(
          problems[snapshot.activeProblemIndex].id,
          snapshot.reasoningCheckpointObservation,
          getPracticeSummary(finishPractice(snapshot.activePractice)),
        );
  if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== raw)
    throw new Error("Practice snapshot changed during verification.");
  if (
    resultVerification.some((verification) => !verification.valid) ||
    activeVerification?.valid === false
  ) {
    await withPracticeSessionLock(() => {
      if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== raw)
        throw new Error("Practice snapshot changed during verification.");
      store.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    });
    return { value: null, interpretation: null };
  }
  return {
    value: snapshot,
    interpretation: activeVerification?.valid
      ? activeVerification.interpretation
      : null,
  };
}

function activeSessionSnapshot(
  session: PracticeSessionState,
  answer: PracticeAnswerState,
  reasoningCheckpointObservation?: ReasoningCheckpointObservation,
): PracticeSessionSnapshot {
  return {
    sessionId: session.sessionId,
    problemIds: [problems[0].id, problems[1].id, problems[2].id],
    activeProblemIndex: session.activeProblemIndex,
    completedResults: session.completedResults,
    activePractice: answer.practice,
    ...(isMultipleChoiceSetAnswerState(answer)
      ? { selectedOptionIds: answer.selectedOptionIds }
      : { rawAnswer: answer.rawAnswer }),
    ...(reasoningCheckpointObservation
      ? { reasoningCheckpointObservation }
      : {}),
  };
}

function ownsPersistedPracticeSession(
  store: Storage,
  sessionId: string,
): boolean {
  const raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
  if (raw === null) return false;
  const persisted = validatePracticeSessionSnapshot(JSON.parse(raw));
  return persisted?.sessionId === sessionId;
}

export async function createPracticeSessionSnapshot(
  session: PracticeSessionState,
  answer: PracticeAnswerState,
  storage?: Storage,
): Promise<boolean> {
  if (session.activeProblemIndex !== 0 || session.completedResults.length !== 0)
    return false;
  const snapshot = activeSessionSnapshot(session, answer);
  if (!validatePracticeSessionSnapshot(snapshot)) return false;
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      if (
        store.getItem(PRACTICE_SESSION_STORAGE_KEY) !== null ||
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null
      )
        return false;
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
      return true;
    });
  } catch {
    return false;
  }
}

export async function savePracticeSessionSnapshot(
  session: PracticeSessionState,
  answer: PracticeAnswerState,
  storage?: Storage,
  reasoningCheckpointObservation?: ReasoningCheckpointObservation,
): Promise<boolean> {
  const snapshot = activeSessionSnapshot(
    session,
    answer,
    reasoningCheckpointObservation,
  );
  if (!validSessionId(session.sessionId)) return false;
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      if (
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null
      )
        return false;
      if (!ownsPersistedPracticeSession(store, session.sessionId)) return false;
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(snapshot));
      return true;
    });
  } catch {
    return false;
  }
}

export async function saveNoNextPracticeSessionSnapshot(
  session: NoNextPracticeSessionState,
  storage?: Storage,
): Promise<boolean> {
  const validated = validatePracticeSessionSnapshot(session);
  if (!validated || !("status" in validated)) return false;
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      if (
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null
      )
        return false;
      if (!ownsPersistedPracticeSession(store, session.sessionId)) return false;
      store.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(session));
      return true;
    });
  } catch {
    return false;
  }
}

function clearPracticeSessionSnapshotInsideLock(storage: Storage): boolean {
  try {
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function clearPracticeSessionSnapshot(
  storage?: Storage,
): Promise<boolean> {
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(
      () =>
        store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) === null &&
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) === null &&
        clearPracticeSessionSnapshotInsideLock(store),
    );
  } catch {
    return false;
  }
}

export function readLatestCompletedResults(
  storage?: Storage,
): readonly PracticeSessionResult[] | null {
  try {
    const store = storage ?? window.localStorage;
    const raw = store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY);
    if (raw === null) return null;
    return validateLatestCompletedResults(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function readVerifiedLatestCompletedResults(
  verifyCheckpoint: VerifyCheckpoint,
  storage?: Storage,
): Promise<VerifiedCheckpointData<readonly PracticeSessionResult[] | null>> {
  const store = storage ?? window.localStorage;
  const raw = store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY);
  const results = readLatestCompletedResults(store);
  if (!results) return { value: null, interpretation: null };

  const verification = await verifyResultObservations(
    results,
    verifyCheckpoint,
  );
  if (store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY) !== raw)
    throw new Error("Completed Practice results changed during verification.");
  if (verification.some((item) => !item.valid)) {
    return { value: null, interpretation: null };
  }
  const interpretations = verification.flatMap((item) =>
    item.valid ? [item.interpretation] : [],
  );
  return {
    value: results,
    interpretation:
      interpretations.find(
        (item) => item.learnerLabel === "Как гарантировать результат",
      ) ?? null,
    tableInterpretation:
      interpretations.find(
        (item) =>
          item.capability ===
          "Доказывать глобальную невозможность через ограничения",
      ) ?? null,
  };
}

export function saveLatestCompletedResults(
  results: readonly PracticeSessionResult[],
  storage?: Storage,
): boolean {
  if (!validateLatestCompletedResults(results)) return false;
  try {
    (storage ?? window.localStorage).setItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      JSON.stringify(results),
    );
    return true;
  } catch {
    return false;
  }
}

type PracticeFinishValues = Readonly<{
  unfinished: string | null;
  completed: string | null;
  progress: string | null;
}>;

type PendingPracticeProgressFinish = Readonly<{
  sessionId: string;
  unfinishedBefore: string;
  completedBefore: string | null;
  progressBefore: string | null;
  completedAfter: string;
  progressAfter: string | null;
  serverBacked?: true;
}>;

export type ServerPracticeFinishPayload = Readonly<{
  sessionId: string;
  contributions: readonly PracticeProgressContribution[];
}>;

type ServerPracticeFinishRequest = ServerPracticeFinishPayload &
  Readonly<{
    unfinishedBefore: string;
    completedBefore: string | null;
    progressBefore: string | null;
    completedAfter: string;
  }>;

function readServerPracticeFinishRequest(
  raw: string,
): ServerPracticeFinishRequest | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !record(value) ||
      !exactKeys(value, [
        "sessionId",
        "contributions",
        "unfinishedBefore",
        "completedBefore",
        "progressBefore",
        "completedAfter",
      ]) ||
      !validSessionId(value.sessionId) ||
      typeof value.unfinishedBefore !== "string" ||
      !(
        value.completedBefore === null ||
        typeof value.completedBefore === "string"
      ) ||
      !(
        value.progressBefore === null ||
        typeof value.progressBefore === "string"
      ) ||
      typeof value.completedAfter !== "string" ||
      !Array.isArray(value.contributions)
    )
      return null;
    const unfinished = validatePracticeSessionSnapshot(
      JSON.parse(value.unfinishedBefore),
    );
    const results = validateLatestCompletedResults(
      JSON.parse(value.completedAfter),
    );
    if (!unfinished || unfinished.sessionId !== value.sessionId || !results)
      return null;
    const expected =
      "status" in unfinished
        ? expectedUnfinishedForFinish(unfinished, null, results)
        : expectedUnfinishedForFinish(
            {
              sessionId: unfinished.sessionId,
              activeProblemIndex: unfinished.activeProblemIndex,
              completedResults: unfinished.completedResults,
            },
            restoreAnswerState(unfinished),
            results,
          );
    const contributions = results
      .map(getPracticeProgressContribution)
      .filter((entry) => entry !== null);
    if (
      expected !== value.unfinishedBefore ||
      contributions.length < 1 ||
      contributions.length > 2 ||
      JSON.stringify(value.contributions) !== JSON.stringify(contributions)
    )
      return null;
    return value as ServerPracticeFinishRequest;
  } catch {
    return null;
  }
}

export async function hasPendingServerPracticeFinish(
  sessionId: string,
  storage?: Storage,
): Promise<boolean> {
  const store = storage ?? window.localStorage;
  return withPracticeSessionLock(() => {
    const raw = store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY);
    if (raw === null) return false;
    const request = readServerPracticeFinishRequest(raw);
    if (!request) throw new Error("Practice Finish request is invalid.");
    return request.sessionId === sessionId;
  });
}

function expectedUnfinishedForFinish(
  session: PracticeSessionState | NoNextPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
): string | null {
  if ("status" in session) {
    return JSON.stringify(results) === JSON.stringify(session.completedResults)
      ? JSON.stringify(session)
      : null;
  }
  const currentResult = results.at(-1);
  if (
    !answer ||
    !currentResult ||
    results.length !== session.completedResults.length + 1 ||
    JSON.stringify(results.slice(0, -1)) !==
      JSON.stringify(session.completedResults) ||
    JSON.stringify(currentResult.summary) !==
      JSON.stringify(getPracticeSummary(finishPractice(answer.practice)))
  )
    return null;
  return JSON.stringify(
    activeSessionSnapshot(
      session,
      answer,
      currentResult.reasoningCheckpointObservation,
    ),
  );
}

export async function isCurrentPracticeFinish(
  session: PracticeSessionState | NoNextPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
): Promise<boolean> {
  const expected = expectedUnfinishedForFinish(session, answer, results);
  try {
    const store = storage ?? window.localStorage;
    return await withPracticeSessionLock(() => {
      const currentUnfinished = store.getItem(PRACTICE_SESSION_STORAGE_KEY);
      const requestRaw = store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY);
      if (requestRaw !== null) {
        const request = readServerPracticeFinishRequest(requestRaw);
        if (!request || request.sessionId !== session.sessionId) return false;
        if (currentUnfinished === null)
          return (
            store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY) ===
            request.completedAfter
          );
        const current = validatePracticeSessionSnapshot(
          JSON.parse(currentUnfinished),
        );
        return current?.sessionId === session.sessionId;
      }
      if (!expected || !validateLatestCompletedResults(results)) return false;
      const pendingRaw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
      if (pendingRaw === null) return currentUnfinished === expected;
      const pending = readPendingPracticeProgressFinish(pendingRaw);
      return (
        pending !== null &&
        pending.sessionId === session.sessionId &&
        pending.unfinishedBefore === expected &&
        pending.completedAfter === JSON.stringify(results) &&
        (currentUnfinished === expected || currentUnfinished === null)
      );
    });
  } catch {
    return false;
  }
}

function readPracticeFinishValues(store: Storage): PracticeFinishValues | null {
  try {
    return {
      unfinished: store.getItem(PRACTICE_SESSION_STORAGE_KEY),
      completed: store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
      progress: store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY),
    };
  } catch {
    return null;
  }
}

function writeAndConfirm(
  store: Storage,
  key: string,
  intended: string | null,
): boolean {
  try {
    if (intended === null) store.removeItem(key);
    else store.setItem(key, intended);
  } catch {
    // A storage implementation can mutate and then report failure.
  }
  try {
    return store.getItem(key) === intended;
  } catch {
    return false;
  }
}

function progressBeforeOrEmpty(raw: string | null) {
  if (raw === null) return emptyPracticeProgressEvidence();
  try {
    return (
      validatePracticeProgressEvidence(JSON.parse(raw)) ??
      emptyPracticeProgressEvidence()
    );
  } catch {
    return emptyPracticeProgressEvidence();
  }
}

function progressAfterResults(
  before: PracticeProgressEvidence,
  results: readonly PracticeSessionResult[],
): PracticeProgressEvidence | null {
  let current: PracticeProgressEvidence = before;
  for (const result of results) {
    const contribution = getPracticeProgressContribution(result);
    if (!contribution) continue;
    const next = appendPracticeProgressEvidence(current, contribution);
    if (!next) return null;
    current = next;
  }
  return current;
}

function hasProgressContribution(results: readonly PracticeSessionResult[]) {
  return results.some(
    (result) => getPracticeProgressContribution(result) !== null,
  );
}

function restorePracticeFinishValues(
  store: Storage,
  before: PracticeFinishValues,
  after: PracticeFinishValues,
): boolean {
  const current = readPracticeFinishValues(store);
  if (
    !current ||
    (current.unfinished !== before.unfinished &&
      current.unfinished !== after.unfinished) ||
    (current.completed !== before.completed &&
      current.completed !== after.completed) ||
    (current.progress !== before.progress &&
      current.progress !== after.progress)
  )
    return false;

  for (const [key, actual, previous] of [
    [PROGRESS_EVIDENCE_STORAGE_KEY, current.progress, before.progress],
    [
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      current.completed,
      before.completed,
    ],
    [PRACTICE_SESSION_STORAGE_KEY, current.unfinished, before.unfinished],
  ] as const) {
    if (actual !== previous && !writeAndConfirm(store, key, previous))
      return false;
  }
  const restored = readPracticeFinishValues(store);
  return (
    restored !== null &&
    restored.unfinished === before.unfinished &&
    restored.completed === before.completed &&
    restored.progress === before.progress
  );
}

function readPendingPracticeProgressFinish(
  raw: string,
): PendingPracticeProgressFinish | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !record(value) ||
      !exactKeys(value, [
        "sessionId",
        "unfinishedBefore",
        "completedBefore",
        "progressBefore",
        "completedAfter",
        "progressAfter",
        ...(value.serverBacked === true ? ["serverBacked"] : []),
      ]) ||
      !validSessionId(value.sessionId) ||
      typeof value.unfinishedBefore !== "string" ||
      !(
        value.completedBefore === null ||
        typeof value.completedBefore === "string"
      ) ||
      !(
        value.progressBefore === null ||
        typeof value.progressBefore === "string"
      ) ||
      typeof value.completedAfter !== "string" ||
      !(value.progressAfter === null || typeof value.progressAfter === "string")
    )
      return null;
    const unfinished = validatePracticeSessionSnapshot(
      JSON.parse(value.unfinishedBefore),
    );
    const completed = validateLatestCompletedResults(
      JSON.parse(value.completedAfter),
    );
    const serverBacked = value.serverBacked === true;
    const progressAfter = serverBacked
      ? null
      : typeof value.progressAfter === "string"
        ? validatePracticeProgressEvidence(JSON.parse(value.progressAfter))
        : null;
    const progressBefore = progressBeforeOrEmpty(value.progressBefore);
    const hasContribution = completed
      ? hasProgressContribution(completed)
      : false;
    if (
      !unfinished ||
      unfinished.sessionId !== value.sessionId ||
      !completed ||
      (!serverBacked && (!progressAfter || !hasContribution)) ||
      (serverBacked && value.progressAfter !== value.progressBefore) ||
      ("status" in unfinished
        ? expectedUnfinishedForFinish(unfinished, null, completed)
        : expectedUnfinishedForFinish(
            {
              sessionId: unfinished.sessionId,
              activeProblemIndex: unfinished.activeProblemIndex,
              completedResults: unfinished.completedResults,
            },
            restoreAnswerState(unfinished),
            completed,
          )) !== value.unfinishedBefore ||
      (!serverBacked &&
        JSON.stringify(progressAfterResults(progressBefore, completed)) !==
          value.progressAfter)
    )
      return null;
    return value as PendingPracticeProgressFinish;
  } catch {
    return null;
  }
}

function reconcilePendingPracticeProgressFinish(
  store: Storage,
  expectedSessionId: string,
  expectedUnfinished: string,
  completedAfter: string,
): "ready" | "completed" | "unresolved" {
  let raw: string | null;
  try {
    raw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
  } catch {
    return "unresolved";
  }
  if (raw === null) return "ready";
  const pending = readPendingPracticeProgressFinish(raw);
  if (!pending) return "unresolved";

  const before = {
    unfinished: pending.unfinishedBefore,
    completed: pending.completedBefore,
    progress: pending.progressBefore,
  };
  const after = {
    unfinished: null,
    completed: pending.completedAfter,
    progress: pending.progressAfter,
  };
  const current = readPracticeFinishValues(store);
  if (!current) return "unresolved";
  if (current.unfinished === null && pending.sessionId !== expectedSessionId)
    return "unresolved";
  const sameEpisode =
    pending.sessionId === expectedSessionId &&
    pending.unfinishedBefore === expectedUnfinished &&
    pending.completedAfter === completedAfter;

  if (
    current.completed === after.completed &&
    current.progress === after.progress
  ) {
    const canCompleteThisEpisode =
      sameEpisode &&
      (current.unfinished === null || current.unfinished === before.unfinished);
    if (
      current.unfinished === before.unfinished &&
      (!sameEpisode ||
        !writeAndConfirm(store, PRACTICE_SESSION_STORAGE_KEY, null))
    )
      return "unresolved";
    if (!writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null))
      return "unresolved";
    return canCompleteThisEpisode ? "completed" : "ready";
  }

  if (!restorePracticeFinishValues(store, before, after)) return "unresolved";
  return writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null)
    ? "ready"
    : "unresolved";
}

// Called only while the shared Practice mutation lock is held. Keep the
// legacy pending marker until the server acknowledges its resulting bytes.
export function recoverLegacyFinishBeforeImportInsideLock(
  store: Storage,
): { sessionId: string; pendingRaw: string } | null {
  const pendingRaw = store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY);
  if (pendingRaw === null) return null;
  const pending = readPendingPracticeProgressFinish(pendingRaw);
  if (!pending) throw new Error("Practice Finish recovery is unresolved.");
  if (pending.serverBacked) return null;
  if (pending.progressBefore !== null) {
    let priorEvidence: PracticeProgressEvidence | null;
    try {
      priorEvidence = validatePracticeProgressEvidence(
        JSON.parse(pending.progressBefore),
      );
    } catch {
      priorEvidence = null;
    }
    if (!priorEvidence)
      throw new Error("Legacy Progress data could not be verified.");
  }
  const current = readPracticeFinishValues(store);
  if (
    !current ||
    (current.unfinished !== pending.unfinishedBefore &&
      current.unfinished !== null) ||
    (current.completed !== pending.completedBefore &&
      current.completed !== pending.completedAfter) ||
    (current.progress !== pending.progressBefore &&
      current.progress !== pending.progressAfter)
  )
    throw new Error("Practice Finish recovery is unresolved.");
  if (
    !writeAndConfirm(
      store,
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      pending.completedAfter,
    ) ||
    !writeAndConfirm(
      store,
      PROGRESS_EVIDENCE_STORAGE_KEY,
      pending.progressAfter,
    ) ||
    !writeAndConfirm(store, PRACTICE_SESSION_STORAGE_KEY, null)
  )
    throw new Error("Practice Finish recovery is unresolved.");
  return { sessionId: pending.sessionId, pendingRaw };
}

export function acknowledgeLegacyFinishImportInsideLock(
  store: Storage,
  pendingRaw: string,
): boolean {
  return (
    store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) === pendingRaw &&
    writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null)
  );
}

async function completeServerBackedPracticeSession(
  session: PracticeSessionState | NoNextPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
  store: Storage,
  serverPersist: (request: ServerPracticeFinishPayload) => Promise<void>,
): Promise<boolean> {
  return withPracticeSessionLock(async () => {
    const requestRaw = store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY);
    let request =
      requestRaw === null ? null : readServerPracticeFinishRequest(requestRaw);
    if (
      requestRaw !== null &&
      (!request || request.sessionId !== session.sessionId)
    )
      return false;
    if (!request) {
      const completedAfter = JSON.stringify(results);
      const unfinishedBefore = expectedUnfinishedForFinish(
        session,
        answer,
        results,
      );
      const before = readPracticeFinishValues(store);
      const contributions = results
        .map(getPracticeProgressContribution)
        .filter((entry) => entry !== null);
      if (
        !validateLatestCompletedResults(results) ||
        !unfinishedBefore ||
        !before ||
        before.unfinished !== unfinishedBefore ||
        store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) !== null ||
        contributions.length < 1 ||
        contributions.length > 2
      )
        return false;
      request = {
        sessionId: session.sessionId,
        contributions,
        unfinishedBefore,
        completedBefore: before.completed,
        progressBefore: before.progress,
        completedAfter,
      };
      if (
        !writeAndConfirm(
          store,
          PRACTICE_SERVER_FINISH_REQUEST_KEY,
          JSON.stringify(request),
        )
      )
        return false;
    }

    const reconciliation = reconcilePendingPracticeProgressFinish(
      store,
      request.sessionId,
      request.unfinishedBefore,
      request.completedAfter,
    );
    if (reconciliation === "unresolved") return false;
    if (reconciliation === "completed")
      return writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null);

    const before = readPracticeFinishValues(store);
    if (
      before?.unfinished === null &&
      before.completed === request.completedAfter &&
      before.progress === request.progressBefore
    ) {
      await serverPersist({
        sessionId: request.sessionId,
        contributions: request.contributions,
      });
      return writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null);
    }
    if (
      !before ||
      before.completed !== request.completedBefore ||
      before.progress !== request.progressBefore ||
      before.unfinished === null
    )
      return false;
    const current = validatePracticeSessionSnapshot(
      JSON.parse(before.unfinished),
    );
    if (current?.sessionId !== request.sessionId) return false;

    await serverPersist({
      sessionId: request.sessionId,
      contributions: request.contributions,
    });
    const unchanged = readPracticeFinishValues(store);
    if (
      !unchanged ||
      unchanged.unfinished !== before.unfinished ||
      unchanged.completed !== before.completed ||
      unchanged.progress !== before.progress
    )
      return false;
    if (
      before.unfinished !== request.unfinishedBefore &&
      !writeAndConfirm(
        store,
        PRACTICE_SESSION_STORAGE_KEY,
        request.unfinishedBefore,
      )
    )
      return false;

    const pending: PendingPracticeProgressFinish = {
      sessionId: request.sessionId,
      unfinishedBefore: request.unfinishedBefore,
      completedBefore: request.completedBefore,
      progressBefore: request.progressBefore,
      completedAfter: request.completedAfter,
      progressAfter: request.progressBefore,
      serverBacked: true,
    };
    if (
      !writeAndConfirm(
        store,
        PRACTICE_PROGRESS_FINISH_PENDING_KEY,
        JSON.stringify(pending),
      )
    )
      return false;
    const original = {
      unfinished: request.unfinishedBefore,
      completed: request.completedBefore,
      progress: request.progressBefore,
    };
    const after = {
      unfinished: null,
      completed: request.completedAfter,
      progress: request.progressBefore,
    };
    const rollback = () => {
      if (restorePracticeFinishValues(store, original, after))
        writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null);
      return false;
    };
    const completed = validateLatestCompletedResults(
      JSON.parse(request.completedAfter),
    );
    if (!completed || !saveLatestCompletedResults(completed, store))
      return rollback();
    if (!clearPracticeSessionSnapshotInsideLock(store)) return rollback();
    const durable = readPracticeFinishValues(store);
    if (
      !durable ||
      durable.unfinished !== null ||
      durable.completed !== request.completedAfter ||
      durable.progress !== request.progressBefore
    )
      return rollback();
    return (
      writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null) &&
      writeAndConfirm(store, PRACTICE_SERVER_FINISH_REQUEST_KEY, null)
    );
  });
}

export function completePracticeSession(
  session: PracticeSessionState,
  answer: PracticeAnswerState,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
  serverPersist?: (request: ServerPracticeFinishPayload) => Promise<void>,
): Promise<boolean>;
export function completePracticeSession(
  session: NoNextPracticeSessionState,
  answer: null,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
  serverPersist?: (request: ServerPracticeFinishPayload) => Promise<void>,
): Promise<boolean>;
export async function completePracticeSession(
  session: PracticeSessionState | NoNextPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
  storage?: Storage,
  serverPersist?: (request: ServerPracticeFinishPayload) => Promise<void>,
): Promise<boolean> {
  if (!serverPersist && !validateLatestCompletedResults(results)) return false;
  if ("status" in session && !validatePracticeSessionSnapshot(session))
    return false;
  if (!("status" in session) && !answer) return false;

  const expectedUnfinished = expectedUnfinishedForFinish(
    session,
    answer,
    results,
  );
  if (expectedUnfinished === null && !serverPersist) return false;
  let store: Storage;
  try {
    store = storage ?? window.localStorage;
  } catch {
    return false;
  }
  if (serverPersist) {
    try {
      return await completeServerBackedPracticeSession(
        session,
        answer,
        results,
        store,
        serverPersist,
      );
    } catch {
      return false;
    }
  }
  if (expectedUnfinished === null) return false;
  try {
    return await withPracticeSessionLock(async () => {
      if (store.getItem(PRACTICE_SERVER_FINISH_REQUEST_KEY) !== null)
        return false;
      const completedAfter = JSON.stringify(results);
      const hasContribution = hasProgressContribution(results);
      const beforeReconciliation = readPracticeFinishValues(store);
      if (!beforeReconciliation) return false;
      if (beforeReconciliation.unfinished !== null) {
        try {
          const persisted = validatePracticeSessionSnapshot(
            JSON.parse(beforeReconciliation.unfinished),
          );
          if (
            !persisted ||
            persisted.sessionId !== session.sessionId ||
            JSON.stringify(persisted) !== expectedUnfinished
          )
            return false;
        } catch {
          return false;
        }
      }
      const reconciliation = reconcilePendingPracticeProgressFinish(
        store,
        session.sessionId,
        expectedUnfinished,
        completedAfter,
      );
      if (reconciliation === "completed") return true;
      if (reconciliation === "unresolved") return false;

      const before = readPracticeFinishValues(store);
      if (!before?.unfinished) return false;
      try {
        const persisted = validatePracticeSessionSnapshot(
          JSON.parse(before.unfinished),
        );
        if (!persisted || JSON.stringify(persisted) !== expectedUnfinished)
          return false;
      } catch {
        return false;
      }

      if (hasContribution) {
        const progress = progressBeforeOrEmpty(before.progress);
        const nextProgress = progressAfterResults(progress, results);
        if (!nextProgress) return false;
        const after = {
          unfinished: null,
          completed: completedAfter,
          progress: JSON.stringify(nextProgress),
        };
        const pending: PendingPracticeProgressFinish = {
          sessionId: session.sessionId,
          unfinishedBefore: before.unfinished,
          completedBefore: before.completed,
          progressBefore: before.progress,
          completedAfter,
          progressAfter: after.progress,
        };
        const pendingRaw = JSON.stringify(pending);
        if (
          !writeAndConfirm(
            store,
            PRACTICE_PROGRESS_FINISH_PENDING_KEY,
            pendingRaw,
          )
        )
          return false;
        const stillCurrent = readPracticeFinishValues(store);
        if (
          !stillCurrent ||
          stillCurrent.unfinished !== before.unfinished ||
          stillCurrent.completed !== before.completed ||
          stillCurrent.progress !== before.progress
        ) {
          try {
            if (
              store.getItem(PRACTICE_PROGRESS_FINISH_PENDING_KEY) === pendingRaw
            )
              writeAndConfirm(
                store,
                PRACTICE_PROGRESS_FINISH_PENDING_KEY,
                null,
              );
          } catch {
            // Leave the pending record to block an uncertain retry.
          }
          return false;
        }

        const rollback = () => {
          if (restorePracticeFinishValues(store, before, after))
            writeAndConfirm(store, PRACTICE_PROGRESS_FINISH_PENDING_KEY, null);
          return false;
        };
        if (!clearPracticeSessionSnapshotInsideLock(store)) {
          return rollback();
        }
        const cleared = readPracticeFinishValues(store);
        if (
          !cleared ||
          cleared.unfinished !== null ||
          cleared.completed !== before.completed ||
          cleared.progress !== before.progress
        )
          return rollback();
        if (!saveLatestCompletedResults(results, store)) {
          return rollback();
        }
        const completed = readPracticeFinishValues(store);
        if (
          !completed ||
          completed.unfinished !== null ||
          completed.completed !== after.completed ||
          completed.progress !== before.progress
        )
          return rollback();
        try {
          store.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, after.progress);
        } catch {
          // Read back before deciding whether the write succeeded.
        }
        const durable = readPracticeFinishValues(store);
        if (
          !durable ||
          durable.unfinished !== after.unfinished ||
          durable.completed !== after.completed ||
          durable.progress !== after.progress
        )
          return rollback();
        return writeAndConfirm(
          store,
          PRACTICE_PROGRESS_FINISH_PENDING_KEY,
          null,
        );
      }

      if (!clearPracticeSessionSnapshotInsideLock(store)) return false;
      if (saveLatestCompletedResults(results, store)) return true;
      try {
        if (store.getItem(PRACTICE_SESSION_STORAGE_KEY) === null)
          writeAndConfirm(
            store,
            PRACTICE_SESSION_STORAGE_KEY,
            before.unfinished,
          );
      } catch {
        // Leave the current storage value untouched when it cannot be inspected.
      }
      return false;
    });
  } catch {
    return false;
  }
}

export function restoreAnswerState(
  snapshot: PracticeSessionSnapshot,
): PracticeAnswerState {
  const lastSubmission = snapshot.activePractice.submissions.at(-1);
  if (snapshot.selectedOptionIds) {
    const answer = JSON.stringify(snapshot.selectedOptionIds);
    return {
      practice: snapshot.activePractice,
      selectedOptionIds: snapshot.selectedOptionIds,
      status:
        lastSubmission && answer === lastSubmission.answer
          ? lastSubmission.outcome
          : "typing",
    };
  }
  return {
    practice: snapshot.activePractice,
    rawAnswer: snapshot.rawAnswer ?? "",
    status:
      lastSubmission && snapshot.rawAnswer === lastSubmission.answer
        ? lastSubmission.outcome
        : "typing",
  };
}

export function getStoredProblemTitle(
  snapshot: PracticeSessionSnapshot,
): string {
  return problems[snapshot.activeProblemIndex].title;
}

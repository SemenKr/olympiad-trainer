"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  revealReasoningCheckpoint,
  revealPracticeHint,
  revealPracticeSolution,
  submitReasoningCheckpointOption,
  submitPracticeAnswer,
  verifyPersistedReasoningCheckpointObservation,
} from "@/app/practice/actions";
import {
  persistPracticeFinishEvidence,
  readServerAdaptiveAvailability,
  readServerNextUsefulProblem,
} from "../../../app/progress/actions";

import type {
  LearnerSafePracticeProblem,
  RevealedPracticeHint,
  RevealedPracticeSolution,
  RevealedReasoningCheckpoint,
} from "../application/practice-problem-presentation";
import {
  finishPractice,
  getPracticeSummary,
  type PracticeSummary,
} from "../application/practice-state";
import {
  canAttemptReasoningCheckpoint,
  isKnownReasoningCheckpointId,
  type ReasoningCheckpointInterpretation,
  type ReasoningCheckpointObservation,
  type ReasoningCheckpointOptionId,
} from "../application/reasoning-checkpoint";
import {
  createPracticeAnswerState,
  isMultipleChoiceSetAnswerState,
  type PracticeAnswerState,
} from "./practice-answer-state";
import {
  runMultipleChoiceSetSubmission,
  toggleMultipleChoiceSetOption,
} from "./multiple-choice-set-answer-state";
import { MultipleChoiceSetAnswer } from "./multiple-choice-set-answer";
import {
  isFocusHintAvailable,
  isNextStepHintAvailable,
  isSolutionAvailable,
  isStrategyHintAvailable,
  keepNewerPracticeSolution,
  mergeRestoredPracticeHints,
  requestFocusHintReveal,
  requestNextStepHintReveal,
  requestPracticeFinish,
  requestSolutionReveal,
  requestStrategyHintReveal,
  restorePracticePresentation,
  runPracticeHintReveal,
  runPracticeSolutionReveal,
  type SuccessfulHintReveal,
  type SuccessfulSolutionReveal,
} from "./practice-session-state";
import { NoNextPracticeSurface } from "./no-next-practice-surface";
import styles from "./practice-session.module.scss";
import {
  completePracticeSession,
  createPracticeSessionSnapshot,
  isCurrentPracticeFinish,
  readVerifiedPracticeSessionSnapshot,
  readVerifiedLatestCompletedResults,
  restoreAnswerState,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
} from "./practice-session-storage";
import {
  editShortNumericAnswer,
  runShortNumericAnswerSubmission,
} from "./short-numeric-answer-state";
import { ShortNumericAnswer } from "./short-numeric-answer";
import { TaskBlockText } from "./task-block";
import { TaskShell } from "./task-shell";
import {
  advancePracticeSession,
  createPracticeSessionResult,
  finishPracticeSession,
  isPracticeProblemNavigationComplete,
  isPracticeProblemSkipAvailable,
  requestPracticeSkip,
  skipFinalPracticeSession,
  startPracticeSession,
  startPackPracticeSession,
  startAdaptivePracticeSession,
  isFixedPracticeSession,
  type ActivePracticeSessionState,
  type FinishedPracticeSessionState,
  type PracticeSessionResult,
} from "./fixed-practice-session-state";
import {
  packIdFromProblemIds,
  type PackId,
} from "../application/completed-practice-episode";
import { ensureServerProgressImported } from "./server-progress-import";

type PracticeSessionProps = Readonly<{
  problems: readonly [
    LearnerSafePracticeProblem,
    LearnerSafePracticeProblem,
    LearnerSafePracticeProblem,
  ];
  packs?: Readonly<
    Record<
      PackId,
      readonly [
        LearnerSafePracticeProblem,
        LearnerSafePracticeProblem,
        LearnerSafePracticeProblem,
      ]
    >
  >;
  startPackId?: PackId;
  transferProblem?: LearnerSafePracticeProblem;
  parrotsProblem?: LearnerSafePracticeProblem;
  pagesProblem?: LearnerSafePracticeProblem;
  startTransferProblemId?:
    | "brothers-ages-products"
    | "parrots-guaranteed-colors"
    | "pages-without-digit-one";
  startMode?: "core" | "transfer" | "pack";
}>;

export function getActivePracticeProblem(
  session: ActivePracticeSessionState,
  problems: PracticeSessionProps["problems"],
  transferProblem: PracticeSessionProps["transferProblem"],
  parrotsProblem: PracticeSessionProps["parrotsProblem"],
  pagesProblem?: PracticeSessionProps["pagesProblem"],
  packs?: PracticeSessionProps["packs"],
): LearnerSafePracticeProblem | null {
  if (isFixedPracticeSession(session)) {
    if (session.mode !== "pack") return problems[session.activeProblemIndex];
    const packId = packIdFromProblemIds(session.problemIds ?? []);
    return packId
      ? (packs?.[packId][session.activeProblemIndex] ?? null)
      : null;
  }
  const problem =
    session.problemId === "parrots-guaranteed-colors"
      ? parrotsProblem
      : session.problemId === "pages-without-digit-one"
        ? pagesProblem
        : transferProblem;
  if (!problem || problem.problemId !== session.problemId) return null;
  return problem;
}

function PracticeRestoreError({ onRetry }: Readonly<{ onRetry: () => void }>) {
  return (
    <main>
      <p role="alert">Не удалось проверить сохранённую тренировку.</p>
      <button onClick={onRetry} type="button">
        Повторить
      </button>
      <Link href="/">На главную</Link>
    </main>
  );
}

type PracticeProblemEpisodeProps = Readonly<{
  problem: LearnerSafePracticeProblem;
  hasNextProblem: boolean;
  focusHeadingOnMount: boolean;
  completionLatch: { current: boolean };
  onFinish: (
    summary: PracticeSummary,
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation | null,
  ) => Promise<boolean>;
  onNextProblem: (
    summary: PracticeSummary,
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation | null,
  ) => Promise<boolean>;
  onSkip: (summary: PracticeSummary) => Promise<boolean>;
  onPause: (
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation | null,
  ) => Promise<boolean>;
  onStableChange: (
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation | null,
  ) => Promise<boolean>;
  onCheckpointAssessed: (
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation,
  ) => Promise<boolean>;
  initialAnswerState: PracticeAnswerState;
  initialCheckpointObservation: ReasoningCheckpointObservation | null;
  initialCheckpointInterpretation: ReasoningCheckpointInterpretation | null;
}>;

const DIRTY_FINISH_MESSAGE =
  "Ответ ещё не отправлен. Завершить тренировку и удалить его?";
const DIRTY_NEXT_MESSAGE =
  "Ответ ещё не отправлен. Перейти к следующей задаче и удалить его?";
const DIRTY_SKIP_MESSAGE =
  "Ответ ещё не отправлен. Пропустить задачу и удалить его?";
const HINT_REVEAL_ERROR_MESSAGE =
  "Не удалось открыть подсказку. Попробуй ещё раз.";
const SOLUTION_REVEAL_ERROR_MESSAGE =
  "Не удалось открыть решение. Попробуй ещё раз.";

export function PracticeHintRevealError() {
  return (
    <p aria-atomic="true" className={styles["hint-error"]} role="alert">
      {HINT_REVEAL_ERROR_MESSAGE}
    </p>
  );
}

export function PracticeSolutionRevealError() {
  return (
    <p aria-atomic="true" className={styles["hint-error"]} role="alert">
      {SOLUTION_REVEAL_ERROR_MESSAGE}
    </p>
  );
}

export async function savePracticeSessionWhileActive(
  completionLatch: { current: boolean },
  session: ActivePracticeSessionState,
  answer: PracticeAnswerState,
  storage?: Storage,
  observation?: ReasoningCheckpointObservation | null,
): Promise<boolean> {
  return (
    !completionLatch.current &&
    (await savePracticeSessionSnapshot(
      session,
      answer,
      storage,
      observation ?? undefined,
    ))
  );
}

export async function finishPracticeSessionAndNavigate(
  completionLatch: { current: boolean },
  session: ActivePracticeSessionState | FinishedPracticeSessionState,
  answer: PracticeAnswerState | null,
  results: readonly PracticeSessionResult[],
  navigate: () => void,
  storage?: Storage,
): Promise<boolean> {
  if (completionLatch.current) return false;
  if (!(await isCurrentPracticeFinish(session, answer, results, storage)))
    return false;
  let importedLegacyFinish: string | null;
  try {
    importedLegacyFinish = await ensureServerProgressImported(storage);
  } catch {
    return false;
  }
  if (importedLegacyFinish === session.sessionId) {
    completionLatch.current = true;
    navigate();
    return true;
  }
  const persist = (request: {
    sessionId: string;
    contributions: readonly unknown[];
    adaptiveFacts?: {
      problemId:
        | "brothers-ages-products"
        | "parrots-guaranteed-colors"
        | "pages-without-digit-one";
      attempted: boolean;
      solutionExposed: boolean;
    };
    episodeMode?: "core" | "transfer" | "exploration" | "pack";
    episodeFacts?: unknown;
  }) =>
    request.episodeFacts
      ? persistPracticeFinishEvidence(
          request.sessionId,
          request.contributions,
          request.adaptiveFacts,
          {
            mode: request.episodeMode,
            facts: request.episodeFacts,
          },
        )
      : request.adaptiveFacts
        ? persistPracticeFinishEvidence(
            request.sessionId,
            request.contributions,
            request.adaptiveFacts,
          )
        : persistPracticeFinishEvidence(
            request.sessionId,
            request.contributions,
          );
  const completed =
    "status" in session
      ? await completePracticeSession(session, null, results, storage, persist)
      : answer !== null &&
        (await completePracticeSession(
          session,
          answer,
          results,
          storage,
          persist,
        ));
  if (!completed) return false;
  completionLatch.current = true;
  navigate();
  return true;
}

export function PracticeSession({
  problems,
  packs,
  startPackId = "pack-a",
  transferProblem,
  parrotsProblem,
  pagesProblem,
  startTransferProblemId = "brothers-ages-products",
  startMode = "core",
}: PracticeSessionProps) {
  const adaptiveProblem =
    startTransferProblemId === "parrots-guaranteed-colors"
      ? (parrotsProblem ?? problems[0])
      : startTransferProblemId === "pages-without-digit-one"
        ? (pagesProblem ?? problems[0])
        : (transferProblem ?? problems[0]);
  const router = useRouter();
  const completionLatch = useRef(false);
  const noNextMutationGate = useRef(false);
  const [noNextMutationPending, setNoNextMutationPending] = useState(false);
  const [completionPending, setCompletionPending] = useState(false);
  const [noNextStorageError, setNoNextStorageError] = useState(false);
  const [restoreError, setRestoreError] = useState(false);
  const [packUnavailable, setPackUnavailable] = useState(false);
  const [restoreRetry, setRestoreRetry] = useState(0);
  const [loaded, setLoaded] = useState<
    | {
        session: ActivePracticeSessionState;
        answer: PracticeAnswerState;
        observation: ReasoningCheckpointObservation | null;
        interpretation: ReasoningCheckpointInterpretation | null;
      }
    | { session: FinishedPracticeSessionState }
    | null
  >(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void readVerifiedPracticeSessionSnapshot(
        verifyPersistedReasoningCheckpointObservation,
      )
        .then(async ({ value: snapshot, interpretation }) => {
          if (!active) return;
          if (snapshot && "status" in snapshot) {
            setLoaded({ session: snapshot });
            return;
          }
          const session: ActivePracticeSessionState = snapshot
            ? ({
                sessionId: snapshot.sessionId,
                ...("mode" in snapshot && snapshot.mode !== "pack"
                  ? {
                      mode: snapshot.mode,
                      problemId: snapshot.problemIds[0],
                    }
                  : snapshot.mode === "pack"
                    ? { mode: "pack" as const, problemIds: snapshot.problemIds }
                    : {}),
                activeProblemIndex: snapshot.activeProblemIndex,
                completedResults: snapshot.completedResults,
              } as ActivePracticeSessionState)
            : startMode === "transfer"
              ? startAdaptivePracticeSession(startTransferProblemId)
              : startMode === "pack"
                ? startPackPracticeSession(startPackId)
                : startPracticeSession();
          if (!snapshot && startMode === "pack" && !packs?.[startPackId]) {
            if (active) setRestoreError(true);
            return;
          }
          const answer = snapshot
            ? restoreAnswerState(snapshot)
            : createPracticeAnswerState(
                startMode === "transfer"
                  ? adaptiveProblem
                  : startMode === "pack"
                    ? packs![startPackId][0]
                    : problems[0],
              );
          if (!snapshot && startMode === "transfer") {
            await ensureServerProgressImported();
            const recommendation = await readServerNextUsefulProblem();
            if (recommendation?.problemId !== startTransferProblemId) {
              if (active) setRestoreError(true);
              return;
            }
          }
          if (!snapshot && startMode === "pack") {
            await ensureServerProgressImported();
            const [availability, completed] = await Promise.all([
              readServerAdaptiveAvailability(),
              readVerifiedLatestCompletedResults(
                verifyPersistedReasoningCheckpointObservation,
              ),
            ]);
            if (!availability.hasPracticeHistory && !completed.value) {
              if (active) setPackUnavailable(true);
              return;
            }
          }
          if (
            !snapshot &&
            !(await createPracticeSessionSnapshot(session, answer))
          ) {
            if (active) setRestoreError(true);
            return;
          }
          if (!active) return;
          setLoaded({
            session,
            answer,
            observation: snapshot?.reasoningCheckpointObservation ?? null,
            interpretation,
          });
        })
        .catch(() => {
          if (active) setRestoreError(true);
        });
    });
    return () => {
      active = false;
    };
  }, [
    restoreRetry,
    problems,
    packs,
    startPackId,
    adaptiveProblem,
    startMode,
    startTransferProblemId,
  ]);

  const retryRestore = () => {
    setRestoreError(false);
    setRestoreRetry((value) => value + 1);
  };

  if (restoreError) return <PracticeRestoreError onRetry={retryRestore} />;

  if (packUnavailable)
    return (
      <main>
        <h1>Дополнительная практика</h1>
        <p>Сначала заверши первую тренировку.</p>
        <Link href="/practice">Начать тренировку</Link>
      </main>
    );

  if (!loaded) {
    return <main aria-busy="true">Загружаем тренировку…</main>;
  }

  if (completionPending) {
    return (
      <main aria-busy="true" role="status">
        Открываем итоги тренировки…
      </main>
    );
  }

  if (!("answer" in loaded)) {
    const noNextSession = loaded.session;
    return (
      <NoNextPracticeSurface
        pending={noNextMutationPending}
        onFinish={() => {
          if (completionLatch.current || noNextMutationGate.current) return;
          noNextMutationGate.current = true;
          setNoNextMutationPending(true);
          void finishPracticeSessionAndNavigate(
            completionLatch,
            noNextSession,
            null,
            noNextSession.completedResults,
            () => {
              setCompletionPending(true);
              router.push("/practice/summary");
            },
          ).then((completed) => {
            if (!completed) {
              setNoNextStorageError(true);
              noNextMutationGate.current = false;
              setNoNextMutationPending(false);
            }
          });
        }}
        onPause={() => {
          if (completionLatch.current || noNextMutationGate.current) return;
          noNextMutationGate.current = true;
          setNoNextMutationPending(true);
          void saveNoNextPracticeSessionSnapshot(noNextSession).then(
            (saved) => {
              if (saved) router.push("/");
              else {
                setNoNextStorageError(true);
                noNextMutationGate.current = false;
                setNoNextMutationPending(false);
              }
            },
          );
        }}
        storageError={noNextStorageError}
      />
    );
  }

  const { session: sessionState } = loaded;
  const activePackId = isFixedPracticeSession(sessionState)
    ? packIdFromProblemIds(sessionState.problemIds ?? [])
    : null;
  const activePackProblems = activePackId ? packs?.[activePackId] : null;
  const activeProblem = getActivePracticeProblem(
    sessionState,
    problems,
    transferProblem,
    parrotsProblem,
    pagesProblem,
    packs,
  );
  if (!activeProblem) return <PracticeRestoreError onRetry={retryRestore} />;
  const restoredProblem = activeProblem;

  async function handleNextProblem(
    summary: PracticeSummary,
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation | null,
  ) {
    if (completionLatch.current) return false;
    const firstCorrectSubmissionCount = observation
      ? answer.practice.submissions.findIndex(
          (submission) => submission.outcome === "correct",
        ) + 1
      : undefined;
    const result = createPracticeSessionResult(
      restoredProblem,
      summary,
      undefined,
      observation ?? undefined,
      firstCorrectSubmissionCount,
    );
    const nextSession = isFixedPracticeSession(sessionState)
      ? advancePracticeSession(sessionState, result)
      : null;

    if (!nextSession) return false;
    const nextAnswer = createPracticeAnswerState(
      nextSession.mode === "pack"
        ? activePackProblems![nextSession.activeProblemIndex]
        : problems[nextSession.activeProblemIndex],
    );
    if (!(await savePracticeSessionSnapshot(nextSession, nextAnswer)))
      return false;
    setLoaded({
      session: nextSession,
      answer: nextAnswer,
      observation: null,
      interpretation: null,
    });
    return true;
  }

  function handleFinish(
    summary: PracticeSummary,
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation | null,
  ) {
    const firstCorrectSubmissionCount = observation
      ? answer.practice.submissions.findIndex(
          (submission) => submission.outcome === "correct",
        ) + 1
      : undefined;
    const result = createPracticeSessionResult(
      restoredProblem,
      summary,
      undefined,
      observation ?? undefined,
      firstCorrectSubmissionCount,
    );
    const results = isFixedPracticeSession(sessionState)
      ? finishPracticeSession(sessionState, result)
      : [result];
    return finishPracticeSessionAndNavigate(
      completionLatch,
      sessionState,
      answer,
      results,
      () => {
        setCompletionPending(true);
        router.push("/practice/summary");
      },
    );
  }

  async function handleSkip(summary: PracticeSummary): Promise<boolean> {
    if (completionLatch.current) return false;
    const result = createPracticeSessionResult(
      restoredProblem,
      summary,
      "skipped",
    );
    const nextSession = isFixedPracticeSession(sessionState)
      ? advancePracticeSession(sessionState, result)
      : null;

    if (nextSession) {
      const answer = createPracticeAnswerState(
        nextSession.mode === "pack"
          ? activePackProblems![nextSession.activeProblemIndex]
          : problems[nextSession.activeProblemIndex],
      );
      if (!(await savePracticeSessionSnapshot(nextSession, answer)))
        return false;
      setLoaded({
        session: nextSession,
        answer,
        observation: null,
        interpretation: null,
      });
      return true;
    }

    const noNextSession: FinishedPracticeSessionState | null =
      isFixedPracticeSession(sessionState)
        ? skipFinalPracticeSession(sessionState, result)
        : {
            sessionId: sessionState.sessionId,
            mode: sessionState.mode,
            status: "no-next",
            completedResults: [result],
          };
    if (
      !noNextSession ||
      !(await saveNoNextPracticeSessionSnapshot(noNextSession))
    )
      return false;
    setLoaded({ session: noNextSession });
    return true;
  }

  async function handlePause(
    answer: PracticeAnswerState,
    observation: ReasoningCheckpointObservation | null,
  ) {
    if (
      !(await savePracticeSessionWhileActive(
        completionLatch,
        sessionState,
        answer,
        undefined,
        observation,
      ))
    )
      return false;
    router.push("/");
    return true;
  }

  return (
    <PracticeProblemEpisode
      completionLatch={completionLatch}
      focusHeadingOnMount={sessionState.activeProblemIndex > 0}
      hasNextProblem={
        isFixedPracticeSession(sessionState) &&
        sessionState.activeProblemIndex < 2
      }
      key={activeProblem.problemId}
      initialAnswerState={loaded.answer}
      initialCheckpointObservation={loaded.observation}
      initialCheckpointInterpretation={loaded.interpretation}
      onCheckpointAssessed={(answer, observation) =>
        savePracticeSessionWhileActive(
          completionLatch,
          sessionState,
          answer,
          undefined,
          observation,
        )
      }
      onFinish={handleFinish}
      onNextProblem={handleNextProblem}
      onPause={handlePause}
      onSkip={handleSkip}
      onStableChange={(answer, observation) =>
        savePracticeSessionWhileActive(
          completionLatch,
          sessionState,
          answer,
          undefined,
          observation,
        )
      }
      problem={activeProblem}
    />
  );
}

function PracticeProblemEpisode({
  problem,
  hasNextProblem,
  focusHeadingOnMount,
  completionLatch,
  onFinish,
  onNextProblem,
  onSkip,
  onPause,
  onStableChange,
  onCheckpointAssessed,
  initialAnswerState,
  initialCheckpointObservation,
  initialCheckpointInterpretation,
}: PracticeProblemEpisodeProps) {
  const [focusHint, strategyHint, nextStepHint] = problem.hints;
  const [answerState, setAnswerState] = useState(() => initialAnswerState);
  const [revealedHints, setRevealedHints] = useState<
    readonly RevealedPracticeHint[]
  >([]);
  const [revealedSolution, setRevealedSolution] =
    useState<RevealedPracticeSolution | null>(null);
  const [pendingHintId, setPendingHintId] = useState<string | null>(null);
  const [isSolutionRevealPending, setIsSolutionRevealPending] = useState(false);
  const [hintRevealFailed, setHintRevealFailed] = useState(false);
  const [solutionRevealFailed, setSolutionRevealFailed] = useState(false);
  const [storageError, setStorageError] = useState<
    "save" | "pause" | "finish" | "next" | "skip" | "checkpoint" | null
  >(null);
  const [transitionPending, setTransitionPending] = useState(false);
  const [checkpointObservation, setCheckpointObservation] = useState(
    initialCheckpointObservation,
  );
  const [checkpointInterpretation, setCheckpointInterpretation] = useState(
    initialCheckpointInterpretation,
  );
  const [revealedCheckpoint, setRevealedCheckpoint] =
    useState<RevealedReasoningCheckpoint | null>(null);
  const [selectedOptionId, setSelectedOptionId] =
    useState<ReasoningCheckpointOptionId | null>(null);
  const [checkpointRevealPending, setCheckpointRevealPending] = useState(false);
  const [checkpointAssessmentPending, setCheckpointAssessmentPending] =
    useState(false);
  const [checkpointError, setCheckpointError] = useState(false);
  const [restorePending, setRestorePending] = useState(
    initialAnswerState.practice.hintExposures.length > 0 ||
      initialAnswerState.practice.solutionExposure !== null,
  );
  const [restoreFailed, setRestoreFailed] = useState(false);
  const [restoreRetry, setRestoreRetry] = useState(0);
  const restorePendingRef = useRef(restorePending);
  const restoredHintIdsRef = useRef(
    new Set(
      initialAnswerState.practice.hintExposures.map(
        (exposure) => exposure.hintId,
      ),
    ),
  );
  const restoredSolutionRef = useRef(
    initialAnswerState.practice.solutionExposure !== null,
  );
  const answerStateRef = useRef(answerState);
  const checkpointObservationRef = useRef(checkpointObservation);
  const checkpointRevealGate = useRef(false);
  const checkpointAssessmentGate = useRef(false);
  const episodeActiveRef = useRef(true);
  const transitionGate = useRef(false);
  const stableWriteTail = useRef<Promise<void>>(Promise.resolve());
  const submissionGate = useRef(false);
  const hintRevealGate = useRef(false);
  const solutionRevealGate = useRef(false);
  const focusHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const strategyHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const nextStepHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const solutionHeadingRef = useRef<HTMLHeadingElement>(null);
  const checkpointHeadingRef = useRef<HTMLHeadingElement>(null);
  const checkpointInterpretationHeadingRef = useRef<HTMLHeadingElement>(null);
  const problemHeadingRef = useRef<HTMLHeadingElement>(null);
  const isPending = answerState.status === "loading";
  const revealedFocusHint = revealedHints.find(
    (hint) => hint.hintId === focusHint.hintId,
  );
  const revealedStrategyHint = revealedHints.find(
    (hint) => hint.hintId === strategyHint.hintId,
  );
  const revealedNextStepHint = revealedHints.find(
    (hint) => hint.hintId === nextStepHint.hintId,
  );
  const focusHintExposure = answerState.practice.hintExposures.find(
    (exposure) => exposure.hintId === focusHint.hintId,
  );
  const strategyHintExposure = answerState.practice.hintExposures.find(
    (exposure) => exposure.hintId === strategyHint.hintId,
  );
  const nextStepHintExposure = answerState.practice.hintExposures.find(
    (exposure) => exposure.hintId === nextStepHint.hintId,
  );
  const canOpenFocusHint = isFocusHintAvailable(answerState, focusHint.hintId);
  const canOpenStrategyHint = isStrategyHintAvailable(
    answerState,
    focusHint.hintId,
    strategyHint.hintId,
  );
  const canOpenNextStepHint = isNextStepHintAvailable(
    answerState,
    strategyHint.hintId,
    nextStepHint.hintId,
  );
  const canOpenSolution = isSolutionAvailable(
    answerState,
    focusHint.hintId,
    strategyHint.hintId,
    nextStepHint.hintId,
  );
  const navigationComplete = isPracticeProblemNavigationComplete(answerState);
  const supportRevealPending =
    pendingHintId !== null || isSolutionRevealPending;
  const canOpenNextProblem =
    hasNextProblem &&
    navigationComplete &&
    !supportRevealPending &&
    !restorePending;
  const canSkipProblem = isPracticeProblemSkipAvailable(
    answerState,
    supportRevealPending || restorePending,
  );
  const canOpenCheckpoint =
    problem.reasoningCheckpoint !== undefined &&
    canAttemptReasoningCheckpoint(
      answerState.practice,
      checkpointObservation,
    ) &&
    !isPending &&
    !restorePending;

  useEffect(() => {
    episodeActiveRef.current = true;
    return () => {
      episodeActiveRef.current = false;
    };
  }, []);

  useEffect(() => {
    const exposures = initialAnswerState.practice.hintExposures;
    const solution = initialAnswerState.practice.solutionExposure;
    if (exposures.length === 0 && !solution) return;

    let active = true;
    restorePendingRef.current = true;
    void restorePracticePresentation(
      problem,
      initialAnswerState.practice,
      revealPracticeHint,
      revealPracticeSolution,
    )
      .then(({ hints, solution: revealed }) => {
        if (!active) return;
        setRevealedHints((current) =>
          mergeRestoredPracticeHints(current, hints),
        );
        setRevealedSolution((current) =>
          keepNewerPracticeSolution(current, revealed),
        );
      })
      .catch(() => {
        if (active) setRestoreFailed(true);
      })
      .finally(() => {
        if (active) {
          restorePendingRef.current = false;
          setRestorePending(false);
        }
      });
    return () => {
      active = false;
    };
  }, [initialAnswerState, problem, restoreRetry]);

  useEffect(() => {
    if (focusHeadingOnMount) {
      problemHeadingRef.current?.focus();
    }
  }, [focusHeadingOnMount]);

  useEffect(() => {
    if (
      revealedFocusHint &&
      focusHintExposure &&
      !restoredHintIdsRef.current.has(focusHint.hintId)
    ) {
      focusHintHeadingRef.current?.focus();
    }
  }, [focusHint.hintId, focusHintExposure, revealedFocusHint]);

  useEffect(() => {
    if (
      revealedStrategyHint &&
      strategyHintExposure &&
      !restoredHintIdsRef.current.has(strategyHint.hintId)
    ) {
      strategyHintHeadingRef.current?.focus();
    }
  }, [revealedStrategyHint, strategyHint.hintId, strategyHintExposure]);

  useEffect(() => {
    if (
      revealedNextStepHint &&
      nextStepHintExposure &&
      !restoredHintIdsRef.current.has(nextStepHint.hintId)
    ) {
      nextStepHintHeadingRef.current?.focus();
    }
  }, [revealedNextStepHint, nextStepHint.hintId, nextStepHintExposure]);

  useEffect(() => {
    if (
      revealedSolution &&
      answerState.practice.solutionExposure &&
      !restoredSolutionRef.current
    ) {
      solutionHeadingRef.current?.focus();
    }
  }, [answerState.practice.solutionExposure, revealedSolution]);

  useEffect(() => {
    if (revealedCheckpoint) checkpointHeadingRef.current?.focus();
  }, [revealedCheckpoint]);

  useEffect(() => {
    if (checkpointObservation)
      checkpointInterpretationHeadingRef.current?.focus();
  }, [checkpointObservation]);

  function updateAnswerState(nextState: PracticeAnswerState) {
    if (
      completionLatch.current ||
      !episodeActiveRef.current ||
      transitionGate.current
    )
      return;
    answerStateRef.current = nextState;
    setAnswerState(nextState);
    const observation = checkpointObservationRef.current;
    stableWriteTail.current = stableWriteTail.current.then(async () => {
      if (!episodeActiveRef.current || completionLatch.current) return;
      try {
        if (!(await onStableChange(nextState, observation)))
          setStorageError("save");
        else
          setStorageError((current) => (current === "save" ? null : current));
      } catch {
        if (episodeActiveRef.current) setStorageError("save");
      }
    });
  }

  async function runPersistenceTransition(
    error: "pause" | "finish" | "next" | "skip",
    persist: () => Promise<boolean>,
  ) {
    if (transitionGate.current) return;
    transitionGate.current = true;
    setTransitionPending(true);
    try {
      await stableWriteTail.current;
      if (!episodeActiveRef.current || completionLatch.current) return;
      if (await persist()) episodeActiveRef.current = false;
      else setStorageError(error);
    } catch {
      if (episodeActiveRef.current) setStorageError(error);
    } finally {
      if (episodeActiveRef.current && !completionLatch.current) {
        transitionGate.current = false;
        setTransitionPending(false);
      }
    }
  }

  function handlePause() {
    if (
      completionLatch.current ||
      !episodeActiveRef.current ||
      transitionGate.current ||
      submissionGate.current ||
      answerStateRef.current.status === "loading" ||
      hintRevealGate.current ||
      solutionRevealGate.current ||
      checkpointAssessmentGate.current ||
      restorePendingRef.current
    )
      return;
    void runPersistenceTransition("pause", () =>
      onPause(answerStateRef.current, checkpointObservationRef.current),
    );
  }

  function handleAnswerChange(rawAnswer: string) {
    if (checkpointAssessmentGate.current || transitionGate.current) return;
    const current = answerStateRef.current;
    if (isMultipleChoiceSetAnswerState(current)) return;
    updateAnswerState(editShortNumericAnswer(current, rawAnswer));
  }

  function handleOptionToggle(optionId: string) {
    if (checkpointAssessmentGate.current || transitionGate.current) return;
    const current = answerStateRef.current;
    if (
      !isMultipleChoiceSetAnswerState(current) ||
      problem.response.kind !== "multiple-choice-set"
    )
      return;
    updateAnswerState(
      toggleMultipleChoiceSetOption(
        current,
        optionId,
        problem.response.options.map((option) => option.id),
      ),
    );
  }

  function handleAnswerSubmit() {
    if (
      completionLatch.current ||
      checkpointAssessmentGate.current ||
      transitionGate.current
    )
      return;
    const current = answerStateRef.current;
    const submitted = isMultipleChoiceSetAnswerState(current)
      ? runMultipleChoiceSetSubmission({
          state: current,
          gate: submissionGate,
          submit: (selectedOptionIds) =>
            submitPracticeAnswer(problem.problemId, selectedOptionIds),
          onPending: updateAnswerState,
        })
      : runShortNumericAnswerSubmission({
          state: current,
          gate: submissionGate,
          submit: (rawAnswer) =>
            submitPracticeAnswer(problem.problemId, rawAnswer),
          onPending: updateAnswerState,
        });
    void submitted.then((nextState) => {
      if (nextState) {
        updateAnswerState(nextState);
      }
    });
  }

  function handleFinish() {
    if (
      completionLatch.current ||
      !episodeActiveRef.current ||
      transitionGate.current ||
      restorePendingRef.current ||
      checkpointAssessmentGate.current
    )
      return;
    const nextSummary = requestPracticeFinish(
      answerStateRef.current,
      () => window.confirm(DIRTY_FINISH_MESSAGE),
      hintRevealGate.current || solutionRevealGate.current,
    );

    if (nextSummary) {
      void runPersistenceTransition("finish", () =>
        onFinish(
          nextSummary,
          answerStateRef.current,
          checkpointObservationRef.current,
        ),
      );
    }
  }

  function handleNextProblem() {
    if (
      completionLatch.current ||
      !episodeActiveRef.current ||
      transitionGate.current ||
      restorePendingRef.current ||
      checkpointAssessmentGate.current
    )
      return;
    const nextSummary = requestPracticeFinish(
      answerStateRef.current,
      () => window.confirm(DIRTY_NEXT_MESSAGE),
      hintRevealGate.current || solutionRevealGate.current,
    );

    if (
      nextSummary &&
      isPracticeProblemNavigationComplete(answerStateRef.current)
    ) {
      void runPersistenceTransition("next", () =>
        onNextProblem(
          nextSummary,
          answerStateRef.current,
          checkpointObservationRef.current,
        ),
      );
    }
  }

  function handleSkip() {
    if (
      completionLatch.current ||
      !episodeActiveRef.current ||
      transitionGate.current ||
      restorePendingRef.current ||
      checkpointAssessmentGate.current
    )
      return;
    const nextSummary = requestPracticeSkip(
      answerStateRef.current,
      () => window.confirm(DIRTY_SKIP_MESSAGE),
      hintRevealGate.current || solutionRevealGate.current,
    );

    if (nextSummary) {
      void runPersistenceTransition("skip", () => onSkip(nextSummary));
    }
  }

  function storeSuccessfulSolutionReveal(result: SuccessfulSolutionReveal) {
    setRevealedSolution(result.revealedSolution);
    updateAnswerState(result.answerState);
  }

  function storeSuccessfulHintReveal(result: SuccessfulHintReveal) {
    setRevealedHints((current) =>
      current.some((hint) => hint.hintId === result.revealedHint.hintId)
        ? current
        : [...current, result.revealedHint],
    );
    updateAnswerState(result.answerState);
  }

  async function runHintReveal(
    hintId: string,
    requestReveal: () => Promise<
      Awaited<ReturnType<typeof requestFocusHintReveal>>
    >,
  ) {
    if (completionLatch.current || transitionGate.current) return;
    await runPracticeHintReveal({
      gate: hintRevealGate,
      hintId,
      requestReveal,
      onStart: (pendingId) => {
        setHintRevealFailed(false);
        setPendingHintId(pendingId);
      },
      onSuccess: (result) => {
        setHintRevealFailed(false);
        storeSuccessfulHintReveal(result);
      },
      onError: () => setHintRevealFailed(true),
      onSettled: () => setPendingHintId(null),
    });
  }

  function handleFocusHintOpen() {
    void runHintReveal(focusHint.hintId, () =>
      requestFocusHintReveal(
        () => answerStateRef.current,
        focusHint,
        () => revealPracticeHint(problem.problemId, focusHint.hintId),
      ),
    );
  }

  function handleStrategyHintOpen() {
    void runHintReveal(strategyHint.hintId, () =>
      requestStrategyHintReveal(
        () => answerStateRef.current,
        focusHint.hintId,
        strategyHint,
        () => revealPracticeHint(problem.problemId, strategyHint.hintId),
      ),
    );
  }

  function handleNextStepHintOpen() {
    void runHintReveal(nextStepHint.hintId, () =>
      requestNextStepHintReveal(
        () => answerStateRef.current,
        strategyHint.hintId,
        nextStepHint,
        () => revealPracticeHint(problem.problemId, nextStepHint.hintId),
      ),
    );
  }

  function handleSolutionOpen() {
    if (completionLatch.current || transitionGate.current) return;
    void runPracticeSolutionReveal({
      gate: solutionRevealGate,
      requestReveal: () =>
        requestSolutionReveal(
          () => answerStateRef.current,
          focusHint.hintId,
          strategyHint.hintId,
          nextStepHint.hintId,
          problem.solution,
          () =>
            revealPracticeSolution(
              problem.problemId,
              problem.solution.solutionId,
            ),
        ),
      onStart: () => {
        setSolutionRevealFailed(false);
        setIsSolutionRevealPending(true);
      },
      onSuccess: (result) => {
        setSolutionRevealFailed(false);
        storeSuccessfulSolutionReveal(result);
      },
      onError: () => setSolutionRevealFailed(true),
      onSettled: () => setIsSolutionRevealPending(false),
    });
  }

  async function handleCheckpointReveal() {
    const descriptor = problem.reasoningCheckpoint;
    if (
      !descriptor ||
      !isKnownReasoningCheckpointId(descriptor.checkpointId) ||
      !episodeActiveRef.current ||
      completionLatch.current ||
      transitionGate.current ||
      checkpointRevealGate.current ||
      checkpointAssessmentGate.current ||
      submissionGate.current ||
      hintRevealGate.current ||
      solutionRevealGate.current ||
      checkpointObservationRef.current ||
      answerStateRef.current.status === "loading" ||
      restorePendingRef.current ||
      !canAttemptReasoningCheckpoint(
        answerStateRef.current.practice,
        checkpointObservationRef.current,
      )
    )
      return;

    checkpointRevealGate.current = true;
    setCheckpointError(false);
    setCheckpointRevealPending(true);
    try {
      const revealed = await revealReasoningCheckpoint(
        problem.problemId,
        descriptor.checkpointId,
      );
      if (revealed.checkpointId !== descriptor.checkpointId)
        throw new Error("Revealed checkpoint does not match the request.");
      if (episodeActiveRef.current && !completionLatch.current)
        setRevealedCheckpoint(revealed);
    } catch {
      if (episodeActiveRef.current) setCheckpointError(true);
    } finally {
      checkpointRevealGate.current = false;
      if (episodeActiveRef.current) setCheckpointRevealPending(false);
    }
  }

  async function handleCheckpointSubmit() {
    const descriptor = problem.reasoningCheckpoint;
    if (
      !descriptor ||
      !isKnownReasoningCheckpointId(descriptor.checkpointId) ||
      !revealedCheckpoint ||
      !selectedOptionId ||
      !episodeActiveRef.current ||
      completionLatch.current ||
      transitionGate.current ||
      checkpointAssessmentGate.current ||
      submissionGate.current ||
      hintRevealGate.current ||
      solutionRevealGate.current ||
      restorePendingRef.current ||
      answerStateRef.current.status === "loading" ||
      checkpointObservationRef.current ||
      !canAttemptReasoningCheckpoint(
        answerStateRef.current.practice,
        checkpointObservationRef.current,
      )
    )
      return;

    const validSubmissionCountAtSubmit =
      answerStateRef.current.practice.submissions.length;
    checkpointAssessmentGate.current = true;
    setCheckpointError(false);
    setCheckpointAssessmentPending(true);
    try {
      const assessed = await submitReasoningCheckpointOption(
        problem.problemId,
        descriptor.checkpointId,
        selectedOptionId,
        getPracticeSummary(finishPractice(answerStateRef.current.practice)),
      );
      if (!episodeActiveRef.current || completionLatch.current) return;
      const observation: ReasoningCheckpointObservation = {
        checkpointId: descriptor.checkpointId,
        selectedOptionId,
        outcome: assessed.outcome,
        validSubmissionCountAtSubmit,
      };
      await stableWriteTail.current;
      if (!(await onCheckpointAssessed(answerStateRef.current, observation))) {
        setStorageError("checkpoint");
        return;
      }
      if (!episodeActiveRef.current || completionLatch.current) return;
      checkpointObservationRef.current = observation;
      setCheckpointObservation(observation);
      setCheckpointInterpretation(assessed.interpretation);
      setRevealedCheckpoint(null);
    } catch {
      if (episodeActiveRef.current) setCheckpointError(true);
    } finally {
      checkpointAssessmentGate.current = false;
      if (episodeActiveRef.current) setCheckpointAssessmentPending(false);
    }
  }

  return (
    <TaskShell
      answerRail={
        <div className={styles["answer-rail"]}>
          {problem.response.kind === "multiple-choice-set" &&
          isMultipleChoiceSetAnswerState(answerState) ? (
            <MultipleChoiceSetAnswer
              instruction={problem.response.instruction}
              locked={checkpointAssessmentPending || transitionPending}
              onOptionToggle={handleOptionToggle}
              onSubmit={handleAnswerSubmit}
              options={problem.response.options}
              state={answerState}
            />
          ) : !isMultipleChoiceSetAnswerState(answerState) ? (
            <ShortNumericAnswer
              onAnswerChange={handleAnswerChange}
              onSubmit={handleAnswerSubmit}
              state={answerState}
              locked={checkpointAssessmentPending || transitionPending}
            />
          ) : null}

          {storageError ? (
            <p aria-atomic="true" className={styles["hint-error"]} role="alert">
              {storageError === "pause"
                ? "Не удалось сохранить тренировку. Попробуй ещё раз."
                : storageError === "save"
                  ? "Не удалось сохранить тренировку. Попробуй ещё раз."
                  : storageError === "next"
                    ? "Не удалось перейти к следующей задаче. Попробуй ещё раз."
                    : storageError === "skip"
                      ? "Не удалось пропустить задачу. Попробуй ещё раз."
                      : storageError === "checkpoint"
                        ? "Рассуждение проверено, но сохранить его не удалось. Попробуй ещё раз сохранить тренировку."
                        : "Не удалось завершить тренировку. Попробуй ещё раз."}
            </p>
          ) : null}

          {hintRevealFailed ? <PracticeHintRevealError /> : null}
          {restorePending ? (
            <p role="status">Восстанавливаем открытые подсказки и решение…</p>
          ) : null}
          {restoreFailed ? (
            <div>
              <p role="alert">
                Не удалось загрузить открытые подсказки или решение.
              </p>
              <button
                className={styles["hint-action"]}
                onClick={() => {
                  if (completionLatch.current) return;
                  restorePendingRef.current = true;
                  setRestorePending(true);
                  setRestoreFailed(false);
                  setRestoreRetry((value) => value + 1);
                }}
                type="button"
              >
                Повторить загрузку
              </button>
            </div>
          ) : null}

          {revealedFocusHint ? (
            <aside className={styles.hint}>
              <h2 ref={focusHintHeadingRef} tabIndex={-1}>
                Подсказка 1
              </h2>
              <p>{revealedFocusHint.text}</p>
            </aside>
          ) : canOpenFocusHint ? (
            <button
              className={styles["hint-action"]}
              disabled={pendingHintId === focusHint.hintId}
              onClick={handleFocusHintOpen}
              type="button"
            >
              Подсказка
            </button>
          ) : null}

          {canOpenStrategyHint ? (
            <button
              className={styles["hint-action"]}
              disabled={pendingHintId === strategyHint.hintId}
              onClick={handleStrategyHintOpen}
              type="button"
            >
              Следующая подсказка
            </button>
          ) : null}

          {revealedStrategyHint ? (
            <aside className={styles.hint}>
              <h2 ref={strategyHintHeadingRef} tabIndex={-1}>
                Подсказка 2
              </h2>
              <p>{revealedStrategyHint.text}</p>
            </aside>
          ) : null}

          {canOpenNextStepHint ? (
            <button
              className={styles["hint-action"]}
              disabled={pendingHintId === nextStepHint.hintId}
              onClick={handleNextStepHintOpen}
              type="button"
            >
              Следующая подсказка
            </button>
          ) : null}

          {revealedNextStepHint ? (
            <aside className={styles.hint}>
              <h2 ref={nextStepHintHeadingRef} tabIndex={-1}>
                Подсказка 3
              </h2>
              <p>{revealedNextStepHint.text}</p>
            </aside>
          ) : null}

          {solutionRevealFailed ? <PracticeSolutionRevealError /> : null}

          {canOpenSolution ? (
            <button
              aria-busy={isSolutionRevealPending}
              className={styles["hint-action"]}
              disabled={isSolutionRevealPending}
              onClick={handleSolutionOpen}
              type="button"
            >
              Показать решение
            </button>
          ) : null}

          {revealedSolution ? (
            <section className={styles.solution}>
              <h2 ref={solutionHeadingRef} tabIndex={-1}>
                Решение открыто
              </h2>
              <p>{revealedSolution.text}</p>
            </section>
          ) : null}

          {canOpenCheckpoint && !revealedCheckpoint ? (
            <button
              className={styles["hint-action"]}
              disabled={checkpointRevealPending}
              onClick={() => void handleCheckpointReveal()}
              type="button"
            >
              Дополнительный вопрос
            </button>
          ) : null}

          {canOpenCheckpoint && revealedCheckpoint ? (
            <section className={styles.checkpoint}>
              <h2 ref={checkpointHeadingRef} tabIndex={-1}>
                {revealedCheckpoint.heading}
              </h2>
              <fieldset disabled={checkpointAssessmentPending}>
                <legend>{revealedCheckpoint.question}</legend>
                {revealedCheckpoint.options.map((option) => (
                  <label key={option.id}>
                    <input
                      checked={selectedOptionId === option.id}
                      name={`checkpoint-${revealedCheckpoint.checkpointId}`}
                      onChange={() => setSelectedOptionId(option.id)}
                      type="radio"
                      value={option.id}
                    />
                    {option.text}
                  </label>
                ))}
              </fieldset>
              <button
                className={styles["hint-action"]}
                disabled={!selectedOptionId || checkpointAssessmentPending}
                onClick={() => void handleCheckpointSubmit()}
                type="button"
              >
                Проверить рассуждение
              </button>
            </section>
          ) : null}

          {checkpointError ? (
            <p aria-atomic="true" className={styles["hint-error"]} role="alert">
              Не удалось проверить рассуждение. Попробуй ещё раз.
            </p>
          ) : null}
          {checkpointRevealPending || checkpointAssessmentPending ? (
            <p role="status">Проверяем рассуждение…</p>
          ) : null}

          {checkpointInterpretation ? (
            <section className={styles.checkpoint}>
              <h2 ref={checkpointInterpretationHeadingRef} tabIndex={-1}>
                {checkpointInterpretation.learnerLabel}
              </h2>
              {checkpointInterpretation.progressGroup ? (
                <p>{checkpointInterpretation.progressGroup}</p>
              ) : null}
              <p>{checkpointInterpretation.conclusion}</p>
            </section>
          ) : null}

          {canSkipProblem ? (
            <button
              className={styles["hint-action"]}
              disabled={transitionPending}
              onClick={handleSkip}
              type="button"
            >
              Пропустить задачу
            </button>
          ) : null}

          {canOpenNextProblem ? (
            <button
              className={styles["next-action"]}
              disabled={checkpointAssessmentPending || transitionPending}
              onClick={handleNextProblem}
              type="button"
            >
              Следующая задача
            </button>
          ) : null}
        </div>
      }
      backAction={
        <button
          disabled={
            isPending ||
            supportRevealPending ||
            restorePending ||
            checkpointAssessmentPending ||
            transitionPending
          }
          onClick={handlePause}
          type="button"
        >
          ← На главную
        </button>
      }
      finishAction={
        <button
          className={styles.finish}
          disabled={
            isPending ||
            supportRevealPending ||
            restorePending ||
            checkpointAssessmentPending ||
            transitionPending
          }
          onClick={handleFinish}
          type="button"
        >
          Завершить
        </button>
      }
      header={
        <header className={styles.header}>
          <p className={styles.eyebrow}>Тренировка</p>
          <h1 ref={problemHeadingRef} tabIndex={-1}>
            {problem.title}
          </h1>
        </header>
      }
    >
      <TaskBlockText title="Условие задачи">
        <p>{problem.statement}</p>
      </TaskBlockText>
    </TaskShell>
  );
}

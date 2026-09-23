"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  revealPracticeHint,
  revealPracticeSolution,
  submitPracticeAnswer,
} from "@/app/practice/actions";

import type {
  LearnerSafePracticeProblem,
  RevealedPracticeHint,
  RevealedPracticeSolution,
} from "../application/practice-problem-presentation";
import type { PracticeSummary } from "../application/practice-state";
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
import styles from "./practice-session.module.scss";
import {
  completePracticeSession,
  readPracticeSessionSnapshot,
  restoreAnswerState,
  savePracticeSessionSnapshot,
} from "./practice-session-storage";
import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  runShortNumericAnswerSubmission,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";
import { ShortNumericAnswer } from "./short-numeric-answer";
import { TaskBlockText } from "./task-block";
import { TaskShell } from "./task-shell";
import {
  advanceTwoProblemSession,
  createPracticeSessionResult,
  finishTwoProblemSession,
  isPracticeProblemNavigationComplete,
  isPracticeProblemSkipAvailable,
  requestPracticeSkip,
  startTwoProblemSession,
  type PracticeSessionResult,
  type TwoProblemSessionState,
} from "./two-problem-session-state";

type PracticeSessionProps = Readonly<{
  problems: readonly [LearnerSafePracticeProblem, LearnerSafePracticeProblem];
}>;

type PracticeProblemEpisodeProps = Readonly<{
  problem: LearnerSafePracticeProblem;
  hasNextProblem: boolean;
  focusHeadingOnMount: boolean;
  completionLatch: { current: boolean };
  onFinish: (
    summary: PracticeSummary,
    answer: ShortNumericAnswerState,
  ) => boolean;
  onNextProblem: (summary: PracticeSummary) => void;
  onSkip: (summary: PracticeSummary) => void;
  onPause: (answer: ShortNumericAnswerState) => boolean;
  onStableChange: (answer: ShortNumericAnswerState) => void;
  initialAnswerState: ShortNumericAnswerState;
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

export function savePracticeSessionWhileActive(
  completionLatch: { current: boolean },
  session: TwoProblemSessionState,
  answer: ShortNumericAnswerState,
  storage?: Storage,
): boolean {
  return (
    !completionLatch.current &&
    savePracticeSessionSnapshot(session, answer, storage)
  );
}

export function finishPracticeSessionAndNavigate(
  completionLatch: { current: boolean },
  session: TwoProblemSessionState,
  answer: ShortNumericAnswerState,
  results: readonly PracticeSessionResult[],
  navigate: () => void,
  storage?: Storage,
): boolean {
  if (completionLatch.current) return false;
  if (!completePracticeSession(session, answer, results, storage)) return false;
  completionLatch.current = true;
  navigate();
  return true;
}

export function PracticeSession({ problems }: PracticeSessionProps) {
  const router = useRouter();
  const completionLatch = useRef(false);
  const [completionPending, setCompletionPending] = useState(false);
  const [loaded, setLoaded] = useState<{
    session: TwoProblemSessionState;
    answer: ShortNumericAnswerState;
  } | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const snapshot = readPracticeSessionSnapshot();
      const session = snapshot
        ? {
            activeProblemIndex: snapshot.activeProblemIndex,
            completedResults: snapshot.completedResults,
          }
        : startTwoProblemSession();
      const answer = snapshot
        ? restoreAnswerState(snapshot)
        : createShortNumericAnswerState();
      setLoaded({ session, answer });
      if (!snapshot) savePracticeSessionSnapshot(session, answer);
    });
    return () => {
      active = false;
    };
  }, []);

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

  const { session: sessionState } = loaded;
  const activeProblem = problems[sessionState.activeProblemIndex];

  function handleNextProblem(summary: PracticeSummary) {
    if (completionLatch.current) return;
    const result = createPracticeSessionResult(activeProblem, summary);
    const nextSession = advanceTwoProblemSession(sessionState, result);

    if (nextSession) {
      const answer = createShortNumericAnswerState();
      savePracticeSessionSnapshot(nextSession, answer);
      setLoaded({ session: nextSession, answer });
    }
  }

  function handleFinish(
    summary: PracticeSummary,
    answer: ShortNumericAnswerState,
  ) {
    const result = createPracticeSessionResult(activeProblem, summary);
    const results = finishTwoProblemSession(sessionState, result);
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

  function handleSkip(summary: PracticeSummary) {
    if (completionLatch.current) return;
    const result = createPracticeSessionResult(
      activeProblem,
      summary,
      "skipped",
    );
    const nextSession = advanceTwoProblemSession(sessionState, result);

    if (nextSession) {
      const answer = createShortNumericAnswerState();
      savePracticeSessionSnapshot(nextSession, answer);
      setLoaded({ session: nextSession, answer });
    }
  }

  function handlePause(answer: ShortNumericAnswerState) {
    if (!savePracticeSessionWhileActive(completionLatch, sessionState, answer))
      return false;
    router.push("/");
    return true;
  }

  return (
    <PracticeProblemEpisode
      completionLatch={completionLatch}
      focusHeadingOnMount={sessionState.activeProblemIndex > 0}
      hasNextProblem={sessionState.activeProblemIndex === 0}
      key={activeProblem.problemId}
      initialAnswerState={loaded.answer}
      onFinish={handleFinish}
      onNextProblem={handleNextProblem}
      onPause={handlePause}
      onSkip={handleSkip}
      onStableChange={(answer) =>
        savePracticeSessionWhileActive(completionLatch, sessionState, answer)
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
  initialAnswerState,
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
  const [storageError, setStorageError] = useState<"pause" | "finish" | null>(
    null,
  );
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
  const submissionGate = useRef(false);
  const hintRevealGate = useRef(false);
  const solutionRevealGate = useRef(false);
  const focusHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const strategyHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const nextStepHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const solutionHeadingRef = useRef<HTMLHeadingElement>(null);
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
    hasNextProblem,
    supportRevealPending || restorePending,
  );

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

  function updateAnswerState(nextState: ShortNumericAnswerState) {
    if (completionLatch.current) return;
    answerStateRef.current = nextState;
    setAnswerState(nextState);
    onStableChange(nextState);
  }

  function handlePause() {
    if (
      completionLatch.current ||
      submissionGate.current ||
      answerStateRef.current.status === "loading" ||
      hintRevealGate.current ||
      solutionRevealGate.current ||
      restorePendingRef.current
    )
      return;
    if (!onPause(answerStateRef.current)) setStorageError("pause");
  }

  function handleAnswerChange(rawAnswer: string) {
    updateAnswerState(
      editShortNumericAnswer(answerStateRef.current, rawAnswer),
    );
  }

  function handleAnswerSubmit() {
    if (completionLatch.current) return;
    void runShortNumericAnswerSubmission({
      state: answerStateRef.current,
      gate: submissionGate,
      submit: (rawAnswer) => submitPracticeAnswer(problem.problemId, rawAnswer),
      onPending: updateAnswerState,
    }).then((nextState) => {
      if (nextState) {
        updateAnswerState(nextState);
      }
    });
  }

  function handleFinish() {
    if (completionLatch.current || restorePendingRef.current) return;
    const nextSummary = requestPracticeFinish(
      answerStateRef.current,
      () => window.confirm(DIRTY_FINISH_MESSAGE),
      hintRevealGate.current || solutionRevealGate.current,
    );

    if (nextSummary) {
      if (!onFinish(nextSummary, answerStateRef.current))
        setStorageError("finish");
    }
  }

  function handleNextProblem() {
    if (completionLatch.current || restorePendingRef.current) return;
    const nextSummary = requestPracticeFinish(
      answerStateRef.current,
      () => window.confirm(DIRTY_NEXT_MESSAGE),
      hintRevealGate.current || solutionRevealGate.current,
    );

    if (
      nextSummary &&
      isPracticeProblemNavigationComplete(answerStateRef.current)
    ) {
      onNextProblem(nextSummary);
    }
  }

  function handleSkip() {
    if (completionLatch.current || restorePendingRef.current) return;
    const nextSummary = requestPracticeSkip(
      answerStateRef.current,
      hasNextProblem,
      () => window.confirm(DIRTY_SKIP_MESSAGE),
      hintRevealGate.current || solutionRevealGate.current,
    );

    if (nextSummary) {
      onSkip(nextSummary);
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
    if (completionLatch.current) return;
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
    if (completionLatch.current) return;
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

  return (
    <TaskShell
      answerRail={
        <div className={styles["answer-rail"]}>
          <ShortNumericAnswer
            onAnswerChange={handleAnswerChange}
            onSubmit={handleAnswerSubmit}
            state={answerState}
          />

          {storageError ? (
            <p aria-atomic="true" className={styles["hint-error"]} role="alert">
              {storageError === "pause"
                ? "Не удалось сохранить тренировку. Попробуй ещё раз."
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

          {canSkipProblem ? (
            <button
              className={styles["hint-action"]}
              onClick={handleSkip}
              type="button"
            >
              Пропустить задачу
            </button>
          ) : null}

          {canOpenNextProblem ? (
            <button
              className={styles["next-action"]}
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
          disabled={isPending || supportRevealPending || restorePending}
          onClick={handlePause}
          type="button"
        >
          ← На главную
        </button>
      }
      finishAction={
        <button
          className={styles.finish}
          disabled={isPending || supportRevealPending || restorePending}
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

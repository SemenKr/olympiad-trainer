"use client";

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
  requestFocusHintReveal,
  requestNextStepHintReveal,
  requestPracticeFinish,
  requestSolutionReveal,
  requestStrategyHintReveal,
  runPracticeHintReveal,
  runPracticeSolutionReveal,
  type SuccessfulHintReveal,
  type SuccessfulSolutionReveal,
} from "./practice-session-state";
import styles from "./practice-session.module.scss";
import { SessionSummary } from "./session-summary";
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
} from "./two-problem-session-state";

type PracticeSessionProps = Readonly<{
  problems: readonly [LearnerSafePracticeProblem, LearnerSafePracticeProblem];
}>;

type PracticeProblemEpisodeProps = Readonly<{
  problem: LearnerSafePracticeProblem;
  hasNextProblem: boolean;
  focusHeadingOnMount: boolean;
  onFinish: (summary: PracticeSummary) => void;
  onNextProblem: (summary: PracticeSummary) => void;
  onSkip: (summary: PracticeSummary) => void;
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

export function PracticeSession({ problems }: PracticeSessionProps) {
  const [sessionState, setSessionState] = useState(startTwoProblemSession);
  const [sessionResults, setSessionResults] = useState<
    readonly PracticeSessionResult[] | null
  >(null);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const activeProblem = problems[sessionState.activeProblemIndex];

  useEffect(() => {
    if (sessionResults) {
      summaryHeadingRef.current?.focus();
    }
  }, [sessionResults]);

  if (sessionResults) {
    return (
      <SessionSummary headingRef={summaryHeadingRef} results={sessionResults} />
    );
  }

  function handleNextProblem(summary: PracticeSummary) {
    const result = createPracticeSessionResult(activeProblem, summary);
    const nextSession = advanceTwoProblemSession(sessionState, result);

    if (nextSession) {
      setSessionState(nextSession);
    }
  }

  function handleFinish(summary: PracticeSummary) {
    const result = createPracticeSessionResult(activeProblem, summary);
    setSessionResults(finishTwoProblemSession(sessionState, result));
  }

  function handleSkip(summary: PracticeSummary) {
    const result = createPracticeSessionResult(
      activeProblem,
      summary,
      "skipped",
    );
    const nextSession = advanceTwoProblemSession(sessionState, result);

    if (nextSession) {
      setSessionState(nextSession);
    }
  }

  return (
    <PracticeProblemEpisode
      focusHeadingOnMount={sessionState.activeProblemIndex > 0}
      hasNextProblem={sessionState.activeProblemIndex === 0}
      key={activeProblem.problemId}
      onFinish={handleFinish}
      onNextProblem={handleNextProblem}
      onSkip={handleSkip}
      problem={activeProblem}
    />
  );
}

function PracticeProblemEpisode({
  problem,
  hasNextProblem,
  focusHeadingOnMount,
  onFinish,
  onNextProblem,
  onSkip,
}: PracticeProblemEpisodeProps) {
  const [focusHint, strategyHint, nextStepHint] = problem.hints;
  const [answerState, setAnswerState] = useState(createShortNumericAnswerState);
  const [revealedHints, setRevealedHints] = useState<
    readonly RevealedPracticeHint[]
  >([]);
  const [revealedSolution, setRevealedSolution] =
    useState<RevealedPracticeSolution | null>(null);
  const [pendingHintId, setPendingHintId] = useState<string | null>(null);
  const [isSolutionRevealPending, setIsSolutionRevealPending] = useState(false);
  const [hintRevealFailed, setHintRevealFailed] = useState(false);
  const [solutionRevealFailed, setSolutionRevealFailed] = useState(false);
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
    hasNextProblem && navigationComplete && !supportRevealPending;
  const canSkipProblem = isPracticeProblemSkipAvailable(
    answerState,
    hasNextProblem,
    supportRevealPending,
  );

  useEffect(() => {
    if (focusHeadingOnMount) {
      problemHeadingRef.current?.focus();
    }
  }, [focusHeadingOnMount]);

  useEffect(() => {
    if (revealedFocusHint && focusHintExposure) {
      focusHintHeadingRef.current?.focus();
    }
  }, [focusHintExposure, revealedFocusHint]);

  useEffect(() => {
    if (revealedStrategyHint && strategyHintExposure) {
      strategyHintHeadingRef.current?.focus();
    }
  }, [revealedStrategyHint, strategyHintExposure]);

  useEffect(() => {
    if (revealedNextStepHint && nextStepHintExposure) {
      nextStepHintHeadingRef.current?.focus();
    }
  }, [revealedNextStepHint, nextStepHintExposure]);

  useEffect(() => {
    if (revealedSolution && answerState.practice.solutionExposure) {
      solutionHeadingRef.current?.focus();
    }
  }, [answerState.practice.solutionExposure, revealedSolution]);

  function updateAnswerState(nextState: ShortNumericAnswerState) {
    answerStateRef.current = nextState;
    setAnswerState(nextState);
  }

  function handleAnswerChange(rawAnswer: string) {
    updateAnswerState(
      editShortNumericAnswer(answerStateRef.current, rawAnswer),
    );
  }

  function handleAnswerSubmit() {
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
    const nextSummary = requestPracticeFinish(
      answerStateRef.current,
      () => window.confirm(DIRTY_FINISH_MESSAGE),
      hintRevealGate.current || solutionRevealGate.current,
    );

    if (nextSummary) {
      onFinish(nextSummary);
    }
  }

  function handleNextProblem() {
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

          {hintRevealFailed ? <PracticeHintRevealError /> : null}

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
        <button disabled type="button">
          ← Назад
        </button>
      }
      finishAction={
        <button
          className={styles.finish}
          disabled={
            isPending || pendingHintId !== null || isSolutionRevealPending
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

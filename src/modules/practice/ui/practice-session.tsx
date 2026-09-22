"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

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
import { TaskShell } from "./task-shell";

type PracticeSessionProps = Readonly<{
  problem: LearnerSafePracticeProblem;
  header: ReactNode;
  taskContent: ReactNode;
}>;

const DIRTY_FINISH_MESSAGE =
  "Ответ ещё не отправлен. Завершить тренировку и удалить его?";
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

export function PracticeSession({
  problem,
  header,
  taskContent,
}: PracticeSessionProps) {
  const [focusHint, strategyHint, nextStepHint] = problem.hints;
  const [answerState, setAnswerState] = useState(createShortNumericAnswerState);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
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
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
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

  useEffect(() => {
    if (summary) {
      summaryHeadingRef.current?.focus();
    }
  }, [summary]);

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
      setSummary(nextSummary);
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

  if (summary) {
    return (
      <SessionSummary
        headingRef={summaryHeadingRef}
        problemTitle={problem.title}
        summary={summary}
      />
    );
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
      header={header}
    >
      {taskContent}
    </TaskShell>
  );
}

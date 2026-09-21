"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { submitPracticeAnswer } from "@/app/practice/actions";

import type { PracticeSummary } from "../application/practice-state";
import {
  isFocusHintAvailable,
  isStrategyHintAvailable,
  openFocusHint,
  openStrategyHint,
  requestPracticeFinish,
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
  problemTitle: string;
  focusHint: Readonly<{
    id: string;
    level: "focus";
    text: string;
  }>;
  strategyHint: Readonly<{
    id: string;
    level: "strategy";
    text: string;
  }>;
  header: ReactNode;
  taskContent: ReactNode;
}>;

const DIRTY_FINISH_MESSAGE =
  "Ответ ещё не отправлен. Завершить тренировку и удалить его?";

export function PracticeSession({
  problemTitle,
  focusHint,
  strategyHint,
  header,
  taskContent,
}: PracticeSessionProps) {
  const [answerState, setAnswerState] = useState(createShortNumericAnswerState);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const answerStateRef = useRef(answerState);
  const submissionGate = useRef(false);
  const focusHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const strategyHintHeadingRef = useRef<HTMLHeadingElement>(null);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const isPending = answerState.status === "loading";
  const focusHintExposure = answerState.practice.hintExposures.find(
    (exposure) => exposure.hintId === focusHint.id,
  );
  const strategyHintExposure = answerState.practice.hintExposures.find(
    (exposure) => exposure.hintId === strategyHint.id,
  );
  const canOpenFocusHint = isFocusHintAvailable(answerState, focusHint.id);
  const canOpenStrategyHint = isStrategyHintAvailable(
    answerState,
    focusHint.id,
    strategyHint.id,
  );

  useEffect(() => {
    if (summary) {
      summaryHeadingRef.current?.focus();
    }
  }, [summary]);

  useEffect(() => {
    if (focusHintExposure) {
      focusHintHeadingRef.current?.focus();
    }
  }, [focusHintExposure]);

  useEffect(() => {
    if (strategyHintExposure) {
      strategyHintHeadingRef.current?.focus();
    }
  }, [strategyHintExposure]);

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
      submit: submitPracticeAnswer,
      onPending: updateAnswerState,
    }).then((nextState) => {
      if (nextState) {
        updateAnswerState(nextState);
      }
    });
  }

  function handleFinish() {
    const nextSummary = requestPracticeFinish(answerStateRef.current, () =>
      window.confirm(DIRTY_FINISH_MESSAGE),
    );

    if (nextSummary) {
      setSummary(nextSummary);
    }
  }

  function handleFocusHintOpen() {
    updateAnswerState(openFocusHint(answerStateRef.current, focusHint.id));
  }

  function handleStrategyHintOpen() {
    updateAnswerState(
      openStrategyHint(answerStateRef.current, focusHint.id, strategyHint.id),
    );
  }

  if (summary) {
    return (
      <SessionSummary
        headingRef={summaryHeadingRef}
        problemTitle={problemTitle}
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

          {focusHintExposure ? (
            <aside className={styles.hint}>
              <h2 ref={focusHintHeadingRef} tabIndex={-1}>
                Подсказка 1
              </h2>
              <p>{focusHint.text}</p>
            </aside>
          ) : canOpenFocusHint ? (
            <button
              className={styles["hint-action"]}
              onClick={handleFocusHintOpen}
              type="button"
            >
              Подсказка
            </button>
          ) : null}

          {canOpenStrategyHint ? (
            <button
              className={styles["hint-action"]}
              onClick={handleStrategyHintOpen}
              type="button"
            >
              Следующая подсказка
            </button>
          ) : null}

          {strategyHintExposure ? (
            <aside className={styles.hint}>
              <h2 ref={strategyHintHeadingRef} tabIndex={-1}>
                Подсказка 2
              </h2>
              <p>{strategyHint.text}</p>
            </aside>
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
          disabled={isPending}
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

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { submitPracticeAnswer } from "@/app/practice/actions";

import type { PracticeSummary } from "../application/practice-state";
import {
  isFocusHintAvailable,
  openFocusHint,
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
  header: ReactNode;
  taskContent: ReactNode;
}>;

const DIRTY_FINISH_MESSAGE =
  "Ответ ещё не отправлен. Завершить тренировку и удалить его?";

export function PracticeSession({
  problemTitle,
  focusHint,
  header,
  taskContent,
}: PracticeSessionProps) {
  const [answerState, setAnswerState] = useState(createShortNumericAnswerState);
  const [summary, setSummary] = useState<PracticeSummary | null>(null);
  const answerStateRef = useRef(answerState);
  const submissionGate = useRef(false);
  const hintHeadingRef = useRef<HTMLHeadingElement>(null);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const isPending = answerState.status === "loading";
  const hintExposure = answerState.practice.hintExposures.find(
    (exposure) => exposure.hintId === focusHint.id,
  );
  const canOpenHint = isFocusHintAvailable(answerState, focusHint.id);

  useEffect(() => {
    if (summary) {
      summaryHeadingRef.current?.focus();
    }
  }, [summary]);

  useEffect(() => {
    if (hintExposure) {
      hintHeadingRef.current?.focus();
    }
  }, [hintExposure]);

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

  function handleHintOpen() {
    updateAnswerState(openFocusHint(answerStateRef.current, focusHint.id));
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

          {hintExposure ? (
            <aside className={styles.hint}>
              <h2 ref={hintHeadingRef} tabIndex={-1}>
                Подсказка
              </h2>
              <p>{focusHint.text}</p>
            </aside>
          ) : canOpenHint ? (
            <button
              className={styles["hint-action"]}
              onClick={handleHintOpen}
              type="button"
            >
              Подсказка
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

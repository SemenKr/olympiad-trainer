"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { submitPracticeAnswer } from "@/app/practice/actions";

import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  runShortNumericAnswerSubmission,
  type ShortNumericAnswerState,
  type ShortNumericAnswerStatus,
} from "./short-numeric-answer-state";
import styles from "./short-numeric-answer.module.scss";

type FeedbackContent = Readonly<{
  tone: "neutral" | "success" | "error" | "system";
  title: string;
  message: string;
}>;

function getFeedback(status: ShortNumericAnswerStatus): FeedbackContent | null {
  switch (status) {
    case "loading":
      return {
        tone: "neutral",
        title: "Проверяем ответ",
        message: "Подожди немного.",
      };
    case "incorrect":
      return {
        tone: "error",
        title: "Пока неверно",
        message: "Проверь ответ и попробуй ещё раз.",
      };
    case "correct":
      return {
        tone: "success",
        title: "Верно",
        message: "Ответ засчитан.",
      };
    case "system":
      return {
        tone: "system",
        title: "Не удалось проверить",
        message: "Попробуй ещё раз. Этот ответ не засчитан как попытка.",
      };
    default:
      return null;
  }
}

function getSubmitLabel(status: ShortNumericAnswerStatus): string {
  switch (status) {
    case "loading":
      return "Проверяем…";
    case "incorrect":
      return "Проверить ещё раз";
    case "correct":
      return "Ответ принят";
    default:
      return "Проверить";
  }
}

export function ShortNumericAnswer() {
  const formId = useId();
  const inputId = useId();
  const helperId = useId();
  const errorId = useId();
  const feedbackId = useId();
  const [state, setState] = useState(createShortNumericAnswerState);
  const stateRef = useRef(state);
  const submissionGate = useRef(false);
  const feedback = getFeedback(state.status);
  const feedbackIsAlert =
    feedback?.tone === "error" || feedback?.tone === "system";
  const isLoading = state.status === "loading";
  const isInvalid = state.status === "invalid";
  const describedBy = [
    helperId,
    isInvalid ? errorId : null,
    feedback ? feedbackId : null,
  ]
    .filter(Boolean)
    .join(" ");
  const feedbackPanel = feedback ? (
    <div className={styles.feedback} data-tone={feedback.tone} id={feedbackId}>
      <p className={styles["feedback-title"]}>{feedback.title}</p>
      <p className={styles["feedback-message"]}>{feedback.message}</p>
    </div>
  ) : null;

  function updateState(nextState: ShortNumericAnswerState) {
    stateRef.current = nextState;
    setState(nextState);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void runShortNumericAnswerSubmission({
      state: stateRef.current,
      gate: submissionGate,
      submit: submitPracticeAnswer,
      onPending: updateState,
    }).then((nextState) => {
      if (nextState) {
        updateState(nextState);
      }
    });
  }

  return (
    <div className={styles.interaction}>
      <form
        aria-busy={isLoading}
        className={styles.form}
        id={formId}
        onSubmit={handleSubmit}
      >
        <div className={styles["answer-format"]}>
          <p className={styles.helper} id={helperId}>
            Введи целое неотрицательное число.
          </p>

          <div className={styles.field}>
            <label htmlFor={inputId}>Ответ</label>
            <input
              aria-describedby={describedBy}
              aria-errormessage={isInvalid ? errorId : undefined}
              aria-invalid={isInvalid || state.status === "incorrect"}
              autoComplete="off"
              data-state={state.status}
              id={inputId}
              inputMode="numeric"
              name="answer"
              onChange={(event) => {
                updateState(
                  editShortNumericAnswer(
                    stateRef.current,
                    event.currentTarget.value,
                  ),
                );
              }}
              placeholder="Введи ответ"
              readOnly={isLoading}
              type="text"
              value={state.rawAnswer}
            />

            {isInvalid ? (
              <p className={styles["field-error"]} id={errorId} role="alert">
                Проверь формат ответа. Эта отправка не считается попыткой.
              </p>
            ) : null}
          </div>
        </div>
      </form>

      <div aria-atomic="true" className={styles.announcement} role="status">
        {!feedbackIsAlert ? feedbackPanel : null}
      </div>
      <div aria-atomic="true" className={styles.announcement} role="alert">
        {feedbackIsAlert ? feedbackPanel : null}
      </div>

      <button
        aria-disabled={isLoading || state.status === "correct"}
        className={styles.submit}
        form={formId}
        type="submit"
      >
        {getSubmitLabel(state.status)}
      </button>
    </div>
  );
}

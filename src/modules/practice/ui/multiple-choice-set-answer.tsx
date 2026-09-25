"use client";

import { useId, type FormEvent } from "react";

import type { MultipleChoiceSetAnswerState } from "./multiple-choice-set-answer-state";
import styles from "./short-numeric-answer.module.scss";

export function MultipleChoiceSetAnswer({
  state,
  options,
  onOptionToggle,
  onSubmit,
  locked = false,
}: Readonly<{
  state: MultipleChoiceSetAnswerState;
  options: readonly Readonly<{ id: string; label: string }>[];
  onOptionToggle: (optionId: string) => void;
  onSubmit: () => void;
  locked?: boolean;
}>) {
  const formId = useId();
  const helperId = useId();
  const errorId = useId();
  const feedbackId = useId();
  const isLoading = state.status === "loading";
  const isInvalid = state.status === "invalid";
  const feedback =
    state.status === "incorrect"
      ? {
          tone: "error",
          title: "Пока неверно",
          message: "Проверь ответ и попробуй ещё раз.",
        }
      : state.status === "correct"
        ? { tone: "success", title: "Верно", message: "Ответ засчитан." }
        : state.status === "system"
          ? {
              tone: "system",
              title: "Не удалось проверить",
              message: "Попробуй ещё раз. Этот ответ не засчитан как попытка.",
            }
          : state.status === "loading"
            ? {
                tone: "neutral",
                title: "Проверяем ответ",
                message: "Подожди немного.",
              }
            : null;
  const feedbackPanel = feedback ? (
    <div className={styles.feedback} data-tone={feedback.tone} id={feedbackId}>
      <p className={styles["feedback-title"]}>{feedback.title}</p>
      <p className={styles["feedback-message"]}>{feedback.message}</p>
    </div>
  ) : null;
  const isAlert = feedback?.tone === "error" || feedback?.tone === "system";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div className={styles.interaction}>
      <form
        aria-busy={isLoading}
        className={styles.form}
        id={formId}
        onSubmit={handleSubmit}
      >
        <fieldset
          aria-describedby={[
            helperId,
            isInvalid ? errorId : null,
            feedback ? feedbackId : null,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-invalid={isInvalid || state.status === "incorrect"}
          className={styles["choice-set"]}
          disabled={isLoading || locked || state.status === "correct"}
        >
          <legend>Ответ</legend>
          <p className={styles.helper} id={helperId}>
            Выбери все подходящие варианты.
          </p>
          {options.map((option) => (
            <label className={styles.choice} key={option.id}>
              <input
                checked={state.selectedOptionIds.includes(option.id)}
                name="answer"
                onChange={() => onOptionToggle(option.id)}
                type="checkbox"
                value={option.id}
              />
              {option.label}
            </label>
          ))}
          {isInvalid ? (
            <p className={styles["field-error"]} id={errorId} role="alert">
              Выбери хотя бы один вариант. Эта отправка не считается попыткой.
            </p>
          ) : null}
        </fieldset>
      </form>
      <div aria-atomic="true" className={styles.announcement} role="status">
        {!isAlert ? feedbackPanel : null}
      </div>
      <div aria-atomic="true" className={styles.announcement} role="alert">
        {isAlert ? feedbackPanel : null}
      </div>
      <button
        aria-disabled={isLoading || locked || state.status === "correct"}
        className={styles.submit}
        form={formId}
        type="submit"
      >
        {isLoading
          ? "Проверяем…"
          : state.status === "correct"
            ? "Ответ принят"
            : state.status === "incorrect"
              ? "Проверить ещё раз"
              : "Проверить"}
      </button>
    </div>
  );
}

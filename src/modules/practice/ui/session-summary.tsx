import Link from "next/link";
import type { RefObject } from "react";

import type { PracticeSummary } from "../application/practice-state";
import styles from "./session-summary.module.scss";

type SessionSummaryProps = Readonly<{
  summary: PracticeSummary;
  problemTitle: string;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}>;

function getRemainingText(outcome: PracticeSummary["outcome"]): string | null {
  switch (outcome) {
    case "no-valid-submissions":
      return "В этой тренировке по задаче не было проверенного ответа.";
    case "incorrect-only":
      return "Были проверенные попытки, но правильный ответ в этой тренировке не был получен.";
    case "eventually-correct":
      return null;
  }
}

export function SessionSummary({
  summary,
  problemTitle,
  headingRef,
}: SessionSummaryProps) {
  const remainingText = getRemainingText(summary.outcome);
  const isSolved = summary.outcome === "eventually-correct";
  const usedHint = summary.hintExposures.length > 0;

  return (
    <main className={styles.summary}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Итоги тренировки</p>
        <h1 ref={headingRef} tabIndex={-1}>
          Тренировка завершена
        </h1>
      </header>

      {remainingText ? (
        <section className={styles.section}>
          <h2>Что осталось</h2>
          <p>{remainingText}</p>
        </section>
      ) : (
        <section className={styles.section}>
          <h2>Что получилось</h2>
          <p>
            {usedHint
              ? "За эту тренировку ты решил одну задачу с подсказкой."
              : "В этой тренировке ты решил задачу самостоятельно."}
          </p>
        </section>
      )}

      {isSolved ? (
        <section className={styles.section}>
          <h2>Результаты задач</h2>
          <div className={styles.result}>
            <h3>
              {usedHint ? "Получилось с подсказкой" : "Решено самостоятельно"}
            </h3>
            <p>{problemTitle}</p>
          </div>
        </section>
      ) : null}

      <div aria-label="Действия после тренировки" className={styles.actions}>
        <Link className={styles.primary} href="/">
          На главную
        </Link>
        <button className={styles.secondary} disabled type="button">
          Мой прогресс
        </button>
      </div>
    </main>
  );
}

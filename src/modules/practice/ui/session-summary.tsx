import Link from "next/link";
import type { RefObject } from "react";

import type { PracticeSummary } from "../application/practice-state";
import styles from "./session-summary.module.scss";
import type { PracticeSessionResult } from "./two-problem-session-state";

type SessionSummaryProps = Readonly<{
  results: readonly PracticeSessionResult[];
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

export function getPracticeResultLabel(
  summary: PracticeSummary,
): string | null {
  if (summary.solutionExposure) {
    return "Посмотрено полное решение";
  }

  if (summary.outcome !== "eventually-correct") {
    return null;
  }

  return summary.hintExposures.length > 0
    ? "Получилось с подсказкой"
    : "Решено самостоятельно";
}

function getSuccessOverview(results: readonly PracticeSessionResult[]) {
  const labels = results.map((result) =>
    getPracticeResultLabel(result.summary),
  );
  const independentCount = labels.filter(
    (label) => label === "Решено самостоятельно",
  ).length;
  const supportedCount = labels.filter(
    (label) => label === "Получилось с подсказкой",
  ).length;

  if (independentCount === results.length && results.length > 1) {
    return "Все задачи этой тренировки решены самостоятельно.";
  }

  return [
    independentCount === 1 ? "Одну задачу ты решил сам." : null,
    supportedCount === 1 ? "В одной задаче получилось с подсказкой." : null,
    independentCount === 2 ? "Две задачи ты решил самостоятельно." : null,
    supportedCount === 2 ? "В двух задачах получилось с подсказкой." : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function SessionSummary({ results, headingRef }: SessionSummaryProps) {
  const presentedResults = results.flatMap((result) => {
    const label = getPracticeResultLabel(result.summary);

    return label ? [{ ...result, label }] : [];
  });
  const remainingResults = results.filter(
    (result) => result.summary.outcome !== "eventually-correct",
  );
  const successOverview = getSuccessOverview(results);

  const remainingText = remainingResults
    .map((result) => getRemainingText(result.summary.outcome))
    .filter(Boolean)
    .join(" ");

  const singleResult = results.length === 1 ? results[0] : null;
  const singleLabel = singleResult
    ? getPracticeResultLabel(singleResult.summary)
    : null;
  const singleOverview =
    singleLabel === "Решено самостоятельно"
      ? "В этой тренировке ты решил задачу самостоятельно."
      : singleLabel === "Получилось с подсказкой"
        ? "За эту тренировку ты решил одну задачу с подсказкой."
        : "";
  const overview = singleResult ? singleOverview : successOverview;

  const showSuccessOverview = overview.length > 0;

  return (
    <main className={styles.summary}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Итоги тренировки</p>
        <h1 ref={headingRef} tabIndex={-1}>
          Тренировка завершена
        </h1>
      </header>

      {showSuccessOverview ? (
        <section className={styles.section}>
          <h2>Что получилось</h2>
          <p>{overview}</p>
        </section>
      ) : null}

      {remainingText ? (
        <section className={styles.section}>
          <h2>Что осталось</h2>
          <p>{remainingText}</p>
        </section>
      ) : null}

      {presentedResults.length > 0 ? (
        <section className={styles.section}>
          <h2>Результаты задач</h2>
          <div className={styles.results}>
            {presentedResults.map((result) => (
              <div className={styles.result} key={result.problemId}>
                <h3>{result.label}</h3>
                <p>{result.problemTitle}</p>
              </div>
            ))}
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

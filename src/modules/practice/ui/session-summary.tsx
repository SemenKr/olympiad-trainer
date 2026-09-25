import Link from "next/link";
import type { RefObject } from "react";

import type { PracticeSummary } from "../application/practice-state";
import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";
import styles from "./session-summary.module.scss";
import type { PracticeSessionResult } from "./two-problem-session-state";

type SessionSummaryProps = Readonly<{
  results: readonly PracticeSessionResult[];
  reasoningInterpretation?: ReasoningCheckpointInterpretation | null;
  headingRef?: RefObject<HTMLHeadingElement | null>;
}>;

export function getPracticeRemainingText(
  outcome: PracticeSummary["outcome"],
  problemTitle?: string,
): string | null {
  switch (outcome) {
    case "no-valid-submissions":
      return problemTitle
        ? `По задаче «${problemTitle}» не было проверенного ответа.`
        : "В этой тренировке по задаче не было проверенного ответа.";
    case "incorrect-only":
      return problemTitle
        ? `По задаче «${problemTitle}» были проверенные попытки, но правильный ответ не был получен.`
        : "Были проверенные попытки, но правильный ответ в этой тренировке не был получен.";
    case "eventually-correct":
      return null;
  }
}

export function getPracticeResultLabel(
  summary: PracticeSummary,
  taskOutcome?: PracticeSessionResult["taskOutcome"],
): string | null {
  if (taskOutcome === "skipped") {
    return "Задача пропущена";
  }

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
    getPracticeResultLabel(result.summary, result.taskOutcome),
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

export function SessionSummary({
  results,
  reasoningInterpretation,
  headingRef,
}: SessionSummaryProps) {
  const presentedResults = results.flatMap((result) => {
    const label = getPracticeResultLabel(result.summary, result.taskOutcome);

    return label ? [{ ...result, label }] : [];
  });
  const remainingResults = results.filter(
    (result) =>
      result.taskOutcome !== "skipped" &&
      result.summary.outcome !== "eventually-correct",
  );
  const successOverview = getSuccessOverview(results);

  const remainingText = remainingResults
    .map((result) =>
      getPracticeRemainingText(
        result.summary.outcome,
        results.length > 1 ? result.problemTitle : undefined,
      ),
    )
    .filter(Boolean)
    .join(" ");

  const singleResult = results.length === 1 ? results[0] : null;
  const singleLabel = singleResult
    ? getPracticeResultLabel(singleResult.summary, singleResult.taskOutcome)
    : null;
  const singleOverview =
    singleLabel === "Решено самостоятельно"
      ? "В этой тренировке ты решил задачу самостоятельно."
      : singleLabel === "Получилось с подсказкой"
        ? "За эту тренировку ты решил одну задачу с подсказкой."
        : "";
  const overview = singleResult ? singleOverview : successOverview;

  const showSuccessOverview = overview.length > 0;
  const sockResult = results.find(
    (result) => result.problemId === "guaranteed-sock-pair",
  );
  const reasoning = sockResult
    ? (reasoningInterpretation ?? {
        learnerLabel: "Как гарантировать результат",
        progressGroup: null,
        conclusion: "Пока рано сказать",
      })
    : null;

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

      {reasoning ? (
        <section className={styles.section}>
          <h2>{reasoning.learnerLabel}</h2>
          {reasoning.progressGroup ? <p>{reasoning.progressGroup}</p> : null}
          <p>{reasoning.conclusion}</p>
        </section>
      ) : null}

      <div aria-label="Действия после тренировки" className={styles.actions}>
        <Link className={styles.primary} href="/">
          На главную
        </Link>
        <Link className={styles.secondary} href="/progress">
          Мой прогресс
        </Link>
      </div>
    </main>
  );
}

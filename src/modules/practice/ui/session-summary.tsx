import Link from "next/link";
import type { RefObject } from "react";
import { HomeNavigation } from "../../../app/home-navigation";

import type { PracticeSummary } from "../application/practice-state";
import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";
import styles from "./session-summary.module.scss";
import type { PracticeSessionResult } from "./two-problem-session-state";
import {
  packById,
  packHref,
  packIdFromProblemIds,
  type PackId,
} from "../application/completed-practice-episode";
import { getLearningPathProjection } from "../application/learning-path";
import {
  getPracticeJourneyLevel,
  getPracticeJourneyRewardDelta,
  type PracticeJourneyFinish,
} from "../application/practice-journey";

type SessionSummaryProps = Readonly<{
  results: readonly PracticeSessionResult[];
  reasoningInterpretation?: ReasoningCheckpointInterpretation | null;
  tableInterpretation?: ReasoningCheckpointInterpretation | null;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  journeyFinish?: PracticeJourneyFinish | null;
  completedPackIds?: readonly PackId[] | null;
  mode?: "review";
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
    supportedCount === 3 ? "В трёх задачах получилось с подсказкой." : null,
  ]
    .filter(Boolean)
    .join(" ");
}

export function SessionSummary({
  results,
  reasoningInterpretation,
  tableInterpretation,
  headingRef,
  journeyFinish,
  completedPackIds,
  mode,
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
  const encouragement =
    mode === "review"
      ? "Хорошая работа — ты завершил повторную попытку. Теперь можно спокойно посмотреть на её результат."
      : "Хорошая работа — ты завершил тренировку. Теперь можно спокойно посмотреть, что получилось и что осталось.";

  const showSuccessOverview = overview.length > 0;
  const journeyReward =
    journeyFinish && journeyFinish.earnedXp > 0
      ? getPracticeJourneyRewardDelta(
          Math.max(0, journeyFinish.totalXp - journeyFinish.earnedXp),
          journeyFinish.totalXp,
        )
      : null;
  const journeyLevel =
    journeyFinish && journeyFinish.earnedXp > 0
      ? getPracticeJourneyLevel(journeyFinish.totalXp)
      : null;
  const hasJourneyCelebration =
    journeyReward !== null &&
    (journeyReward.newLevel !== null || journeyReward.newBadges.length > 0);
  const completedPackId =
    mode === undefined
      ? packIdFromProblemIds(results.map((result) => result.problemId))
      : null;
  const learningPath =
    completedPackId && completedPackIds
      ? getLearningPathProjection(completedPackIds)
      : null;
  const nextPathPack =
    learningPath?.nextPackId ? packById(learningPath.nextPackId) : null;
  const sockResult = results.find(
    (result) =>
      result.problemId === "guaranteed-sock-pair" ||
      result.problemId === "parrots-guaranteed-colors",
  );
  const reasoning = sockResult
    ? (reasoningInterpretation ?? {
        learnerLabel: "Как гарантировать результат",
        progressGroup: null,
        conclusion: "Пока рано сказать",
      })
    : null;
  const tableResult = results.find(
    (result) =>
      result.problemId === "table-impossible-sums" ||
      result.problemId === "brothers-ages-products",
  );
  const tableReasoning = tableResult
    ? (tableInterpretation ?? {
        learnerLabel: "Доказывать, что что-то невозможно",
        progressGroup: null,
        conclusion: "Пока рано сказать",
      })
    : null;

  return (
    <main className={styles.summary}>
      <HomeNavigation current="Итоги" />
      <div className={styles.content}>
        <div className={styles.learning}>
          <header className={styles.header}>
            <p className={styles.eyebrow}>Итоги тренировки</p>
            <h1 ref={headingRef} tabIndex={-1}>
              {mode === "review"
                ? "Повторная попытка завершена"
                : "Тренировка завершена"}
            </h1>
            <p className={styles.encouragement}>{encouragement}</p>
            <p>
              Здесь только факты об этой тренировке — не оценка твоих
              способностей.
            </p>
          </header>

          {mode === "review" ? (
            <p>
              Это отдельная попытка знакомой задачи. Она не меняет выводы о
              навыках и выбор следующей полезной задачи.
            </p>
          ) : null}
          {showSuccessOverview ? (
            <section className={`${styles.section} ${styles.success}`}>
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
                    <h3>{result.problemTitle}</h3>
                    <p>{result.label}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {reasoning ? (
            <section className={styles.section}>
              <h2>{reasoning.learnerLabel}</h2>
              {reasoning.progressGroup ? (
                <p>{reasoning.progressGroup}</p>
              ) : null}
              <p>{reasoning.conclusion}</p>
            </section>
          ) : null}
          {tableReasoning ? (
            <section className={styles.section}>
              <h2>{tableReasoning.learnerLabel}</h2>
              {tableReasoning.progressGroup ? (
                <p>{tableReasoning.progressGroup}</p>
              ) : null}
              <p>{tableReasoning.conclusion}</p>
            </section>
          ) : null}
        </div>
        <aside
          className={styles.sidebar}
          aria-label="Путь практики и следующие действия"
        >
          {journeyFinish && journeyFinish.earnedXp > 0 && journeyLevel ? (
            <section
              aria-live="polite"
              className={`${styles.section} ${hasJourneyCelebration ? styles.celebration : ""}`}
            >
              <h2>
                {hasJourneyCelebration ? "Награда за путь" : "Путь практики"}
              </h2>
              {journeyReward?.newLevel ? (
                <div className={styles.reward}>
                  <span aria-hidden="true" className={styles["reward-icon"]}>
                    ★
                  </span>
                  <div>
                    <p className={styles["reward-kicker"]}>
                      Новый уровень пути
                    </p>
                    <h3>
                      Уровень пути {journeyReward.newLevel.level} ·{" "}
                      {journeyReward.newLevel.label}
                    </h3>
                  </div>
                </div>
              ) : null}
              {journeyReward?.newBadges.map((badge) => (
                <div className={styles.reward} key={badge.threshold}>
                  <span aria-hidden="true" className={styles["reward-icon"]}>
                    ★
                  </span>
                  <div>
                    <p className={styles["reward-kicker"]}>Новая медаль</p>
                    <h3>{badge.label}</h3>
                  </div>
                </div>
              ))}
              {!hasJourneyCelebration ? (
                <p>
                  Уровень пути {journeyLevel.level} · {journeyLevel.label}
                </p>
              ) : null}
              <p className={styles.xp}>+{journeyFinish.earnedXp} XP</p>
              <p>За эту тренировку</p>
              <p>Всего {journeyFinish.totalXp} XP</p>
              <p>XP показывает участие, а не уровень знаний.</p>
              <p>Уровень пути и медали тоже показывают участие.</p>
            </section>
          ) : null}

          <div
            aria-label="Действия после тренировки"
            className={styles.actions}
          >
            <h2>Что дальше</h2>
            {completedPackId && nextPathPack ? (
              <>
                <p>
                  Следующий ориентир пути — «{nextPathPack.name}». Это не оценка
                  сложности или знаний.
                </p>
                <Link
                  className={styles.primary}
                  href={packHref(nextPathPack.id)}
                >
                  Продолжить путь
                </Link>
              </>
            ) : completedPackId && learningPath?.allRecorded ? (
              <>
                <p>
                  Во всех наборах пути есть сохранённое завершение. Можно
                  выбрать любой набор и пройти его ещё раз.
                </p>
                <Link className={styles.primary} href="/practice/choose">
                  Выбрать тренировку
                </Link>
              </>
            ) : (
              <Link className={styles.primary} href="/">
                На главную
              </Link>
            )}
            {completedPackId ? (
              <Link className={styles.secondary} href="/">
                На главную
              </Link>
            ) : null}
            <Link className={styles.secondary} href="/progress">
              Мой прогресс
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { verifyPersistedReasoningCheckpointObservation } from "./practice/actions";
import {
  readServerAdaptiveAvailability,
  readServerPracticeJourney,
  readServerReviewAvailability,
  readServerLearningPath,
} from "./progress/actions";
import type { AdaptiveAvailability } from "../modules/practice/application/adaptive-availability";
import {
  PRACTICE_PACKS,
  packHref,
  packIdFromProblemIds,
  packById,
  type PackId,
} from "../modules/practice/application/completed-practice-episode";
import {
  getStoredProblemTitle,
  readVerifiedLatestCompletedResults,
  readVerifiedPracticeSessionSnapshot,
  type UnfinishedPracticeSessionSnapshot,
} from "../modules/practice/ui/practice-session-storage";
import {
  getPracticeRemainingText,
  getPracticeResultLabel,
} from "../modules/practice/ui/session-summary";
import type { PracticeSessionResult } from "../modules/practice/ui/two-problem-session-state";
import { ensureServerProgressImported } from "../modules/practice/ui/server-progress-import";
import { HomePracticeJourney } from "../modules/practice/ui/practice-journey";
import { getLearningPathProjection } from "../modules/practice/application/learning-path";

import styles from "./page.module.scss";
import { ReviewEntry } from "../modules/practice/ui/review-entry";

type StoredPractice = Readonly<{
  unfinished: UnfinishedPracticeSessionSnapshot | null;
  completed: readonly PracticeSessionResult[] | null;
  completedSessionId?: string | null;
  completedLoadError?: boolean;
  availability: AdaptiveAvailability;
  hasPracticeHistory: boolean;
  reviewAvailable?: boolean | null;
  completedPackIds?: readonly PackId[] | null;
}>;

export function HomePracticeAction() {
  const [stored, setStored] = useState<StoredPractice | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const [summaryRetryPending, setSummaryRetryPending] = useState(false);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void readVerifiedPracticeSessionSnapshot(
        verifyPersistedReasoningCheckpointObservation,
      )
        .then(async (unfinished) => {
          if (!active) return;
          if (unfinished.value) {
            setStored({
              unfinished: unfinished.value,
              completed: null,
              availability: { status: "insufficient-evidence" },
              hasPracticeHistory: false,
            });
            // A previous Summary is secondary to the recoverable current episode.
            void readVerifiedLatestCompletedResults(
              verifyPersistedReasoningCheckpointObservation,
            ).then(
              (completed) => {
                if (active)
                  setStored((current) =>
                    current
                      ? {
                          ...current,
                          completed: completed.value,
                          completedSessionId: completed.sessionId,
                        }
                      : current,
                  );
              },
              () => {
                if (active)
                  setStored((current) =>
                    current
                      ? { ...current, completedLoadError: true }
                      : current,
                  );
              },
            );
            return;
          }
          const completed = await readVerifiedLatestCompletedResults(
            verifyPersistedReasoningCheckpointObservation,
          );
          let adaptive: Pick<
            StoredPractice,
            | "availability"
            | "hasPracticeHistory"
            | "reviewAvailable"
            | "completedPackIds"
          > = {
            availability: { status: "insufficient-evidence" },
            hasPracticeHistory: false,
            completedPackIds: [],
          };
          if (!unfinished.value) {
            await ensureServerProgressImported();
            const [availability, reviewAvailable, completedPackIds] =
              await Promise.all([
                readServerAdaptiveAvailability(),
                readServerReviewAvailability().catch(() => null),
                readServerLearningPath().catch(() => null),
              ]);
            adaptive = { ...availability, reviewAvailable, completedPackIds };
          }
          if (active)
            setStored({
              unfinished: unfinished.value,
              completed: completed.value,
              completedSessionId: completed.sessionId,
              ...adaptive,
            });
        })
        .catch(() => {
          if (active) setLoadError(true);
        });
    });
    return () => {
      active = false;
    };
  }, [loadRetry]);

  async function retrySummary() {
    if (summaryRetryPending) return;
    setSummaryRetryPending(true);
    try {
      const completed = await readVerifiedLatestCompletedResults(
        verifyPersistedReasoningCheckpointObservation,
      );
      setStored((current) =>
        current
          ? {
              ...current,
              completed: completed.value,
              completedSessionId: completed.sessionId,
              completedLoadError: false,
            }
          : current,
      );
    } catch {
      setStored((current) =>
        current ? { ...current, completedLoadError: true } : current,
      );
    } finally {
      setSummaryRetryPending(false);
    }
  }

  if (loadError) {
    return (
      <HomePracticeLayout>
        <p role="alert">Не удалось проверить сохранённую тренировку.</p>
        <button
          className={styles.primary}
          onClick={() => {
            setLoadError(false);
            setLoadRetry((value) => value + 1);
          }}
          type="button"
        >
          Повторить
        </button>
      </HomePracticeLayout>
    );
  }
  return stored ? (
    <HomePracticeContent
      stored={stored}
      onSummaryRetry={retrySummary}
      summaryRetryPending={summaryRetryPending}
      onPathRetry={() => {
        setStored(null);
        setLoadRetry((value) => value + 1);
      }}
    />
  ) : (
    <HomePracticeLayout>
      <p role="status">Проверяем, есть ли незаконченная тренировка…</p>
    </HomePracticeLayout>
  );
}

export function HomePracticeContent({
  stored,
  onPathRetry,
  onSummaryRetry,
  summaryRetryPending,
}: {
  stored: StoredPractice;
  onPathRetry?: () => void;
  onSummaryRetry?: () => void;
  summaryRetryPending?: boolean;
}) {
  const path =
    stored.completedPackIds === null
      ? null
      : getLearningPathProjection(stored.completedPackIds ?? []);
  const returning = stored.completed !== null || stored.hasPracticeHistory;
  const nextPathPack = path?.nextPackId ? packById(path.nextPackId) : null;
  const neutral =
    !stored.unfinished &&
    stored.availability.status !== "recommendation" &&
    returning &&
    path?.allRecorded === true;
  return (
    <HomePracticeLayout
      stored={stored}
      neutral={neutral}
      onSummaryRetry={onSummaryRetry}
      summaryRetryPending={summaryRetryPending}
    >
      {stored.unfinished ? (
        <section aria-label="Текущая тренировка">
          <h2>Тренировка не закончена</h2>
          {"status" in stored.unfinished ? (
            <p>Можно завершить тренировку и посмотреть итоги.</p>
          ) : (
            <>
              <p>Можно продолжить с того же места.</p>
              <p>{getStoredProblemTitle(stored.unfinished)}</p>
            </>
          )}
          <Link
            className={styles.primary}
            href={
              stored.unfinished.mode === "pack"
                ? packHref(
                    packIdFromProblemIds(
                      "status" in stored.unfinished
                        ? stored.unfinished.completedResults.map(
                            (result) => result.problemId,
                          )
                        : stored.unfinished.problemIds,
                    )!,
                  )
                : stored.unfinished.mode === "review"
                  ? "/practice/review"
                  : "mode" in stored.unfinished
                    ? "/practice/transfer"
                    : "/practice"
            }
          >
            {"status" in stored.unfinished
              ? "Завершить тренировку"
              : "Продолжить тренировку"}
          </Link>
        </section>
      ) : stored.availability.status === "recommendation" ? (
        <section aria-label="Следующая полезная задача">
          <h2>Следующая полезная задача</h2>
          <p>{stored.availability.reason}</p>
          <Link
            className={styles.primary}
            href={
              stored.availability.problemId === "parrots-guaranteed-colors"
                ? "/practice/transfer?problem=parrots-guaranteed-colors"
                : stored.availability.problemId === "pages-without-digit-one"
                  ? "/practice/transfer?problem=pages-without-digit-one"
                  : "/practice/transfer"
            }
          >
            {stored.availability.problemId === "parrots-guaranteed-colors"
              ? "Попугаи в зоопарке"
              : stored.availability.problemId === "pages-without-digit-one"
                ? "Страницы без цифры 1"
                : "Возраст братьев"}
          </Link>
        </section>
      ) : !returning ? (
        <section>
          <p className={styles.eyebrow}>Что сейчас?</p>
          <h2>Начни с первой тренировки</h2>
          <p>
            Попробуй решить задачу самостоятельно. Если понадобится, помощь
            можно открыть по ходу решения.
          </p>
          <Link className={styles.primary} href="/practice">
            Начать тренировку
          </Link>
        </section>
      ) : !path ? (
        <section aria-label="Путь тренировок">
          <p role="alert">Не удалось загрузить отметки пути.</p>
          {onPathRetry ? (
            <button
              type="button"
              className={styles.primary}
              onClick={onPathRetry}
            >
              Повторить
            </button>
          ) : null}
          <Link className={styles.secondary} href="/practice/choose">
            Выбрать набор
          </Link>
        </section>
      ) : nextPathPack ? (
        <section aria-label="Путь тренировок">
          <p className={styles.eyebrow}>ПУТЬ ТРЕНИРОВОК</p>
          <h2>Продолжи с набора «{nextPathPack.name}»</h2>
          <p>
            Это ориентир по существующим тренировкам, а не оценка знаний. Можно
            выбрать и другой набор.
          </p>
          <Link className={styles.primary} href={packHref(nextPathPack.id)}>
            Продолжить путь
          </Link>
        </section>
      ) : (
        <section aria-label="Путь тренировок">
          <p className={styles.eyebrow}>ПУТЬ ТРЕНИРОВОК</p>
          <h2>Во всех наборах есть сохранённое завершение</h2>
          <p>
            Это не означает, что вся математика 5 класса освоена. Можно
            вернуться к любому набору и потренироваться ещё.
          </p>
          <Link className={styles.primary} href="/practice/choose">
            Выбрать тренировку
          </Link>
        </section>
      )}
    </HomePracticeLayout>
  );
}

function HomePracticeLayout({
  children,
  stored,
  neutral = false,
  onSummaryRetry,
  summaryRetryPending,
}: Readonly<{
  children: ReactNode;
  stored?: StoredPractice;
  neutral?: boolean;
  onSummaryRetry?: () => void;
  summaryRetryPending?: boolean;
}>) {
  return (
    <div className={styles.content}>
      <div className={styles["main-column"]}>
        <header className={styles.introduction}>
          <p className={styles.eyebrow}>5 КЛАСС · МАТЕМАТИКА</p>
          <h1>Что лучше сделать сейчас</h1>
          <p className={styles["desktop-intro"]}>
            Продолжай с полезного следующего шага — без выбора между десятком
            режимов.
          </p>
        </header>
        <div
          className={
            styles["next-action"] + (neutral ? " " + styles.neutral : "")
          }
          aria-live="polite"
          aria-atomic="true"
        >
          {children}
        </div>
        <section
          className={styles["secondary-area"]}
          aria-labelledby="secondary-title"
        >
          <h2 id="secondary-title">Ещё можно</h2>
          <div className={styles.destinations}>
            <section
              className={styles.card}
              aria-labelledby="choose-practice-title"
            >
              <h3 id="choose-practice-title">Выбрать тренировку</h3>
              <p>
                {PRACTICE_PACKS.length} наборов по{" "}
                {PRACTICE_PACKS[0].problemIds.length} задачи. Выбирай тему сам.
              </p>
              <Link className={styles.secondary} href="/practice/choose">
                Выбрать набор
              </Link>
            </section>
            {stored &&
            !stored.unfinished &&
            stored.reviewAvailable !== undefined ? (
              <ReviewEntry
                available={stored.reviewAvailable}
                className={styles.card}
                actionClassName={styles.secondary}
              />
            ) : null}
            <Link
              className={styles.secondary + " " + styles["mobile-progress"]}
              href="/progress"
            >
              Мой прогресс
            </Link>
            <section
              className={styles.card + " " + styles.simulation}
              aria-labelledby="simulation-entry"
            >
              <p className={styles.eyebrow}>ОТДЕЛЬНЫЙ РЕЖИМ</p>
              <h2 id="simulation-entry">Олимпиадная симуляция</h2>
              <p>4 задачи · 45 минут · без подсказок и баллов</p>
              <Link className={styles.secondary} href="/simulation">
                Открыть симуляцию
              </Link>
            </section>
          </div>
        </section>
      </div>
      <aside
        className={styles["side-column"]}
        aria-label="Прогресс и последние тренировки"
      >
        <section
          className={styles.card + " " + styles["progress-card"]}
          aria-labelledby="home-progress-title"
        >
          <h2 id="home-progress-title">Мой прогресс</h2>
          <p>Здесь — твоя работа над задачами.</p>
          {stored ? (
            <div className={styles["journey-preview"]}>
              <HomePracticeJourneyLoader />
            </div>
          ) : null}
          <Link className={styles.secondary} href="/progress">
            Открыть прогресс
          </Link>
        </section>
        <section
          className={styles.card + " " + styles.principle}
          aria-labelledby="learner-principle-title"
        >
          <h3 id="learner-principle-title">Сначала — твой ход</h3>
          <p>Подсказка не появляется сама. Сначала попробуй решить задачу.</p>
        </section>
        {stored?.completedLoadError ? (
          <section aria-label="Последняя тренировка" className={styles.card}>
            <p role="alert">Не удалось проверить сохранённые итоги.</p>
            <button
              type="button"
              className={styles.secondary}
              onClick={onSummaryRetry}
              disabled={summaryRetryPending}
            >
              {summaryRetryPending ? "Проверяем…" : "Повторить"}
            </button>
          </section>
        ) : null}
        {stored?.completed ? (
          <section
            aria-label="Последняя тренировка"
            className={styles.card + " " + styles.latest}
          >
            <h2>Последняя тренировка</h2>
            <ol>
              {stored.completed.map((result) => (
                <li key={result.problemId}>
                  <strong>{result.problemTitle}</strong>
                  <span>
                    {getPracticeResultLabel(
                      result.summary,
                      result.taskOutcome,
                    ) ?? getPracticeRemainingText(result.summary.outcome)}
                  </span>
                </li>
              ))}
            </ol>
            <Link
              className={styles.secondary}
              href={
                stored.completedSessionId
                  ? "/practice/summary?session=" + stored.completedSessionId
                  : "/practice/summary"
              }
            >
              Посмотреть итоги
            </Link>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

function HomePracticeJourneyLoader() {
  const [totalXp, setTotalXp] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    void readServerPracticeJourney().then(
      (value) => active && setTotalXp(value),
      () => active && setTotalXp(0),
    );
    return () => {
      active = false;
    };
  }, []);
  return totalXp === null ? null : <HomePracticeJourney totalXp={totalXp} />;
}

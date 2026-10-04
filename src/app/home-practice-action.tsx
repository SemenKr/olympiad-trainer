"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { verifyPersistedReasoningCheckpointObservation } from "@/app/practice/actions";
import {
  readServerAdaptiveAvailability,
  readServerPracticeJourney,
  readServerReviewAvailability,
} from "@/app/progress/actions";
import type { AdaptiveAvailability } from "@/modules/practice/application/adaptive-availability";
import {
  PRACTICE_PACKS,
  packHref,
  packIdFromProblemIds,
} from "../modules/practice/application/completed-practice-episode";
import {
  getStoredProblemTitle,
  readVerifiedLatestCompletedResults,
  readVerifiedPracticeSessionSnapshot,
  type UnfinishedPracticeSessionSnapshot,
} from "@/modules/practice/ui/practice-session-storage";
import {
  getPracticeRemainingText,
  getPracticeResultLabel,
} from "@/modules/practice/ui/session-summary";
import type { PracticeSessionResult } from "@/modules/practice/ui/two-problem-session-state";
import { ensureServerProgressImported } from "@/modules/practice/ui/server-progress-import";
import { HomePracticeJourney } from "../modules/practice/ui/practice-journey";

import styles from "./page.module.scss";
import { ReviewEntry } from "../modules/practice/ui/review-entry";

type StoredPractice = Readonly<{
  unfinished: UnfinishedPracticeSessionSnapshot | null;
  completed: readonly PracticeSessionResult[] | null;
  completedSessionId?: string | null;
  availability: AdaptiveAvailability;
  hasPracticeHistory: boolean;
  reviewAvailable?: boolean | null;
}>;

export function HomePracticeAction() {
  const [stored, setStored] = useState<StoredPractice | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void Promise.all([
        readVerifiedPracticeSessionSnapshot(
          verifyPersistedReasoningCheckpointObservation,
        ),
        readVerifiedLatestCompletedResults(
          verifyPersistedReasoningCheckpointObservation,
        ),
      ])
        .then(async ([unfinished, completed]) => {
          let adaptive: Pick<
            StoredPractice,
            "availability" | "hasPracticeHistory" | "reviewAvailable"
          > = {
            availability: { status: "insufficient-evidence" },
            hasPracticeHistory: false,
          };
          if (!unfinished.value) {
            await ensureServerProgressImported();
            const [availability, reviewAvailable] = await Promise.all([
              readServerAdaptiveAvailability(),
              readServerReviewAvailability().catch(() => null),
            ]);
            adaptive = { ...availability, reviewAvailable };
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
    <HomePracticeContent stored={stored} />
  ) : (
    <HomePracticeLayout>
      <p role="status">Проверяем, есть ли незаконченная тренировка…</p>
    </HomePracticeLayout>
  );
}

export function HomePracticeContent({ stored }: { stored: StoredPractice }) {
  const hasNoNextAction =
    !stored.unfinished &&
    stored.availability.status !== "recommendation" &&
    (stored.completed !== null || stored.hasPracticeHistory);
  return (
    <HomePracticeLayout stored={stored} neutral={hasNoNextAction}>
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
      ) : hasNoNextAction ? (
        <section>
          <p className={styles.eyebrow}>Что сейчас?</p>
          <h2>
            {stored.availability.status === "transfer-exhausted"
              ? "Новых подходящих задач пока нет"
              : "Пока без новой задачи"}
          </h2>
          <p>
            {stored.availability.status === "transfer-exhausted"
              ? "Все подходящие задачи из текущего набора уже были в работе."
              : "Пока недостаточно проверенной работы, чтобы честно выбрать следующую полезную задачу."}
          </p>
        </section>
      ) : (
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
      )}
    </HomePracticeLayout>
  );
}

function HomePracticeLayout({
  children,
  stored,
  neutral = false,
}: Readonly<{
  children: ReactNode;
  stored?: StoredPractice;
  neutral?: boolean;
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

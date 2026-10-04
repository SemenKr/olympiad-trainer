"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
      <div>
        <p role="alert">Не удалось проверить сохранённую тренировку.</p>
        <button
          onClick={() => {
            setLoadError(false);
            setLoadRetry((value) => value + 1);
          }}
          type="button"
        >
          Повторить
        </button>
        <Link className={styles.secondary} href="/progress">
          Мой прогресс
        </Link>
      </div>
    );
  }

  return (
    <div aria-live="polite" aria-atomic="true">
      {stored ? (
        <HomePracticeContent stored={stored} />
      ) : (
        <>
          <p role="status">Проверяем, есть ли незаконченная тренировка…</p>
          <Link className={styles.secondary} href="/progress">
            Мой прогресс
          </Link>
        </>
      )}
    </div>
  );
}

export function HomePracticeContent({ stored }: { stored: StoredPractice }) {
  const progressIsPrimary =
    !stored.unfinished &&
    stored.availability.status !== "recommendation" &&
    (stored.completed !== null || stored.hasPracticeHistory);
  return (
    <>
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
      ) : progressIsPrimary ? (
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
          <Link className={styles.primary} href="/progress">
            Посмотреть прогресс
          </Link>
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
      <HomePracticeJourneyLoader />
      {!stored.unfinished && stored.reviewAvailable !== undefined ? (
        <ReviewEntry
          available={stored.reviewAvailable}
          actionClassName={styles.secondary}
        />
      ) : null}
      {!stored.unfinished &&
      (stored.hasPracticeHistory || stored.completed !== null) ? (
        <section aria-label="Дополнительная практика" className={styles.pack}>
          <h2>Дополнительная практика</h2>
          {PRACTICE_PACKS.map((pack, index) => (
            <div
              key={pack.id}
              className={index === 0 ? undefined : styles["pack-choice"]}
            >
              <h3>{pack.name}</h3>
              {index === 0 ? (
                <p>
                  Три задачи для дополнительной тренировки. Этот набор можно
                  выбрать самому — он не зависит от персональной рекомендации.
                </p>
              ) : null}
              <Link className={styles.secondary} href={packHref(pack.id)}>
                Решить 3 задачи
              </Link>
            </div>
          ))}
        </section>
      ) : null}
      {stored.completed ? (
        <section aria-label="Последняя тренировка" className={styles.latest}>
          <h2>Последняя тренировка</h2>
          <ol>
            {stored.completed.map((result) => (
              <li key={result.problemId}>
                <strong>{result.problemTitle}</strong>
                <span>
                  {getPracticeResultLabel(result.summary, result.taskOutcome) ??
                    getPracticeRemainingText(result.summary.outcome)}
                </span>
              </li>
            ))}
          </ol>
          <Link
            className={styles.secondary}
            href={
              stored.completedSessionId
                ? `/practice/summary?session=${stored.completedSessionId}`
                : "/practice/summary"
            }
          >
            Посмотреть итоги
          </Link>
        </section>
      ) : null}
      {!progressIsPrimary ? (
        <Link className={styles.secondary} href="/progress">
          Мой прогресс
        </Link>
      ) : null}
    </>
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

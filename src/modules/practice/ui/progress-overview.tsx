"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HomeNavigation } from "../../../app/home-navigation";

import {
  readServerProgress,
  readServerRecentPracticeEpisodes,
  readServerPracticeJourney,
  readServerReviewAvailability,
  readServerLearningPath,
} from "../../learner/progress-client";

import type { LearnerProgressInterpretation } from "../application/reasoning-checkpoint";
import type { PackId } from "../application/completed-practice-episode";
import type { RecentPracticeEpisode } from "../server/learner-progress-persistence";
import { ensureServerProgressImported } from "./server-progress-import";
import styles from "./progress-overview.module.scss";
import { ProgressPracticeJourney } from "./practice-journey";
import { ProgressLearningPath } from "./learning-path";
import { ReviewEntry } from "./review-entry";

type ProgressLoad =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      interpretations: readonly [
        LearnerProgressInterpretation,
        LearnerProgressInterpretation,
        LearnerProgressInterpretation,
      ];
      episodes: readonly RecentPracticeEpisode[];
      journeyTotalXp: number;
      reviewAvailable: boolean | null;
      completedPackIds: readonly PackId[] | null;
    };

export function ProgressOverview({
  recoveryAvailable = false,
}: {
  recoveryAvailable?: boolean;
} = {}) {
  const [load, setLoad] = useState<ProgressLoad>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void ensureServerProgressImported()
        .then(() =>
          Promise.all([
            readServerProgress(),
            readServerRecentPracticeEpisodes(),
            readServerPracticeJourney(),
            readServerReviewAvailability().catch(() => null),
            readServerLearningPath().catch(() => null),
          ]),
        )
        .then(
          ([
            interpretations,
            episodes,
            journeyTotalXp,
            reviewAvailable,
            completedPackIds,
          ]) => {
            if (active)
              setLoad({
                status: "ready",
                interpretations,
                episodes,
                journeyTotalXp,
                reviewAvailable,
                completedPackIds,
              });
          },
        )
        .catch(() => {
          if (active) setLoad({ status: "error" });
        });
    });
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    if (load.status !== "loading") headingRef.current?.focus();
  }, [load]);

  return (
    <main aria-busy={load.status === "loading"} className={styles.progress}>
      <HomeNavigation
        current="Мой прогресс"
        recoveryAvailable={recoveryAvailable}
      />
      <header className={styles.header}>
        <p className={styles.eyebrow}>5 класс · математика</p>
        <h1 ref={headingRef} tabIndex={-1}>
          Мой прогресс
        </h1>
        <p>
          Здесь видно, какие идеи ты уже пробовал в задачах. Картина будет
          меняться по мере новой работы.
        </p>
      </header>

      {load.status === "loading" ? (
        <p role="status">Загружаем прогресс…</p>
      ) : load.status === "error" ? (
        <div className={styles.error}>
          <p role="alert">Не удалось загрузить прогресс. Попробуй ещё раз.</p>
          <button
            className={styles.primary}
            onClick={() => {
              setLoad({ status: "loading" });
              setRetry((value) => value + 1);
            }}
            type="button"
          >
            Попробовать ещё раз
          </button>
        </div>
      ) : (
        <div className={styles.content}>
          <div className={styles.next}>
            <ReviewEntry
              available={load.reviewAvailable}
              actionClassName={styles.primary}
              className={styles["next-action"]}
            />
          </div>
          <section
            className={styles.evidence}
            aria-labelledby="evidence-heading"
          >
            <h2 id="evidence-heading">Что уже получается</h2>
            {load.interpretations.map((interpretation) => (
              <ProgressEvidenceContent
                interpretation={interpretation}
                key={interpretation.learnerLabel}
              />
            ))}
          </section>
          <div className={styles.path}>
            {load.completedPackIds ? (
              <ProgressLearningPath
                completedPackIds={load.completedPackIds}
                className={styles["path-card"]}
              />
            ) : (
              <section className={styles.error} aria-label="Путь тренировок">
                <h2>Путь тренировок</h2>
                <p role="alert">Не удалось загрузить отметки пути.</p>
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => {
                    setLoad({ status: "loading" });
                    setRetry((value) => value + 1);
                  }}
                >
                  Повторить
                </button>
                <Link className={styles.secondary} href="/practice/choose">
                  Выбрать тренировку
                </Link>
              </section>
            )}
          </div>
          <div className={styles.journey}>
            <ProgressPracticeJourney
              totalXp={load.journeyTotalXp}
              className={styles["journey-card"]}
            />
          </div>
          <section className={styles.destinations}>
            <h2>Хочешь ещё?</h2>
            <Link className={styles.secondary} href="/practice/choose">
              Выбрать тренировку
            </Link>
            <Link className={styles.secondary} href="/">
              На главную
            </Link>
          </section>
          <div className={styles.recent}>
            <RecentPracticeHistory episodes={load.episodes} />
          </div>
        </div>
      )}

      {load.status !== "ready" ? (
        <Link className={styles.secondary} href="/">
          На главную
        </Link>
      ) : null}
    </main>
  );
}

function problemStatus(
  problem: RecentPracticeEpisode["problems"][number],
): string {
  if (problem.skipped) return "Задача пропущена";
  if (problem.solutionExposed) return "Открыт разбор";
  if (problem.outcome === "eventually-correct")
    return problem.hintLevelsExposed.length > 0
      ? "Ответ найден после подсказок"
      : "Ответ найден без подсказок";
  return problem.outcome === "incorrect-only"
    ? "Ответ пока не найден"
    : "Без отправленного ответа";
}

export function RecentPracticeHistory({
  episodes,
}: {
  episodes: readonly RecentPracticeEpisode[];
}) {
  if (episodes.length === 0) return null;
  return (
    <section className={styles.history}>
      <h2>Недавняя работа</h2>
      <ol className={styles.episodes}>
        {episodes.map((episode, index) => (
          <li key={`${episode.completedAt}-${index}`}>
            <h3>
              {episode.mode === "review"
                ? "Повторная попытка"
                : episode.mode === "core"
                  ? "Тренировка"
                  : episode.mode === "pack"
                    ? "Дополнительная практика"
                    : "Дополнительная задача"}
            </h3>
            <time dateTime={episode.completedAt}>
              {new Date(episode.completedAt).toLocaleString("ru-RU")}
            </time>
            <ul className={styles.problems}>
              {episode.problems.map((problem, problemIndex) => (
                <li key={problemIndex}>
                  <strong>{problem.problemTitle}</strong>
                  <span>{problemStatus(problem)}</span>
                  {problem.checkpoint && (
                    <span>
                      Проверка рассуждения:{" "}
                      {problem.checkpoint.outcome === "correct"
                        ? "верно"
                        : "не засчитана"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function ProgressEvidenceContent({
  interpretation,
}: {
  interpretation: LearnerProgressInterpretation;
}) {
  return (
    <section className={styles.capability}>
      <p
        className={`${styles.group} ${interpretation.progressGroup === "Получается в разных задачах" ? styles.transfer : interpretation.progressGroup ? styles.recognized : styles.unknown}`}
      >
        {interpretation.progressGroup ?? "Пока рано сказать"}
      </p>
      <h3>{interpretation.learnerLabel}</h3>
      <p>{interpretation.conclusion}</p>
    </section>
  );
}

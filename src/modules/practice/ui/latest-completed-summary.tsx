"use client";

import Link from "next/link";
import { captureLearnerStorage } from "../../learner/local-ownership";
import { HomeNavigation } from "../../../app/home-navigation";
import { useEffect, useRef, useState, type RefObject } from "react";

import { verifyPersistedReasoningCheckpointObservation } from "../../../app/practice/actions";

import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";
import { readVerifiedLatestCompletedResults } from "./practice-session-storage";
import { SessionSummary } from "./session-summary";
import styles from "./session-summary.module.scss";
import type { PracticeSessionResult } from "./two-problem-session-state";
import {
  readServerLearningPath,
  readServerPracticeJourneyFinish,
} from "../../learner/progress-client";
import type { PracticeJourneyFinish } from "../application/practice-journey";
import {
  packIdFromCompletedProblemIds,
  type PackId,
  type CompletedPracticeEpisodeMode,
} from "../application/completed-practice-episode";

export function LatestCompletedSummary({
  allowedProblemIds,
}: { allowedProblemIds?: readonly string[] } = {}) {
  const [restricted, setRestricted] = useState(false);
  const [results, setResults] = useState<
    readonly PracticeSessionResult[] | null | undefined
  >();
  const [interpretation, setInterpretation] =
    useState<ReasoningCheckpointInterpretation | null>(null);
  const [tableInterpretation, setTableInterpretation] =
    useState<ReasoningCheckpointInterpretation | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const [journeyFinish, setJourneyFinish] =
    useState<PracticeJourneyFinish | null>(null);
  const [mode, setMode] = useState<CompletedPracticeEpisodeMode | undefined>();
  const [completedPackIds, setCompletedPackIds] = useState<
    readonly PackId[] | null
  >(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      if (allowedProblemIds) {
        const store = captureLearnerStorage();
        if (
          store.getItem("olympiad-trainer:practice-progress-finish-pending") !==
          null
        ) {
          setRestricted(true);
          return;
        }
        const permitted = (v: unknown): boolean => {
          if (!v || typeof v !== "object") return true;
          if (Array.isArray(v)) return v.every(permitted);
          return Object.entries(v).every(([k, x]) =>
            k === "problemId"
              ? typeof x === "string" && allowedProblemIds.includes(x)
              : k === "problemIds"
                ? Array.isArray(x) &&
                  x.every((id) => allowedProblemIds.includes(id))
                : permitted(x),
          );
        };
        for (const key of [
          "olympiad-trainer:practice-session",
          "olympiad-trainer:practice-latest-completed",
          "olympiad-trainer:practice-server-finish-request",
        ]) {
          const raw = store.getItem(key);
          if (raw !== null)
            try {
              if (!permitted(JSON.parse(raw))) {
                setRestricted(true);
                return;
              }
            } catch {
              setLoadError(true);
              return;
            }
        }
      }
      void readVerifiedLatestCompletedResults(
        verifyPersistedReasoningCheckpointObservation,
      )
        .then(
          ({
            value,
            sessionId,
            mode: completedMode,
            interpretation: verifiedInterpretation,
            tableInterpretation: verifiedTableInterpretation,
          }) => {
            if (!active) return;
            setInterpretation(verifiedInterpretation);
            setTableInterpretation(verifiedTableInterpretation ?? null);
            setResults(value);
            const packId =
              completedMode !== "review" && value
                ? packIdFromCompletedProblemIds(
                    value.map((result) => result.problemId),
                  )
                : null;
            setMode(completedMode ?? (packId ? "pack" : undefined));
            setJourneyFinish(null);
            setCompletedPackIds(null);
            if (sessionId && active) {
              void readServerPracticeJourneyFinish(sessionId)
                .then((reward) => {
                  if (active) setJourneyFinish(reward);
                })
                .catch(() => {
                  if (active) setJourneyFinish(null);
                });
              if (packId && !allowedProblemIds)
                void readServerLearningPath()
                  .then((packIds) => {
                    if (active) setCompletedPackIds(packIds);
                  })
                  .catch(() => {
                    if (active) setCompletedPackIds(null);
                  });
            }
          },
        )
        .catch(() => {
          if (active) setLoadError(true);
        });
    });
    return () => {
      active = false;
    };
  }, [loadRetry, allowedProblemIds]);

  useEffect(() => {
    if (results) headingRef.current?.focus();
  }, [results]);

  if (restricted)
    return (
      <main>
        <h1>Прежняя тренировка временно недоступна</h1>
        <p>
          Работа и запрос завершения сохранены. В этой версии доступны только
          авторские наборы S и T.
        </p>
        <Link href="/progress">История</Link>
        <Link href="/restore">Сохранить доступ</Link>
      </main>
    );

  if (loadError) {
    return (
      <main className={styles.summary}>
        <HomeNavigation current="Итоги" />
        <p role="alert">Не удалось проверить сохранённые итоги.</p>
        <button
          className={styles.secondary}
          onClick={() => {
            setLoadError(false);
            setLoadRetry((value) => value + 1);
          }}
          type="button"
        >
          Повторить
        </button>
        <Link className={styles.primary} href="/">
          На главную
        </Link>
      </main>
    );
  }

  if (results === undefined) {
    return (
      <main aria-busy="true" className={styles.summary}>
        <HomeNavigation current="Итоги" />
        <p role="status">Загружаем итоги тренировки…</p>
      </main>
    );
  }

  return (
    <LatestCompletedSummaryContent
      headingRef={headingRef}
      reasoningInterpretation={interpretation}
      tableInterpretation={tableInterpretation}
      results={results}
      journeyFinish={journeyFinish}
      completedPackIds={completedPackIds}
      mode={mode}
    />
  );
}

export function LatestCompletedSummaryContent({
  results,
  headingRef,
  reasoningInterpretation,
  tableInterpretation,
  journeyFinish = null,
  completedPackIds = null,
  mode,
}: {
  results: readonly PracticeSessionResult[] | null;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  reasoningInterpretation?: ReasoningCheckpointInterpretation | null;
  tableInterpretation?: ReasoningCheckpointInterpretation | null;
  journeyFinish?: PracticeJourneyFinish | null;
  completedPackIds?: readonly PackId[] | null;
  mode?: CompletedPracticeEpisodeMode;
}) {
  if (!results) {
    return (
      <main className={styles.summary}>
        <HomeNavigation current="Итоги" />
        <h1>Итоги тренировки недоступны</h1>
        <Link className={styles.primary} href="/">
          На главную
        </Link>
      </main>
    );
  }

  return (
    <SessionSummary
      headingRef={headingRef}
      reasoningInterpretation={reasoningInterpretation}
      tableInterpretation={tableInterpretation}
      results={results}
      journeyFinish={journeyFinish}
      completedPackIds={completedPackIds}
      mode={mode}
    />
  );
}

"use client";

import Link from "next/link";
import { HomeNavigation } from "../../../app/home-navigation";
import { useEffect, useRef, useState, type RefObject } from "react";

import { verifyPersistedReasoningCheckpointObservation } from "../../../app/practice/actions";

import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";
import { readVerifiedLatestCompletedResults } from "./practice-session-storage";
import { SessionSummary } from "./session-summary";
import styles from "./session-summary.module.scss";
import type { PracticeSessionResult } from "./two-problem-session-state";
import { readServerPracticeJourneyFinish } from "../../../app/progress/actions";
import type { PracticeJourneyFinish } from "../application/practice-journey";

export function LatestCompletedSummary() {
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
  const [mode, setMode] = useState<"review" | undefined>();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
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
            setMode(completedMode);
            setJourneyFinish(null);
            if (sessionId && active)
              void readServerPracticeJourneyFinish(sessionId)
                .then((reward) => {
                  if (active) setJourneyFinish(reward);
                })
                .catch(() => {
                  if (active) setJourneyFinish(null);
                });
          },
        )
        .catch(() => {
          if (active) setLoadError(true);
        });
    });
    return () => {
      active = false;
    };
  }, [loadRetry]);

  useEffect(() => {
    if (results) headingRef.current?.focus();
  }, [results]);

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
  mode,
}: {
  results: readonly PracticeSessionResult[] | null;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  reasoningInterpretation?: ReasoningCheckpointInterpretation | null;
  tableInterpretation?: ReasoningCheckpointInterpretation | null;
  journeyFinish?: PracticeJourneyFinish | null;
  mode?: "review";
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
      mode={mode}
    />
  );
}

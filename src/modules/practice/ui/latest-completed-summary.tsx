"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";

import { verifyPersistedReasoningCheckpointObservation } from "@/app/practice/actions";

import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";
import { readVerifiedLatestCompletedResults } from "./practice-session-storage";
import { SessionSummary } from "./session-summary";
import styles from "./session-summary.module.scss";
import type { PracticeSessionResult } from "./two-problem-session-state";

export function LatestCompletedSummary() {
  const [results, setResults] = useState<
    readonly PracticeSessionResult[] | null | undefined
  >();
  const [interpretation, setInterpretation] =
    useState<ReasoningCheckpointInterpretation | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void readVerifiedLatestCompletedResults(
        verifyPersistedReasoningCheckpointObservation,
      )
        .then(({ value, interpretation: verifiedInterpretation }) => {
          if (!active) return;
          setInterpretation(verifiedInterpretation);
          setResults(value);
        })
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
    return <main aria-busy="true">Загружаем итоги тренировки…</main>;
  }

  return (
    <LatestCompletedSummaryContent
      headingRef={headingRef}
      reasoningInterpretation={interpretation}
      results={results}
    />
  );
}

export function LatestCompletedSummaryContent({
  results,
  headingRef,
  reasoningInterpretation,
}: {
  results: readonly PracticeSessionResult[] | null;
  headingRef?: RefObject<HTMLHeadingElement | null>;
  reasoningInterpretation?: ReasoningCheckpointInterpretation | null;
}) {
  if (!results) {
    return (
      <main className={styles.summary}>
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
      results={results}
    />
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";

import { readLatestCompletedResults } from "./practice-session-storage";
import { SessionSummary } from "./session-summary";
import styles from "./session-summary.module.scss";
import type { PracticeSessionResult } from "./two-problem-session-state";

export function LatestCompletedSummary() {
  const [results, setResults] = useState<
    readonly PracticeSessionResult[] | null | undefined
  >();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setResults(readLatestCompletedResults());
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (results) headingRef.current?.focus();
  }, [results]);

  if (results === undefined) {
    return <main aria-busy="true">Загружаем итоги тренировки…</main>;
  }

  return (
    <LatestCompletedSummaryContent headingRef={headingRef} results={results} />
  );
}

export function LatestCompletedSummaryContent({
  results,
  headingRef,
}: {
  results: readonly PracticeSessionResult[] | null;
  headingRef?: RefObject<HTMLHeadingElement | null>;
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

  return <SessionSummary headingRef={headingRef} results={results} />;
}

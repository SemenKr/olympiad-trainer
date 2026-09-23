"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getStoredProblemTitle,
  readLatestCompletedResults,
  readPracticeSessionSnapshot,
  type PracticeSessionSnapshot,
} from "@/modules/practice/ui/practice-session-storage";
import {
  getPracticeRemainingText,
  getPracticeResultLabel,
} from "@/modules/practice/ui/session-summary";
import type { PracticeSessionResult } from "@/modules/practice/ui/two-problem-session-state";

import styles from "./page.module.scss";

type StoredPractice = Readonly<{
  unfinished: PracticeSessionSnapshot | null;
  completed: readonly PracticeSessionResult[] | null;
}>;

export function HomePracticeAction() {
  const [stored, setStored] = useState<StoredPractice | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active)
        setStored({
          unfinished: readPracticeSessionSnapshot(),
          completed: readLatestCompletedResults(),
        });
    });
    return () => {
      active = false;
    };
  }, []);

  if (!stored) {
    return <p role="status">Проверяем, есть ли незаконченная тренировка…</p>;
  }

  return <HomePracticeContent stored={stored} />;
}

export function HomePracticeContent({ stored }: { stored: StoredPractice }) {
  return (
    <>
      {stored.unfinished ? (
        <section aria-label="Текущая тренировка">
          <h2>Тренировка не закончена</h2>
          <p>Можно продолжить с того же места.</p>
          <p>{getStoredProblemTitle(stored.unfinished)}</p>
          <Link className={styles.primary} href="/practice">
            Продолжить тренировку
          </Link>
        </section>
      ) : (
        <Link className={styles.primary} href="/practice">
          Начать тренировку
        </Link>
      )}
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
          <Link className={styles.secondary} href="/practice/summary">
            Посмотреть итоги
          </Link>
        </section>
      ) : null}
    </>
  );
}

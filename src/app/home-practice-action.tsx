"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { verifyPersistedReasoningCheckpointObservation } from "@/app/practice/actions";
import { readServerNextUsefulProblem } from "@/app/progress/actions";
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

import styles from "./page.module.scss";

type StoredPractice = Readonly<{
  unfinished: UnfinishedPracticeSessionSnapshot | null;
  completed: readonly PracticeSessionResult[] | null;
  recommendation?: Readonly<{
    problemId: "brothers-ages-products";
    reason: string;
  }> | null;
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
          let recommendation: StoredPractice["recommendation"] = null;
          if (!unfinished.value) {
            await ensureServerProgressImported();
            recommendation = await readServerNextUsefulProblem();
          }
          if (active)
            setStored({
              unfinished: unfinished.value,
              completed: completed.value,
              recommendation,
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
      </div>
    );
  }

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
              "mode" in stored.unfinished ? "/practice/transfer" : "/practice"
            }
          >
            {"status" in stored.unfinished
              ? "Завершить тренировку"
              : "Продолжить тренировку"}
          </Link>
        </section>
      ) : stored.recommendation ? (
        <section aria-label="Следующая полезная задача">
          <h2>Следующая полезная задача</h2>
          <p>{stored.recommendation.reason}</p>
          <Link className={styles.primary} href="/practice/transfer">
            Возраст братьев
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

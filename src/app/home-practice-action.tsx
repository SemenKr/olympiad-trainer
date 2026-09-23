"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getStoredProblemTitle,
  readPracticeSessionSnapshot,
  type PracticeSessionSnapshot,
} from "@/modules/practice/ui/practice-session-storage";

import styles from "./page.module.scss";

export function HomePracticeAction() {
  const [snapshot, setSnapshot] = useState<
    PracticeSessionSnapshot | null | undefined
  >();

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setSnapshot(readPracticeSessionSnapshot());
    });
    return () => {
      active = false;
    };
  }, []);

  if (snapshot === undefined) {
    return <p role="status">Проверяем, есть ли незаконченная тренировка…</p>;
  }

  if (snapshot) {
    return (
      <section aria-label="Текущая тренировка">
        <h2>Тренировка не закончена</h2>
        <p>Можно продолжить с того же места.</p>
        <p>{getStoredProblemTitle(snapshot)}</p>
        <Link className={styles.primary} href="/practice">
          Продолжить тренировку
        </Link>
      </section>
    );
  }

  return (
    <Link className={styles.primary} href="/practice">
      Начать тренировку
    </Link>
  );
}

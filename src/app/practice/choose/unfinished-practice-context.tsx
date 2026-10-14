"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LOCAL_IDENTITY_EVENT } from "../../../modules/learner/local-ownership";
import {
  readVerifiedPracticeSessionSnapshot,
  type UnfinishedPracticeSessionSnapshot,
} from "../../../modules/practice/ui/practice-session-storage";
import { getUnfinishedPracticeLabel } from "../../../modules/practice/ui/unfinished-practice-label";
import { verifyPersistedReasoningCheckpointObservation } from "../actions";
import styles from "../../page.module.scss";

export function UnfinishedPracticeContext() {
  const [state, setState] = useState<
    | { status: "loading" | "error" }
    | { status: "ready"; snapshot: UnfinishedPracticeSessionSnapshot | null }
  >({ status: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let readId = 0;
    const read = async () => {
      const id = ++readId;
      setState({ status: "loading" });
      try {
        const { value } = await readVerifiedPracticeSessionSnapshot(
          verifyPersistedReasoningCheckpointObservation,
        );
        if (active && id === readId)
          setState({ status: "ready", snapshot: value });
      } catch {
        if (active && id === readId) setState({ status: "error" });
      }
    };
    const refresh = () => void read();
    queueMicrotask(() => {
      if (active) refresh();
    });
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(LOCAL_IDENTITY_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(LOCAL_IDENTITY_EVENT, refresh);
    };
  }, [retry]);

  if (state.status === "loading")
    return <p role="status">Проверяем сохранённую тренировку…</p>;
  if (state.status === "error")
    return (
      <section
        className={styles["secondary-area"]}
        aria-label="Сохранённая тренировка"
      >
        <p role="alert">Не удалось проверить сохранённую тренировку.</p>
        <button
          className={styles.secondary}
          type="button"
          onClick={() => setRetry((value) => value + 1)}
        >
          Повторить
        </button>
      </section>
    );
  if (state.status !== "ready" || !state.snapshot) return null;
  return (
    <section
      className={styles["secondary-area"]}
      aria-labelledby="unfinished-practice-title"
    >
      <h2 id="unfinished-practice-title">Тренировка не закончена</h2>
      <p>Текущая тренировка: {getUnfinishedPracticeLabel(state.snapshot)}.</p>
      <p>Чтобы начать другой набор, сначала заверши текущую тренировку.</p>
      <Link className={styles.secondary} href="/practice">
        Открыть текущую тренировку
      </Link>
    </section>
  );
}

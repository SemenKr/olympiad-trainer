"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { captureLearnerStorage } from "../modules/learner/local-ownership";
import {
  isCanonicalStorage,
  refreshCanonicalStorage,
  assertCanonicalStorageCurrent,
} from "../modules/learner/canonical-local-store";
import {
  packHref,
  packIdFromProblemIds,
  packIdFromCompletedProblemIds,
} from "../modules/practice/application/completed-practice-episode";
import { PROGRESS_EVIDENCE_STORAGE_KEY } from "../modules/practice/ui/progress-evidence-storage";
import { readVerifiedPracticeSessionSnapshot } from "../modules/practice/ui/practice-session-storage";
import { verifyPersistedReasoningCheckpointObservation } from "./practice/actions";
import styles from "./page.module.scss";

// Admission precedes checkpoint verification: Home never repairs retained work.
export async function readBetaHomeTarget(allowedProblemIds: readonly string[]) {
  const storage = captureLearnerStorage();
  if (!isCanonicalStorage(storage)) throw new Error("Recovery required");
  await refreshCanonicalStorage(storage);
  if (
    storage.getItem("olympiad-trainer:practice-progress-finish-pending") !==
      null ||
    storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== null
  )
    throw new Error("Recovery required");
  const permits = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return true;
    if (Array.isArray(value)) return value.every(permits);
    return Object.entries(value).every(([key, item]) => {
      if (key === "problemId")
        return typeof item === "string" && allowedProblemIds.includes(item);
      if (key === "problemIds")
        return (
          Array.isArray(item) &&
          item.every(
            (id) => typeof id === "string" && allowedProblemIds.includes(id),
          )
        );
      return permits(item);
    });
  };
  for (const key of [
    "olympiad-trainer:practice-session",
    "olympiad-trainer:practice-server-finish-request",
  ]) {
    const raw = storage.getItem(key);
    if (raw === null) continue;
    const value: unknown = JSON.parse(raw);
    if (
      !permits(value) ||
      (key.endsWith("practice-session") &&
        (!value ||
          typeof value !== "object" ||
          !("mode" in value) ||
          value.mode !== "pack"))
    )
      throw new Error("Recovery required");
  }
  const { value } = await readVerifiedPracticeSessionSnapshot(
    (id, observation, summary) => {
      if (!allowedProblemIds.includes(id)) throw new Error("Recovery required");
      return verifyPersistedReasoningCheckpointObservation(
        id,
        observation,
        summary,
      );
    },
    storage,
  );
  await assertCanonicalStorageCurrent(storage);
  if (!value) return null;
  if (value.mode !== "pack" || !permits(value))
    throw new Error("Recovery required");
  const pack =
    "status" in value
      ? packIdFromCompletedProblemIds(
          value.completedResults.map((result) => result.problemId),
        )
      : packIdFromProblemIds(value.problemIds);
  if (pack !== "pack-s" && pack !== "pack-t")
    throw new Error("Recovery required");
  return packHref(pack);
}

export function BetaHomeAction({
  allowedProblemIds,
}: {
  allowedProblemIds: readonly string[];
}) {
  const [state, setState] = useState<
    { target: string | null } | "loading" | "error"
  >("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void readBetaHomeTarget(allowedProblemIds).then(
      (target) => {
        if (active) setState({ target });
      },
      () => {
        if (active) setState("error");
      },
    );
    return () => {
      active = false;
    };
  }, [allowedProblemIds, retry]);
  if (state === "loading")
    return <p role="status">Проверяем сохранённую тренировку…</p>;
  if (state === "error")
    return (
      <section aria-label="Сохранённая тренировка">
        <p role="alert">
          Не удалось проверить сохранённую тренировку. Данные сохранены. Открой
          тренировку для восстановления доступа или проверки совместимости
          версии.
        </p>
        <button
          className={styles.primary}
          type="button"
          onClick={() => {
            setState("loading");
            setRetry((value) => value + 1);
          }}
        >
          Проверить снова
        </button>
        <Link className={styles.secondary} href="/practice">
          Открыть сохранённую тренировку
        </Link>
      </section>
    );
  return (
    <Link className={styles.primary} href={state.target ?? "/practice"}>
      {state.target ? "Продолжить тренировку" : "Начать тренировку"}
    </Link>
  );
}

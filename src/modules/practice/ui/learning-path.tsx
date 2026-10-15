"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { readServerLearningPath } from "../../learner/progress-client";
import { getLearningPathProjection } from "../application/learning-path";
import {
  packHref,
  type PackId,
} from "../application/completed-practice-episode";
import { LOCAL_IDENTITY_EVENT } from "../../learner/local-ownership";
import type { UnfinishedPracticeSessionSnapshot } from "./practice-session-storage";
import { getUnfinishedPracticeLabel } from "./unfinished-practice-label";
import { ensureServerProgressImported } from "./server-progress-import";
import styles from "./learning-path.module.scss";

export function LearningPathGuideLoader({
  unfinished = { status: "ready", snapshot: null },
  retryUnfinished,
}: {
  unfinished?:
    | { status: "loading" | "error" }
    | { status: "ready"; snapshot: UnfinishedPracticeSessionSnapshot | null };
  retryUnfinished?: () => void;
}) {
  const [value, setValue] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; completedPackIds: readonly PackId[] }
  >({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const retryButtonRef = useCallback((node: HTMLButtonElement | null) => {
    if (!node) return;
    return () => {
      if (document.activeElement === node) headingRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let readId = 0;
    const refresh = () => {
      const id = ++readId;
      setValue({ status: "loading" });
      void ensureServerProgressImported()
        .then(() => readServerLearningPath())
        .then((completedPackIds) => {
          if (!active || id !== readId) return;
          setValue({ status: "ready", completedPackIds });
        })
        .catch(() => {
          if (active && id === readId) setValue({ status: "error" });
        });
    };
    refresh();
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

  const projection =
    value.status === "ready"
      ? getLearningPathProjection(value.completedPackIds)
      : null;
  const next = projection?.entries.find((entry) => entry.suggested);

  const snapshot = unfinished.status === "ready" ? unfinished.snapshot : null;
  const verificationFailed = unfinished.status === "error";
  const retryReads = () => {
    retryUnfinished?.();
    setValue({ status: "loading" });
    setRetry((current) => current + 1);
  };
  const retryButton = (
    <button
      className={styles.secondary}
      ref={retryButtonRef}
      disabled={
        retry > 0 &&
        (unfinished.status === "loading" || value.status === "loading")
      }
      onClick={retryReads}
      type="button"
    >
      Повторить
    </button>
  );

  return (
    <section
      className={`${styles.compact} ${styles["chooser-summary"]}`}
      aria-labelledby="learning-path-title"
    >
      <h2 id="learning-path-title" ref={headingRef} tabIndex={-1}>
        Путь тренировок
      </h2>
      <p>
        Отметки — завершённые тренировки, а не решённые задачи. Старые
        тренировки могли не получить отметку; XP и уровни пути учитываются
        отдельно.
      </p>
      <div className={styles["summary-state"]}>
        <div className={styles["summary-count"]}>
          <p role={value.status === "error" && snapshot ? "alert" : "status"}>
            {projection
              ? `Сохранённые завершения: ${projection.completedCount} из ${projection.totalCount}`
              : value.status === "loading"
                ? "Загружаем отметки пути…"
                : "Отметки пути недоступны"}
          </p>
          {snapshot && value.status === "error" && retryButton}
        </div>
        <p
          className={styles["summary-next"]}
          role={
            verificationFailed || (value.status === "error" && !snapshot)
              ? "alert"
              : "status"
          }
        >
          {unfinished.status === "loading"
            ? "Проверяем сохранённую тренировку…"
            : verificationFailed
              ? "Не удалось проверить сохранённую тренировку. Повтори проверку перед выбором."
              : snapshot
                ? "status" in snapshot
                  ? "Тренировка готова к завершению. Открой её, чтобы завершить."
                  : `Не закончена: ${getUnfinishedPracticeLabel(snapshot)}.`
                : value.status === "error"
                  ? "Не удалось загрузить отметки пути. Все наборы ниже всё равно доступны."
                  : next
                    ? `Следующий ориентир: ${next.name}`
                    : projection
                      ? "Во всех наборах есть сохранённое завершение. Можно выбрать любой набор снова."
                      : "Все наборы ниже доступны — можно выбрать любой."}
        </p>
        <div className={styles["summary-action"]}>
          {verificationFailed ||
          (retry > 0 && unfinished.status === "loading") ||
          (!snapshot && value.status === "error") ||
          (unfinished.status === "ready" &&
            !snapshot &&
            value.status === "loading" &&
            retry > 0) ? (
            retryButton
          ) : snapshot ? (
            <Link className={styles.primary} href="/practice">
              {"status" in snapshot
                ? "Открыть и завершить"
                : "Продолжить тренировку"}
            </Link>
          ) : unfinished.status === "ready" && next ? (
            <Link
              className={styles.primary}
              href={packHref(next.packId)}
              aria-label={`Выбрать набор «${next.name}»`}
            >
              Продолжить путь
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ProgressLearningPath({
  completedPackIds,
  className,
}: {
  completedPackIds: readonly PackId[];
  className?: string;
}) {
  const projection = getLearningPathProjection(completedPackIds);
  const next = projection.entries.find((entry) => entry.suggested) ?? null;

  return (
    <section
      className={`${styles.compact} ${className ?? ""}`}
      aria-labelledby="progress-learning-path-title"
    >
      <h2 id="progress-learning-path-title">Путь тренировок</h2>
      <p>
        {projection.completedCount} из {projection.totalCount} наборов имеют
        сохранённое завершение.
      </p>
      <p>
        Это отметки завершённых тренировок. Уровни пути и XP учитываются
        отдельно; старые тренировки могли не получить отметку.
      </p>
      <progress
        aria-label={`Сохранённые завершения наборов: ${projection.completedCount} из ${projection.totalCount}`}
        max={projection.totalCount}
        value={projection.completedCount}
      />
      {next ? (
        <>
          <p className={styles.next}>
            Следующий ориентир: <strong>{next.name}</strong>
          </p>
          <Link className={styles.primary} href={packHref(next.packId)}>
            Продолжить путь
          </Link>
        </>
      ) : (
        <p>
          Во всех наборах пути уже есть сохранённое завершение. Это не означает,
          что весь курс или класс освоен.
        </p>
      )}
      <Link className={styles.secondary} href="/practice/choose">
        Открыть весь путь
      </Link>
    </section>
  );
}

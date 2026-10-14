"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { readServerLearningPath } from "../../learner/progress-client";
import { getLearningPathProjection } from "../application/learning-path";
import {
  packHref,
  type PackId,
} from "../application/completed-practice-episode";
import { ensureServerProgressImported } from "./server-progress-import";
import styles from "./learning-path.module.scss";

export function LearningPathGuideLoader() {
  const [value, setValue] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; completedPackIds: readonly PackId[] }
  >({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    void ensureServerProgressImported()
      .then(() => readServerLearningPath())
      .then((completedPackIds) => {
        if (!active) return;
        if (retry > 0 && document.activeElement === retryButtonRef.current)
          headingRef.current?.focus();
        setValue({ status: "ready", completedPackIds });
      })
      .catch(() => active && setValue({ status: "error" }));
    return () => {
      active = false;
    };
  }, [retry]);

  const projection =
    value.status === "ready"
      ? getLearningPathProjection(value.completedPackIds)
      : null;
  const next = projection?.entries.find((entry) => entry.suggested);

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
        <p className={styles["summary-count"]} role="status">
          {projection
            ? `Сохранённые завершения: ${projection.completedCount} из ${projection.totalCount}`
            : value.status === "loading"
              ? "Загружаем отметки пути…"
              : "Отметки пути недоступны"}
        </p>
        <p
          className={styles["summary-next"]}
          role={value.status === "error" ? "alert" : undefined}
        >
          {value.status === "error"
            ? "Не удалось загрузить отметки пути. Все наборы ниже всё равно доступны."
            : next
              ? `Следующий ориентир: ${next.name}`
              : projection
                ? "Во всех наборах есть сохранённое завершение. Можно выбрать любой набор снова."
                : "Все наборы ниже доступны — можно выбрать любой."}
        </p>
        <div className={styles["summary-action"]}>
          {value.status === "error" ||
          (value.status === "loading" && retry > 0) ? (
            <button
              className={styles.secondary}
              ref={retryButtonRef}
              disabled={value.status === "loading"}
              onClick={() => {
                setValue({ status: "loading" });
                setRetry((current) => current + 1);
              }}
              type="button"
            >
              {value.status === "loading" ? "Загружаем…" : "Повторить"}
            </button>
          ) : next ? (
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readServerLearningPath } from "../../../app/progress/actions";
import {
  getLearningPathProjection,
  type LearningPathEntry,
} from "../application/learning-path";
import {
  packHref,
  type PackId,
} from "../application/completed-practice-episode";
import { ensureServerProgressImported } from "./server-progress-import";
import styles from "./learning-path.module.scss";

function PathEntryCard({ entry }: { entry: LearningPathEntry }) {
  return (
    <li
      className={styles.entry}
      data-state={
        entry.completed ? "recorded" : entry.suggested ? "suggested" : "open"
      }
    >
      <div className={styles["entry-heading"]}>
        <span className={styles.step}>Шаг {entry.position}</span>
        <span className={styles.status}>
          {entry.completed
            ? "Есть завершённая тренировка"
            : entry.suggested
              ? "Следующий ориентир"
              : "Можно выбрать"}
        </span>
      </div>
      <h3>{entry.name}</h3>
      <p>{entry.description}</p>
      <Link
        className={entry.suggested ? styles.primary : styles.secondary}
        href={packHref(entry.packId)}
        aria-label={`${entry.completed ? "Пройти ещё раз" : "Выбрать"} набор «${entry.name}»`}
      >
        {entry.completed
          ? "Пройти ещё раз"
          : entry.suggested
            ? "Продолжить путь"
            : "Выбрать этот набор"}
      </Link>
    </li>
  );
}

export function LearningPathGuide({
  completedPackIds,
}: {
  completedPackIds: readonly PackId[];
}) {
  const projection = getLearningPathProjection(completedPackIds);
  return (
    <section className={styles.guide} aria-labelledby="learning-path-title">
      <header>
        <p className={styles.eyebrow}>ПУТЬ ТРЕНИРОВОК</p>
        <h2 id="learning-path-title">Куда идти дальше</h2>
        <p>
          Это удобный маршрут по наборам, а не шкала сложности и не оценка
          знаний. Любой набор можно выбрать в любом порядке.
        </p>
        <p className={styles.count}>
          Сохранённые завершения: {projection.completedCount} из{" "}
          {projection.totalCount}
        </p>
      </header>
      <p>
        Отметки показывают сохранённые завершения. Старые тренировки могли не
        получить такую отметку. Уровни пути и XP учитываются отдельно.
      </p>
      {projection.allRecorded ? (
        <p className={styles.complete}>
          Во всех наборах пути есть сохранённая завершённая тренировка. Можно
          вернуться к любому набору и пройти его ещё раз.
        </p>
      ) : null}
      <ol className={styles.entries}>
        {projection.entries.map((entry) => (
          <PathEntryCard entry={entry} key={entry.packId} />
        ))}
      </ol>
    </section>
  );
}

export function LearningPathGuideLoader() {
  const [value, setValue] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; completedPackIds: readonly PackId[] }
  >({ status: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    void ensureServerProgressImported()
      .then(() => readServerLearningPath())
      .then(
        (completedPackIds) =>
          active && setValue({ status: "ready", completedPackIds }),
      )
      .catch(() => active && setValue({ status: "error" }));
    return () => {
      active = false;
    };
  }, [retry]);

  if (value.status === "loading")
    return <p role="status">Загружаем путь тренировок…</p>;
  if (value.status === "error")
    return (
      <div className={styles.error}>
        <p role="alert">
          Не удалось загрузить отметки пути. Все наборы ниже всё равно доступны.
        </p>
        <button
          className={styles.secondary}
          onClick={() => {
            setValue({ status: "loading" });
            setRetry((current) => current + 1);
          }}
          type="button"
        >
          Повторить
        </button>
      </div>
    );
  return <LearningPathGuide completedPackIds={value.completedPackIds} />;
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

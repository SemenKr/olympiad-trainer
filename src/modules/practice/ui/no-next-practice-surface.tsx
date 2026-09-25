import { useEffect, useId, useRef } from "react";

import styles from "./practice-session.module.scss";

export function NoNextPracticeSurface({
  onFinish,
  onPause,
  pending = false,
  storageError,
}: {
  onFinish: () => void;
  onPause: () => void;
  pending?: boolean;
  storageError: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const descriptionId = useId();
  const focusedRef = useRef(false);

  useEffect(() => {
    if (focusedRef.current) return;
    focusedRef.current = true;
    headingRef.current?.focus();
  }, []);

  return (
    <main className={styles["no-next"]}>
      <h1 aria-describedby={descriptionId} ref={headingRef} tabIndex={-1}>
        Тренировка
      </h1>
      <p id={descriptionId}>
        Сейчас больше нет задач в этой тренировке. Можно завершить тренировку и
        посмотреть итоги или вернуться на главную.
      </p>
      {storageError ? (
        <p aria-atomic="true" className={styles["hint-error"]} role="alert">
          Не удалось сохранить тренировку. Попробуй ещё раз.
        </p>
      ) : null}
      <div className={styles["no-next-actions"]}>
        <button
          className={styles["next-action"]}
          disabled={pending}
          onClick={onFinish}
          type="button"
        >
          Завершить тренировку
        </button>
        <button
          className={styles["hint-action"]}
          disabled={pending}
          onClick={onPause}
          type="button"
        >
          На главную
        </button>
      </div>
    </main>
  );
}

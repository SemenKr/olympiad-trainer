"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { readServerReviewAvailability } from "../../learner/progress-client";

export function ReviewEntry({
  available,
  actionClassName,
  className,
}: {
  available: boolean | null;
  actionClassName?: string;
  className?: string;
}) {
  const [retried, setRetried] = useState<boolean | null | undefined>();
  const [pending, setPending] = useState(false);
  const gate = useRef(false);
  const current = retried === undefined ? available : retried;
  if (current === false) return null;
  return (
    <section aria-label="Повторная попытка" className={className}>
      <h2>Повторная попытка</h2>
      {current === null ? (
        <>
          <p role="alert">
            Не удалось проверить, доступна ли повторная попытка.
          </p>
          <button
            type="button"
            className={actionClassName}
            disabled={pending}
            onClick={() => {
              if (gate.current) return;
              gate.current = true;
              setPending(true);
              void readServerReviewAvailability()
                .then(setRetried, () => setRetried(null))
                .finally(() => {
                  gate.current = false;
                  setPending(false);
                });
            }}
          >
            Проверить ещё раз
          </button>
          {pending ? <p role="status">Проверяем повторную попытку…</p> : null}
        </>
      ) : (
        <>
          <p>
            Попробуй знакомую задачу «Совпадающие места» ещё раз. Это отдельная
            попытка из прошлой тренировки, которая не меняет выводы о навыках.
          </p>
          <Link className={actionClassName} href="/practice/review">
            Решить знакомую задачу
          </Link>
        </>
      )}
    </section>
  );
}

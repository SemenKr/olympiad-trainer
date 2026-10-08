"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  initializeFreshAnonymousLearner,
  readLearnerIdentityStatus,
} from "./actions";

export default function LearnerIdentityGate({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    async function prepare() {
      if (!navigator.locks?.request)
        throw new Error("Identity lock unavailable");
      await navigator.locks.request(
        "olympiad-trainer:identity-initialization",
        async () => {
          const status = await readLearnerIdentityStatus();
          if (status === "unavailable") throw new Error("Identity unavailable");
          if (status === "missing") {
            // Existing local work is not evidence of ownership after cookie loss.
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (
                key?.startsWith("olympiad-trainer:") ||
                key?.startsWith("olympiad-trainer-")
              )
                throw new Error(
                  "Local learner work requires its original identity",
                );
            }
            await initializeFreshAnonymousLearner();
            if ((await readLearnerIdentityStatus()) !== "available")
              throw new Error("Identity unavailable");
          }
        },
      );
    }
    void prepare()
      .then(() => {
        if (active) setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [retry]);
  if (state === "ready") return children;
  return (
    <main>
      <h1>Олимпиадный тренажёр</h1>
      {state === "loading" ? (
        <p role="status">Проверяем доступ к тренировкам…</p>
      ) : (
        <>
          <p role="alert">
            Не удалось подтвердить доступ к истории. Сохранённая работа остаётся
            в браузере. Попробуй ещё раз или открой прежний профиль браузера.
          </p>
          <button
            type="button"
            onClick={() => {
              setState("loading");
              setRetry((value) => value + 1);
            }}
          >
            Попробовать ещё раз
          </button>
        </>
      )}
    </main>
  );
}

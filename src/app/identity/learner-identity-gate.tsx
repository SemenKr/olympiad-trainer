"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  initializeFreshAnonymousLearner,
  readAuthenticatedLearnerContext,
} from "./actions";
import {
  hasLocalLearnerBytes,
  reconcileAuthenticatedLocalOwner,
  suspendLocalLearner,
  LOCAL_IDENTITY_EVENT,
  LOCAL_OWNER_KEY,
  IDENTITY_SWITCH_KEY,
  IDENTITY_LOCK,
} from "../../modules/learner/local-ownership";

export default function LearnerIdentityGate({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    // Restore must remain reachable before anonymous initialization. In
    // particular, a lost-cookie browser cannot be assigned a new learner here.
    if (pathname === "/restore") return;
    let active = true;
    async function prepare() {
      if (!navigator.locks?.request)
        throw new Error("Identity lock unavailable");
      let authenticated = await readAuthenticatedLearnerContext();
      if (!active) return;
      if (authenticated === "unavailable")
        throw new Error("Identity unavailable");
      const preexisting = authenticated !== "missing";
      if (authenticated === "missing")
        await navigator.locks.request(IDENTITY_LOCK, async () => {
          const status = await readAuthenticatedLearnerContext();
          if (status === "unavailable") throw new Error("Identity unavailable");
          if (status === "missing") {
            // Existing local work is not evidence of ownership after cookie loss.
            if (hasLocalLearnerBytes(localStorage))
              throw new Error(
                "Local learner work requires its original identity",
              );
            await initializeFreshAnonymousLearner();
          }
          authenticated = await readAuthenticatedLearnerContext();
        });
      if (typeof authenticated === "string")
        throw new Error("Identity unavailable");
      if (active)
        await reconcileAuthenticatedLocalOwner(authenticated, preexisting);
    }
    void prepare()
      .then(() => {
        if (active) setState("ready");
      })
      .catch(() => {
        if (active) {
          suspendLocalLearner();
          setState("error");
        }
      });
    return () => {
      active = false;
    };
  }, [pathname, retry]);
  useEffect(() => {
    const invalidate = () => {
      setState("loading");
      setRetry((value) => value + 1);
    };
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === LOCAL_OWNER_KEY ||
        event.key === IDENTITY_SWITCH_KEY
      )
        invalidate();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(LOCAL_IDENTITY_EVENT, invalidate);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(LOCAL_IDENTITY_EVENT, invalidate);
    };
  }, []);
  if (pathname === "/restore" || state === "ready") return children;
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

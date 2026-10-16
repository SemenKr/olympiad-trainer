"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  confirmStartFreshLearner,
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
  START_FRESH_KEY,
  startFreshLocalIdentity,
} from "../../modules/learner/local-ownership";

import styles from "./learner-identity-gate.module.scss";

export default function LearnerIdentityGate({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [readyPath, setReadyPath] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [lost, setLost] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const freshButton = useRef<HTMLButtonElement>(null);
  const starting = useRef(false);
  useEffect(() => {
    if (confirming) confirmationHeading.current?.focus();
  }, [confirming]);
  async function startFresh() {
    if (starting.current) return;
    starting.current = true;
    setConfirming(false);
    setState("loading");
    try {
      await startFreshLocalIdentity(() => confirmStartFreshLearner(true));
      setRetry((value) => value + 1);
    } catch {
      suspendLocalLearner();
      setLost(false);
      setState("error");
    } finally {
      starting.current = false;
    }
  }
  useEffect(() => {
    // Restore must remain reachable before anonymous initialization. In
    // particular, a lost-cookie browser cannot be assigned a new learner here.
    if (pathname === "/restore") return;
    let active = true;
    let identityLost = false;
    async function prepare() {
      if (!navigator.locks?.request)
        throw new Error("Identity lock unavailable");
      let authenticated = await readAuthenticatedLearnerContext();
      if (!active) return;
      if (authenticated === "unavailable")
        throw new Error("Identity unavailable");
      // Storage/lock failures are operational errors, never reset eligibility.
      const freshIntent = localStorage.getItem(START_FRESH_KEY);
      if (freshIntent !== null && freshIntent !== "confirmed-v1")
        throw new Error("Invalid fresh intent");
      hasLocalLearnerBytes(localStorage);
      if (authenticated === "invalid") {
        identityLost = true;
        throw new Error("Invalid identity");
      }
      if (freshIntent && typeof authenticated !== "string") {
        await startFreshLocalIdentity(async () => {
          const current = await readAuthenticatedLearnerContext();
          if (typeof current === "string")
            throw new Error("Identity unavailable");
          return current;
        });
        return;
      }
      const preexisting = authenticated !== "missing";
      if (authenticated === "missing")
        await navigator.locks.request(IDENTITY_LOCK, async () => {
          const status = await readAuthenticatedLearnerContext();
          if (status === "unavailable") throw new Error("Identity unavailable");
          if (status === "invalid") {
            identityLost = true;
            throw new Error("Invalid identity");
          }
          if (status === "missing") {
            // Existing local work is not evidence of ownership after cookie loss.
            if (hasLocalLearnerBytes(localStorage)) {
              identityLost = true;
              throw new Error(
                "Local learner work requires its original identity",
              );
            }
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
        if (active) {
          setReadyPath(pathname);
          setConfirming(false);
          setState("ready");
        }
      })
      .catch(() => {
        if (active) {
          suspendLocalLearner();
          setConfirming(false);
          setLost(identityLost);
          setState("error");
        }
      });
    return () => {
      active = false;
    };
  }, [pathname, retry]);
  useEffect(() => {
    const invalidate = () => {
      if (starting.current) return;
      setState("loading");
      setRetry((value) => value + 1);
    };
    const onStorage = (event: StorageEvent) => {
      if (
        event.key === null ||
        event.key === START_FRESH_KEY ||
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
  if (pathname === "/restore" || (state === "ready" && readyPath === pathname))
    return children;
  return (
    <main className={styles.gate}>
      <h1>Олимпиадный тренажёр</h1>
      {state === "loading" || (state === "ready" && readyPath !== pathname) ? (
        <p role="status">Проверяем доступ к тренировкам…</p>
      ) : (
        <>
          <p role="alert">
            {lost
              ? "Доступ к прежнему профилю потерян. Сохранённая работа остаётся в браузере. Восстанови доступ по коду или начни заново."
              : "Не удалось проверить доступ. Возможно, временно недоступны сервер или хранилище браузера. Закрой другие вкладки с тренировкой и попробуй ещё раз. Сохранённая работа не переносится автоматически."}
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
          {lost && !confirming && (
            <button
              ref={freshButton}
              type="button"
              onClick={() => setConfirming(true)}
            >
              Начать заново
            </button>
          )}
          {lost && confirming && (
            <section aria-labelledby="start-fresh-heading">
              <h2
                id="start-fresh-heading"
                ref={confirmationHeading}
                tabIndex={-1}
              >
                Начать с новым профилем?
              </h2>
              <p>
                Прежняя история и незавершённая работа не перенесутся в новый
                профиль. Прежняя история на сервере не удалится, но для доступа
                к ней понадобится сохранённый код восстановления или прежний
                профиль браузера. Без кода вернуть доступ не получится.
              </p>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  requestAnimationFrame(() => freshButton.current?.focus());
                }}
              >
                Отмена
              </button>
              <button type="button" onClick={() => void startFresh()}>
                Подтверждаю: начать заново
              </button>
            </section>
          )}
          <p>
            Есть сохранённый код восстановления?{" "}
            <Link className={styles["recovery-link"]} href="/restore">
              Восстановить доступ по коду
            </Link>
          </p>
        </>
      )}
    </main>
  );
}

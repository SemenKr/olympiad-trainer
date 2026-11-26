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
  initializeEmptyLocalOwner,
  prepareExistingLocalOwner,
  reconcileAuthenticatedLocalOwner,
  suspendLocalLearner,
  LOCAL_IDENTITY_EVENT,
  LOCAL_OWNER_KEY,
  IDENTITY_SWITCH_KEY,
  IDENTITY_LOCK,
  START_FRESH_KEY,
  startFreshLocalIdentity,
  withIdentityBarrier,
} from "../../modules/learner/local-ownership";

import {
  CanonicalPersistenceError,
  canonicalRequired,
  confirmCanonicalHandoff,
  HANDOFF_KEY,
  initializeEmptyCanonicalOwner,
  prepareCanonicalOwner,
} from "../../modules/learner/canonical-local-store";
import { sameLocalLearnerOwner } from "../../modules/learner/local-owner-context";
import styles from "./learner-identity-gate.module.scss";

import { LearnerViewReady } from "./learner-view-readiness";

const learnerRoutes = new Set([
  "/practice",
  "/practice/pack",
  "/practice/review",
  "/practice/summary",
  "/practice/transfer",
  "/progress",
  "/simulation",
]);

export default function LearnerIdentityGate({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const optionalProfile = pathname === "/" || pathname === "/practice/choose";
  const publicOnly = !optionalProfile && !learnerRoutes.has(pathname);
  const [state, setState] = useState<"loading" | "ready" | "error" | "handoff">(
    "loading",
  );
  const [observedPath, setObservedPath] = useState(pathname);
  const [retry, setRetry] = useState(0);
  const [lost, setLost] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const freshButton = useRef<HTMLButtonElement>(null);
  const starting = useRef(false);
  if (observedPath !== pathname) {
    setObservedPath(pathname);
    setState("loading");
    setConfirming(false);
  }
  useEffect(() => {
    if (confirming) confirmationHeading.current?.focus();
  }, [confirming]);
  async function handoff() {
    if (starting.current) return;
    starting.current = true;
    setState("loading");
    try {
      await withIdentityBarrier(async () => {
        const owner = await readAuthenticatedLearnerContext();
        if (typeof owner === "string") throw new Error("Identity unavailable");
        await confirmCanonicalHandoff(owner);
      });
      setRetry((value) => value + 1);
    } catch {
      suspendLocalLearner();
      setState("error");
    } finally {
      starting.current = false;
    }
  }
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
    // Public pages and Recovery must never initialize a learner.
    if (publicOnly) return;
    let active = true;
    let identityLost = false;
    async function prepare() {
      if (!navigator.locks?.request)
        throw new Error("Identity lock unavailable");
      if (optionalProfile) {
        if (!canonicalRequired()) return false;
        return navigator.locks.request(
          IDENTITY_LOCK,
          { mode: "shared" },
          async () => {
            const owner = await readAuthenticatedLearnerContext();
            if (!active || typeof owner === "string") return false;
            await prepareExistingLocalOwner(owner);
            return true;
          },
        );
      }
      let authenticated = await navigator.locks.request(
        IDENTITY_LOCK,
        { mode: "shared" },
        readAuthenticatedLearnerContext,
      );
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
      const preexistingCredential = authenticated !== "missing";
      if (authenticated === "missing") {
        const initialized = await withIdentityBarrier(
          async () => {
            const status = await readAuthenticatedLearnerContext();
            if (status === "unavailable")
              throw new Error("Identity unavailable");
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
              await initializeEmptyLocalOwner(async () => {
                await initializeFreshAnonymousLearner();
                const owner = await readAuthenticatedLearnerContext();
                if (typeof owner === "string")
                  throw new Error("Identity unavailable");
                return owner;
              });
              return true;
            }
            authenticated = status;
            return false;
          },
          { waitForIdentity: true },
        );
        if (initialized) return;
      }
      if (typeof authenticated === "string")
        throw new Error("Identity unavailable");
      if (active) {
        const owner = authenticated;
        try {
          await reconcileAuthenticatedLocalOwner(owner, preexistingCredential);
          await prepareCanonicalOwner(owner);
        } catch (error) {
          if (
            !(error instanceof CanonicalPersistenceError) ||
            error.status !== "handoff-required"
          )
            throw error;
          await withIdentityBarrier(
            async () => {
              const current = await readAuthenticatedLearnerContext();
              if (
                typeof current === "string" ||
                !sameLocalLearnerOwner(current, owner)
              )
                throw new Error("Identity changed before storage setup");
              try {
                // Another tab may have activated storage while we waited.
                await prepareCanonicalOwner(owner);
              } catch (error) {
                if (
                  !(error instanceof CanonicalPersistenceError) ||
                  error.status !== "handoff-required"
                )
                  throw error;
                await initializeEmptyCanonicalOwner(owner);
              }
            },
            { waitForIdentity: true, waitForPractice: true },
          );
          await reconcileAuthenticatedLocalOwner(owner, preexistingCredential);
        }
      }
    }
    void prepare()
      .then((ready) => {
        if (active && ready !== false) {
          setConfirming(false);
          setState("ready");
        }
      })
      .catch((error: unknown) => {
        if (active) {
          suspendLocalLearner();
          setConfirming(false);
          setLost(identityLost);
          setState(
            error instanceof CanonicalPersistenceError &&
              error.status === "handoff-required"
              ? "handoff"
              : "error",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [optionalProfile, pathname, publicOnly, retry]);
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
        event.key === HANDOFF_KEY ||
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
  const ready = state === "ready" && observedPath === pathname;
  if (publicOnly) return children;
  if (optionalProfile || ready)
    return <LearnerViewReady value={ready}>{children}</LearnerViewReady>;
  return (
    <main className={styles.gate}>
      <h1>Олимпиадный тренажёр</h1>
      {state === "loading" || observedPath !== pathname ? (
        <p role="status">Проверяем доступ к тренировкам…</p>
      ) : state === "handoff" ? (
        <>
          <h2>Продолжить с сохранённой работой</h2>
          <p>
            Если тренажёр открыт в других вкладках, сохрани там работу и закрой
            их. Затем подтверди перенос. Прежние данные останутся в браузере.
          </p>
          <button type="button" onClick={() => void handoff()}>
            Другие вкладки закрыты — перенести работу
          </button>
        </>
      ) : (
        <>
          <p role="alert">
            {lost
              ? "Доступ к прежнему профилю потерян. Сохранённая работа остаётся в браузере. Восстанови доступ по коду или начни заново."
              : "Не получилось открыть твой профиль. Закрой другие вкладки с тренажёром и попробуй ещё раз. Сохранённая работа останется в браузере."}
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
      <Link href="/">На главную</Link>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  finishSimulation,
  readSimulation,
  readSimulationReferences,
  saveSimulation,
  startSimulation,
} from "../../../app/simulation/actions";
import {
  MAX_DRAFT_LENGTH,
  remainingSimulationSeconds,
  sameSimulationWork,
  type SimulationAttempt,
  type SimulationProblem,
  type SimulationReference,
  type SimulationSnapshot,
} from "../domain/simulation";
import {
  restoreSimulationDraft,
  storeSimulationDraft,
  hasUnsubmittedDrafts,
  SIMULATION_PENDING_KEY,
} from "./simulation-storage";
import styles from "./simulation-session.module.scss";

export function SimulationSession({
  problems,
}: {
  problems: readonly SimulationProblem[];
}) {
  const [attempt, setAttempt] = useState<SimulationAttempt | null>(null);
  const current = useRef<SimulationAttempt | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [seconds, setSeconds] = useState(45 * 60);
  const clock = useRef({ serverNow: 0, receivedAt: 0 });
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);
  const summaryRef = useRef<HTMLHeadingElement>(null);
  const [references, setReferences] = useState<
    readonly SimulationReference[] | null
  >(null);
  const [referenceError, setReferenceError] = useState(false);
  const dirty = useRef(false);
  const ownsEditor = useRef(false);
  const pendingSave = useRef<SimulationAttempt | null>(null);
  const [unsubmitted, setUnsubmitted] = useState(false);
  const confirmedFinish = useRef(false);

  const showAttempt = useCallback((value: SimulationAttempt | null) => {
    current.current = value;
    setAttempt(value);
  }, []);

  const acceptClock = useCallback((snapshot: SimulationSnapshot) => {
    clock.current = {
      serverNow: snapshot.serverNow,
      receivedAt: performance.now(),
    };
    if (snapshot.attempt)
      setSeconds(
        remainingSimulationSeconds(snapshot.attempt, snapshot.serverNow),
      );
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const snapshot = await readSimulation();
      acceptClock(snapshot);
      const restored = snapshot.attempt
        ? restoreSimulationDraft(snapshot.attempt)
        : null;
      if (restored?.finishedAt !== null && restored)
        setUnsubmitted(hasUnsubmittedDrafts(restored));
      dirty.current = !!(
        restored &&
        snapshot.attempt &&
        !sameSimulationWork(restored, snapshot.attempt)
      );
      showAttempt(restored);
      setSaved(!dirty.current);
      setReady(true);
    } catch {
      setError(
        "Не удалось восстановить симуляцию. Проверь соединение и попробуй ещё раз. При конфликте черновиков сохрани локальную копию перед продолжением.",
      );
    }
  }, [acceptClock, showAttempt]);

  useEffect(() => {
    let disposed = false;
    let release = () => {};
    if (!navigator.locks?.request) {
      queueMicrotask(() =>
        setError(
          "Для сохранения симуляции нужен браузер с поддержкой Web Locks. Открой её в современном браузере.",
        ),
      );
      return;
    }
    void navigator.locks.request(
      "olympiad-trainer:simulation-editor",
      { ifAvailable: true },
      async (lock) => {
        if (!lock) {
          setError(
            "Симуляция уже открыта в другой вкладке. Закрой её и обнови эту страницу.",
          );
          return;
        }
        ownsEditor.current = true;
        await new Promise<void>((resolve) => {
          release = resolve;
          if (disposed) resolve();
          else void load();
        });
        ownsEditor.current = false;
      },
    );
    return () => {
      disposed = true;
      release();
    };
  }, [load]);

  const synchronize = useCallback(
    async (finish = false, confirmed = false) => {
      const latestBeforeSave = current.current;
      if (
        !latestBeforeSave ||
        latestBeforeSave.finishedAt !== null ||
        busyRef.current
      )
        return;
      const sent = pendingSave.current ?? latestBeforeSave;
      if (finish && confirmed) confirmedFinish.current = true;
      busyRef.current = true;
      setBusy(true);
      setError("");
      try {
        pendingSave.current = sent;
        storeSimulationDraft(latestBeforeSave, sent);
        const replaying = !sameSimulationWork(sent, latestBeforeSave);
        const snapshot =
          (finish || confirmedFinish.current) && !replaying
            ? await finishSimulation(
                sent.sessionId,
                sent.revision,
                sent,
                confirmed || confirmedFinish.current,
              )
            : await saveSimulation(sent.sessionId, sent.revision, sent);
        if (!snapshot.attempt) throw new Error("Missing simulation attempt.");
        acceptClock(snapshot);
        const latest = current.current;
        const next =
          snapshot.attempt.finishedAt !== null ||
          !latest ||
          sameSimulationWork(sent, latest)
            ? snapshot.attempt
            : {
                ...snapshot.attempt,
                drafts: latest.drafts,
                selectedIndex: latest.selectedIndex,
              };
        dirty.current = !sameSimulationWork(next, snapshot.attempt);
        pendingSave.current = null;
        showAttempt(next);
        setSaved(!dirty.current);
        if (next.finishedAt !== null) {
          setConfirming(false);
          const unsent = !!(latest && !sameSimulationWork(latest, next));
          setUnsubmitted(unsent);
          if (!unsent) localStorage.removeItem(SIMULATION_PENDING_KEY);
          confirmedFinish.current = false;
        } else storeSimulationDraft(next);
      } catch {
        setSaved(false);
        setError(
          "Не удалось сохранить работу. Черновики остаются в этой вкладке и локальной копии. Проверь соединение и повтори сохранение. Время продолжает идти.",
        );
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [acceptClock, showAttempt],
  );

  useEffect(() => {
    if (!attempt || attempt.finishedAt !== null || !dirty.current) return;
    const timer = setTimeout(() => {
      void synchronize();
    }, 300);
    return () => clearTimeout(timer);
  }, [attempt, synchronize]);

  const activeSessionId =
    attempt?.finishedAt === null ? attempt.sessionId : null;
  useEffect(() => {
    if (!activeSessionId) return;
    const tick = () => {
      const value = current.current;
      if (!value || value.finishedAt !== null) return;
      const now =
        clock.current.serverNow + performance.now() - clock.current.receivedAt;
      const remaining = remainingSimulationSeconds(value, now);
      setSeconds(remaining);
      if (remaining === 0) void synchronize(true);
    };
    const timer = setInterval(tick, 1000);
    const refresh = setInterval(() => {
      void synchronize();
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void synchronize();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      clearInterval(refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeSessionId, synchronize]);

  const loadReferences = useCallback(async (id: string) => {
    try {
      setReferences(await readSimulationReferences(id));
      setReferenceError(false);
    } catch {
      setReferenceError(true);
    }
  }, []);

  useEffect(() => {
    if (attempt?.finishedAt !== null && attempt?.sessionId) {
      let cancelled = false;
      void readSimulationReferences(attempt.sessionId)
        .then((result) => {
          if (!cancelled) setReferences(result);
        })
        .catch(() => {
          if (!cancelled) setReferenceError(true);
        });
      return () => {
        cancelled = true;
      };
    }
  }, [attempt?.sessionId, attempt?.finishedAt]);

  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  useEffect(() => {
    if (attempt?.finishedAt !== null) summaryRef.current?.focus();
  }, [attempt?.finishedAt]);

  function edit(next: SimulationAttempt) {
    if (seconds === 0 || next.finishedAt !== null) return;
    // Write before updating the editor so a reload cannot lose acknowledged keystrokes.
    try {
      storeSimulationDraft(next, pendingSave.current);
      dirty.current = true;
      setSaved(false);
      showAttempt(next);
    } catch {
      setError(
        "Не удалось сохранить локальную копию. Освободи место в браузере и повтори ввод; предыдущий черновик сохранён.",
      );
    }
  }

  async function start() {
    setBusy(true);
    setError("");
    try {
      const snapshot = await startSimulation();
      acceptClock(snapshot);
      if (!snapshot.attempt) throw new Error("Missing simulation attempt.");
      storeSimulationDraft(snapshot.attempt);
      showAttempt(snapshot.attempt);
      setSaved(true);
    } catch {
      setError("Не удалось начать симуляцию. Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  }

  const finished = attempt?.finishedAt !== null && attempt !== null;
  const problem = attempt ? problems[attempt.selectedIndex] : null;
  return (
    <main className={styles.simulation}>
      <Link href="/">На главную</Link>
      <h1>Олимпиадная симуляция</h1>
      <p>Математика · 5 класс · 4 задачи · 45 минут</p>
      <p role="alert">{error}</p>
      {(error || unsubmitted) && (
        <button
          onClick={() => {
            const raw = localStorage.getItem(SIMULATION_PENDING_KEY);
            if (!raw) return;
            const url = URL.createObjectURL(
              new Blob([raw], { type: "application/json" }),
            );
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = "simulation-drafts.json";
            anchor.click();
            URL.revokeObjectURL(url);
          }}
        >
          Скачать локальную копию черновиков
        </button>
      )}
      {!ready && (
        <>
          <p>
            {error
              ? "Симуляция пока недоступна."
              : "Восстанавливаем состояние…"}
          </p>
          {error && (
            <button
              onClick={() => {
                if (ownsEditor.current) void load();
                else window.location.reload();
              }}
            >
              Повторить восстановление
            </button>
          )}
        </>
      )}
      {ready && !attempt && (
        <section>
          <h2>Самостоятельная работа</h2>
          <p>
            Можно переходить между всеми задачами. Записывай ответ и ход
            рассуждений в черновик; можно пользоваться бумагой. Подсказки и
            разборы появятся только после завершения.
          </p>
          <p>
            Таймер не останавливается при закрытии страницы. Работа сохраняется
            автоматически в этом браузере и на сервере. Перед завершением
            проверь статус сохранения.
          </p>
          <p>
            Это наш тренировочный вариант из существующих задач, а не
            официальный тур. Баллы и XP не начисляются.
          </p>
          <button
            disabled={busy}
            onClick={() => {
              void start();
            }}
          >
            Начать · 45 минут
          </button>
        </section>
      )}
      {attempt && !finished && problem && (
        <>
          <div className={styles.toolbar}>
            <p role="timer" aria-live="off" aria-label="Осталось времени">
              {Math.floor(seconds / 60)
                .toString()
                .padStart(2, "0")}
              :{(seconds % 60).toString().padStart(2, "0")}
            </p>
            <p role="status">
              {seconds === 0
                ? "Время вышло. Завершаем работу…"
                : saved
                  ? "Все черновики сохранены"
                  : "Сохраняем черновики…"}
            </p>
          </div>
          <nav className={styles.navigation} aria-label="Задачи симуляции">
            {problems.map((item, index) => (
              <button
                key={item.problemId}
                aria-current={
                  attempt.selectedIndex === index ? "step" : undefined
                }
                disabled={seconds === 0 || confirming}
                onClick={() => edit({ ...attempt, selectedIndex: index })}
              >
                Задача {index + 1}
                {attempt.drafts[index].trim() ? " · есть черновик" : ""}
              </button>
            ))}
          </nav>
          <section aria-labelledby="simulation-problem-title">
            <h2 id="simulation-problem-title">
              {attempt.selectedIndex + 1}. {problem.title}
            </h2>
            <p className={styles.statement}>{problem.statement}</p>
            {problem.options.length > 0 && (
              <p>
                Варианты из условия: {problem.options.join(", ")}. Укажи выбор и
                обоснование в черновике.
              </p>
            )}
            <label htmlFor="simulation-draft">Твой ответ и ход решения</label>
            <textarea
              id="simulation-draft"
              rows={10}
              maxLength={MAX_DRAFT_LENGTH}
              disabled={seconds === 0 || confirming}
              value={attempt.drafts[attempt.selectedIndex]}
              onChange={(event) => {
                const drafts: [string, string, string, string] = [
                  ...attempt.drafts,
                ];
                drafts[attempt.selectedIndex] = event.target.value;
                edit({ ...attempt, drafts });
              }}
            />
            <p className={styles.note}>
              Свободный черновик до {MAX_DRAFT_LENGTH} символов. Автоматической
              проверки нет.
            </p>
          </section>
          {error && (
            <button
              disabled={busy}
              onClick={() => {
                void synchronize(seconds === 0);
              }}
            >
              Повторить сохранение
            </button>
          )}
          {!confirming && (
            <button
              ref={finishRef}
              disabled={busy || seconds === 0}
              onClick={() => setConfirming(true)}
            >
              Завершить раньше
            </button>
          )}
          {confirming && (
            <section
              className={styles.confirmation}
              aria-labelledby="finish-confirm-title"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  confirmedFinish.current = false;
                  setConfirming(false);
                  finishRef.current?.focus();
                }
              }}
            >
              <h2 id="finish-confirm-title">Завершить симуляцию?</h2>
              <p>
                Все четыре черновика будут сданы, даже пустые. После этого их
                нельзя изменить. Откроются разборы задач.
              </p>
              <button
                ref={cancelRef}
                disabled={busy}
                onClick={() => {
                  confirmedFinish.current = false;
                  setConfirming(false);
                  finishRef.current?.focus();
                }}
              >
                Продолжить работу
              </button>
              <button
                disabled={busy || seconds === 0}
                onClick={() => {
                  void synchronize(true, true);
                }}
              >
                Да, завершить и сдать
              </button>
            </section>
          )}
        </>
      )}
      {attempt && finished && (
        <section>
          <h2 ref={summaryRef} tabIndex={-1}>
            {attempt.finishReason === "timeout"
              ? "Время вышло — работа завершена"
              : "Работа завершена"}
          </h2>
          <p>
            Ниже — сданная работа и разборы для самостоятельного сравнения.
            Автоматических оценок нет; эта симуляция не меняет прогресс, Review
            и XP.
          </p>
          {attempt.finishReason === "timeout" && (
            <p>Сданы черновики, которые сервер получил до истечения времени.</p>
          )}
          {unsubmitted && (
            <p role="alert">
              Локальная копия содержит изменения, которые не попали в сданную
              работу. Скачай её для сохранности; изменить завершённую работу
              нельзя.
            </p>
          )}
          {problems.map((item, index) => (
            <section key={item.problemId} className={styles.submission}>
              <h3>
                {index + 1}. {item.title}
              </h3>
              <p className={styles.statement}>{item.statement}</p>
              <h4>Твоя сданная работа</h4>
              <p className={styles.statement}>
                {attempt.drafts[index] ||
                  "Черновик пуст — решение не записано."}
              </p>
              {references && (
                <>
                  <h4>Разбор для сравнения</h4>
                  <p className={styles.statement}>
                    {
                      references.find(
                        (reference) => reference.problemId === item.problemId,
                      )?.text
                    }
                  </p>
                </>
              )}
            </section>
          ))}
          {!references && (
            <p role="status">
              {referenceError
                ? "Не удалось загрузить разборы. Сданная работа сохранена."
                : "Загружаем разборы…"}
            </p>
          )}
          {referenceError && (
            <button
              onClick={() => {
                void loadReferences(attempt.sessionId);
              }}
            >
              Повторить загрузку разборов
            </button>
          )}
          <Link href="/practice">Перейти к обычной практике</Link>
        </section>
      )}
    </main>
  );
}

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
  const wasConfirming = useRef(false);
  const [showTimeoutWork, setShowTimeoutWork] = useState(false);
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
    else if (wasConfirming.current && current.current?.finishedAt === null)
      finishRef.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);

  useEffect(() => {
    if (attempt?.finishedAt !== null) summaryRef.current?.focus();
  }, [attempt?.finishedAt, showTimeoutWork]);

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
  const timeoutNotice =
    finished && attempt.finishReason === "timeout" && !showTimeoutWork;
  const remainingText = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  const localCopyButton = (
    <button
      className={styles.secondary}
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
  );
  return (
    <main className={styles.simulation}>
      <nav className={styles["top-navigation"]} aria-label="Навигация">
        <Link href="/">← На главную</Link>
        <span aria-current="page">Олимпиадная симуляция</span>
      </nav>
      <h1 className={styles["visually-hidden"]}>Олимпиадная симуляция</h1>
      <div className={styles.meta}>
        <p className={styles.eyebrow}>5 класс · математика</p>
        <p>4 задачи · 45 минут</p>
      </div>
      {error && (
        <div className={styles.recovery}>
          <p role="alert">{error}</p>
          {localCopyButton}
        </div>
      )}
      {!ready && (
        <>
          <p role={error ? undefined : "status"}>
            {error
              ? "Симуляция пока недоступна."
              : "Восстанавливаем состояние…"}
          </p>
          {error && (
            <button
              className={styles.secondary}
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
        <section className={`${styles.card} ${styles.start}`}>
          <h2>Самостоятельная работа</h2>
          <p>
            Можно переходить между всеми четырьмя задачами и менять черновики до
            завершения. Записывай ответ и ход рассуждений; можно пользоваться
            бумагой.
          </p>
          <section
            className={styles.rules}
            aria-labelledby="simulation-rules-title"
          >
            <h3 id="simulation-rules-title">Как проходит симуляция</h3>
            <ul>
              <li>45 минут с момента старта</li>
              <li>Подсказок и разборов до завершения нет</li>
              <li>
                Черновики сохраняются автоматически в этом браузере и на сервере
              </li>
              <li>Таймер не останавливается при закрытии страницы</li>
              <li>Баллы и XP не начисляются; автоматической проверки нет</li>
            </ul>
          </section>
          <p className={styles.note}>
            Это наш тренировочный вариант из существующих задач, а не
            официальный тур. Перед завершением проверь статус сохранения.
          </p>
          <button
            className={styles.primary}
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
          <div className={styles.active} hidden={confirming}>
            <div className={styles.toolbar}>
              <p role="timer" aria-live="off" aria-label="Осталось времени">
                {remainingText}
              </p>
              <p role="status">
                {seconds === 0
                  ? "Время вышло. Завершаем работу…"
                  : saved
                    ? "Все черновики сохранены"
                    : "Сохраняем черновики…"}
              </p>
            </div>
            <section
              className={`${styles.card} ${styles.editor}`}
              aria-labelledby="simulation-problem-title"
            >
              <h2 id="simulation-problem-title">
                {attempt.selectedIndex + 1}. {problem.title}
              </h2>
              <p className={styles.statement}>{problem.statement}</p>
              {problem.options.length > 0 && (
                <p>
                  Варианты из условия: {problem.options.join(", ")}. Укажи выбор
                  и обоснование в черновике.
                </p>
              )}
              <label htmlFor="simulation-draft">Твой ответ и ход решения</label>
              <textarea
                id="simulation-draft"
                aria-describedby="simulation-draft-note"
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
              <p className={styles.note} id="simulation-draft-note">
                Черновик сохраняется автоматически, до {MAX_DRAFT_LENGTH}{" "}
                символов. Автоматической проверки нет.
              </p>
            </section>
            <nav className={styles.navigation} aria-label="Задачи симуляции">
              {problems.map((item, index) => (
                <button
                  key={item.problemId}
                  aria-label={`Задача ${index + 1}${attempt.drafts[index].trim() ? " · есть черновик" : " · пусто"}`}
                  aria-current={
                    attempt.selectedIndex === index ? "step" : undefined
                  }
                  disabled={seconds === 0 || confirming}
                  onClick={() => edit({ ...attempt, selectedIndex: index })}
                >
                  <span>
                    <span className={styles["task-word"]}>Задача </span>
                    {index + 1}
                  </span>
                  <span className={styles["draft-status"]}>
                    {attempt.drafts[index].trim() ? "есть черновик" : "пусто"}
                  </span>
                </button>
              ))}
            </nav>
            {error && (
              <button
                className={`${styles.secondary} ${styles["save-retry"]}`}
                disabled={busy}
                onClick={() => {
                  void synchronize(seconds === 0);
                }}
              >
                Повторить сохранение
              </button>
            )}
            <button
              className={`${styles.secondary} ${styles["finish-action"]}`}
              ref={finishRef}
              disabled={busy || seconds === 0}
              onClick={() => setConfirming(true)}
            >
              Завершить раньше
            </button>
          </div>
          {confirming && (
            <>
              <div className={styles.context}>
                <p>
                  {remainingText} осталось · Задача {attempt.selectedIndex + 1}{" "}
                  из 4
                </p>
                <h2>{problem.title}</h2>
              </div>
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
                  className={styles.secondary}
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
                  className={styles.primary}
                  disabled={busy || seconds === 0}
                  onClick={() => {
                    void synchronize(true, true);
                  }}
                >
                  Да, завершить и сдать
                </button>
              </section>
            </>
          )}
        </>
      )}
      {attempt && finished && (
        <section className={styles.completed}>
          <header
            className={
              timeoutNotice ? styles.timeout : styles["completed-header"]
            }
          >
            <h2 ref={summaryRef} tabIndex={-1}>
              {attempt.finishReason === "timeout"
                ? "Время вышло — работа завершена"
                : "Работа завершена"}
            </h2>
            {timeoutNotice ? (
              <p>
                Сданы черновики, которые сервер получил до истечения 45 минут.
                Изменить завершённую работу нельзя.
              </p>
            ) : (
              <p>
                Ниже — сданная работа и разборы для самостоятельного сравнения.
                Автоматических оценок нет; эта симуляция не меняет прогресс,
                Review и XP.
              </p>
            )}
            {!timeoutNotice && attempt.finishReason === "timeout" && (
              <p>
                Сданы черновики, которые сервер получил до истечения времени.
              </p>
            )}
            {unsubmitted && (
              <div className={styles["local-copy"]}>
                <p role="alert">
                  Локальная копия содержит изменения, которые не попали в
                  сданную работу. Скачай её для сохранности; изменить
                  завершённую работу нельзя.
                </p>
                {!error && localCopyButton}
              </div>
            )}
            {timeoutNotice && (
              <button
                className={styles.primary}
                onClick={() => setShowTimeoutWork(true)}
              >
                Посмотреть сданную работу и разборы
              </button>
            )}
          </header>
          {!timeoutNotice && (
            <div className={styles["completed-content"]}>
              <div className={styles.submissions}>
                {problems.map((item, index) => (
                  <section
                    key={item.problemId}
                    className={styles.submission}
                    id={`simulation-submission-${index + 1}`}
                    aria-labelledby={`simulation-submission-title-${index + 1}`}
                  >
                    <div className={styles.card}>
                      <h3 id={`simulation-submission-title-${index + 1}`}>
                        {index + 1}. {item.title}
                      </h3>
                      <p className={styles.statement}>{item.statement}</p>
                      <h4>Твоя сданная работа</h4>
                      <p className={styles.statement}>
                        {attempt.drafts[index] ||
                          "Черновик пуст — решение не записано."}
                      </p>
                    </div>
                    {references && (
                      <div className={`${styles.card} ${styles.reference}`}>
                        <h4>Разбор для сравнения</h4>
                        <p className={styles.statement}>
                          {
                            references.find(
                              (reference) =>
                                reference.problemId === item.problemId,
                            )?.text
                          }
                        </p>
                      </div>
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
                    className={styles.secondary}
                    onClick={() => {
                      void loadReferences(attempt.sessionId);
                    }}
                  >
                    Повторить загрузку разборов
                  </button>
                )}
              </div>
              <aside
                className={styles["completed-side"]}
                aria-label="Задачи и дальнейшие действия"
              >
                <nav
                  className={`${styles.card} ${styles["task-list"]}`}
                  aria-label="Сданные задачи"
                >
                  <h3>Все задачи</h3>
                  {problems.map((item, index) => (
                    <a
                      href={`#simulation-submission-${index + 1}`}
                      key={item.problemId}
                    >
                      {index + 1} · {item.title}
                    </a>
                  ))}
                </nav>
                <Link className={styles.secondary} href="/practice">
                  Перейти к обычной практике
                </Link>
              </aside>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  reconcileAuthenticatedLocalOwner,
  transitionLocalIdentity,
  transitionRecoveredLocalIdentity,
} from "../../modules/learner/local-ownership";
import {
  isLocalLearnerOwner,
  sameLocalLearnerOwner,
  type LocalLearnerOwner,
} from "../../modules/learner/local-owner-context";
import { readAuthenticatedLearnerContext } from "../identity/actions";
import styles from "./recovery-panel.module.scss";

type Mode = "enrollment" | "replacement" | "recovery";
type Operation = { id: string; mode: Mode; code: string };
type Action =
  | Mode
  | "status-authenticated"
  | "cancel"
  | "context-authenticated"
  | "context-recovery"
  | "confirm-authenticated"
  | "confirm-recovery";

async function postAction(action: Action, code?: string) {
  const response = await fetch("/api/identity/credentials", {
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...(code === undefined ? {} : { code }) }),
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("unavailable");
  }
  if (!response.ok || typeof body !== "object" || body === null)
    throw new Error("unavailable");
  return body as Record<string, unknown>;
}

export function RecoveryPanel({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [account, setAccount] = useState<
    "loading" | "signed-out" | "disabled" | { recoveryEnabled: boolean }
  >(enabled ? "loading" : "disabled");
  const [operation, setOperation] = useState<Operation | null>(null);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [recovered, setRecovered] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!enabled) return;
    void postAction("status-authenticated")
      .then((result) => {
        if (active) setAccount({ recoveryEnabled: result.enabled === true });
      })
      .catch(() => {
        if (active) setAccount("signed-out");
      });
    return () => {
      active = false;
    };
  }, [enabled]);

  useEffect(() => {
    if (operation || error || account !== "loading")
      headingRef.current?.focus();
  }, [account, error, operation, recovered]);

  async function start(nextMode: Mode, code?: string) {
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const result = await postAction(nextMode, code);
      if (
        result.ok !== true ||
        typeof result.operationId !== "string" ||
        typeof result.code !== "string"
      )
        throw new Error("unavailable");
      setOperation({
        id: result.operationId,
        mode: nextMode,
        code: result.code,
      });
      setConfirmation("");
      setRecoveryCode("");
    } catch {
      setError(
        nextMode === "recovery"
          ? "Не удалось начать восстановление. Проверь код и попробуй ещё раз."
          : "Не удалось подготовить новый код. Попробуй ещё раз.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function cancel() {
    setWorking(true);
    setError(null);
    try {
      await postAction("cancel");
      setOperation(null);
      setConfirmation("");
      setNotice("Настройки доступа не изменились.");
    } catch {
      setError("Не удалось отменить действие. Попробуй ещё раз.");
    } finally {
      setWorking(false);
    }
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!operation || confirmation !== operation.code) {
      setError("Вставь сохранённый код полностью, как он показан выше.");
      return;
    }
    setWorking(true);
    setError(null);
    setNotice(null);
    try {
      const suffix =
        operation.mode === "recovery" ? "recovery" : "authenticated";
      const context = await postAction(`context-${suffix}`, confirmation);
      const target = context.target;
      if (context.operationId !== operation.id || !isLocalLearnerOwner(target))
        throw new Error("unavailable");

      const acknowledge = async (): Promise<LocalLearnerOwner> => {
        await postAction(`confirm-${suffix}`, confirmation);
        const authenticated = await readAuthenticatedLearnerContext();
        if (
          !isLocalLearnerOwner(authenticated) ||
          !sameLocalLearnerOwner(authenticated, target)
        )
          throw new Error("unavailable");
        return authenticated;
      };

      if (operation.mode === "recovery")
        await transitionRecoveredLocalIdentity(target, acknowledge);
      else {
        const current = await readAuthenticatedLearnerContext();
        if (!isLocalLearnerOwner(current)) throw new Error("unavailable");
        await reconcileAuthenticatedLocalOwner(current, true);
        await transitionLocalIdentity(target, acknowledge);
      }

      setOperation(null);
      setConfirmation("");
      setRecoveryCode("");
      if (operation.mode === "recovery") setRecovered(true);
      else openHistory();
    } catch {
      setError(
        operation.mode === "recovery"
          ? "Не удалось проверить доступ. Если восстановление уже завершилось, обнови страницу и начни восстановление с сохранённого нового кода. Данные браузеров не объединяются."
          : "Не удалось подтвердить доступ. Сохранённые данные в этом браузере не объединяются. Проверь код и попробуй ещё раз.",
      );
    } finally {
      setWorking(false);
    }
  }

  function openHistory() {
    router.replace("/progress");
    router.refresh();
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(operation?.code ?? "");
      setNotice(
        "Код скопирован. Теперь сохрани его вне этого браузера и вставь сохранённую копию ниже.",
      );
    } catch {
      setNotice("Не удалось скопировать. Выдели код и перепиши его вручную.");
    }
  }

  if (!enabled || account === "disabled")
    return (
      <section className={styles.panel}>
        <h1 ref={headingRef} tabIndex={-1}>
          Доступ к истории
        </h1>
        <p role="status">
          Сохранение и восстановление доступа сейчас недоступны.
        </p>
        <Link className={styles.secondary} href="/">
          На главную
        </Link>
      </section>
    );

  if (recovered)
    return (
      <section className={styles.panel}>
        <h1 ref={headingRef} tabIndex={-1}>
          Доступ восстановлен
        </h1>
        <p>
          Новый код заменил старый. Оставь у себя новую сохранённую копию вместо
          прежней — старый код больше не работает.
        </p>
        <p>В этом браузере можно продолжать заниматься без кода.</p>
        <button className={styles.primary} onClick={openHistory} type="button">
          К истории
        </button>
      </section>
    );

  if (operation)
    return (
      <section className={styles.panel} aria-busy={working}>
        <h1 ref={headingRef} tabIndex={-1}>
          {operation.mode === "recovery"
            ? "Сохрани новый код"
            : "Сохрани код доступа"}
        </h1>
        <p>
          Код не нужно запоминать. Он поможет вернуть историю, если потеряется
          доступ в браузере. После подтверждения мы не сможем показать его
          снова.
        </p>
        {operation.mode === "replacement" ? (
          <p className={styles.warning}>
            Старый код продолжит работать до подтверждения нового.
          </p>
        ) : null}
        {operation.mode === "recovery" ? (
          <p className={styles.warning}>
            После подтверждения этот браузер получит доступ к найденной истории,
            а прежний браузер потеряет доступ. Данные из браузеров не
            объединяются.
          </p>
        ) : null}
        <ol className={styles.steps}>
          <li>Скопируй код кнопкой ниже.</li>
          <li>
            Сохрани его вне этого браузера, например в заметке на другом
            устройстве или на бумаге. Если нужно, попроси близкого взрослого
            помочь.
          </li>
          <li>Открой сохранённую копию и вставь её в поле подтверждения.</li>
        </ol>
        <p className={styles["secret-label"]}>Твой новый код</p>
        <code className={styles.code} aria-label="Новый код восстановления">
          {operation.code}
        </code>
        <button
          className={styles.secondary}
          disabled={working}
          onClick={() => void copyCode()}
          type="button"
        >
          Скопировать код
        </button>
        <form className={styles.form} onSubmit={(event) => void confirm(event)}>
          <label htmlFor="recovery-confirmation">
            Вставь сохранённую копию кода
          </label>
          <input
            autoComplete="off"
            autoCapitalize="none"
            id="recovery-confirmation"
            maxLength={48}
            name="recovery-confirmation"
            onChange={(event) => setConfirmation(event.currentTarget.value)}
            spellCheck={false}
            value={confirmation}
          />
          <button className={styles.primary} disabled={working} type="submit">
            {working ? "Подтверждаем…" : "Подтвердить"}
          </button>
        </form>
        {error ? <p role="alert">{error}</p> : null}
        {notice ? <p role="status">{notice}</p> : null}
        <button
          className={styles["text-button"]}
          disabled={working}
          onClick={() => void cancel()}
          type="button"
        >
          Отменить
        </button>
      </section>
    );

  return (
    <section
      className={styles.panel}
      aria-busy={account === "loading" || working}
    >
      <h1 ref={headingRef} tabIndex={-1}>
        Доступ к истории
      </h1>
      <p>
        Для обычных занятий в этом браузере код не нужен. Он помогает вернуть
        историю при потере доступа, но не переносит черновики из другого
        браузера.
      </p>
      {account === "loading" ? (
        <p role="status">Проверяем доступ…</p>
      ) : (
        <>
          {account !== "signed-out" ? (
            <div className={styles.actions}>
              <h2>
                {account.recoveryEnabled
                  ? "Восстановление настроено"
                  : "Сохранить доступ"}
              </h2>
              <p>
                {account.recoveryEnabled
                  ? "Если заменишь код, старый перестанет работать после подтверждения нового."
                  : "Код не нужно запоминать. Сохрани его вне этого браузера и вставь сохранённую копию для подтверждения."}
              </p>
              <button
                className={styles.primary}
                disabled={working}
                onClick={() =>
                  void start(
                    account.recoveryEnabled ? "replacement" : "enrollment",
                  )
                }
                type="button"
              >
                {account.recoveryEnabled ? "Заменить код" : "Сохранить доступ"}
              </button>
            </div>
          ) : null}
          <form
            className={styles.form}
            onSubmit={(event) => {
              event.preventDefault();
              void start("recovery", recoveryCode);
            }}
          >
            <h2>Восстановить доступ</h2>
            <p>
              Вставь код из сохранённой копии. При ошибке мы не сообщим, есть ли
              у него история.
            </p>
            <label htmlFor="recovery-code">Код восстановления</label>
            <input
              autoComplete="off"
              autoCapitalize="none"
              id="recovery-code"
              maxLength={48}
              name="recovery-code"
              onChange={(event) => setRecoveryCode(event.currentTarget.value)}
              spellCheck={false}
              value={recoveryCode}
            />
            <button
              className={styles.secondary}
              disabled={working}
              type="submit"
            >
              Продолжить
            </button>
          </form>
        </>
      )}
      {error ? <p role="alert">{error}</p> : null}
      {notice ? <p role="status">{notice}</p> : null}
      <Link className={styles.secondary} href="/">
        На главную
      </Link>
    </section>
  );
}

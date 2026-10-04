"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  readKnowledgeSupport,
  readKnowledgeSupportEligibility,
  submitKnowledgeDiagnostic,
  openKnowledgeLesson,
  submitKnowledgeMicroCheck,
} from "../../../app/practice/knowledge-support-actions";
import type { PracticeState } from "../../practice/application/practice-state";
import {
  CARRIER_PROBLEM_ID,
  canRecommendLesson,
  type OptionId,
  type SupportObservation,
} from "../domain/knowledge-support";
import {
  LEARNER_LABEL,
  OFFER_HEADING,
  OFFER_TEXT,
  DIAGNOSTIC,
  MICRO_CHECK,
  DIAGNOSTIC_CORRECT,
  DIAGNOSTIC_INCORRECT,
} from "../domain/content";
import styles from "./knowledge-support.module.scss";

type Props = Readonly<{
  sessionId: string;
  problemId: string;
  practice: PracticeState;
  busy: boolean;
  beforeOpen: () => Promise<boolean>;
  onReturn: () => void;
  children: (offer: ReactNode) => ReactNode;
  renderSurface?: (surface: ReactNode) => ReactNode;
}>;
type Surface =
  | "practice"
  | "diagnostic"
  | "diagnostic-result"
  | "lesson"
  | "micro-check"
  | "micro-result";

export function KnowledgeSupport({
  sessionId,
  problemId,
  practice,
  busy,
  beforeOpen,
  onReturn,
  children,
  renderSurface,
}: Props) {
  const [surface, setSurface] = useState<Surface>("practice");
  const [observation, setObservation] = useState<SupportObservation | null>(
    null,
  );
  const [lesson, setLesson] = useState<string | null>(null);
  const [microFeedback, setMicroFeedback] = useState<{
    heading: string;
    text: string;
  } | null>(null);
  const [eligibility, setEligibility] = useState<{
    practice: PracticeState;
    eligible: boolean;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  const [selected, setSelected] = useState<OptionId | null>(null);
  const gate = useRef(false);
  const previousSurface = useRef<Surface>("practice");
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (
      problemId !== CARRIER_PROBLEM_ID ||
      practice.status !== "active" ||
      practice.solutionExposure !== null
    )
      return;
    let active = true;
    void Promise.all([
      readKnowledgeSupport(sessionId),
      readKnowledgeSupportEligibility({ problemId, practice }),
    ])
      .then(([result, eligible]) => {
        if (active) {
          setObservation(result);
          setEligibility({ practice, eligible });
          setLoaded(true);
          setError(false);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [sessionId, problemId, practice, loadRetry]);

  useEffect(() => {
    if (surface !== "practice") heading.current?.focus();
    else if (previousSurface.current !== "practice") onReturn();
    previousSurface.current = surface;
  }, [surface, onReturn]);

  async function run(action: () => Promise<void>) {
    if (gate.current) return;
    gate.current = true;
    setPending(true);
    setError(false);
    try {
      await action();
    } catch {
      setError(true);
    } finally {
      gate.current = false;
      setPending(false);
    }
  }

  function returnToPractice() {
    setSurface("practice");
    setSelected(null);
    setError(false);
  }

  const eligible =
    eligibility?.practice === practice &&
    eligibility.eligible &&
    observation === null;
  const availabilityPending =
    problemId === CARRIER_PROBLEM_ID &&
    practice.status === "active" &&
    practice.solutionExposure === null &&
    observation === null &&
    (!loaded || eligibility?.practice !== practice);
  const offer =
    eligible && loaded ? (
      <aside className={styles.offer}>
        <h2>{OFFER_HEADING}</h2>
        <p>{OFFER_TEXT}</p>

        <button
          type="button"
          disabled={busy || pending}
          onClick={() =>
            void run(async () => {
              if (!(await beforeOpen()))
                throw new Error("Practice save is pending.");
              setSurface("diagnostic");
            })
          }
        >
          Проверить формулировки
        </button>

        {error ? (
          <p role="alert">Не удалось открыть проверку. Попробуй ещё раз.</p>
        ) : null}
      </aside>
    ) : availabilityPending ? (
      <aside className={styles.offer}>
        {error ? (
          <>
            <p role="alert">Не удалось загрузить доступность проверки.</p>
            <button
              type="button"
              onClick={() => {
                setError(false);
                setLoadRetry((value) => value + 1);
              }}
            >
              Повторить загрузку проверки
            </button>
          </>
        ) : (
          <p role="status">Загружаем доступность проверки…</p>
        )}
      </aside>
    ) : null;

  const question = surface === "diagnostic" ? DIAGNOSTIC : MICRO_CHECK;
  const result =
    surface === "diagnostic-result"
      ? observation?.diagnosticOutcome === "correct"
        ? DIAGNOSTIC_CORRECT
        : DIAGNOSTIC_INCORRECT
      : microFeedback;
  const active = surface !== "practice";
  const SupportSurface = renderSurface ? "section" : "main";
  const supportSurface = active ? (
    <SupportSurface className={styles.surface} aria-busy={pending}>
      <p>{LEARNER_LABEL}</p>
      <h1 ref={heading} tabIndex={-1}>
        {surface === "diagnostic"
          ? "Проверка формулировок"
          : surface === "lesson"
            ? LEARNER_LABEL
            : surface === "micro-check"
              ? "Новый пример"
              : result?.heading}
      </h1>
      {surface === "diagnostic" || surface === "micro-check" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected) return;
            void run(async () => {
              if (surface === "diagnostic") {
                setObservation(
                  await submitKnowledgeDiagnostic(sessionId, selected, {
                    problemId,
                    practice,
                  }),
                );
              } else {
                const result = await submitKnowledgeMicroCheck(
                  sessionId,
                  selected,
                );
                setObservation(result.observation);
                setMicroFeedback(result.feedback);
              }
              setSurface(
                surface === "diagnostic" ? "diagnostic-result" : "micro-result",
              );
              setSelected(null);
            });
          }}
        >
          <fieldset disabled={pending}>
            <legend>{question.question}</legend>
            {question.options.map((option) => (
              <label key={option.id}>
                <input
                  type="radio"
                  name="knowledge-option"
                  value={option.id}
                  checked={selected === option.id}
                  onChange={() => setSelected(option.id)}
                />
                {option.text}
              </label>
            ))}
          </fieldset>
          <button type="submit" disabled={!selected || pending}>
            Проверить
          </button>
        </form>
      ) : surface === "lesson" ? (
        <>
          <p className={styles.copy}>{lesson}</p>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setSelected(null);
              setSurface("micro-check");
            }}
          >
            Проверить на новом примере
          </button>
        </>
      ) : (
        <p className={styles.copy} role="status">
          {result?.text}
        </p>
      )}
      {surface === "diagnostic-result" &&
      observation &&
      canRecommendLesson(observation) ? (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            void run(async () => {
              const result = await openKnowledgeLesson(sessionId);
              setObservation(result.observation);
              setLesson(result.lesson);
              setSurface("lesson");
            })
          }
        >
          Разобрать за минуту
        </button>
      ) : null}
      {error ? (
        <p role="alert">
          Не удалось сохранить проверку. Повтори отправку выбранного ответа.
          Если он уже сохранён, заменить его нельзя.
        </p>
      ) : null}
      {pending ? <p role="status">Сохраняем…</p> : null}
      <button type="button" disabled={pending} onClick={returnToPractice}>
        {surface === "micro-result"
          ? "Вернуться к «Пять кучек камней»"
          : "Вернуться к задаче"}
      </button>
    </SupportSurface>
  ) : null;
  return (
    <>
      <div hidden={active}>{children(offer)}</div>
      {supportSurface
        ? renderSurface
          ? renderSurface(supportSurface)
          : supportSurface
        : null}
    </>
  );
}

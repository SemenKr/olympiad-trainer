"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { verifyPersistedGuaranteeEvidenceFacts } from "@/app/practice/actions";

import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";
import { readVerifiedGuaranteeProgressEvidence } from "./progress-evidence-storage";
import styles from "./progress-overview.module.scss";

type ProgressLoad =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; interpretation: ReasoningCheckpointInterpretation };

export function ProgressOverview() {
  const [load, setLoad] = useState<ProgressLoad>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void readVerifiedGuaranteeProgressEvidence(
        verifyPersistedGuaranteeEvidenceFacts,
      )
        .then(({ interpretation }) => {
          if (active) setLoad({ status: "ready", interpretation });
        })
        .catch(() => {
          if (active) setLoad({ status: "error" });
        });
    });
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    if (load.status !== "loading") headingRef.current?.focus();
  }, [load]);

  return (
    <main aria-busy={load.status === "loading"} className={styles.progress}>
      <header className={styles.header}>
        <h1 ref={headingRef} tabIndex={-1}>
          Мой прогресс
        </h1>
        <p>
          Здесь видно, какие идеи ты уже пробовал в задачах. Картина будет
          меняться по мере новой работы.
        </p>
      </header>

      {load.status === "loading" ? (
        <p role="status">Загружаем прогресс…</p>
      ) : load.status === "error" ? (
        <div className={styles.error}>
          <p role="alert">Не удалось загрузить прогресс. Попробуй ещё раз.</p>
          <button
            className={styles.primary}
            onClick={() => {
              setLoad({ status: "loading" });
              setRetry((value) => value + 1);
            }}
            type="button"
          >
            Попробовать ещё раз
          </button>
        </div>
      ) : (
        <ProgressEvidenceContent interpretation={load.interpretation} />
      )}

      <Link className={styles.secondary} href="/">
        На главную
      </Link>
    </main>
  );
}

export function ProgressEvidenceContent({
  interpretation,
}: {
  interpretation: ReasoningCheckpointInterpretation;
}) {
  return (
    <section className={styles.capability}>
      <h2>{interpretation.learnerLabel}</h2>
      <p className={styles.group}>
        {interpretation.progressGroup ?? "Пока рано сказать"}
      </p>
      <p>{interpretation.conclusion}</p>
    </section>
  );
}

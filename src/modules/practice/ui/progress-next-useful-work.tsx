"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { verifyPersistedReasoningCheckpointObservation } from "../../../app/practice/actions";
import { readServerAdaptiveRecommendation } from "../../learner/progress-client";
import type { AdaptiveRecommendationResult } from "../application/adaptive-recommendation";
import {
  packById,
  packHref,
  packIdFromProblemIds,
  packIdFromCompletedProblemIds,
  type PackId,
} from "../application/completed-practice-episode";
import { selectNextPracticeWork } from "../application/next-practice-work";
import { AdaptiveRecommendationCard } from "./adaptive-recommendation";
import { ensureServerProgressImported } from "./server-progress-import";
import {
  readVerifiedPracticeSessionSnapshot,
  readVerifiedLatestCompletedResults,
  type UnfinishedPracticeSessionSnapshot,
} from "./practice-session-storage";

type NextWork =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      unfinished: UnfinishedPracticeSessionSnapshot | null;
      availability: AdaptiveRecommendationResult;
      returning: boolean;
    };

export function ProgressNextUsefulWork({
  completedPackIds,
  onPathRetry,
  actionClassName,
  className,
}: {
  completedPackIds: readonly PackId[] | null;
  onPathRetry?: () => void;
  actionClassName?: string;
  className?: string;
}) {
  const [state, setState] = useState<NextWork>({ status: "loading" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void (async () => {
      const snapshot = await readVerifiedPracticeSessionSnapshot(
        verifyPersistedReasoningCheckpointObservation,
      );
      if (snapshot.value)
        return {
          status: "ready" as const,
          unfinished: snapshot.value,
          availability: { status: "none" as const },
          returning: true,
        };
      await ensureServerProgressImported();
      const adaptive = await readServerAdaptiveRecommendation();
      const summary = await readVerifiedLatestCompletedResults(
        verifyPersistedReasoningCheckpointObservation,
      );
      return {
        status: "ready" as const,
        unfinished: null,
        availability: adaptive.availability,
        returning: adaptive.hasPracticeHistory || summary.value !== null,
      };
    })().then(
      (value) => {
        if (active) setState(value);
      },
      () => {
        if (active) setState({ status: "error" });
      },
    );
    return () => {
      active = false;
    };
  }, [retry]);
  return (
    <ProgressNextUsefulWorkContent
      state={state}
      completedPackIds={completedPackIds}
      actionClassName={actionClassName}
      className={className}
      onPathRetry={onPathRetry}
      onRetry={() => {
        setState({ status: "loading" });
        setRetry((value) => value + 1);
      }}
    />
  );
}

export function ProgressNextUsefulWorkContent({
  state,
  completedPackIds,
  actionClassName,
  className,
  onRetry,
  onPathRetry,
}: {
  state: NextWork;
  completedPackIds: readonly PackId[] | null;
  actionClassName?: string;
  className?: string;
  onRetry?: () => void;
  onPathRetry?: () => void;
}) {
  if (state.status === "loading")
    return <p role="status">Проверяем, что можно продолжить…</p>;
  if (state.status === "error")
    return (
      <section className={className}>
        <h2>Что попробовать дальше</h2>
        <p role="alert">Не удалось проверить следующую тренировку.</p>
        <button className={actionClassName} type="button" onClick={onRetry}>
          Повторить
        </button>
        <Link href="/practice/choose">Выбрать набор</Link>
      </section>
    );
  const nextWork = selectNextPracticeWork({
    hasUnfinished: !!state.unfinished,
    recommendation: state.availability,
    returning: state.returning,
    completedPackIds,
  });
  if (state.unfinished) {
    const snapshot = state.unfinished;
    const href =
      snapshot.mode === "pack"
        ? packHref(
            ("status" in snapshot
              ? packIdFromCompletedProblemIds(
                  snapshot.completedResults.map((result) => result.problemId),
                )
              : packIdFromProblemIds(snapshot.problemIds))!,
          )
        : snapshot.mode === "review"
          ? "/practice/review"
          : "mode" in snapshot
            ? "/practice/transfer"
            : "/practice";
    return (
      <section className={className} aria-label="Текущая тренировка">
        <h2>Тренировка не закончена</h2>
        <Link className={actionClassName} href={href}>
          {"status" in snapshot
            ? "Завершить тренировку"
            : "Продолжить тренировку"}
        </Link>
      </section>
    );
  }
  if (nextWork.kind === "adaptive")
    return (
      <AdaptiveRecommendationCard
        recommendation={nextWork.recommendation}
        actionClassName={actionClassName}
        className={className}
      />
    );
  if (nextWork.kind === "path-error")
    return (
      <section className={className}>
        <h2>Что попробовать дальше</h2>
        <p role="alert">Не удалось загрузить отметки пути.</p>
        <button
          className={actionClassName}
          type="button"
          onClick={onPathRetry ?? onRetry}
        >
          Повторить
        </button>
        <Link href="/practice/choose">Выбрать набор</Link>
      </section>
    );
  const nextPack = nextWork.kind === "pack" ? packById(nextWork.packId) : null;
  return (
    <section className={className} aria-label="Что попробовать дальше">
      <h2>Что попробовать дальше</h2>
      <Link
        className={actionClassName}
        href={
          nextWork.kind === "core"
            ? "/practice"
            : nextPack
              ? packHref(nextPack.id)
              : "/practice/choose"
        }
      >
        {nextWork.kind === "core"
          ? "Начать тренировку"
          : nextPack
            ? "Продолжить путь"
            : "Выбрать тренировку"}
      </Link>
    </section>
  );
}

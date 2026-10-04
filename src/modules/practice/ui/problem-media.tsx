"use client";

import { useId, useRef, useState } from "react";

import type { LearnerSafeProblemMedia } from "../application/problem-media";
import styles from "./problem-media.module.scss";

export function ProblemMedia({
  media,
}: Readonly<{ media: LearnerSafeProblemMedia }>) {
  const dialogId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">(
    "loading",
  );

  function image(enlarged = false) {
    return (
      // Authored local assets retain their intrinsic dimensions, including SVGs.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={
          enlarged
            ? undefined
            : (node) => {
                // A cached/server-rendered image can finish before hydration attaches onLoad.
                if (node?.complete)
                  setStatus(node.naturalWidth > 0 ? "ready" : "failed");
              }
        }
        src={media.src}
        width={media.width}
        height={media.height}
        alt={media.alt}
        hidden={status === "failed"}
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("failed")}
        className={enlarged ? styles.enlarged : styles.image}
      />
    );
  }

  return (
    <figure className={styles.media}>
      <h2>{media.title}</h2>
      <div className={styles.preview} aria-busy={status === "loading"}>
        {image()}
        {status === "loading" ? (
          <p role="status">Загружаем изображение…</p>
        ) : null}
        {status === "failed" ? (
          <p role="alert">
            Не удалось загрузить изображение. Обнови страницу, чтобы повторить
            загрузку.
          </p>
        ) : null}
      </div>
      <figcaption>{media.caption}</figcaption>
      {media.enlarge ? (
        <>
          <button
            ref={opener}
            aria-haspopup="dialog"
            aria-controls={dialogId}
            disabled={status !== "ready"}
            onClick={() => dialog.current?.showModal()}
            type="button"
          >
            Открыть крупнее
          </button>
          <dialog
            id={dialogId}
            ref={dialog}
            className={styles.dialog}
            aria-labelledby={`${dialogId}-title`}
            onClose={() => opener.current?.focus()}
          >
            <h2 id={`${dialogId}-title`}>{media.title}</h2>
            <button
              autoFocus
              type="button"
              onClick={() => dialog.current?.close()}
            >
              Закрыть изображение
            </button>
            {image(true)}
            <p>{media.caption}</p>
          </dialog>
        </>
      ) : null}
    </figure>
  );
}

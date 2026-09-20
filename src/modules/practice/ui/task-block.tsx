import type { ReactNode } from "react";

import styles from "./task-block.module.scss";

type TaskBlockTextProps = Readonly<{
  title: string;
  children: ReactNode;
}>;

export function TaskBlockText({ title, children }: TaskBlockTextProps) {
  return (
    <section className={styles["text-block"]}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.body}>{children}</div>
    </section>
  );
}

type TaskBlockMediaProps = Readonly<{
  title: string;
  caption: string;
  children: ReactNode;
}>;

export function TaskBlockMedia({
  title,
  caption,
  children,
}: TaskBlockMediaProps) {
  return (
    <figure className={styles["media-block"]}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.media}>{children}</div>
      <figcaption className={styles.caption}>{caption}</figcaption>
    </figure>
  );
}

type TaskBlockNoteProps = Readonly<{
  title: string;
  children: ReactNode;
}>;

export function TaskBlockNote({ title, children }: TaskBlockNoteProps) {
  return (
    <aside className={styles.note} role="note">
      <h2 className={styles.title}>{title}</h2>
      <div className={styles["note-body"]}>{children}</div>
    </aside>
  );
}

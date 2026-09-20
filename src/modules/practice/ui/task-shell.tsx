import type { ReactNode } from "react";

import styles from "./task-shell.module.scss";

type TaskShellProps = Readonly<{
  backAction: ReactNode;
  finishAction: ReactNode;
  header: ReactNode;
  answerRail: ReactNode;
  children: ReactNode;
}>;

export function TaskShell({
  backAction,
  finishAction,
  header,
  answerRail,
  children,
}: TaskShellProps) {
  return (
    <main className={styles.shell}>
      <nav aria-label="Действия с тренировкой" className={styles.navigation}>
        <div className={styles["navigation-action"]}>{backAction}</div>
        <div className={styles["navigation-action"]}>{finishAction}</div>
      </nav>

      <div className={styles.body}>
        <article className={styles.content}>
          {header}
          {children}
        </article>

        <aside aria-label="Ответ на задачу" className={styles["answer-rail"]}>
          {answerRail}
        </aside>
      </div>
    </main>
  );
}

import type { ReactNode } from "react";

import styles from "./task-shell.module.scss";

type TaskShellProps = Readonly<{
  backAction: ReactNode;
  finishAction: ReactNode;
  header: ReactNode;
  answerRail: ReactNode;
  learningSupport?: ReactNode;
  context?: ReactNode;
  children: ReactNode;
}>;

export function TaskShell({
  backAction,
  finishAction,
  header,
  answerRail,
  learningSupport,
  context,
  children,
}: TaskShellProps) {
  return (
    <main className={styles.shell}>
      {backAction || finishAction ? (
        <nav aria-label="Действия с тренировкой" className={styles.navigation}>
          <div
            className={`${styles["navigation-action"]} ${styles["navigation-action-back"]}`}
          >
            {backAction}
          </div>
          <span className={styles.context}>{context}</span>
          <div className={styles["navigation-action"]}>{finishAction}</div>
        </nav>
      ) : null}

      <div className={styles.body}>
        <article className={styles.content}>
          {header}
          {children}
        </article>

        {answerRail ? (
          <section
            aria-label="Ответ на задачу"
            className={styles["answer-rail"]}
          >
            {answerRail}
          </section>
        ) : null}
        {learningSupport ? (
          <section aria-label="Помощь к этой задаче" className={styles.support}>
            {learningSupport}
          </section>
        ) : null}
      </div>
    </main>
  );
}

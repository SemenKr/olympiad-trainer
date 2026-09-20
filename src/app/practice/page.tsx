import { practiceProblem } from "@/modules/practice/server/practice-problem";
import { ShortNumericAnswer } from "@/modules/practice/ui/short-numeric-answer";
import { TaskBlockText } from "@/modules/practice/ui/task-block";
import { TaskShell } from "@/modules/practice/ui/task-shell";

import styles from "./page.module.scss";

export default function PracticePage() {
  return (
    <TaskShell
      answerRail={<ShortNumericAnswer />}
      backAction={
        <button disabled type="button">
          ← Назад
        </button>
      }
      finishAction={
        <button disabled type="button">
          Завершить
        </button>
      }
      header={
        <header className={styles.header}>
          <p className={styles.eyebrow}>Тренировка</p>
          <h1>{practiceProblem.title}</h1>
        </header>
      }
    >
      <TaskBlockText title="Условие задачи">
        <p>{practiceProblem.statement}</p>
      </TaskBlockText>
    </TaskShell>
  );
}

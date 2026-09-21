import { practiceProblem } from "@/modules/practice/server/practice-problem";
import { PracticeSession } from "@/modules/practice/ui/practice-session";
import { TaskBlockText } from "@/modules/practice/ui/task-block";

import styles from "./page.module.scss";

export default function PracticePage() {
  return (
    <PracticeSession
      focusHint={practiceProblem.focusHint}
      header={
        <header className={styles.header}>
          <p className={styles.eyebrow}>Тренировка</p>
          <h1>{practiceProblem.title}</h1>
        </header>
      }
      problemTitle={practiceProblem.title}
      taskContent={
        <TaskBlockText title="Условие задачи">
          <p>{practiceProblem.statement}</p>
        </TaskBlockText>
      }
    />
  );
}

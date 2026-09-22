import {
  CURRENT_PRACTICE_PROBLEM_ID,
  getLearnerSafePracticeProblem,
} from "@/modules/practice/server/problem-catalog";
import { PracticeSession } from "@/modules/practice/ui/practice-session";
import { TaskBlockText } from "@/modules/practice/ui/task-block";

import styles from "./page.module.scss";

export default function PracticePage() {
  const problem = getLearnerSafePracticeProblem(CURRENT_PRACTICE_PROBLEM_ID);

  return (
    <PracticeSession
      header={
        <header className={styles.header}>
          <p className={styles.eyebrow}>Тренировка</p>
          <h1>{problem.title}</h1>
        </header>
      }
      problem={problem}
      taskContent={
        <TaskBlockText title="Условие задачи">
          <p>{problem.statement}</p>
        </TaskBlockText>
      }
    />
  );
}

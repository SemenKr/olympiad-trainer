import {
  getNextPracticeJourneyMilestone,
  getPracticeJourneyMilestones,
} from "../application/practice-journey";
import styles from "./practice-journey.module.scss";

export function HomePracticeJourney({ totalXp }: { totalXp: number }) {
  if (totalXp <= 0) return null;
  const next = getNextPracticeJourneyMilestone(totalXp);
  return (
    <section className={styles.journey}>
      <h2>Путь практики</h2>
      <p className={styles.total}>{totalXp} XP</p>
      {next ? (
        <p>
          До отметки «{next.label}» — {next.threshold - totalXp} XP.
        </p>
      ) : null}
    </section>
  );
}

export function ProgressPracticeJourney({ totalXp }: { totalXp: number }) {
  return (
    <section className={styles.journey}>
      <h2>Путь практики</h2>
      <p className={styles.total}>{totalXp} XP</p>
      <p>XP отмечает практику, а не уровень знаний.</p>
      <ul>
        {getPracticeJourneyMilestones(totalXp).map((milestone) => (
          <li key={milestone.threshold}>
            <span>{milestone.label}</span>
            <span>{milestone.reached ? "Получена" : "Впереди"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

import {
  getNextPracticeJourneyBadge,
  getPracticeJourneyBadges,
  getPracticeJourneyLevelProgress,
} from "../application/practice-journey";
import styles from "./practice-journey.module.scss";

function JourneyLevelProgress({ totalXp }: { totalXp: number }) {
  const progress = getPracticeJourneyLevelProgress(totalXp);

  return (
    <>
      <div className={styles["level-row"]}>
        <div>
          <p className={styles.kicker}>Уровень пути {progress.current.level}</p>
          <h2>{progress.current.label}</h2>
        </div>
        <p className={styles.total}>{totalXp} XP</p>
      </div>

      {progress.next ? (
        <div className={styles.progress}>
          <div className={styles["progress-label"]}>
            <span>До уровня пути {progress.next.level}</span>
            <strong>{progress.xpToNext} XP</strong>
          </div>
          <progress
            aria-label={`Прогресс до уровня пути ${progress.next.level}`}
            max={progress.progressMax}
            value={progress.progressValue}
          />
        </div>
      ) : (
        <p>
          Верхняя отметка пути этой версии достигнута. XP продолжают копиться.
        </p>
      )}
    </>
  );
}

export function HomePracticeJourney({ totalXp }: { totalXp: number }) {
  if (totalXp <= 0) return null;
  const nextBadge = getNextPracticeJourneyBadge(totalXp);

  return (
    <section className={styles.journey}>
      <JourneyLevelProgress totalXp={totalXp} />
      {nextBadge ? (
        <p className={styles["next-badge"]}>
          Следующая медаль: «{nextBadge.label}» · {nextBadge.threshold} XP
        </p>
      ) : null}
    </section>
  );
}

export function ProgressPracticeJourney({
  totalXp,
  className,
}: {
  totalXp: number;
  className?: string;
}) {
  return (
    <section className={`${styles.journey} ${className ?? ""}`}>
      <JourneyLevelProgress totalXp={totalXp} />
      <p>XP, уровни пути и медали показывают практику, а не уровень знаний.</p>

      <div className={styles.badges}>
        <h3>Медали пути</h3>
        <ul>
          {getPracticeJourneyBadges(totalXp).map((badge) => (
            <li
              className={badge.reached ? styles.reached : styles.upcoming}
              key={badge.threshold}
            >
              <span aria-hidden="true" className={styles["badge-icon"]}>
                {badge.reached ? "★" : "☆"}
              </span>
              <span className={styles["badge-label"]}>
                <strong>{badge.label}</strong>
                <span>{badge.threshold} XP</span>
              </span>
              <span>{badge.reached ? "Получена" : "Впереди"}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

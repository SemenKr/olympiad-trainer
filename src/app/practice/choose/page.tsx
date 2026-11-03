import Link from "next/link";

import {
  packById,
  packHref,
  PRACTICE_PACKS,
} from "../../../modules/practice/application/completed-practice-episode";
import { HomeNavigation } from "../../home-navigation";
import { LEARNING_PATH_V1 } from "../../../modules/practice/application/learning-path";
import { UnfinishedPracticeContext } from "./unfinished-practice-context";
import styles from "../../page.module.scss";

export default function ChoosePracticePage() {
  const entries = [
    ...LEARNING_PATH_V1.map((entry, index) => ({
      ...entry,
      position: index + 1,
    })),
    ...PRACTICE_PACKS.filter(
      (pack) => !LEARNING_PATH_V1.some((entry) => entry.packId === pack.id),
    ).map((pack) => ({ packId: pack.id, description: null, position: null })),
  ];
  return (
    <main className={styles.chooser}>
      <HomeNavigation current="Тренировки" />
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>5 КЛАСС · МАТЕМАТИКА</p>
        <h1>Тренировки</h1>
        <p>
          Можно идти по предложенному пути или выбрать любой набор самому. Путь
          не означает порядок сложности или уровень знаний.
        </p>
      </header>
      <UnfinishedPracticeContext />
      <section
        className={styles["free-choice"]}
        aria-labelledby="all-packs-title"
      >
        <h2 id="all-packs-title">Все наборы</h2>
        <p>
          Можно выбрать любой набор. Если тренировка уже начата, сначала заверши
          её.
        </p>
      </section>
      <ol aria-label="Все наборы задач" className={styles["pack-grid"]}>
        {entries.map((entry) => {
          const pack = packById(entry.packId)!;
          return (
            <li key={pack.id}>
              <article
                aria-labelledby={`${pack.id}-title`}
                className={styles["pack-card"]}
              >
                <p className={styles.eyebrow}>
                  {entry.position === null
                    ? "ДОПОЛНИТЕЛЬНЫЙ НАБОР"
                    : `ШАГ ${entry.position} · НАБОР`}{" "}
                  {pack.id.replace("pack-", "").toUpperCase()}
                </p>
                <h2 id={`${pack.id}-title`}>{pack.name}</h2>
                {entry.description ? <p>{entry.description}</p> : null}
                <p>{pack.problemIds.length} задачи</p>
                <Link
                  className={styles.secondary}
                  href={packHref(pack.id)}
                  aria-label={`Начать набор «${pack.name}»`}
                >
                  Начать набор
                </Link>
              </article>
            </li>
          );
        })}
      </ol>
      <Link className={styles["text-link"]} href="/">
        ← На главную
      </Link>
    </main>
  );
}

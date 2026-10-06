import Link from "next/link";

import {
  PRACTICE_PACKS,
  packHref,
} from "../../../modules/practice/application/completed-practice-episode";
import { HomeNavigation } from "../../home-navigation";
import { LearningPathGuideLoader } from "../../../modules/practice/ui/learning-path";
import { LEARNING_PATH_V1 } from "../../../modules/practice/application/learning-path";
import styles from "../../page.module.scss";

export default function ChoosePracticePage() {
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
      <LearningPathGuideLoader />
      <section
        className={styles["free-choice"]}
        aria-labelledby="all-packs-title"
      >
        <h2 id="all-packs-title">Все наборы</h2>
        <p>Свободный выбор остаётся доступен в любой момент.</p>
      </section>
      <ul aria-label="Все наборы задач" className={styles["pack-grid"]}>
        {PRACTICE_PACKS.map((pack) => (
          <li key={pack.id}>
            <article
              aria-labelledby={`${pack.id}-title`}
              className={styles["pack-card"]}
            >
              <p className={styles.eyebrow}>
                НАБОР {pack.id.replace("pack-", "").toUpperCase()}
              </p>
              <h2 id={`${pack.id}-title`}>{pack.name}</h2>
              <p>
                {
                  LEARNING_PATH_V1.find((entry) => entry.packId === pack.id)
                    ?.description
                }
              </p>
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
        ))}
      </ul>
      <Link className={styles["text-link"]} href="/">
        ← На главную
      </Link>
    </main>
  );
}

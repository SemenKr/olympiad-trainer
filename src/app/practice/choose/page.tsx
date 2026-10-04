import Link from "next/link";

import {
  PRACTICE_PACKS,
  packHref,
} from "../../../modules/practice/application/completed-practice-episode";
import { HomeNavigation } from "../../home-navigation";
import styles from "../../page.module.scss";

export default function ChoosePracticePage() {
  return (
    <main className={styles.chooser}>
      <HomeNavigation current="Тренировки" />
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>5 КЛАСС · МАТЕМАТИКА</p>
        <h1>Выбери тренировку</h1>
        <p>
          В каждом наборе по 3 задачи. Выбирай сам — это не заменяет следующий
          шаг с Главной.
        </p>
      </header>
      <ul aria-label="Наборы задач" className={styles["pack-grid"]}>
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

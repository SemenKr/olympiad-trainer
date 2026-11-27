import Link from "next/link";

import {
  packById,
  packHref,
  PRACTICE_PACKS,
} from "../../../modules/practice/application/completed-practice-episode";
import { HomeNavigation } from "../../home-navigation";
import { LEARNING_PATH_V1 } from "../../../modules/practice/application/learning-path";
import { OptionalUnfinishedPracticeContext } from "./unfinished-practice-context";
import styles from "../../page.module.scss";

const PATH_SECTION = "recommended-packs";
const ADDITIONAL_SECTION = "additional-packs";

function PackCard({
  pack,
  step,
  description,
}: {
  pack: (typeof PRACTICE_PACKS)[number];
  step?: number;
  description?: string;
}) {
  const titleId = `${pack.id}-title`;
  const code = pack.id.replace("pack-", "").toUpperCase();

  return (
    <li>
      <article aria-labelledby={titleId} className={styles["pack-card"]}>
        <p className={styles.eyebrow}>
          {step === undefined ? null : `Шаг ${step} · `}
          Набор {code} · {pack.problemIds.length} задачи
        </p>
        <h3 id={titleId}>{pack.name}</h3>
        {description && <p>{description}</p>}
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
}

export default function ChoosePracticePage() {
  const additional = PRACTICE_PACKS.filter(
    (pack) => !LEARNING_PATH_V1.some((entry) => entry.packId === pack.id),
  );

  return (
    <main className={styles.chooser}>
      <HomeNavigation current="Тренировки" />
      <header className={styles.introduction}>
        <p className={styles.eyebrow}>5 КЛАСС · МАТЕМАТИКА</p>
        <h1>Выбери тренировку</h1>
        <p>Не знаешь, с чего начать? Попробуй наборы пути по порядку.</p>
      </header>
      <nav aria-label="Разделы каталога" className={styles["catalog-nav"]}>
        <a className={styles.secondary} href={`#${PATH_SECTION}`}>
          Путь тренировок
        </a>
        <a className={styles.secondary} href={`#${ADDITIONAL_SECTION}`}>
          Дополнительные наборы
        </a>
      </nav>
      <OptionalUnfinishedPracticeContext />
      <section className={styles["pack-group"]} aria-labelledby={PATH_SECTION}>
        <h2 id={PATH_SECTION} tabIndex={-1}>
          Путь тренировок
        </h2>
        <p>
          После первой тренировки можно выбрать любой набор. Если тренировка уже
          начата, сначала заверши её.
        </p>
        <ol
          role="list"
          aria-labelledby={PATH_SECTION}
          className={styles["pack-grid"]}
        >
          {LEARNING_PATH_V1.map(({ packId, description }, index) => (
            <PackCard
              key={packId}
              pack={packById(packId)!}
              step={index + 1}
              description={description}
            />
          ))}
        </ol>
      </section>
      <section
        className={styles["pack-group"]}
        aria-labelledby={ADDITIONAL_SECTION}
      >
        <h2 id={ADDITIONAL_SECTION} tabIndex={-1}>
          Дополнительные наборы
        </h2>
        <p>Хочешь ещё задач? Выбирай любой набор.</p>
        <ul
          role="list"
          aria-labelledby={ADDITIONAL_SECTION}
          className={styles["pack-grid"]}
        >
          {additional.map((pack) => (
            <PackCard key={pack.id} pack={pack} />
          ))}
        </ul>
      </section>
      <Link className={styles["text-link"]} href="/">
        ← На главную
      </Link>
    </main>
  );
}

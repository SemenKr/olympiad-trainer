import { HomePracticeAction } from "./home-practice-action";
import Link from "next/link";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.home}>
      <h1>Олимпиадный тренажёр</h1>
      <p>
        Решай олимпиадные задачи по математике: сначала самостоятельно, а если
        понадобится — с подсказками и разбором.
      </p>
      <HomePracticeAction />
      <section className={styles.pack} aria-labelledby="simulation-entry">
        <h2 id="simulation-entry">Олимпиадная симуляция · 5 класс</h2>
        <p>Четыре задачи, 45 минут и самостоятельное решение без подсказок.</p>
        <Link className={styles.secondary} href="/simulation">
          Открыть симуляцию
        </Link>
      </section>
    </main>
  );
}

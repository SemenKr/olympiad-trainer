import Link from "next/link";

import { HomePracticeAction } from "./home-practice-action";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.home}>
      <h1>Олимпиадный тренажёр</h1>
      <p>Скоро здесь можно будет готовиться к олимпиадам по математике.</p>
      <HomePracticeAction />
      <Link className={styles.secondary} href="/progress">
        Мой прогресс
      </Link>
    </main>
  );
}

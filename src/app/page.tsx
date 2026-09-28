import { HomePracticeAction } from "./home-practice-action";
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
    </main>
  );
}

import { HomePracticeAction } from "./home-practice-action";
import { HomeNavigation } from "./home-navigation";
import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.home}>
      <HomeNavigation current="Главная" />
      <HomePracticeAction />
    </main>
  );
}

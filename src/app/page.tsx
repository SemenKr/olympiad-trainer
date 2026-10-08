import { HomePracticeAction } from "./home-practice-action";
import { HomeNavigation } from "./home-navigation";
import styles from "./page.module.scss";
import { recoveryEnabled } from "../modules/learner/server/recovery-security";

export default function Home() {
  return (
    <main className={styles.home}>
      <HomeNavigation current="Главная" recoveryAvailable={recoveryEnabled()} />
      <HomePracticeAction />
    </main>
  );
}

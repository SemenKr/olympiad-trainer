import { recoveryEnabled } from "../../modules/learner/server/recovery-security";
import { HomeNavigation } from "../home-navigation";
import { RecoveryPanel } from "./recovery-panel";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export default function RestorePage() {
  return (
    <main className={styles.page}>
      <HomeNavigation current="Доступ" />
      <RecoveryPanel enabled={recoveryEnabled()} />
    </main>
  );
}

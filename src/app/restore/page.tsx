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
      <section
        className={styles.notice}
        aria-labelledby="recovery-notice-title"
      >
        <h2 id="recovery-notice-title">Что нужно знать о коде доступа</h2>
        <p>
          Для восстановления не нужны аккаунт и электронная почта. Тот, у кого
          есть действующий код, может открыть твою историю. Не передавай код
          другим людям.
        </p>
        <p>
          Запиши код на бумаге или попроси близкого взрослого сохранить его вне
          браузера. После подтверждения замены или восстановления старый код
          перестаёт работать — нужно сохранить новый.
        </p>
        <p>
          Если потеряются и доступ в браузере, и действующий код, вернуть доступ
          к истории не получится. Попроси близкого взрослого помочь сохранить
          код.
        </p>
      </section>
    </main>
  );
}

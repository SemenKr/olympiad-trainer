import type { Metadata } from "next";
import { recoveryEnabled } from "../../modules/learner/server/recovery-security";
import { HomeNavigation } from "../home-navigation";
import { RecoveryPanel } from "./recovery-panel";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Восстановление доступа",
  robots: { index: false, follow: false },
};

export default function RestorePage() {
  return (
    <main className={styles.page}>
      <HomeNavigation current="Доступ" />
      <RecoveryPanel enabled={recoveryEnabled()} />
      <section
        className={styles.notice}
        aria-labelledby="recovery-notice-title"
      >
        <h2 id="recovery-notice-title">
          Что нужно знать о коде восстановления
        </h2>
        <p>
          Для восстановления не нужны аккаунт и электронная почта. Тот, у кого
          есть действующий код, может открыть твою историю. Храни код в тайне;
          близкий взрослый может помочь его сохранить.
        </p>
        <p>
          Код не нужно запоминать. Скопируй его, сохрани вне этого браузера и
          вставь сохранённую копию и активируй восстановление. Пока новый код не
          активирован, старый остаётся действующим. После активации нового
          старый код перестаёт работать — оставь новую копию вместо прежней.
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

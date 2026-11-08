import Link from "next/link";
import { PracticeSession } from "../modules/practice/ui/practice-session";
import {
  BETA_PACKS,
  BETA_PROBLEM_IDS,
} from "../modules/practice/server/content-access";
import { getLearnerSafePackProblems } from "../modules/practice/server/problem-catalog";
import styles from "./page.module.scss";
import { BetaHomeAction } from "./beta-home-action";
export function BetaUnavailable() {
  return (
    <main>
      <h1>Режим временно недоступен</h1>
      <p>
        В экспериментальной версии доступны только авторские наборы S и T.
        Прежняя работа сохранена; продолжить её здесь пока нельзя.
      </p>
      <Link href="/practice/choose">Выбрать авторский набор</Link>
      <Link href="/progress">История</Link>
      <Link href="/restore">Восстановить доступ</Link>
    </main>
  );
}
export function BetaHome() {
  return (
    <main className={styles.home}>
      <header className={styles.introduction}>
        <h1>Авторские задачи · 5 класс</h1>
        <p>
          Экспериментальная версия: наборы S и T. Адаптивная практика,
          повторение и олимпиадная работа временно недоступны.
        </p>
      </header>
      <BetaHomeAction allowedProblemIds={BETA_PROBLEM_IDS} />
      <nav className={styles["secondary-area"]} aria-label="Другие действия">
        <Link className={styles.secondary} href="/practice/choose">
          Выбрать набор
        </Link>
        <Link className={styles.secondary} href="/progress">
          История и прогресс
        </Link>
        <Link className={styles.secondary} href="/restore">
          Сохранить или восстановить доступ
        </Link>
      </nav>
    </main>
  );
}
export function BetaPractice({
  pack = "pack-s",
}: {
  pack?: keyof typeof BETA_PACKS;
}) {
  const packs = getLearnerSafePackProblems();
  return (
    <PracticeSession
      problems={packs[pack]}
      packs={packs}
      startMode="pack"
      startPackId={pack}
      allowedProblemIds={BETA_PROBLEM_IDS}
    />
  );
}

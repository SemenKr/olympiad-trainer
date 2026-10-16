import Link from "next/link";

import styles from "./page.module.scss";

export function HomeNavigation({
  current,
  recoveryAvailable = false,
}: Readonly<{ current: string; recoveryAvailable?: boolean }>) {
  return (
    <nav aria-label="Навигация" className={styles.navigation}>
      <Link href="/" aria-label="На главную — Olympiad Trainer">
        На главную
      </Link>
      <span aria-current="page">{current}</span>
      {recoveryAvailable ? (
        <Link className={styles["recovery-link"]} href="/restore">
          Сохранить доступ
        </Link>
      ) : null}
    </nav>
  );
}

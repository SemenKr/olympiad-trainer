import Link from "next/link";

import styles from "./page.module.scss";

export function HomeNavigation({ current }: Readonly<{ current: string }>) {
  return (
    <nav aria-label="Навигация" className={styles.navigation}>
      <Link href="/" aria-label="Olympiad Trainer — на главную">
        Olympiad Trainer
      </Link>
      <span aria-current="page">{current}</span>
    </nav>
  );
}

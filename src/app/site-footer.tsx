import Link from "next/link";
import styles from "./site-footer.module.scss";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <Link href="/sources" prefetch={false}>
        Источники и авторские права
      </Link>
    </footer>
  );
}

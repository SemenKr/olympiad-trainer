import type { Metadata } from "next";
import { productDescription, productOpenGraph } from "./site-metadata";
import { HomePracticeAction } from "./home-practice-action";
import { HomeNavigation } from "./home-navigation";
import styles from "./page.module.scss";
import { recoveryEnabled } from "../modules/learner/server/recovery-security";

export const metadata: Metadata = {
  title: { absolute: productOpenGraph.title },
  description: productDescription,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { ...productOpenGraph, url: "/" },
};

export default function Home() {
  return (
    <main className={styles.home}>
      <HomeNavigation current="Главная" recoveryAvailable={recoveryEnabled()} />
      <HomePracticeAction />
    </main>
  );
}

import styles from "./page.module.scss";

export default function Home() {
  return (
    <main className={styles.home}>
      <h1>Олимпиадный тренажёр</h1>
      <p>Скоро здесь можно будет готовиться к олимпиадам по математике.</p>
    </main>
  );
}

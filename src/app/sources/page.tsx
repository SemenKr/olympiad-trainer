import type { Metadata } from "next";
import Link from "next/link";
import { getPublicProblemSources } from "../../modules/practice/server/public-problem-sources";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Источники и авторские права",
  description:
    "Происхождение задач, учебные адаптации и статус проверки прав на материалы.",
  alternates: { canonical: "/sources" },
};

export default function SourcesPage() {
  const sources = getPublicProblemSources();
  return (
    <main className={styles.page}>
      <nav aria-label="Навигация">
        <Link href="/" prefetch={false}>
          На главную
        </Link>
      </nav>
      <h1>Источники и авторские права</h1>
      <section aria-labelledby="project-status">
        <h2 id="project-status">Независимый учебный проект</h2>
        <p>
          Олимпиадный тренажёр — самостоятельный образовательный проект для
          подготовки по математике, 5 класс. Это не официальный сайт
          Всероссийской олимпиады школьников (ВсОШ). Проект не представляет
          организаторов олимпиады; ссылки на их материалы не означают одобрения
          или партнёрства.
        </p>
      </section>
      <section aria-labelledby="adaptations">
        <h2 id="adaptations">Как используются задачи</h2>
        <p>
          Тренировочные формулировки могут быть адаптированы: изменены сюжет,
          числа или формат ответа. Названия задач, подборки, подсказки и учебные
          объяснения подготовлены для тренажёра. Они не являются официальными
          формулировками, решениями или классификацией ВсОШ.
        </p>
        <p>
          Год, этап, регион и номер ниже относятся к исходной олимпиадной
          задаче, а не к сложности тренировки. Первоисточники опубликованы в{" "}
          <a href="https://vos.olimpiada.ru/">архиве ВсОШ в Москве</a>.
        </p>
      </section>
      <section aria-labelledby="rights">
        <h2 id="rights">Статус проверки прав</h2>
        <p>
          Права на исходные материалы принадлежат их правообладателям.
          Подтверждённое основание для использования и адаптации каждого
          источника пока не установлено: проверка прав остаётся открытой.
          Общедоступность файлов и указание источника сами по себе не
          подтверждают разрешение. Проект не заявляет открытую лицензию на
          исходные материалы.
        </p>
      </section>
      <section aria-labelledby="source-list">
        <h2 id="source-list">Источники задач — {sources.length}</h2>
        <p>
          Для каждой задачи указаны сведения о первоисточнике. Ссылки ведут на
          внешние PDF; некоторые документы также содержат ответы и решения. Если
          хочешь решить задачу самостоятельно, сначала попробуй её в тренажёре.
        </p>
        <ul className={styles.sources}>
          {sources.map((source) => (
            <li key={source.problemId}>
              <h3>{source.title}</h3>
              <dl>
                <div>
                  <dt>Учебный год</dt>
                  <dd>{source.academicYear}</dd>
                </div>
                <div>
                  <dt>Этап</dt>
                  <dd>
                    {source.stage === "invitational"
                      ? "Пригласительный"
                      : "Школьный"}
                  </dd>
                </div>
                <div>
                  <dt>Регион</dt>
                  <dd>
                    {source.region === "Moscow" ? "Москва" : source.region}
                  </dd>
                </div>
                <div>
                  <dt>Номер в источнике</dt>
                  <dd>
                    № {source.problemNumber}
                    {source.variant === undefined
                      ? ""
                      : `, вариант ${source.variant}`}
                  </dd>
                </div>
              </dl>
              <a
                href={`${source.originalSource.url}#page=${source.originalSource.page}`}
              >
                Первоисточник «{source.title}» (PDF, стр.{" "}
                {source.originalSource.page})
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

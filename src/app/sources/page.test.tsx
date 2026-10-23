import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import SourcesPage from "./page";
import SiteFooter from "../site-footer";
import { getPublicProblemSources } from "../../modules/practice/server/public-problem-sources";

describe("Sources page", () => {
  it("renders semantic headings, labelled sections and complete source links without JavaScript", () => {
    const { document } = new JSDOM(renderToStaticMarkup(<SourcesPage />))
      .window;
    expect(document.querySelectorAll("main")).toHaveLength(1);
    expect(document.querySelectorAll("h1")).toHaveLength(1);
    expect(document.querySelector("nav")?.getAttribute("aria-label")).toBe(
      "Навигация",
    );
    for (const section of document.querySelectorAll("section")) {
      const label = section.getAttribute("aria-labelledby")!;
      expect(section.querySelector(`h2#${label}`)?.textContent).toBeTruthy();
    }
    const rows = [...document.querySelectorAll("li")];
    expect(rows).toHaveLength(63);
    for (const [index, row] of rows.entries()) {
      const source = getPublicProblemSources()[index];
      expect(row.querySelector("h3")?.textContent).toBe(source.title);
      if (source.kind === "original") {
        expect(row.textContent).toContain("Оригинальная задача проекта");
        expect(row.textContent).toContain(source.authorship);
        expect(row.querySelector("dl, a")).toBeNull();
        continue;
      }
      expect(
        [...row.querySelectorAll("dt")].map((node) => node.textContent),
      ).toEqual(["Учебный год", "Этап", "Регион", "Номер в источнике"]);
      const values = [...row.querySelectorAll("dd")].map(
        (node) => node.textContent,
      );
      expect(values).toEqual([
        source.academicYear,
        source.stage === "school" ? "Школьный" : "Пригласительный",
        "Москва",
        `№ ${source.problemNumber}${source.variant === undefined ? "" : `, вариант ${source.variant}`}`,
      ]);
      const link = row.querySelector("a")!;
      expect(link.getAttribute("href")).toBe(
        `${source.originalSource.url}#page=${source.originalSource.page}`,
      );
      expect(link.textContent).toContain(source.title);
      expect(link.textContent).toContain("PDF");
      expect(link.hasAttribute("target")).toBe(false);
    }
    expect(document.body.textContent).toContain(
      "проверка прав остаётся открытой",
    );
  });

  it("distinguishes owner permission for Pack S from open human and VSOSh rights gates", () => {
    const { document } = new JSDOM(renderToStaticMarkup(<SourcesPage />))
      .window;
    const paragraphs = [
      ...document.querySelectorAll('section[aria-labelledby="rights"] p'),
    ].map((paragraph) => paragraph.textContent!.replace(/\s+/g, " ").trim());
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toContain("Для всех 60 задач на основе ВсОШ");
    expect(paragraphs[0]).toContain("проверка прав остаётся открытой");
    expect(paragraphs[1]).toContain("19 октября 2026 года");
    expect(paragraphs[1]).toContain("трёх оригинальных задач Pack S");
    expect(paragraphs[1]).toContain("SVG-схем, подсказок и объяснений");
    expect(paragraphs[1]).toContain(
      "в Olympiad Trainer и его GitHub-репозитории",
    );
    expect(paragraphs[1]).toContain("Публичное указание помощи Codex одобрено");
    expect(paragraphs[1]).toContain("Владельцу не известно о скопированных");
    expect(paragraphs[2]).toContain(
      "не означает независимой проверки оригинальности",
    );
    expect(paragraphs[2]).toContain("или предоставления открытой лицензии");
    expect(paragraphs[2]).toContain(
      "пригодности для 5 класса остаётся открытой",
    );
    expect(paragraphs[2]).toContain(
      "не распространяется на 60 задач на основе ВсОШ",
    );
    expect(document.body.textContent).not.toContain(
      "Разрешение на публикацию этих материалов пока не получено",
    );
  });

  it("keeps the footer destination keyboard focusable", () => {
    const { document } = new JSDOM(renderToStaticMarkup(<SiteFooter />)).window;
    const link = document.querySelector<HTMLAnchorElement>("footer a")!;
    expect(link.textContent).toBe("Источники и авторские права");
    expect(link.getAttribute("href")).toBe("/sources");
    expect(link.tabIndex).toBe(0);
    link.focus();
    expect(document.activeElement).toBe(link);
  });
});

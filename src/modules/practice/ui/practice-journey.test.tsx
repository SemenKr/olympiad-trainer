import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HomePracticeJourney,
  ProgressPracticeJourney,
} from "./practice-journey";

describe("Practice Journey v1 surfaces", () => {
  it("keeps Home quiet for a fresh learner and shows a compact next goal later", () => {
    expect(renderToStaticMarkup(<HomePracticeJourney totalXp={0} />)).toBe("");

    const markup = renderToStaticMarkup(<HomePracticeJourney totalXp={70} />);
    expect(markup).toContain("Путь практики");
    expect(markup).toContain("Уровень пути 2");
    expect(markup).toContain("В движении");
    expect(markup).toContain("70 XP");
    expect(markup).toContain("До уровня пути 3");
    expect(markup).toContain("10 XP");
    expect(markup).toContain("Следующая медаль: «Первая сотня» · 100 XP");
    expect(markup).toContain('aria-label="Прогресс до уровня пути 3"');
  });

  it("keeps XP growing after the highest v1 level", () => {
    const markup = renderToStaticMarkup(<HomePracticeJourney totalXp={430} />);
    expect(markup).toContain("Уровень пути 6");
    expect(markup).toContain("Длинная дистанция");
    expect(markup).toContain("430 XP");
    expect(markup).toContain(
      "Верхняя отметка пути этой версии достигнута. XP продолжают копиться.",
    );
    expect(markup).not.toContain("Следующая медаль");
  });

  it("shows levels and collectible participation badges on Progress", () => {
    const markup = renderToStaticMarkup(
      <ProgressPracticeJourney totalXp={50} />,
    );

    expect(markup).toContain("Уровень пути 2");
    expect(markup).toContain("В движении");
    expect(markup).toContain("До уровня пути 3");
    expect(markup).toContain("30 XP");
    expect(markup).toContain("XP отмечает практику, а не уровень знаний.");
    expect(markup).toContain("Уровни пути и медали тоже показывают участие.");
    for (const label of [
      "Первый шаг",
      "Начал разгон",
      "Первая сотня",
      "Стабильный темп",
      "Большой путь",
    ])
      expect(markup).toContain(label);
    expect(markup.match(/Получена/g)).toHaveLength(2);
    expect(markup.match(/Впереди/g)).toHaveLength(3);
  });
});

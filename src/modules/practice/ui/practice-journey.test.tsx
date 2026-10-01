import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  HomePracticeJourney,
  ProgressPracticeJourney,
} from "./practice-journey";

describe("Practice Journey surfaces", () => {
  it("hides the Home block for a fresh learner and offers only a fixed milestone", () => {
    expect(renderToStaticMarkup(<HomePracticeJourney totalXp={0} />)).toBe("");
    const markup = renderToStaticMarkup(<HomePracticeJourney totalXp={70} />);
    expect(markup).toContain("70 XP");
    expect(markup).toContain("До отметки «100 XP практики» — 30 XP.");
    const after100 = renderToStaticMarkup(
      <HomePracticeJourney totalXp={120} />,
    );
    expect(after100).toContain("120 XP");
    expect(after100).not.toContain("До отметки");
  });

  it("shows fixed milestone states in text on Progress", () => {
    const markup = renderToStaticMarkup(
      <ProgressPracticeJourney totalXp={50} />,
    );
    expect(markup).toContain("XP отмечает практику, а не уровень знаний.");
    expect(markup).toContain("Первый шаг");
    expect(markup).toContain("50 XP практики");
    expect(markup).toContain("100 XP практики");
    expect(markup).toContain("Получена");
    expect(markup).toContain("Впереди");
  });
});

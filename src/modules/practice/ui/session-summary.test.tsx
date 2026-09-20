import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { PracticeSummary } from "../application/practice-state";
import { SessionSummary } from "./session-summary";

const problemTitle = "Совпадающие места";

function renderSummary(outcome: PracticeSummary["outcome"]): string {
  return renderToStaticMarkup(
    <SessionSummary
      problemTitle={problemTitle}
      summary={{ outcome, validSubmissionCount: 0 }}
    />,
  );
}

describe("SessionSummary", () => {
  it("omits task results when there are no valid submissions", () => {
    const markup = renderSummary("no-valid-submissions");

    expect(markup).toContain("Тренировка завершена");
    expect(markup).toContain("Что осталось");
    expect(markup).toContain(
      "В этой тренировке по задаче не было проверенного ответа.",
    );
    expect(markup).not.toContain("Результаты задач");
  });

  it("omits task results when all valid attempts were incorrect", () => {
    const markup = renderSummary("incorrect-only");

    expect(markup).toContain(
      "Были проверенные попытки, но правильный ответ в этой тренировке не был получен.",
    );
    expect(markup).not.toContain("Результаты задач");
  });

  it("shows the current task as independently solved after a correct answer", () => {
    const markup = renderSummary("eventually-correct");

    expect(markup).toContain("Результаты задач");
    expect(markup).toContain("Решено самостоятельно");
    expect(markup).toContain(problemTitle);
  });

  it.each([
    "no-valid-submissions",
    "incorrect-only",
    "eventually-correct",
  ] as const)("never presents Finish as a skipped task for %s", (outcome) => {
    expect(renderSummary(outcome)).not.toContain("Задача пропущена");
  });

  it("keeps Home functional and Progress honestly unavailable", () => {
    const markup = renderSummary("eventually-correct");

    expect(markup).toContain('href="/"');
    expect(markup).toContain("На главную");
    expect(markup).toMatch(
      /<button[^>]*disabled=""[^>]*>Мой прогресс<\/button>/,
    );
  });
});

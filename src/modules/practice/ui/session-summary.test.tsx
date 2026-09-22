import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type {
  PracticeHintExposure,
  PracticeSolutionExposure,
  PracticeSummary,
} from "../application/practice-state";
import { SessionSummary } from "./session-summary";

const problemTitle = "Совпадающие места";

function renderSummary(
  outcome: PracticeSummary["outcome"],
  hintExposures: readonly PracticeHintExposure[] = [],
  solutionExposure: PracticeSolutionExposure | null = null,
): string {
  return renderToStaticMarkup(
    <SessionSummary
      results={[
        {
          problemId: "coinciding-seats",
          problemTitle,
          summary: {
            outcome,
            validSubmissionCount: 0,
            hintExposures,
            solutionExposure,
          },
        },
      ]}
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

  it("shows supported success after a focus hint without a causal claim", () => {
    const markup = renderSummary("eventually-correct", [
      {
        hintId: "coinciding-seats-focus-simultaneous-rules",
        level: "focus",
        validSubmissionCountAtOpen: 0,
      },
    ]);

    expect(markup).toContain(
      "За эту тренировку ты решил одну задачу с подсказкой.",
    );
    expect(markup).toContain("Получилось с подсказкой");
    expect(markup).not.toContain("Решено самостоятельно");
    expect(markup).not.toContain("Подсказка помогла найти ход.");
  });

  it("keeps the same supported-success presentation after focus and strategy", () => {
    const markup = renderSummary("eventually-correct", [
      {
        hintId: "coinciding-seats-focus-simultaneous-rules",
        level: "focus",
        validSubmissionCountAtOpen: 0,
      },
      {
        hintId: "coinciding-seats-strategy-repeat-interval",
        level: "strategy",
        validSubmissionCountAtOpen: 0,
      },
    ]);

    expect(markup).toContain(
      "За эту тренировку ты решил одну задачу с подсказкой.",
    );
    expect(markup).toContain("Получилось с подсказкой");
    expect(markup).not.toContain("Решено самостоятельно");
    expect(markup).not.toContain("Подсказка помогла найти ход.");
    expect(markup).not.toContain("strategy");
  });

  it("keeps the same supported-success presentation after all three hints", () => {
    const markup = renderSummary("eventually-correct", [
      {
        hintId: "coinciding-seats-focus-simultaneous-rules",
        level: "focus",
        validSubmissionCountAtOpen: 0,
      },
      {
        hintId: "coinciding-seats-strategy-repeat-interval",
        level: "strategy",
        validSubmissionCountAtOpen: 0,
      },
      {
        hintId: "coinciding-seats-next-step-list-common-seats",
        level: "next-step",
        validSubmissionCountAtOpen: 0,
      },
    ]);

    expect(markup).toContain(
      "За эту тренировку ты решил одну задачу с подсказкой.",
    );
    expect(markup).toContain("Получилось с подсказкой");
    expect(markup).not.toContain("Решено самостоятельно");
    expect(markup).not.toContain("Подсказка помогла найти ход.");
    expect(markup).not.toContain("next-step");
  });

  it("keeps incorrect-only without a task outcome after all hints", () => {
    const markup = renderSummary("incorrect-only", [
      {
        hintId: "coinciding-seats-focus-simultaneous-rules",
        level: "focus",
        validSubmissionCountAtOpen: 0,
      },
      {
        hintId: "coinciding-seats-strategy-repeat-interval",
        level: "strategy",
        validSubmissionCountAtOpen: 0,
      },
      {
        hintId: "coinciding-seats-next-step-list-common-seats",
        level: "next-step",
        validSubmissionCountAtOpen: 0,
      },
    ]);

    expect(markup).toContain(
      "Были проверенные попытки, но правильный ответ в этой тренировке не был получен.",
    );
    expect(markup).not.toContain("Результаты задач");
    expect(markup).not.toContain("Получилось с подсказкой");
  });

  it("shows full-solution study after incorrect attempts", () => {
    const markup = renderSummary("incorrect-only", [], {
      solutionId: "coinciding-seats-full-solution",
      validSubmissionCountAtOpen: 1,
    });

    expect(markup).toContain(
      "Были проверенные попытки, но правильный ответ в этой тренировке не был получен.",
    );
    expect(markup).toContain("Результаты задач");
    expect(markup).toContain("Посмотрено полное решение");
    expect(markup).not.toContain("Решено самостоятельно");
    expect(markup).not.toContain("Получилось с подсказкой");
  });

  it("gives solution exposure precedence after a later correct answer", () => {
    const markup = renderSummary(
      "eventually-correct",
      [
        {
          hintId: "coinciding-seats-focus-simultaneous-rules",
          level: "focus",
          validSubmissionCountAtOpen: 1,
        },
      ],
      {
        solutionId: "coinciding-seats-full-solution",
        validSubmissionCountAtOpen: 1,
      },
    );

    expect(markup).toContain("Посмотрено полное решение");
    expect(markup).not.toContain("Решено самостоятельно");
    expect(markup).not.toContain("Получилось с подсказкой");
    expect(markup).not.toContain(
      "За эту тренировку ты решил одну задачу с подсказкой.",
    );
    expect(markup).not.toContain("Что получилось");
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

  it("renders two ordered independent results", () => {
    const markup = renderToStaticMarkup(
      <SessionSummary
        results={[
          {
            problemId: "coinciding-seats",
            problemTitle: "Совпадающие места",
            summary: {
              outcome: "eventually-correct",
              validSubmissionCount: 1,
              hintExposures: [],
              solutionExposure: null,
            },
          },
          {
            problemId: "guaranteed-sock-pair",
            problemTitle: "Носки в пакете",
            summary: {
              outcome: "eventually-correct",
              validSubmissionCount: 1,
              hintExposures: [],
              solutionExposure: null,
            },
          },
        ]}
      />,
    );

    expect(markup).toContain(
      "Все задачи этой тренировки решены самостоятельно.",
    );
    expect(markup.indexOf("Совпадающие места")).toBeLessThan(
      markup.indexOf("Носки в пакете"),
    );
    expect(markup.match(/Решено самостоятельно/g)).toHaveLength(2);
  });

  it("keeps per-problem support and solution labels distinct", () => {
    const markup = renderToStaticMarkup(
      <SessionSummary
        results={[
          {
            problemId: "coinciding-seats",
            problemTitle: "Совпадающие места",
            summary: {
              outcome: "eventually-correct",
              validSubmissionCount: 1,
              hintExposures: [
                {
                  hintId: "focus",
                  level: "focus",
                  validSubmissionCountAtOpen: 0,
                },
              ],
              solutionExposure: null,
            },
          },
          {
            problemId: "guaranteed-sock-pair",
            problemTitle: "Носки в пакете",
            summary: {
              outcome: "eventually-correct",
              validSubmissionCount: 2,
              hintExposures: [],
              solutionExposure: {
                solutionId: "guaranteed-sock-pair-full-solution",
                validSubmissionCountAtOpen: 1,
              },
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("Получилось с подсказкой");
    expect(markup).toContain("Посмотрено полное решение");
    expect(markup).not.toContain("Решено самостоятельно");
    expect(markup.indexOf("Совпадающие места")).toBeLessThan(
      markup.indexOf("Носки в пакете"),
    );
  });

  it("renders independent and supported successes as separate ordered rows", () => {
    const markup = renderToStaticMarkup(
      <SessionSummary
        results={[
          {
            problemId: "coinciding-seats",
            problemTitle: "Совпадающие места",
            summary: {
              outcome: "eventually-correct",
              validSubmissionCount: 1,
              hintExposures: [],
              solutionExposure: null,
            },
          },
          {
            problemId: "guaranteed-sock-pair",
            problemTitle: "Носки в пакете",
            summary: {
              outcome: "eventually-correct",
              validSubmissionCount: 2,
              hintExposures: [
                {
                  hintId: "guaranteed-sock-pair-focus-guarantee",
                  level: "focus",
                  validSubmissionCountAtOpen: 1,
                },
              ],
              solutionExposure: null,
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("Одну задачу ты решил сам.");
    expect(markup).toContain("В одной задаче получилось с подсказкой.");
    expect(markup).toContain("Решено самостоятельно");
    expect(markup).toContain("Получилось с подсказкой");
    expect(markup.indexOf("Совпадающие места")).toBeLessThan(
      markup.indexOf("Носки в пакете"),
    );
  });

  it("keeps an early unfinished problem factual without inventing an outcome", () => {
    const markup = renderToStaticMarkup(
      <SessionSummary
        results={[
          {
            problemId: "coinciding-seats",
            problemTitle: "Совпадающие места",
            summary: {
              outcome: "incorrect-only",
              validSubmissionCount: 1,
              hintExposures: [],
              solutionExposure: null,
            },
          },
        ]}
      />,
    );

    expect(markup).toContain(
      "Были проверенные попытки, но правильный ответ в этой тренировке не был получен.",
    );
    expect(markup).not.toContain("Результаты задач");
    expect(markup).not.toContain("Решено самостоятельно");
    expect(markup).not.toContain("Получилось с подсказкой");
  });
});

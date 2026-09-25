import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));

vi.mock("@/modules/practice/ui/practice-session-storage", () => ({
  getStoredProblemTitle: () => "Совпадающие места",
  readVerifiedLatestCompletedResults: vi.fn(),
  readVerifiedPracticeSessionSnapshot: vi.fn(),
}));

vi.mock("@/modules/practice/ui/session-summary", () => ({
  getPracticeResultLabel: () => null,
  getPracticeRemainingText: () =>
    "В этой тренировке по задаче не было проверенного ответа.",
}));

import { startPractice } from "../modules/practice/application/practice-state";
import { HomePracticeContent } from "./home-practice-action";
import Home from "./page";

const completed = [
  {
    problemId: "coinciding-seats",
    problemTitle: "Совпадающие места",
    summary: {
      outcome: "no-valid-submissions" as const,
      validSubmissionCount: 0,
      hintExposures: [],
      solutionExposure: null,
    },
  },
];
const unfinished = {
  sessionId: "00000000-0000-4000-8000-000000000065",
  problemIds: [
    "coinciding-seats",
    "guaranteed-sock-pair",
    "table-impossible-sums",
  ] as const,
  activeProblemIndex: 0 as const,
  completedResults: [],
  activePractice: startPractice(),
  rawAnswer: "",
};
const noNext = {
  sessionId: "00000000-0000-4000-8000-000000000090",
  status: "no-next" as const,
  completedResults: [
    {
      ...completed[0],
      summary: {
        ...completed[0].summary,
        outcome: "eventually-correct" as const,
        validSubmissionCount: 1,
      },
    },
    {
      problemId: "guaranteed-sock-pair",
      problemTitle: "Носки в пакете",
      summary: completed[0].summary,
    },
    {
      problemId: "table-impossible-sums",
      problemTitle: "Невозможные суммы",
      summary: completed[0].summary,
      taskOutcome: "skipped" as const,
    },
  ] as const,
};

describe("Home Practice precedence", () => {
  it("keeps Progress secondary on Home without changing Practice's primary action", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain('href="/progress"');
    expect(markup).toContain("Мой прогресс");
    expect(markup).toContain("Проверяем, есть ли незаконченная тренировка…");
  });

  it("keeps Resume primary with the previous completion secondary", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent stored={{ unfinished, completed }} />,
    );

    expect(markup).toContain("Продолжить тренировку");
    expect(markup).not.toContain("Начать тренировку");
    expect(markup).toContain("Последняя тренировка");
    expect(markup).toContain("Посмотреть итоги");
    expect(markup).toContain('href="/practice/summary"');
    expect(markup).toContain("Совпадающие места");
    expect(markup).toContain("не было проверенного ответа");
  });

  it("shows Start primary and the latest completion secondary without unfinished work", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent stored={{ unfinished: null, completed }} />,
    );

    expect(markup).toContain("Начать тренировку");
    expect(markup).not.toContain("Продолжить тренировку");
    expect(markup).toContain("Последняя тренировка");
    expect(markup).toContain("Посмотреть итоги");
  });

  it("shows Finish primary for no-next while retaining the previous Summary", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent stored={{ unfinished: noNext, completed }} />,
    );

    expect(markup).toContain("Завершить тренировку");
    expect(markup).toContain('href="/practice"');
    expect(markup).not.toContain("Продолжить тренировку");
    expect(markup).not.toContain("Начать тренировку");
    expect(markup).toContain("Последняя тренировка");
    expect(markup).toContain("Посмотреть итоги");
  });
});

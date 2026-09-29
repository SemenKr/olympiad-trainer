import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));

vi.mock("@/app/progress/actions", () => ({
  readServerAdaptiveAvailability: vi.fn(async () => ({
    availability: { status: "insufficient-evidence" },
    hasPracticeHistory: false,
  })),
}));

vi.mock("@/modules/practice/ui/server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(async () => null),
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
const insufficient = { status: "insufficient-evidence" as const };
const exhausted = { status: "transfer-exhausted" as const };
const fresh = {
  unfinished: null,
  completed: null,
  availability: insufficient,
  hasPracticeHistory: false,
};

describe("Home Practice precedence", () => {
  it("shows Pack A only for returning learners, below the current action and before latest preview", () => {
    const render = (
      stored: Parameters<typeof HomePracticeContent>[0]["stored"],
    ) => renderToStaticMarkup(<HomePracticeContent stored={stored} />);
    expect(render(fresh)).not.toContain("/practice/pack");
    const returning = render({ ...fresh, hasPracticeHistory: true });
    expect(returning).toContain("Дополнительная практика");
    expect(returning).toContain("Разные способы рассуждать");
    expect(returning).toContain(
      "Три задачи для дополнительной тренировки. Этот набор можно выбрать самому — он не зависит от персональной рекомендации.",
    );
    expect(returning).toContain("Решить 3 задачи");
    expect(returning).toContain("/practice/pack");
    expect(returning.indexOf("Пока без новой задачи")).toBeLessThan(
      returning.indexOf("Разные способы рассуждать"),
    );
    expect(render({ ...fresh, completed })).toContain("/practice/pack");
    expect(
      render({ ...fresh, unfinished, hasPracticeHistory: true }),
    ).not.toContain("/practice/pack");
    expect(
      render({ ...fresh, unfinished: noNext, hasPracticeHistory: true }),
    ).not.toContain("/practice/pack");
    expect(
      render({ ...fresh, availability: exhausted, hasPracticeHistory: true }),
    ).toContain("/practice/pack");
    const recommended = render({
      ...fresh,
      completed,
      availability: {
        status: "recommendation",
        problemId: "brothers-ages-products",
        reason: "Рекомендация",
      },
    });
    expect(recommended.indexOf("Следующая полезная задача")).toBeLessThan(
      recommended.indexOf("Разные способы рассуждать"),
    );
    expect(recommended.indexOf("Разные способы рассуждать")).toBeLessThan(
      recommended.indexOf("Последняя тренировка"),
    );
  });
  it("links pages exploration without revealing its strategy and keeps consumed no-next copy", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished: null,
          completed: null,
          hasPracticeHistory: true,
          availability: {
            status: "recommendation",
            problemId: "pages-without-digit-one",
            reason:
              "В твоём прогрессе пока нет проверяемой работы с таким типом рассуждения. Эта задача даст возможность попробовать новую идею.",
          },
        }}
      />,
    );
    expect(markup).toContain(
      "/practice/transfer?problem=pages-without-digit-one",
    );
    expect(markup).toContain("Страницы без цифры 1");
    expect(markup).not.toMatch(/перебор|непересекающ|блоки/);
    const consumed = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished: null,
          completed: null,
          hasPracticeHistory: true,
          availability: exhausted,
        }}
      />,
    );
    expect(consumed).toContain("Новых подходящих задач пока нет");
  });
  it("links a parrots recommendation to its explicit transfer identity", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished: null,
          completed: null,
          hasPracticeHistory: true,
          availability: {
            status: "recommendation",
            problemId: "parrots-guaranteed-colors",
            reason:
              "Здесь выбор устроен иначе — попробуй разобраться без готового хода.",
          },
        }}
      />,
    );
    expect(markup).toContain("Попугаи в зоопарке");
    expect(markup).toContain(
      "/practice/transfer?problem=parrots-guaranteed-colors",
    );
    expect(markup).not.toContain("не-красных");
  });
  const recommendation = {
    status: "recommendation" as const,
    problemId: "brothers-ages-products" as const,
    reason:
      "Раньше ты уже верно проверил рассуждение без подсказок. Здесь условия совсем другие — посмотрим, получится ли так же в новой ситуации.",
  };

  it("shows the single transfer as primary only without unfinished Practice", () => {
    const recommended = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished: null,
          completed,
          availability: recommendation,
          hasPracticeHistory: true,
        }}
      />,
    );
    expect(recommended).toContain('href="/practice/transfer"');
    expect(recommended).toContain(recommendation.reason);
    expect(recommended).not.toContain("Начать тренировку");
    expect(recommended).not.toContain("младшему");
    const resume = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished,
          completed,
          availability: recommendation,
          hasPracticeHistory: true,
        }}
      />,
    );
    expect(resume).toContain("Продолжить тренировку");
    expect(resume).not.toContain(recommendation.reason);
  });
  it("keeps Progress secondary on Home without changing Practice's primary action", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("Решай олимпиадные задачи по математике");
    expect(markup).not.toContain("Скоро здесь можно будет готовиться");
    expect(markup).toContain("Проверяем, есть ли незаконченная тренировка…");
    expect(markup).toContain('aria-live="polite"');
    expect(markup).toContain('href="/progress"');
  });

  it("keeps Resume primary with the previous completion secondary", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished,
          completed,
          availability: insufficient,
          hasPracticeHistory: true,
        }}
      />,
    );

    expect(markup).toContain("Продолжить тренировку");
    expect(markup).not.toContain("Начать тренировку");
    expect(markup).toContain("Последняя тренировка");
    expect(markup).toContain("Посмотреть итоги");
    expect(markup).toContain('href="/practice/summary"');
    expect(markup).toContain("Совпадающие места");
    expect(markup).toContain("не было проверенного ответа");
  });

  it("treats a verified local Summary as returning even without server history", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent stored={{ ...fresh, completed }} />,
    );

    expect(markup).toContain("Пока без новой задачи");
    expect(markup).toContain("Посмотреть прогресс");
    expect(markup).not.toContain("Начать тренировку");
    expect(markup).not.toContain("Продолжить тренировку");
    expect(markup).toContain("Последняя тренировка");
    expect(markup).toContain("Посмотреть итоги");
    expect(markup.indexOf("Посмотреть прогресс")).toBeLessThan(
      markup.indexOf("Последняя тренировка"),
    );
  });

  it("shows Finish primary for no-next while retaining the previous Summary", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished: noNext,
          completed,
          availability: insufficient,
          hasPracticeHistory: true,
        }}
      />,
    );

    expect(markup).toContain("Завершить тренировку");
    expect(markup).toContain('href="/practice"');
    expect(markup).not.toContain("Продолжить тренировку");
    expect(markup).not.toContain("Начать тренировку");
    expect(markup).toContain("Последняя тренировка");
    expect(markup).toContain("Посмотреть итоги");
  });

  it("offers the core Practice to a fresh learner without recent work", () => {
    const markup = renderToStaticMarkup(<HomePracticeContent stored={fresh} />);
    expect(markup).toContain("Что сейчас?");
    expect(markup).toContain("<h2>Начни с первой тренировки</h2>");
    expect(markup).toContain('href="/practice"');
    expect(markup).toContain("Начать тренировку");
    expect(markup).not.toContain("Последняя тренировка");
    expect(markup).not.toContain("<h2>Что сейчас?</h2>");
    expect(markup).toContain("Мой прогресс");
  });

  it.each([
    [
      insufficient,
      "Пока без новой задачи",
      "Пока недостаточно проверенной работы",
    ],
    [
      exhausted,
      "Новых подходящих задач пока нет",
      "Все подходящие задачи из текущего набора",
    ],
  ])("shows Progress for returning %s", (availability, title, text) => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{ ...fresh, availability, hasPracticeHistory: true }}
      />,
    );
    expect(markup).toContain(`<h2>${title}</h2>`);
    expect(markup).toContain(text);
    expect(markup).toContain('href="/progress"');
    expect(markup).toContain("Посмотреть прогресс");
    expect(markup).not.toContain("Начать тренировку");
    expect(markup).not.toContain("Мой прогресс");
    expect(markup).not.toMatch(/слаб|освоил|мастерств|вернись позже/i);
    expect(markup).not.toContain("disabled");
  });

  it("keeps a latest Summary secondary when transfers are exhausted", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{ ...fresh, completed, availability: exhausted }}
      />,
    );
    expect(markup.indexOf("Посмотреть прогресс")).toBeLessThan(
      markup.indexOf("Последняя тренировка"),
    );
    expect(markup).toContain("Посмотреть итоги");
  });
});

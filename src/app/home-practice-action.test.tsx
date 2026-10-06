import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));

vi.mock("./progress/actions", () => ({
  readServerReviewAvailability: vi.fn(async () => false),
  readServerLearningPath: vi.fn(async () => []),
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
import {
  PACK_B_PROBLEM_IDS,
  PACK_C_PROBLEM_IDS,
  PRACTICE_PACKS,
} from "../modules/practice/application/completed-practice-episode";
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
  completedPackIds: [],
};

describe("Home Practice precedence", () => {
  it("links the latest Summary using its persisted completed session identity", () => {
    const completedSessionId = "00000000-0000-4000-8000-000000000002";
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{ ...fresh, completed, completedSessionId }}
      />,
    );
    expect(markup).toContain(
      `href="/practice/summary?session=${completedSessionId}"`,
    );
    const legacy = renderToStaticMarkup(
      <HomePracticeContent stored={{ ...fresh, completed }} />,
    );
    expect(legacy).toContain('href="/practice/summary"');
    expect(legacy).not.toContain("?session=");
  });

  it("moves ordinary Pack choices behind the chooser while preserving every Pack Resume route", () => {
    const render = (
      unfinishedValue: Parameters<
        typeof HomePracticeContent
      >[0]["stored"]["unfinished"],
      returning = true,
    ) =>
      renderToStaticMarkup(
        <HomePracticeContent
          stored={{
            ...fresh,
            unfinished: unfinishedValue,
            hasPracticeHistory: returning,
          }}
        />,
      );
    const returning = render(null);
    expect(returning).toContain('href="/practice/choose"');
    expect(returning).toContain('href="/practice/pack"');
    expect(returning).not.toContain("Решить 3 задачи");
    for (const pack of PRACTICE_PACKS.slice(1))
      expect(returning).not.toContain(pack.name);
    expect(returning).toContain("Продолжи с набора");
    expect(returning).toContain("Разные способы рассуждать");
    expect(returning).toContain("Продолжить путь");
    expect(render(null, false)).toContain('href="/practice/choose"');
    const active = {
      ...unfinished,
      mode: "pack" as const,
      problemIds: PACK_B_PROBLEM_IDS,
    };
    const activeMarkup = render(active);
    expect(activeMarkup).toContain('href="/practice/pack?pack=pack-b"');
    expect(activeMarkup).not.toContain("Связи и закономерности");
    const noNextPack = {
      sessionId: unfinished.sessionId,
      mode: "pack" as const,
      status: "no-next" as const,
      completedResults: PACK_B_PROBLEM_IDS.map((problemId) => ({
        ...completed[0],
        problemId,
        taskOutcome: "skipped" as const,
      })),
    };
    expect(render(noNextPack)).toContain('href="/practice/pack?pack=pack-b"');
    expect(render({ ...active, problemIds: PACK_C_PROBLEM_IDS })).toContain(
      'href="/practice/pack?pack=pack-c"',
    );
    expect(
      render({
        ...noNextPack,
        completedResults: PACK_C_PROBLEM_IDS.map((problemId) => ({
          ...completed[0],
          problemId,
          taskOutcome: "skipped" as const,
        })),
      }),
    ).toContain('href="/practice/pack?pack=pack-c"');
    for (const pack of PRACTICE_PACKS.slice(3)) {
      expect(render({ ...active, problemIds: pack.problemIds })).toContain(
        `href="/practice/pack?pack=${pack.id}"`,
      );
      expect(
        render({
          ...noNextPack,
          completedResults: pack.problemIds.map((problemId) => ({
            ...completed[0],
            problemId,
            taskOutcome: "skipped" as const,
          })),
        }),
      ).toContain(`href="/practice/pack?pack=${pack.id}"`);
    }
    const packA = {
      ...unfinished,
      mode: "pack" as const,
      problemIds: [
        "granddaughters-first",
        "cutout-area-ratio",
        "domino-placements",
      ] as const,
    };
    expect(render(packA)).toContain('href="/practice/pack"');
    expect(render(packA)).not.toContain('href="/practice/pack?pack=pack-b"');
  });
  it("offers one secondary chooser entry for fresh, returning, recommended and unfinished states", () => {
    const variants = [
      fresh,
      { ...fresh, hasPracticeHistory: true },
      { ...fresh, completed },
      { ...fresh, unfinished },
      { ...fresh, unfinished: noNext },
      { ...fresh, availability: exhausted, hasPracticeHistory: true },
      {
        ...fresh,
        completed,
        availability: {
          status: "recommendation" as const,
          problemId: "brothers-ages-products" as const,
          reason: "Рекомендация",
        },
      },
    ];
    for (const stored of variants) {
      const markup = renderToStaticMarkup(
        <HomePracticeContent stored={stored} />,
      );
      expect(markup.match(/href="\/practice\/choose"/g)).toHaveLength(1);
      expect(
        markup.match(/aria-label="Путь тренировок"/g)?.length ?? 0,
      ).toBeLessThanOrEqual(1);
      expect(markup).not.toContain("Решить 3 задачи");
      expect(markup).toContain("12 наборов по 3 задачи");
      expect(markup).toContain('href="/simulation"');
    }
    const recommended = renderToStaticMarkup(
      <HomePracticeContent stored={variants[6]} />,
    );
    expect(recommended.indexOf("Следующая полезная задача")).toBeLessThan(
      recommended.indexOf("Выбрать набор"),
    );
    expect(recommended.indexOf("Выбрать набор")).toBeLessThan(
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
          completedPackIds: [],
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
          completedPackIds: [],
          availability: exhausted,
        }}
      />,
    );
    expect(consumed).toContain("Продолжить путь");
  });
  it("links a parrots recommendation to its explicit transfer identity", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished: null,
          completed: null,
          hasPracticeHistory: true,
          completedPackIds: [],
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
          completedPackIds: [],
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
          completedPackIds: [],
        }}
      />,
    );
    expect(resume).toContain("Продолжить тренировку");
    expect(resume).not.toContain(recommendation.reason);
  });
  it("keeps Progress secondary on Home without changing Practice's primary action", () => {
    const markup = renderToStaticMarkup(<Home />);

    expect(markup).toContain("Что лучше сделать сейчас");
    expect(markup).toContain("5 КЛАСС · МАТЕМАТИКА");
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
          completedPackIds: [],
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

    expect(markup).toContain("Продолжи с набора");
    expect(markup).toContain("Продолжить путь");
    expect(markup).toContain("Открыть прогресс");
    expect(markup).not.toContain("Начать тренировку");
    expect(markup).not.toContain("Продолжить тренировку");
    expect(markup).toContain("Последняя тренировка");
    expect(markup).toContain("Посмотреть итоги");
    expect(markup.indexOf("Открыть прогресс")).toBeLessThan(
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
          completedPackIds: [],
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

  it.each([insufficient, exhausted])(
    "guides a returning learner after adaptive availability is exhausted: %s",
    (availability) => {
      const markup = renderToStaticMarkup(
        <HomePracticeContent
          stored={{
            ...fresh,
            availability,
            hasPracticeHistory: true,
            completedPackIds: ["pack-a"],
          }}
        />,
      );
      expect(markup).toContain("Продолжить путь");
      expect(markup).toContain('href="/practice/pack?pack=pack-j"');
      expect(markup).not.toContain("Начать тренировку");
      expect(markup).toContain('href="/practice/choose"');
      expect(markup).not.toMatch(/освоил|слаб|мастерств/i);
    },
  );

  it("keeps adaptive and fresh primary actions when Path reads fail", () => {
    const recommended = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          ...fresh,
          completedPackIds: null,
          availability: {
            status: "recommendation",
            problemId: "brothers-ages-products",
            reason: "Полезная задача",
          },
          hasPracticeHistory: true,
        }}
      />,
    );
    expect(recommended).toContain("Полезная задача");
    expect(recommended).not.toContain("Не удалось загрузить отметки");
    const core = renderToStaticMarkup(
      <HomePracticeContent stored={{ ...fresh, completedPackIds: null }} />,
    );
    expect(core).toContain("Начать тренировку");
    const returning = renderToStaticMarkup(
      <HomePracticeContent
        stored={{ ...fresh, hasPracticeHistory: true, completedPackIds: null }}
        onPathRetry={() => {}}
      />,
    );
    expect(returning).toContain("Не удалось загрузить отметки");
    expect(returning).toContain("Повторить");
    expect(returning).not.toContain("Продолжить путь");
  });

  it("offers free choice after every Pack has a recorded Finish", () => {
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          ...fresh,
          availability: exhausted,
          hasPracticeHistory: true,
          completedPackIds: PRACTICE_PACKS.map((pack) => pack.id),
        }}
      />,
    );
    expect(markup).toContain("Во всех наборах есть сохранённое завершение");
    expect(markup).toContain('href="/practice/choose"');
    expect(markup).not.toContain("Продолжить путь");
    expect(markup).not.toContain("Начать тренировку");
  });
});

describe("Home Review remains secondary", () => {
  it("shows Review after existing adaptive primary and hides it during Resume", () => {
    const base = {
      unfinished: null,
      completed: null,
      availability: {
        status: "recommendation" as const,
        problemId: "brothers-ages-products" as const,
        reason: "Полезная задача",
      },
      hasPracticeHistory: true,
      completedPackIds: [],
      reviewAvailable: true,
    };
    const markup = renderToStaticMarkup(<HomePracticeContent stored={base} />);
    expect(markup).toContain('href="/practice/review"');
    expect(markup.indexOf("Следующая полезная задача")).toBeLessThan(
      markup.indexOf("Повторная попытка"),
    );
    expect(
      renderToStaticMarkup(
        <HomePracticeContent stored={{ ...base, unfinished }} />,
      ),
    ).not.toContain('href="/practice/review"');
  });
  it("resumes Review through its own route", () => {
    const review = {
      sessionId: unfinished.sessionId,
      mode: "review" as const,
      problemIds: ["coinciding-seats"] as const,
      activeProblemIndex: 0 as const,
      completedResults: [] as const,
      activePractice: startPractice(),
      rawAnswer: "",
    };
    const markup = renderToStaticMarkup(
      <HomePracticeContent
        stored={{
          unfinished: review,
          completed: null,
          availability: { status: "insufficient-evidence" },
          hasPracticeHistory: true,
          completedPackIds: [],
        }}
      />,
    );
    expect(markup).toContain('href="/practice/review"');
    expect(markup).toContain("Продолжить тренировку");
  });
});

it("preserves adaptive primary when secondary Review availability fails", () => {
  const markup = renderToStaticMarkup(
    <HomePracticeContent
      stored={{
        unfinished: null,
        completed: null,
        availability: {
          status: "recommendation",
          problemId: "brothers-ages-products",
          reason: "Полезная задача",
        },
        hasPracticeHistory: true,
        completedPackIds: [],
        reviewAvailable: null,
      }}
    />,
  );
  expect(markup).toContain("Следующая полезная задача");
  expect(markup).toContain('href="/practice/transfer"');
  expect(markup).toContain(
    "Не удалось проверить, доступна ли повторная попытка",
  );
  expect(markup).toContain("Проверить ещё раз");
});

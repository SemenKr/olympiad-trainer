import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/practice/actions", () => ({
  revealPracticeHint: vi.fn(),
  revealPracticeSolution: vi.fn(),
  submitPracticeAnswer: vi.fn(),
}));

import { revealPracticeSolution } from "@/app/practice/actions";
import { NoNextPracticeSurface } from "./no-next-practice-surface";

import {
  PracticeHintRevealError,
  PracticeSession,
  PracticeSolutionRevealError,
} from "./practice-session";

const problems = [
  {
    problemId: "coinciding-seats",
    title: "Совпадающие места",
    statement: "Learner statement 1",
    hints: [
      {
        hintId: "coinciding-seats-focus-simultaneous-rules",
        level: "focus",
      },
      {
        hintId: "coinciding-seats-strategy-repeat-interval",
        level: "strategy",
      },
      {
        hintId: "coinciding-seats-next-step-list-common-seats",
        level: "next-step",
      },
    ],
    solution: { solutionId: "coinciding-seats-full-solution" },
  },
  {
    problemId: "guaranteed-sock-pair",
    title: "Носки в пакете",
    statement: "Learner statement 2",
    hints: [
      {
        hintId: "guaranteed-sock-pair-focus-guarantee",
        level: "focus",
      },
      {
        hintId: "guaranteed-sock-pair-strategy-worst-case",
        level: "strategy",
      },
      {
        hintId: "guaranteed-sock-pair-next-step-bound-without-pair",
        level: "next-step",
      },
    ],
    solution: { solutionId: "guaranteed-sock-pair-full-solution" },
  },
] as const;

describe("PracticeSession hint reveal error", () => {
  it("renders a visible, accessibly announced retry message", () => {
    const markup = renderToStaticMarkup(<PracticeHintRevealError />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain("Не удалось открыть подсказку. Попробуй ещё раз.");
  });
});

describe("PracticeSession solution reveal", () => {
  it("renders a visible, accessibly announced retry message", () => {
    const markup = renderToStaticMarkup(<PracticeSolutionRevealError />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain("Не удалось открыть решение. Попробуй ещё раз.");
  });

  it("gates the episode until browser storage has been checked", () => {
    const markup = renderToStaticMarkup(
      <PracticeSession problems={problems} />,
    );

    expect(markup).toContain("Загружаем тренировку");
    expect(markup).toContain('aria-busy="true"');
    expect(markup).not.toContain("Совпадающие места");
    expect(markup).not.toContain("Learner statement 1");
    expect(markup).not.toContain("Носки в пакете");
    expect(markup).not.toContain("Learner statement 2");
    expect(markup).not.toContain("Показать решение");
    expect(markup).not.toContain("Следующая задача");
    expect(markup).not.toContain("Пропустить задачу");
    expect(markup).not.toContain("Решение открыто");
    expect(markup).not.toContain("6 × 17");
    expect(revealPracticeSolution).not.toHaveBeenCalled();
  });
});

describe("Practice no-next surface", () => {
  it("offers explicit Finish and Home without an active answer or reveal control", () => {
    const markup = renderToStaticMarkup(
      <NoNextPracticeSurface
        onFinish={vi.fn()}
        onPause={vi.fn()}
        storageError={false}
      />,
    );

    expect(markup).toContain("Сейчас больше нет задач в этой тренировке.");
    const descriptionId = markup.match(
      /<h1[^>]*aria-describedby="([^"]+)"/,
    )?.[1];
    expect(descriptionId).toBeDefined();
    expect(markup).toMatch(/<h1[^>]*tabindex="-1"/);
    expect(markup).toContain(`<p id="${descriptionId}">`);
    expect(markup).toContain("Завершить тренировку");
    expect(markup).toContain("На главную");
    expect(markup).not.toContain("Ответ на задачу");
    expect(markup).not.toContain("Подсказка");
    expect(markup).not.toContain("Показать решение");
    expect(markup).not.toContain("Пропустить задачу");
  });
});

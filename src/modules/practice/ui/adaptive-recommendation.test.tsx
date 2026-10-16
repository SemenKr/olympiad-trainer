import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("../../../app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("../../../app/progress/actions", () => ({}));
import { HomePracticeContent } from "../../../app/home-practice-action";
import {
  ADAPTIVE_RULES,
  recommendationPresentation,
} from "../application/adaptive-recommendation";
import { ProgressNextUsefulWorkContent } from "./progress-next-useful-work";
import { validatePracticeSessionSnapshot } from "./practice-session-storage";
import { startPractice } from "../application/practice-state";

describe("Home / Progress next useful work", () => {
  it("keeps a failed Path read retryable on both surfaces instead of treating it as exhaustion", () => {
    for (const markup of [
      renderToStaticMarkup(
        <HomePracticeContent
          stored={{
            unfinished: null,
            completed: null,
            availability: { status: "none" },
            hasPracticeHistory: true,
            completedPackIds: null,
          }}
          onPathRetry={() => {}}
        />,
      ),
      renderToStaticMarkup(
        <ProgressNextUsefulWorkContent
          state={{
            status: "ready",
            unfinished: null,
            availability: { status: "none" },
            returning: true,
          }}
          completedPackIds={null}
          onPathRetry={() => {}}
        />,
      ),
    ]) {
      expect(markup).toContain("Не удалось загрузить отметки пути.");
      expect(markup).toContain("Повторить");
      expect(markup).not.toContain(
        "Во всех наборах есть сохранённое завершение",
      );
      expect(markup).not.toContain("Начать тренировку");
    }
  });
  it.each(ADAPTIVE_RULES)(
    "uses the identical safe explanation and destination for $target",
    (rule) => {
      const recommendation = {
        status: "recommendation" as const,
        problemId: rule.target,
        reason:
          "В сохранённой тренировке ты верно выбрал объяснение. Предлагаем другую задачу.",
      };
      const view = recommendationPresentation(recommendation);
      const home = renderToStaticMarkup(
        <HomePracticeContent
          stored={{
            unfinished: null,
            completed: null,
            availability: recommendation,
            hasPracticeHistory: true,
            completedPackIds: [],
          }}
        />,
      );
      const progress = renderToStaticMarkup(
        <ProgressNextUsefulWorkContent
          state={{
            status: "ready",
            unfinished: null,
            availability: recommendation,
            returning: true,
          }}
          completedPackIds={[]}
        />,
      );
      for (const markup of [home, progress]) {
        expect(markup).toContain(view.reason);
        expect(markup).toContain(view.title);
        expect(markup).toContain(`href="${view.href}"`);
        expect(markup).toContain(
          "Это предложение для практики, а не оценка знаний.",
        );
        expect(markup).not.toMatch(
          /selectedOptionId|nextSequence|checkpointId|expectedAnswer/,
        );
      }
    },
  );
  it("Progress prioritizes an existing snapshot over a new recommendation", () => {
    const unfinished = validatePracticeSessionSnapshot({
      sessionId: "00000000-0000-4000-8000-000000000001",
      problemIds: [
        "coinciding-seats",
        "guaranteed-sock-pair",
        "table-impossible-sums",
      ],
      activeProblemIndex: 0,
      completedResults: [],
      activePractice: startPractice(),
      rawAnswer: "",
    });
    expect(unfinished).not.toBeNull();
    const markup = renderToStaticMarkup(
      <ProgressNextUsefulWorkContent
        state={{
          status: "ready",
          unfinished,
          availability: {
            status: "recommendation",
            problemId: "brothers-ages-products",
            reason: "new recommendation sentinel",
          },
          returning: true,
        }}
        completedPackIds={[]}
      />,
    );
    expect(markup).toContain("Продолжить тренировку");
    expect(markup).not.toContain("new recommendation sentinel");
  });
  it("does not turn a failed read into an empty recommendation", () => {
    const markup = renderToStaticMarkup(
      <ProgressNextUsefulWorkContent
        state={{ status: "error" }}
        completedPackIds={[]}
      />,
    );
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Повторить");
    expect(markup).not.toContain("Продолжить путь");
  });
  it("resumes early Pack Finish in the same Pack on both surfaces", () => {
    const unfinished = {
      sessionId: "00000000-0000-4000-8000-000000000001",
      mode: "pack" as const,
      status: "no-next" as const,
      completedResults: [
        {
          problemId: "truck-car-same-arrival",
          problemTitle: "Грузовик и легковая машина",
          summary: {
            outcome: "no-valid-submissions" as const,
            validSubmissionCount: 0,
            hintExposures: [],
            solutionExposure: null,
          },
          taskOutcome: "skipped" as const,
        },
      ],
    };
    for (const markup of [
      renderToStaticMarkup(
        <HomePracticeContent
          stored={{
            unfinished,
            completed: null,
            availability: { status: "none" },
            hasPracticeHistory: true,
          }}
        />,
      ),
      renderToStaticMarkup(
        <ProgressNextUsefulWorkContent
          state={{
            status: "ready",
            unfinished,
            availability: { status: "none" },
            returning: true,
          }}
          completedPackIds={[]}
        />,
      ),
    ]) {
      expect(markup).toContain('href="/practice/pack?pack=pack-b"');
      expect(markup).toContain("Завершить тренировку");
    }
  });
  it.each([false, true])(
    "preserves fresh/Path fallback when returning=$returning",
    (returning) => {
      const markup = renderToStaticMarkup(
        <ProgressNextUsefulWorkContent
          state={{
            status: "ready",
            unfinished: null,
            availability: { status: "none" },
            returning,
          }}
          completedPackIds={[]}
        />,
      );
      expect(markup).toContain(
        returning ? "Продолжить путь" : "Начать тренировку",
      );
    },
  );
});

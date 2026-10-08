import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../app/progress/actions", () => ({
  readServerProgress: vi.fn(),
  readServerRecentPracticeEpisodes: vi.fn(async () => []),
  readServerPracticeJourney: vi.fn(async () => 70),
  readServerLearningPath: vi.fn(async () => []),
  readServerReviewAvailability: vi.fn(),
}));
vi.mock("./server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(async () => {}),
}));

import {
  readServerProgress,
  readServerReviewAvailability,
  readServerLearningPath,
} from "../../../app/progress/actions";
import { ProgressOverview } from "./progress-overview";
import { SessionSummary } from "./session-summary";

beforeEach(installImmediatePracticeSessionLock);

describe("Summary and Progress hierarchy", () => {
  it("keeps episode outcomes and checkpoint evidence outside Journey/actions", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <SessionSummary
        results={[
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
        journeyFinish={{
          earnedXp: 20,
          totalXp: 70,
          newlyReachedMilestone: "50 XP практики",
        }}
      />,
    );
    const sidebar = container.querySelector("aside")!;
    expect(sidebar.textContent).toContain("+20 XP");
    expect(sidebar.textContent).toContain("За эту тренировку");
    expect(sidebar.textContent).toContain("Всего 70 XP");
    expect(sidebar.textContent).toContain("Уровень пути 2 · В движении");
    expect(sidebar.textContent).not.toContain("50 XP практики");
    expect(sidebar.textContent).toContain(
      "XP показывает участие, а не уровень знаний.",
    );
    expect(sidebar.textContent).toContain(
      "Уровень пути и медали тоже показывают участие.",
    );
    expect(sidebar.textContent).not.toContain("Решено самостоятельно");
    expect(sidebar.textContent).not.toContain("Как гарантировать результат");
    const title = container.querySelector("h3")!;
    expect(title.textContent).toBe("Носки в пакете");
    expect(title.nextElementSibling?.textContent).toBe("Решено самостоятельно");
    expect(container.textContent).toContain("не оценка твоих способностей");
    expect(sidebar.querySelector("a")?.getAttribute("href")).toBe("/");
  });

  it.each([true, false, null])(
    "preserves evidence and secondary destinations with Review availability %s",
    async (available) => {
      vi.mocked(readServerProgress).mockResolvedValue([
        {
          learnerLabel: "Навык переноса",
          progressGroup: "Получается в разных задачах",
          conclusion: "Существующий вывод о переносе",
        },
        {
          learnerLabel: "Навык узнавания",
          progressGroup: "Начинаю разбираться",
          conclusion: "Существующий ограниченный вывод",
        },
        {
          learnerLabel: "Новая идея",
          progressGroup: null,
          conclusion: "Пока рано сказать",
        },
      ]);
      vi.mocked(readServerLearningPath).mockRejectedValueOnce(
        new Error("Path unavailable"),
      );
      if (available === null) {
        vi.mocked(readServerReviewAvailability).mockRejectedValueOnce(
          new Error("Review unavailable"),
        );
      } else {
        vi.mocked(readServerReviewAvailability).mockResolvedValue(available);
      }
      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);
      try {
        await act(async () => root.render(<ProgressOverview />));
        const evidence = container.querySelector(
          '[aria-labelledby="evidence-heading"]',
        )!;
        expect(evidence.querySelectorAll("h3")).toHaveLength(3);
        expect(evidence.textContent).toContain("Начинаю разбираться");
        expect(evidence.textContent).toContain("Получается в разных задачах");
        expect(evidence.textContent).toContain("Пока рано сказать");
        expect(evidence.textContent).not.toContain("XP");
        expect(
          container.querySelector(
            'section[class*="destinations"] a[href="/practice/choose"]',
          )?.textContent,
        ).toBe("Выбрать тренировку");
        expect(container.querySelector('a[href="/"]')).not.toBeNull();
        expect(container.textContent).toContain("70 XP");
        expect(container.textContent).toContain(
          "XP отмечает практику, а не уровень знаний.",
        );
        expect(
          container.querySelector('a[href="/practice/review"]') !== null,
        ).toBe(available === true);
        const review = container.querySelector(
          '[aria-label="Повторная попытка"]',
        );
        if (available !== false) {
          expect(review).not.toBeNull();
          expect(evidence.contains(review)).toBe(false);
          expect(
            review!.compareDocumentPosition(evidence) &
              Node.DOCUMENT_POSITION_FOLLOWING,
          ).toBeTruthy();
        } else {
          expect(review).toBeNull();
        }
        if (available === null)
          expect(
            container.querySelector('[role="alert"]')?.textContent,
          ).toContain("Не удалось проверить");
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    },
  );
});

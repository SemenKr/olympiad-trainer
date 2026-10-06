// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../app/progress/actions", () => ({
  readServerProgress: vi.fn(),
  readServerRecentPracticeEpisodes: vi.fn(),
  readServerPracticeJourney: vi.fn(async () => 70),
  readServerLearningPath: vi.fn(async () => []),
  readServerReviewAvailability: vi.fn(async () => false),
}));
vi.mock("./server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(async () => {}),
}));

import {
  readServerProgress,
  readServerRecentPracticeEpisodes,
  readServerPracticeJourney,
  readServerReviewAvailability,
} from "../../../app/progress/actions";
import { ProgressOverview } from "./progress-overview";

afterEach(() => {
  vi.clearAllMocks();
  document.body.replaceChildren();
});

describe("durable history on Progress reload", () => {
  it("loads recent activity again after remount and keeps capability wording", async () => {
    vi.mocked(readServerProgress).mockResolvedValue([
      {
        learnerLabel: "Как гарантировать результат",
        progressGroup: null,
        conclusion: "Вывод 1",
      },
      {
        learnerLabel: "Доказывать, что что-то невозможно",
        progressGroup: null,
        conclusion: "Вывод 2",
      },
      {
        learnerLabel: "Проверять все возможные случаи",
        progressGroup: null,
        conclusion: "Вывод 3",
      },
    ]);
    vi.mocked(readServerRecentPracticeEpisodes).mockResolvedValue([
      {
        mode: "transfer",
        completedAt: "2026-09-28T12:00:00.000Z",
        problems: [
          {
            problemTitle: "Возраст братьев",
            outcome: "no-valid-submissions",
            skipped: true,
            validSubmissionCount: 0,
            hintLevelsExposed: [],
            solutionExposed: false,
            checkpoint: null,
          },
        ],
      },
    ]);
    const container = document.createElement("div");
    document.body.append(container);
    for (let visit = 0; visit < 2; visit++) {
      const root = createRoot(container);
      await act(async () => {
        root.render(<ProgressOverview />);
      });
      expect(container.textContent).toContain("Недавняя работа");
      expect(container.textContent).toContain("Дополнительная задача");
      expect(container.textContent).toContain("Возраст братьев");
      expect(container.textContent).toContain("Путь практики");
      expect(container.textContent).toContain(
        "XP отмечает практику, а не уровень знаний.",
      );
      expect(
        container.textContent!.indexOf("Как гарантировать результат"),
      ).toBeLessThan(container.textContent!.indexOf("Путь практики"));
      expect(container.textContent!.indexOf("Путь практики")).toBeLessThan(
        container.textContent!.indexOf("Недавняя работа"),
      );
      expect(readServerPracticeJourney).toHaveBeenCalled();
      expect(container.textContent).toContain("Как гарантировать результат");
      await act(async () => {
        root.unmount();
      });
    }
    expect(readServerRecentPracticeEpisodes).toHaveBeenCalledTimes(2);
  });

  it("shows the existing retryable error when history read fails", async () => {
    vi.mocked(readServerProgress).mockResolvedValue([
      { learnerLabel: "A", progressGroup: null, conclusion: "B" },
      { learnerLabel: "C", progressGroup: null, conclusion: "D" },
      {
        learnerLabel: "Проверять все возможные случаи",
        progressGroup: null,
        conclusion: "E",
      },
    ]);
    vi.mocked(readServerRecentPracticeEpisodes).mockRejectedValue(
      new Error("Invalid history"),
    );
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () => {
      root.render(<ProgressOverview />);
    });
    expect(container.textContent).toContain("Не удалось загрузить прогресс");
    expect(container.textContent).toContain("Попробовать ещё раз");
    await act(async () => {
      root.unmount();
    });
  });
});

it("keeps capability/Journey/history available when the secondary Review read fails, then retries separately", async () => {
  vi.mocked(readServerProgress).mockResolvedValue([
    { learnerLabel: "A", progressGroup: null, conclusion: "Evidence A" },
    { learnerLabel: "B", progressGroup: null, conclusion: "Evidence B" },
    { learnerLabel: "C", progressGroup: null, conclusion: "Evidence C" },
  ]);
  vi.mocked(readServerRecentPracticeEpisodes).mockResolvedValue([
    {
      mode: "review",
      completedAt: "2026-10-04T00:00:00Z",
      problems: [
        {
          problemTitle: "Совпадающие места",
          outcome: "incorrect-only",
          skipped: false,
          validSubmissionCount: 1,
          hintLevelsExposed: [],
          solutionExposed: false,
          checkpoint: null,
        },
      ],
    },
  ]);
  vi.mocked(readServerReviewAvailability).mockRejectedValueOnce(
    Error("Review unavailable"),
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(<ProgressOverview />);
  });
  expect(container.textContent).toContain("Evidence A");
  expect(container.textContent).toContain("Путь практики");
  expect(container.textContent).toContain("Недавняя работа");
  expect(container.textContent).toContain("Повторная попытка");
  expect(container.textContent).toContain("Не удалось проверить");
  expect(container.textContent).not.toContain("Не удалось загрузить прогресс");
  vi.mocked(readServerReviewAvailability).mockResolvedValue(true);
  await act(async () => {
    container.querySelector<HTMLButtonElement>("button")!.click();
  });
  expect(container.querySelector('a[href="/practice/review"]')).not.toBeNull();
  expect(readServerProgress).toHaveBeenCalledTimes(1);
  expect(container.textContent!.indexOf("Решить знакомую задачу")).toBeLessThan(
    container.textContent!.indexOf("Evidence A"),
  );
  await act(async () => {
    root.unmount();
  });
});

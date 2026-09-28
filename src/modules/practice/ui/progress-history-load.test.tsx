// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../app/progress/actions", () => ({
  readServerProgress: vi.fn(),
  readServerRecentPracticeEpisodes: vi.fn(),
}));
vi.mock("./server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(async () => {}),
}));

import {
  readServerProgress,
  readServerRecentPracticeEpisodes,
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

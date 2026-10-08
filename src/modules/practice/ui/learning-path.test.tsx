import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../app/progress/actions", () => ({
  readServerLearningPath: vi.fn(),
}));
vi.mock("./server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(async () => {}),
}));
import { readServerLearningPath } from "../../../app/progress/actions";
import { LearningPathGuideLoader } from "./learning-path";
afterEach(() => {
  vi.resetAllMocks();
  document.body.replaceChildren();
});
beforeEach(installImmediatePracticeSessionLock);

describe("Learning Path guide", () => {
  it("keeps every Pack selectable, with distinct accessible names and the next suggested entry", async () => {
    vi.mocked(readServerLearningPath).mockResolvedValue(["pack-a"]);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<LearningPathGuideLoader />));
      const entries = [...container.querySelectorAll("ol > li")];
      expect(entries).toHaveLength(12);
      expect(entries[0].textContent).toContain("Есть завершённая тренировка");
      expect(entries[1].textContent).toContain("Следующий ориентир");
      expect(entries[1].querySelector("a")?.getAttribute("href")).toBe(
        "/practice/pack?pack=pack-j",
      );
      expect(entries.every((entry) => entry.querySelector("a[href]"))).toBe(
        true,
      );
      expect(
        new Set(
          entries.map((entry) =>
            entry.querySelector("a")?.getAttribute("aria-label"),
          ),
        ).size,
      ).toBe(12);
      expect(container.textContent).toContain(
        "Старые тренировки могли не получить такую отметку",
      );
    } finally {
      await act(async () => root.unmount());
    }
  });
  it("shows loading, preserves a retryable failure, then loads real records", async () => {
    let rejectRead!: (reason: Error) => void;
    vi.mocked(readServerLearningPath).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectRead = reject;
        }),
    );
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<LearningPathGuideLoader />));
      expect(container.querySelector('[role="status"]')?.textContent).toContain(
        "Загружаем",
      );
      await act(async () => rejectRead(new Error("offline")));
      expect(container.querySelector('[role="alert"]')?.textContent).toContain(
        "Все наборы ниже всё равно доступны",
      );
      expect(container.querySelector("ol")).toBeNull();
      vi.mocked(readServerLearningPath).mockResolvedValue(["pack-a", "pack-j"]);
      await act(async () => container.querySelector("button")!.click());
      expect(container.textContent).toContain(
        "Сохранённые завершения: 2 из 12",
      );
      expect(
        container
          .querySelector('[data-state="suggested"] a')
          ?.getAttribute("href"),
      ).toBe("/practice/pack?pack=pack-h");
    } finally {
      await act(async () => root.unmount());
    }
  });
});

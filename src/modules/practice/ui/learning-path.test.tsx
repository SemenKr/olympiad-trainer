// @vitest-environment jsdom
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
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
import {
  PRACTICE_PACKS,
  packHref,
} from "../application/completed-practice-episode";
import { LearningPathGuideLoader } from "./learning-path";

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  await installImmediatePracticeSessionLock();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  document.body.replaceChildren();
});

describe("Compact Learning Path summary", () => {
  it.each([
    {
      completed: ["pack-j", "pack-a", "pack-a"] as const,
      count: 2,
      next: "pack-h" as const,
    },
    { completed: [] as const, count: 0, next: "pack-a" as const },
    { completed: PRACTICE_PACKS.map((pack) => pack.id), count: 12, next: null },
  ])(
    "keeps factual completion count and editorial next step ($count records)",
    async ({ completed, count, next }) => {
      vi.mocked(readServerLearningPath).mockResolvedValue(completed);
      const container = document.createElement("div");
      const root = createRoot(container);
      try {
        await act(async () => root.render(<LearningPathGuideLoader />));
        expect(container.textContent).toContain(
          `Сохранённые завершения: ${count} из 12`,
        );
        expect(container.querySelectorAll("article, ol, ul")).toHaveLength(0);
        expect(container.textContent).toContain(
          "Старые тренировки могли не получить отметку",
        );
        expect(container.textContent).toContain("а не решённые задачи");
        if (next)
          expect(container.querySelector("a")?.getAttribute("href")).toBe(
            packHref(next),
          );
        else {
          expect(container.querySelector("a")).toBeNull();
          expect(container.textContent).toContain(
            "Можно выбрать любой набор снова",
          );
        }
      } finally {
        await act(async () => root.unmount());
      }
    },
  );
});

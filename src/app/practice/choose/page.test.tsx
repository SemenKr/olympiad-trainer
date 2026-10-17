// @vitest-environment jsdom
import { installImmediatePracticeSessionLock } from "../../../modules/practice/ui/practice-session-lock.test-helper";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import {
  packById,
  packHref,
  type PackId,
} from "../../../modules/practice/application/completed-practice-episode";
import { LEARNING_PATH_V1 } from "../../../modules/practice/application/learning-path";
vi.mock("../actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("../../../modules/practice/ui/practice-session-storage", () => ({
  readVerifiedPracticeSessionSnapshot: vi.fn(async () => ({ value: null })),
}));
vi.mock("../../../modules/practice/ui/server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(async () => {}),
}));
vi.mock("../../progress/actions", () => ({ readServerLearningPath: vi.fn() }));

import { readServerLearningPath } from "../../progress/actions";
import { readVerifiedPracticeSessionSnapshot } from "../../../modules/practice/ui/practice-session-storage";
import ChoosePracticePage from "./page";

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  await installImmediatePracticeSessionLock();
  vi.mocked(readVerifiedPracticeSessionSnapshot).mockResolvedValue({
    value: null,
    interpretation: null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
  document.body.replaceChildren();
});

function catalog(container: HTMLElement) {
  const cards = [...container.querySelectorAll("article")];
  expect(cards).toHaveLength(18);
  expect(cards.map((card) => card.getAttribute("aria-labelledby"))).toEqual(
    LEARNING_PATH_V1.map(({ packId }) => `${packId}-title`),
  );
  for (const [index, entry] of LEARNING_PATH_V1.entries()) {
    const pack = packById(entry.packId)!;
    const link = cards[index].querySelector("a")!;
    expect(link.getAttribute("href")).toBe(packHref(pack.id));
    expect(link.getAttribute("aria-label")).toBe(`Начать набор «${pack.name}»`);
    expect(cards[index].textContent).toContain(entry.description);
    expect(link.hasAttribute("aria-disabled")).toBe(false);
  }
  return cards;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Choose Practice stable catalog", () => {
  it("renders all eighteen Packs in editorial order before any reads resolve", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(<ChoosePracticePage />);
    catalog(container);
    expect(container.textContent).toContain("Загружаем отметки пути");
    expect(container.textContent).toContain(
      "Если тренировка уже начата, сначала заверши её",
    );
    expect(container.textContent).toContain("На главную");
    expect(container.querySelector('a[href="/simulation"]')).toBeNull();
  });

  it("loads the compact next step without inserting, moving or replacing Pack cards or keyboard focus", async () => {
    const read = deferred<readonly PackId[]>();
    vi.mocked(readServerLearningPath).mockReturnValue(read.promise);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<ChoosePracticePage />));
      const before = catalog(container);
      const summary = container.querySelector(
        '[aria-labelledby="learning-path-title"]',
      )!;
      const slots = [...summary.querySelectorAll("p, div")];
      const link = before[3].querySelector("a")!;
      link.focus();
      await act(async () => read.resolve(["pack-a"]));
      expect(catalog(container)).toEqual(before);
      expect(
        container.querySelector('[aria-labelledby="learning-path-title"]'),
      ).toBe(summary);
      expect([...summary.querySelectorAll("p, div")]).toEqual(slots);
      expect(document.activeElement).toBe(link);
      expect(summary.textContent).toContain("Сохранённые завершения: 1 из 18");
      expect(summary.querySelector("a")?.getAttribute("href")).toBe(
        packHref("pack-j"),
      );
      expect(summary.querySelector("a")?.getAttribute("aria-label")).toBe(
        `Выбрать набор «${packById("pack-j")!.name}»`,
      );
    } finally {
      await act(async () => root.unmount());
    }
  });

  it("keeps all Packs available through error, retry loading and recovery without false completion counts", async () => {
    const first = deferred<readonly PackId[]>();
    const retry = deferred<readonly PackId[]>();
    vi.mocked(readServerLearningPath)
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(retry.promise);
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<ChoosePracticePage />));
      const before = catalog(container);
      const summary = container.querySelector(
        '[aria-labelledby="learning-path-title"]',
      )!;
      await act(async () => first.reject(new Error("offline")));
      expect(catalog(container)).toEqual(before);
      expect(summary.querySelector('[role="alert"]')?.textContent).toContain(
        "Все наборы ниже всё равно доступны",
      );
      expect(summary.textContent).not.toContain("0 из 18");
      const retryButton = container.querySelector("button")!;
      retryButton.focus();
      await act(async () => retryButton.click());
      expect(document.activeElement).toBe(retryButton);
      expect(retryButton.disabled).toBe(true);
      expect(catalog(container)).toEqual(before);
      expect(summary.textContent).toContain("Загружаем отметки пути");
      await act(async () => retry.resolve(["pack-a", "pack-j"]));
      expect(catalog(container)).toEqual(before);
      expect(summary.textContent).toContain("Сохранённые завершения: 2 из 18");
      expect(summary.querySelector("a")?.getAttribute("href")).toBe(
        packHref("pack-h"),
      );
      expect(document.activeElement).toBe(summary.querySelector("h2"));
      expect(container.querySelectorAll("article")).toHaveLength(18);
    } finally {
      await act(async () => root.unmount());
    }
  });
});

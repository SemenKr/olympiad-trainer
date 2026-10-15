import { installImmediatePracticeSessionLock } from "../modules/practice/ui/practice-session-lock.test-helper";
// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("./practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("./progress/actions", () => ({
  readServerAdaptiveRecommendation: vi.fn(),
  readServerReviewAvailability: vi.fn(),
  readServerLearningPath: vi.fn(),
  readServerPracticeJourney: vi.fn(async () => 0),
}));
vi.mock("../modules/practice/ui/server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(),
}));
vi.mock("../modules/practice/ui/practice-session-storage", () => ({
  getStoredProblemTitle: () => "Совпадающие места",
  readVerifiedLatestCompletedResults: vi.fn(),
  readVerifiedPracticeSessionSnapshot: vi.fn(),
}));

import { HomePracticeAction } from "./home-practice-action";
import { readServerAdaptiveRecommendation } from "./progress/actions";
import { ensureServerProgressImported } from "../modules/practice/ui/server-progress-import";
import {
  readVerifiedLatestCompletedResults,
  readVerifiedPracticeSessionSnapshot,
} from "../modules/practice/ui/practice-session-storage";
import { startPractice } from "../modules/practice/application/practice-state";

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
  rawAnswer: "draft",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.mocked(readVerifiedPracticeSessionSnapshot).mockResolvedValue({
    value: unfinished,
    interpretation: null,
  });
});
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

beforeEach(installImmediatePracticeSessionLock);

it("reserves the initial action card with announced, non-interactive loading content", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<HomePracticeAction />);
  const action = container.querySelector('[class*="next-action"]')!;
  expect(action.querySelector('[role="status"]')?.textContent).toContain(
    "Проверяем, есть ли незаконченная тренировка",
  );
  expect(action.querySelector('[aria-hidden="true"]')).not.toBeNull();
  expect(action.querySelector("a, button, [tabindex]")).toBeNull();
});

it("replaces loading content with verified Resume without changing the surrounding action card", async () => {
  let resolve!: (
    value: Awaited<ReturnType<typeof readVerifiedPracticeSessionSnapshot>>,
  ) => void;
  vi.mocked(readVerifiedPracticeSessionSnapshot).mockImplementationOnce(
    () => new Promise((done) => (resolve = done)),
  );
  vi.mocked(readVerifiedLatestCompletedResults).mockResolvedValue({
    value: null,
    interpretation: null,
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<HomePracticeAction />));
    const action = container.querySelector('[class*="next-action"]')!;
    expect(action.querySelector('[role="status"]')).not.toBeNull();
    expect(action.querySelector("a, button")).toBeNull();
    await act(async () => resolve({ value: unfinished, interpretation: null }));
    const loadedAction = container.querySelector('[class*="next-action"]')!;
    expect(loadedAction.className).toBe(action.className);
    expect(loadedAction.querySelector('[role="status"]')).toBeNull();
    expect(
      loadedAction.querySelector('a[href="/practice"]')?.textContent,
    ).toContain("Продолжить тренировку");
  } finally {
    await act(async () => root.unmount());
  }
});

it("restores the same loading footprint during a failed verification retry", async () => {
  let resolve!: (
    value: Awaited<ReturnType<typeof readVerifiedPracticeSessionSnapshot>>,
  ) => void;
  vi.mocked(readVerifiedPracticeSessionSnapshot)
    .mockRejectedValueOnce(Error("unavailable"))
    .mockImplementationOnce(() => new Promise((done) => (resolve = done)));
  vi.mocked(readVerifiedLatestCompletedResults).mockResolvedValue({
    value: null,
    interpretation: null,
  });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<HomePracticeAction />));
    const action = container.querySelector('[class*="next-action"]')!;
    expect(action.querySelector('[role="alert"]')?.textContent).toContain(
      "Не удалось проверить сохранённую тренировку",
    );
    await act(async () =>
      action.querySelector<HTMLButtonElement>("button")!.click(),
    );
    const retryAction = container.querySelector('[class*="next-action"]')!;
    expect(retryAction.className).toBe(action.className);
    expect(retryAction.querySelector('[role="status"]')).not.toBeNull();
    expect(retryAction.querySelector("a, button")).toBeNull();
    await act(async () => resolve({ value: unfinished, interpretation: null }));
    expect(container.textContent).toContain("Продолжить тренировку");
  } finally {
    await act(async () => root.unmount());
  }
});

it("keeps Resume usable while the secondary latest Summary verification is pending", async () => {
  let resolve!: (
    value: Awaited<ReturnType<typeof readVerifiedLatestCompletedResults>>,
  ) => void;
  vi.mocked(readVerifiedLatestCompletedResults).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<HomePracticeAction />));
    expect(container.textContent).toContain("Продолжить тренировку");
    expect(container.querySelector('a[href="/practice"]')).not.toBeNull();
    expect(readServerAdaptiveRecommendation).not.toHaveBeenCalled();
    expect(ensureServerProgressImported).not.toHaveBeenCalled();
    await act(async () => resolve({ value: null, interpretation: null }));
    expect(container.textContent).toContain("Продолжить тренировку");
  } finally {
    await act(async () => root.unmount());
  }
});

it("reports a secondary Summary failure without hiding Resume, then retries", async () => {
  vi.mocked(readVerifiedLatestCompletedResults)
    .mockRejectedValueOnce(Error("verification unavailable"))
    .mockResolvedValue({ value: null, interpretation: null });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<HomePracticeAction />));
    expect(container.textContent).toContain("Продолжить тренировку");
    expect(container.textContent).toContain(
      "Не удалось проверить сохранённые итоги.",
    );
    expect(container.textContent).not.toContain("Начать тренировку");
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button")!.click(),
    );
    expect(container.textContent).toContain("Продолжить тренировку");
    expect(container.textContent).not.toContain(
      "Не удалось проверить сохранённые итоги.",
    );
    expect(ensureServerProgressImported).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it("fails closed when unfinished verification fails instead of offering a new session", async () => {
  vi.mocked(readVerifiedPracticeSessionSnapshot).mockRejectedValueOnce(
    Error("storage unavailable"),
  );
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<HomePracticeAction />));
    expect(container.textContent).toContain(
      "Не удалось проверить сохранённую тренировку.",
    );
    expect(container.textContent).not.toContain("Начать тренировку");
    expect(readServerAdaptiveRecommendation).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});

it.each(["success", "failure"])(
  "retains verified Resume throughout a deferred secondary Summary retry (%s)",
  async (outcome) => {
    let resolve!: (
      value: Awaited<ReturnType<typeof readVerifiedLatestCompletedResults>>,
    ) => void;
    let reject!: (error: Error) => void;
    vi.mocked(readVerifiedLatestCompletedResults)
      .mockRejectedValueOnce(Error("Summary unavailable"))
      .mockImplementationOnce(
        () =>
          new Promise((done, fail) => {
            resolve = done;
            reject = fail;
          }),
      );
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    try {
      await act(async () => root.render(<HomePracticeAction />));
      vi.mocked(readVerifiedPracticeSessionSnapshot).mockRejectedValue(
        Error("Unfinished verification unavailable now"),
      );
      await act(async () =>
        container.querySelector<HTMLButtonElement>("button")!.click(),
      );
      expect(container.textContent).toContain("Продолжить тренировку");
      expect(
        container.querySelector<HTMLButtonElement>("button")!.disabled,
      ).toBe(true);
      expect(readVerifiedPracticeSessionSnapshot).toHaveBeenCalledOnce();
      await act(async () => {
        if (outcome === "success")
          resolve({ value: null, interpretation: null });
        else reject(Error("Summary still unavailable"));
      });
      expect(container.textContent).toContain("Продолжить тренировку");
      expect(readVerifiedPracticeSessionSnapshot).toHaveBeenCalledOnce();
      expect(container.textContent).not.toContain(
        "Не удалось проверить сохранённую тренировку.",
      );
      if (outcome === "failure")
        expect(container.textContent).toContain(
          "Не удалось проверить сохранённые итоги.",
        );
      else
        expect(container.textContent).not.toContain(
          "Не удалось проверить сохранённые итоги.",
        );
    } finally {
      await act(async () => root.unmount());
    }
  },
);

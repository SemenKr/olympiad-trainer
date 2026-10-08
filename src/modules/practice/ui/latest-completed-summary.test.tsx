import { installTestLocalOwner } from "../../learner/local-ownership.test-helper";
// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("../../../app/progress/actions", () => ({
  readServerPracticeJourneyFinish: vi.fn(async () => null),
  readServerLearningPath: vi.fn(async () => []),
}));

import {
  LatestCompletedSummary,
  LatestCompletedSummaryContent,
} from "./latest-completed-summary";

describe("latest completed Summary route", () => {
  it("shows a safe Home link when the snapshot is missing or invalid", () => {
    const markup = renderToStaticMarkup(
      <LatestCompletedSummaryContent results={null} />,
    );

    expect(markup).toContain("Итоги тренировки недоступны");
    expect(markup).toContain("На главную");
    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("Тренировка завершена");
  });

  it("reuses factual SessionSummary for a valid early Finish", () => {
    const markup = renderToStaticMarkup(
      <LatestCompletedSummaryContent
        results={[
          {
            problemId: "coinciding-seats",
            problemTitle: "Совпадающие места",
            summary: {
              outcome: "no-valid-submissions",
              validSubmissionCount: 0,
              hintExposures: [],
              solutionExposure: null,
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("Тренировка завершена");
    expect(markup).toContain("не было проверенного ответа");
    expect(markup).toContain("На главную");
  });
});

import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  readServerLearningPath,
  readServerPracticeJourneyFinish,
} from "../../../app/progress/actions";
import {
  completePracticeSession,
  createPracticeSessionSnapshot,
  saveNoNextPracticeSessionSnapshot,
  saveLatestCompletedResults,
  readVerifiedLatestCompletedResults,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
} from "./practice-session-storage";
import { createShortNumericAnswerState } from "./short-numeric-answer-state";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import type { PracticeSessionResult } from "./fixed-practice-session-state";

const sessionA = "00000000-0000-4000-8000-000000000001";
const sessionB = "00000000-0000-4000-8000-000000000002";
const problemMetadata = [
  ["coinciding-seats", "Совпадающие места"],
  ["guaranteed-sock-pair", "Носки в пакете"],
  ["table-impossible-sums", "Невозможные суммы"],
] as const;

function completedResults(count: number): PracticeSessionResult[] {
  return problemMetadata.map(([problemId, problemTitle], index) => ({
    problemId,
    problemTitle,
    summary: {
      outcome: index === 0 ? "incorrect-only" : "no-valid-submissions",
      validSubmissionCount: index === 0 ? count : 0,
      hintExposures: [],
      solutionExposure: null,
    },
    taskOutcome: "skipped",
  }));
}

async function finish(sessionId: string, count: number) {
  const results = completedResults(count);
  expect(
    await createPracticeSessionSnapshot(
      {
        sessionId,
        activeProblemIndex: 0,
        completedResults: [],
      },
      createShortNumericAnswerState(),
    ),
  ).toBe(true);
  const session = {
    sessionId,
    status: "no-next" as const,
    completedResults: results,
  };
  expect(await saveNoNextPracticeSessionSnapshot(session)).toBe(true);
  expect(
    await completePracticeSession(
      session,
      null,
      results,
      undefined,
      async () => null,
    ),
  ).toBe(true);
  return results;
}

beforeEach(async () => {
  await installImmediatePracticeSessionLock();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  await installTestLocalOwner(window.localStorage);
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/practice/summary");
});
afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

async function renderMountedSummary() {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<LatestCompletedSummary />));
  const text = container.textContent;
  await act(async () => root.unmount());
  return text;
}

describe("persisted Summary session identity", () => {
  it.each([sessionA, sessionB])(
    "uses latest B's results and reward when opened with session %s",
    async (urlSession) => {
      await finish(sessionA, 1);
      const resultsB = await finish(sessionB, 3);
      expect(
        JSON.parse(
          localStorage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!,
        ),
      ).toEqual({ sessionId: sessionB, results: resultsB });
      const verified = await readVerifiedLatestCompletedResults(vi.fn());
      expect(verified.value).toEqual(resultsB);
      expect(verified.sessionId).toBe(sessionB);
      vi.mocked(readServerPracticeJourneyFinish).mockImplementation(
        async (id) =>
          id === sessionB
            ? {
                earnedXp: 10,
                totalXp: 50,
                newlyReachedMilestone: "50 XP практики",
              }
            : {
                earnedXp: 10,
                totalXp: 10,
                newlyReachedMilestone: "Первый шаг",
              },
      );
      window.history.replaceState(
        null,
        "",
        `/practice/summary?session=${urlSession}`,
      );
      for (let reload = 0; reload < 2; reload++) {
        const text = await renderMountedSummary();
        expect(text).toContain("Всего 50 XP");
        expect(text).toContain("Новая медаль");
        expect(text).toContain("Начал разгон");
        expect(text).not.toContain("Первый шаг");
      }
      expect(readServerPracticeJourneyFinish).toHaveBeenCalledTimes(2);
      expect(readServerLearningPath).not.toHaveBeenCalled();
      expect(vi.mocked(readServerPracticeJourneyFinish).mock.calls).toEqual([
        [sessionB, expect.objectContaining({ generation: "0" })],
        [sessionB, expect.objectContaining({ generation: "0" })],
      ]);
    },
  );

  it("renders a legacy Summary without using a URL's reward identity", async () => {
    const results = completedResults(1);
    expect(saveLatestCompletedResults(results)).toBe(true);
    window.history.replaceState(
      null,
      "",
      `/practice/summary?session=${sessionA}`,
    );
    const text = await renderMountedSummary();
    expect(text).toContain("Тренировка завершена");
    expect(text).not.toContain("XP");
    expect(readServerPracticeJourneyFinish).not.toHaveBeenCalled();
    expect(readServerLearningPath).not.toHaveBeenCalled();
  });

  it("rejects an invalid persisted identity instead of falling back to the URL", async () => {
    localStorage.setItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      JSON.stringify({ sessionId: "invalid", results: completedResults(1) }),
    );
    window.history.replaceState(
      null,
      "",
      `/practice/summary?session=${sessionA}`,
    );
    expect(await renderMountedSummary()).toContain(
      "Итоги тренировки недоступны",
    );
    expect(readServerPracticeJourneyFinish).not.toHaveBeenCalled();
  });
});

it("keeps completed bytes and shows a retryable error when Summary storage cannot be read", async () => {
  const results = await finish(sessionA, 1);
  const before = localStorage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY);
  const read = Storage.prototype.getItem;
  let failOnce = true;
  const spy = vi
    .spyOn(Storage.prototype, "getItem")
    .mockImplementation(function (this: Storage, key) {
      if (key.endsWith(":practice-latest-completed") && failOnce) {
        failOnce = false;
        throw Error("Storage unavailable");
      }
      return read.call(this, key);
    });
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await act(async () => root.render(<LatestCompletedSummary />));
    expect(container.textContent).toContain(
      "Не удалось проверить сохранённые итоги.",
    );
    expect(container.textContent).not.toContain("Тренировка завершена");
    expect(container.textContent).not.toContain("Итоги тренировки недоступны");
    expect(localStorage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      before,
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button")!.click(),
    );
    expect(container.textContent).toContain("Тренировка завершена");
    expect(
      await readVerifiedLatestCompletedResults(async () => ({ valid: false })),
    ).toMatchObject({ value: results });
  } finally {
    spy.mockRestore();
    await act(async () => root.unmount());
  }
});

it("offers Path continuation for a validated early Pack Summary only after a durable marker read", async () => {
  const results = [
    {
      problemId: "granddaughters-first",
      problemTitle: "Кто пришёл первым?",
      summary: {
        outcome: "no-valid-submissions" as const,
        validSubmissionCount: 0,
        hintExposures: [],
        solutionExposure: null,
      },
    },
  ];
  expect(saveLatestCompletedResults(results, undefined, sessionA)).toBe(true);
  vi.mocked(readServerPracticeJourneyFinish).mockResolvedValueOnce(null);
  vi.mocked(readServerLearningPath).mockResolvedValueOnce(["pack-a"]);
  const text = await renderMountedSummary();
  expect(text).toContain("Продолжить путь");
  expect(text).toContain("не было проверенного ответа");
  expect(text).not.toContain("Вырезанная фигура");
  expect(readServerLearningPath).toHaveBeenCalledOnce();
});

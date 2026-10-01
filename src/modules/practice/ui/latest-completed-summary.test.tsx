// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("../../../app/progress/actions", () => ({
  readServerPracticeJourneyFinish: vi.fn(async () => null),
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
import { readServerPracticeJourneyFinish } from "../../../app/progress/actions";
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

beforeEach(() => {
  installImmediatePracticeSessionLock();
  localStorage.clear();
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
        expect(text).toContain("50 XP практики");
        expect(text).not.toContain("Первый шаг");
      }
      expect(readServerPracticeJourneyFinish).toHaveBeenCalledTimes(2);
      expect(vi.mocked(readServerPracticeJourneyFinish).mock.calls).toEqual([
        [sessionB],
        [sessionB],
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

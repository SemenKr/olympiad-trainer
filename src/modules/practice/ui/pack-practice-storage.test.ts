import { beforeEach, describe, expect, it } from "vitest";

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import { PACK_A_PROBLEM_IDS } from "../application/completed-practice-episode";
import {
  advancePracticeSession,
  skipFinalPracticeSession,
  startPackPracticeSession,
} from "./fixed-practice-session-state";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import {
  completePracticeSession,
  createPracticeSessionSnapshot,
  getStoredProblemTitle,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  readVerifiedLatestCompletedResults,
  restoreAnswerState,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  type ServerPracticeFinishPayload,
  validatePracticeSessionSnapshot,
} from "./practice-session-storage";

beforeEach(installImmediatePracticeSessionLock);

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const titles = [
  "Кто пришёл первым?",
  "Вырезанная фигура",
  "Сколько прямоугольников?",
];
const emptySummary = getPracticeSummary(finishPractice(startPractice()));
const result = (index: number, summary = emptySummary, skipped = false) => ({
  problemId: PACK_A_PROBLEM_IDS[index],
  problemTitle: titles[index],
  summary,
  ...(skipped ? { taskOutcome: "skipped" as const } : {}),
});

describe("Pack A Practice snapshot and Finish", () => {
  it("restores exact Pack A order and choice state, then retries immutable Finish without evidence", async () => {
    const store = storage();
    const first = startPackPracticeSession();
    const initial = {
      selectedOptionIds: [],
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await createPracticeSessionSnapshot(first, initial, store)).toBe(
      true,
    );
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      mode: "pack",
      problemIds: PACK_A_PROBLEM_IDS,
      activeProblemIndex: 0,
    });
    const choicePractice = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: '["bella"]',
    });
    const choice = {
      selectedOptionIds: ["bella"],
      status: "correct" as const,
      practice: choicePractice,
    };
    expect(await savePracticeSessionSnapshot(first, choice, store)).toBe(true);
    const restored = await readPracticeSessionSnapshot(store);
    expect(
      restored && !("status" in restored) && restoreAnswerState(restored),
    ).toMatchObject({
      selectedOptionIds: ["bella"],
      status: "correct",
    });
    expect(
      restored && !("status" in restored) && getStoredProblemTitle(restored),
    ).toBe(titles[0]);

    const firstResult = result(
      0,
      getPracticeSummary(finishPractice(choicePractice)),
    );
    const second = advancePracticeSession(first, firstResult);
    expect(second).not.toBeNull();
    if (!second) return;
    const numeric = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await savePracticeSessionSnapshot(second, numeric, store)).toBe(
      true,
    );
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      activeProblemIndex: 1,
    });
    const third = advancePracticeSession(second, result(1, emptySummary, true));
    expect(third).not.toBeNull();
    if (!third) return;
    const finalPractice = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: "15",
    });
    const finalAnswer = {
      rawAnswer: "15",
      status: "correct" as const,
      practice: finalPractice,
    };
    expect(await savePracticeSessionSnapshot(third, finalAnswer, store)).toBe(
      true,
    );
    const results = [
      ...third.completedResults,
      result(2, getPracticeSummary(finishPractice(finalPractice))),
    ];
    const requests: ServerPracticeFinishPayload[] = [];
    expect(
      await completePracticeSession(
        third,
        finalAnswer,
        results,
        store,
        async (request) => {
          requests.push(request);
          throw new Error("response lost");
        },
      ),
    ).toBe(false);
    expect(requests[0]).toMatchObject({
      episodeMode: "pack",
      contributions: [],
      episodeFacts: {
        problems: PACK_A_PROBLEM_IDS.map((problemId) => ({
          problemId,
          checkpoint: null,
        })),
      },
    });
    expect(requests[0]).not.toHaveProperty("adaptiveFacts");
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      mode: "pack",
      activeProblemIndex: 2,
    });
    expect(
      await completePracticeSession(
        third,
        finalAnswer,
        results,
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe(true);
    expect(requests[1]).toEqual(requests[0]);
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(
      JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!),
    ).toEqual(results);
    expect(
      (
        await readVerifiedLatestCompletedResults(
          async () => ({ valid: false }),
          store,
        )
      ).value,
    ).toEqual(results);
  });

  it("keeps final skip as a Pack A no-next snapshot until Finish", async () => {
    const store = storage();
    const first = startPackPracticeSession();
    expect(
      await createPracticeSessionSnapshot(
        first,
        {
          selectedOptionIds: [],
          status: "typing",
          practice: startPractice(),
        },
        store,
      ),
    ).toBe(true);
    const second = advancePracticeSession(
      first,
      result(0, emptySummary, true),
    )!;
    expect(
      await savePracticeSessionSnapshot(
        second,
        {
          rawAnswer: "",
          status: "typing",
          practice: startPractice(),
        },
        store,
      ),
    ).toBe(true);
    const third = advancePracticeSession(
      second,
      result(1, emptySummary, true),
    )!;
    expect(
      await savePracticeSessionSnapshot(
        third,
        {
          rawAnswer: "",
          status: "typing",
          practice: startPractice(),
        },
        store,
      ),
    ).toBe(true);
    const noNext = skipFinalPracticeSession(
      third,
      result(2, emptySummary, true),
    );
    expect(noNext).not.toBeNull();
    if (!noNext) return;
    expect(await saveNoNextPracticeSessionSnapshot(noNext, store)).toBe(true);
    expect(
      validatePracticeSessionSnapshot(
        JSON.parse(store.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
      ),
    ).toEqual(noNext);
    expect(
      await completePracticeSession(
        noNext,
        null,
        noNext.completedResults,
        store,
        async (request) => {
          expect(request.episodeMode).toBe("pack");
          expect(request.contributions).toEqual([]);
        },
      ),
    ).toBe(true);
  });
});

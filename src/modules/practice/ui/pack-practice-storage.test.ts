import { beforeEach, describe, expect, it } from "vitest";

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import {
  PACK_A_PROBLEM_IDS,
  PACK_B_PROBLEM_IDS,
  PACK_C_PROBLEM_IDS,
} from "../application/completed-practice-episode";
import { getPracticeProgressContribution } from "../application/practice-progress-evidence";
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
  validateLatestCompletedResults,
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
const packBTitles = [
  "Одновременно в город",
  "Рыцари и лжецы",
  "Хвастливый рыбак",
];
const packBResult = (
  index: number,
  summary = emptySummary,
  skipped = false,
) => ({
  problemId: PACK_B_PROBLEM_IDS[index],
  problemTitle: packBTitles[index],
  summary,
  ...(skipped ? { taskOutcome: "skipped" as const } : {}),
});
const packCTitles = [
  "Самое большое число",
  "Три загадочных числа",
  "Рейсы между городами",
];
const packCResult = (
  index: number,
  summary = emptySummary,
  skipped = false,
) => ({
  problemId: PACK_C_PROBLEM_IDS[index],
  problemTitle: packCTitles[index],
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
    ).toEqual({ sessionId: third.sessionId, results });
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

describe("Pack B Practice snapshot and Finish", () => {
  it("restores the exact active tuple and choice, then retries Finish without evidence", async () => {
    const store = storage();
    const first = startPackPracticeSession("pack-b");
    expect(
      await createPracticeSessionSnapshot(
        first,
        {
          rawAnswer: "",
          status: "typing",
          practice: startPractice(),
        },
        store,
      ),
    ).toBe(true);
    const initial = await readPracticeSessionSnapshot(store);
    expect(initial).toMatchObject({
      mode: "pack",
      problemIds: PACK_B_PROBLEM_IDS,
    });
    expect(initial).not.toHaveProperty("packId");
    const second = advancePracticeSession(
      first,
      packBResult(0, emptySummary, true),
    )!;
    const choice = {
      selectedOptionIds: ["count-0"],
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await savePracticeSessionSnapshot(second, choice, store)).toBe(true);
    const restored = await readPracticeSessionSnapshot(store);
    expect(restored).toMatchObject({
      problemIds: PACK_B_PROBLEM_IDS,
      activeProblemIndex: 1,
      selectedOptionIds: ["count-0"],
    });
    expect(
      restored && !("status" in restored) && getStoredProblemTitle(restored),
    ).toBe("Рыцари и лжецы");
    expect(
      restored && !("status" in restored) && restoreAnswerState(restored),
    ).toMatchObject({
      selectedOptionIds: ["count-0"],
    });
    for (const ids of [
      [...PACK_B_PROBLEM_IDS].reverse(),
      [PACK_B_PROBLEM_IDS[0], PACK_A_PROBLEM_IDS[1], PACK_B_PROBLEM_IDS[2]],
      PACK_B_PROBLEM_IDS.slice(0, 2),
    ]) {
      expect(
        validatePracticeSessionSnapshot({ ...restored, problemIds: ids }),
      ).toBeNull();
    }
    const choicePractice = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: '["count-0","count-5"]',
    });
    expect(
      await savePracticeSessionSnapshot(
        second,
        {
          selectedOptionIds: ["count-0", "count-5"],
          status: "correct",
          practice: choicePractice,
        },
        store,
      ),
    ).toBe(true);
    const third = advancePracticeSession(
      second,
      packBResult(1, getPracticeSummary(finishPractice(choicePractice))),
    )!;
    const finalPractice = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: "8",
    });
    const finalAnswer = {
      rawAnswer: "8",
      status: "correct" as const,
      practice: finalPractice,
    };
    expect(await savePracticeSessionSnapshot(third, finalAnswer, store)).toBe(
      true,
    );
    const results = [
      ...third.completedResults,
      packBResult(2, getPracticeSummary(finishPractice(finalPractice))),
    ];
    expect(validateLatestCompletedResults(results)).toEqual(results);
    expect(results.map(getPracticeProgressContribution)).toEqual([
      null,
      null,
      null,
    ]);
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
        problems: PACK_B_PROBLEM_IDS.map((problemId) => ({
          problemId,
          checkpoint: null,
        })),
      },
    });
    expect(requests[0]).not.toHaveProperty("adaptiveFacts");
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
      (
        await readVerifiedLatestCompletedResults(
          async () => ({ valid: false }),
          store,
        )
      ).value,
    ).toEqual(results);
  });

  it("keeps the final skip in a Pack B no-next snapshot", async () => {
    const store = storage();
    const first = startPackPracticeSession("pack-b");
    expect(
      await createPracticeSessionSnapshot(
        first,
        {
          rawAnswer: "",
          status: "typing",
          practice: startPractice(),
        },
        store,
      ),
    ).toBe(true);
    const second = advancePracticeSession(
      first,
      packBResult(0, emptySummary, true),
    )!;
    expect(
      await savePracticeSessionSnapshot(
        second,
        {
          selectedOptionIds: [],
          status: "typing",
          practice: startPractice(),
        },
        store,
      ),
    ).toBe(true);
    const third = advancePracticeSession(
      second,
      packBResult(1, emptySummary, true),
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
      packBResult(2, emptySummary, true),
    )!;
    expect(await saveNoNextPracticeSessionSnapshot(noNext, store)).toBe(true);
    expect(await readPracticeSessionSnapshot(store)).toEqual(noNext);
    expect(
      await completePracticeSession(
        noNext,
        null,
        noNext.completedResults,
        store,
        async (request) => {
          expect(request.episodeMode).toBe("pack");
          expect(request.contributions).toEqual([]);
          expect(request).not.toHaveProperty("adaptiveFacts");
        },
      ),
    ).toBe(true);
  });
});

describe("Pack C Practice snapshot and Finish", () => {
  it("restores its exact active problem and retries immutable Finish without contributions", async () => {
    const store = storage();
    const first = startPackPracticeSession("pack-c");
    const blank = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await createPracticeSessionSnapshot(first, blank, store)).toBe(true);
    const initial = await readPracticeSessionSnapshot(store);
    expect(initial).toMatchObject({
      mode: "pack",
      problemIds: PACK_C_PROBLEM_IDS,
    });
    expect(initial).not.toHaveProperty("packId");
    const second = advancePracticeSession(
      first,
      packCResult(0, emptySummary, true),
    )!;
    const answer = {
      rawAnswer: "24",
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await savePracticeSessionSnapshot(second, answer, store)).toBe(true);
    const restored = await readPracticeSessionSnapshot(store);
    expect(restored).toMatchObject({
      problemIds: PACK_C_PROBLEM_IDS,
      activeProblemIndex: 1,
      rawAnswer: "24",
    });
    expect(
      restored && !("status" in restored) && getStoredProblemTitle(restored),
    ).toBe("Три загадочных числа");
    for (const ids of [
      [...PACK_C_PROBLEM_IDS].reverse(),
      [PACK_C_PROBLEM_IDS[0], PACK_B_PROBLEM_IDS[1], PACK_C_PROBLEM_IDS[2]],
      [PACK_C_PROBLEM_IDS[0], PACK_C_PROBLEM_IDS[1], "unknown"],
    ])
      expect(
        validatePracticeSessionSnapshot({ ...restored, problemIds: ids }),
      ).toBeNull();
    const third = advancePracticeSession(
      second,
      packCResult(1, emptySummary, true),
    )!;
    const finalPractice = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: "81",
    });
    const finalAnswer = {
      rawAnswer: "81",
      status: "correct" as const,
      practice: finalPractice,
    };
    expect(await savePracticeSessionSnapshot(third, finalAnswer, store)).toBe(
      true,
    );
    const results = [
      ...third.completedResults,
      packCResult(2, getPracticeSummary(finishPractice(finalPractice))),
    ];
    expect(validateLatestCompletedResults(results)).toEqual(results);
    expect(results.map(getPracticeProgressContribution)).toEqual([
      null,
      null,
      null,
    ]);
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
        problems: PACK_C_PROBLEM_IDS.map((problemId) => ({
          problemId,
          checkpoint: null,
        })),
      },
    });
    expect(requests[0]).not.toHaveProperty("adaptiveFacts");
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
      (
        await readVerifiedLatestCompletedResults(
          async () => ({ valid: false }),
          store,
        )
      ).value,
    ).toEqual(results);
  });

  it("finishes after a final skip with no next problem", async () => {
    const store = storage();
    const first = startPackPracticeSession("pack-c");
    const blank = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await createPracticeSessionSnapshot(first, blank, store)).toBe(true);
    const second = advancePracticeSession(
      first,
      packCResult(0, emptySummary, true),
    )!;
    expect(await savePracticeSessionSnapshot(second, blank, store)).toBe(true);
    const third = advancePracticeSession(
      second,
      packCResult(1, emptySummary, true),
    )!;
    expect(await savePracticeSessionSnapshot(third, blank, store)).toBe(true);
    const noNext = skipFinalPracticeSession(
      third,
      packCResult(2, emptySummary, true),
    )!;
    expect(await saveNoNextPracticeSessionSnapshot(noNext, store)).toBe(true);
    expect(await readPracticeSessionSnapshot(store)).toEqual(noNext);
    expect(
      await completePracticeSession(
        noNext,
        null,
        noNext.completedResults,
        store,
        async (request) => {
          expect(request.episodeMode).toBe("pack");
          expect(request.contributions).toEqual([]);
          expect(request).not.toHaveProperty("adaptiveFacts");
        },
      ),
    ).toBe(true);
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/app/practice/actions", () => ({
  revealPracticeHint: vi.fn(),
  revealPracticeSolution: vi.fn(),
  submitPracticeAnswer: vi.fn(),
}));

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import { createShortNumericAnswerState } from "./short-numeric-answer-state";
import {
  completePracticeSession,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  readLatestCompletedResults,
  readPracticeSessionSnapshot,
  saveLatestCompletedResults,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  validateLatestCompletedResults,
} from "./practice-session-storage";
import {
  finishPracticeSessionAndNavigate,
  savePracticeSessionWhileActive,
} from "./practice-session";
import {
  advanceTwoProblemSession,
  startTwoProblemSession,
  type NoNextTwoProblemSessionState,
  type PracticeSessionResult,
} from "./two-problem-session-state";

const problems = [
  { id: "coinciding-seats", title: "Совпадающие места" },
  { id: "guaranteed-sock-pair", title: "Носки в пакете" },
] as const;

function memoryStorage(): Storage {
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

function result(
  index: 0 | 1,
  outcome: "no-valid-submissions" | "incorrect-only" | "eventually-correct",
  skipped = false,
): PracticeSessionResult {
  const practice =
    outcome === "no-valid-submissions"
      ? startPractice()
      : recordAnswerResult(startPractice(), {
          status: outcome === "eventually-correct" ? "correct" : "incorrect",
          normalizedAnswer: "17",
        });
  return {
    problemId: problems[index].id,
    problemTitle: problems[index].title,
    summary: getPracticeSummary(finishPractice(practice)),
    ...(skipped ? { taskOutcome: "skipped" as const } : {}),
  };
}

describe("latest completed Practice storage", () => {
  it("latches after successful Finish before navigation can write or Pause", () => {
    const storage = memoryStorage();
    const session = startTwoProblemSession();
    const answer = createShortNumericAnswerState();
    const results = [result(0, "no-valid-submissions")];
    const completionLatch = { current: false };
    savePracticeSessionSnapshot(session, answer, storage);
    let navigations = 0;

    expect(
      finishPracticeSessionAndNavigate(
        completionLatch,
        session,
        answer,
        results,
        () => {
          navigations += 1;
          expect(completionLatch.current).toBe(true);
          expect(readPracticeSessionSnapshot(storage)).toBeNull();
          expect(
            savePracticeSessionWhileActive(
              completionLatch,
              session,
              answer,
              storage,
            ),
          ).toBe(false);
          const pause = () => {
            if (
              !savePracticeSessionWhileActive(
                completionLatch,
                session,
                answer,
                storage,
              )
            )
              return false;
            navigations += 1;
            return true;
          };
          expect(pause()).toBe(false);
        },
        storage,
      ),
    ).toBe(true);

    expect(navigations).toBe(1);
    expect(readPracticeSessionSnapshot(storage)).toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(results);
  });

  it("does not latch a failed Finish and permits a successful retry", () => {
    const storage = memoryStorage();
    const session = startTwoProblemSession();
    const answer = createShortNumericAnswerState();
    const results = [result(0, "incorrect-only")];
    const completionLatch = { current: false };
    let navigations = 0;
    savePracticeSessionSnapshot(session, answer, storage);
    const failedWrite = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key === PRACTICE_LATEST_COMPLETED_STORAGE_KEY)
          throw new Error("QuotaExceededError");
        storage.setItem(key, value);
      },
    };

    expect(
      finishPracticeSessionAndNavigate(
        completionLatch,
        session,
        answer,
        results,
        () => {
          navigations += 1;
        },
        failedWrite,
      ),
    ).toBe(false);
    expect(completionLatch.current).toBe(false);
    expect(navigations).toBe(0);
    expect(readPracticeSessionSnapshot(storage)).not.toBeNull();
    expect(
      savePracticeSessionWhileActive(completionLatch, session, answer, storage),
    ).toBe(true);
    expect(
      finishPracticeSessionAndNavigate(
        completionLatch,
        session,
        answer,
        results,
        () => {
          navigations += 1;
        },
        storage,
      ),
    ).toBe(true);
    expect(navigations).toBe(1);
  });

  it("finishes into a separate factual snapshot and survives another read", () => {
    const storage = memoryStorage();
    const session = startTwoProblemSession();
    const answer = createShortNumericAnswerState();
    const results = [result(0, "no-valid-submissions")];
    savePracticeSessionSnapshot(session, answer, storage);

    expect(completePracticeSession(session, answer, results, storage)).toBe(
      true,
    );
    expect(readPracticeSessionSnapshot(storage)).toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(results);
    expect(
      JSON.parse(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!),
    ).toEqual(results);
    expect(
      storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
    ).not.toContain("answer");
    expect(
      storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
    ).not.toContain("text");
    expect(
      storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
    ).not.toContain("assessment");
  });

  it("preserves Skip and mixed ordered results, then replaces the latest completion", () => {
    const storage = memoryStorage();
    const skipped = result(0, "incorrect-only", true);
    const session = advanceTwoProblemSession(
      startTwoProblemSession(),
      skipped,
    )!;
    const answer = createShortNumericAnswerState();
    const mixed = [skipped, result(1, "eventually-correct")];
    savePracticeSessionSnapshot(session, answer, storage);

    expect(completePracticeSession(session, answer, mixed, storage)).toBe(true);
    expect(readLatestCompletedResults(storage)).toEqual(mixed);

    const newSession = startTwoProblemSession();
    savePracticeSessionSnapshot(newSession, answer, storage);
    expect(readPracticeSessionSnapshot(storage)).not.toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(mixed);

    const replacement = [result(0, "incorrect-only")];
    expect(
      completePracticeSession(newSession, answer, replacement, storage),
    ).toBe(true);
    expect(readPracticeSessionSnapshot(storage)).toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(replacement);
  });

  it("accepts an unfinished final result without loosening navigation results", () => {
    expect(
      validateLatestCompletedResults([result(0, "no-valid-submissions")]),
    ).not.toBeNull();
    expect(
      validateLatestCompletedResults([result(0, "incorrect-only")]),
    ).not.toBeNull();
    expect(
      validateLatestCompletedResults([
        result(0, "eventually-correct"),
        result(1, "incorrect-only"),
      ]),
    ).not.toBeNull();
    expect(
      validateLatestCompletedResults([
        result(0, "incorrect-only"),
        result(1, "eventually-correct"),
      ]),
    ).toBeNull();
    expect(
      validateLatestCompletedResults([result(0, "incorrect-only", true)]),
    ).toBeNull();
    expect(
      validateLatestCompletedResults([
        result(0, "eventually-correct"),
        result(1, "incorrect-only", true),
      ]),
    ).not.toBeNull();
  });

  it("fails closed for malformed, stale, protected, and impossible completed data", () => {
    const good = result(0, "eventually-correct");
    const invalid = [
      [],
      [good, good],
      [{ ...good, problemId: "unknown" }],
      [{ ...good, problemTitle: "Wrong" }],
      [{ ...good, rawAnswer: "17" }],
      [{ ...good, summary: { ...good.summary, validSubmissionCount: -1 } }],
      [
        {
          ...good,
          summary: {
            ...good.summary,
            outcome: "incorrect-only",
            validSubmissionCount: 0,
          },
        },
      ],
      [
        {
          ...good,
          summary: {
            ...good.summary,
            hintExposures: [
              {
                hintId: "unknown",
                level: "focus",
                validSubmissionCountAtOpen: 0,
              },
            ],
          },
        },
      ],
      [
        {
          ...good,
          summary: {
            ...good.summary,
            solutionExposure: {
              solutionId: "coinciding-seats-full-solution",
              validSubmissionCountAtOpen: 0,
            },
          },
        },
      ],
      [{ ...good, taskOutcome: "skipped" }],
      [result(1, "eventually-correct")],
    ];
    for (const value of invalid) {
      expect(validateLatestCompletedResults(value)).toBeNull();
    }

    const storage = memoryStorage();
    storage.setItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      JSON.stringify(invalid[0]),
    );
    expect(readLatestCompletedResults(storage)).toBeNull();
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBeNull();
    expect(readLatestCompletedResults(storage)).toBeNull();
  });

  it("keeps the old completion and Practice retryable when clear or completed write fails", () => {
    const storage = memoryStorage();
    const oldResults = [result(0, "eventually-correct")];
    const newResults = [result(0, "incorrect-only")];
    const session = startTwoProblemSession();
    const answer = createShortNumericAnswerState();
    saveLatestCompletedResults(oldResults, storage);
    savePracticeSessionSnapshot(session, answer, storage);

    const failedClear = {
      ...storage,
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(
      completePracticeSession(session, answer, newResults, failedClear),
    ).toBe(false);
    expect(readPracticeSessionSnapshot(storage)).not.toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(oldResults);

    const failedCompletedWrite = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key === PRACTICE_LATEST_COMPLETED_STORAGE_KEY)
          throw new Error("QuotaExceededError");
        storage.setItem(key, value);
      },
    };
    expect(
      completePracticeSession(
        session,
        answer,
        newResults,
        failedCompletedWrite,
      ),
    ).toBe(false);
    expect(readPracticeSessionSnapshot(storage)).not.toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(oldResults);
    expect(completePracticeSession(session, answer, newResults, storage)).toBe(
      true,
    );
    expect(readPracticeSessionSnapshot(storage)).toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(newResults);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("finishes no-next explicitly, preserving the prior completion through failed transitions", () => {
    const storage = memoryStorage();
    const previous = [result(0, "eventually-correct")];
    const session: NoNextTwoProblemSessionState = {
      status: "no-next",
      completedResults: [
        result(0, "eventually-correct"),
        result(1, "incorrect-only", true),
      ],
    };
    const completionLatch = { current: false };
    const navigate = vi.fn();
    expect(saveLatestCompletedResults(previous, storage)).toBe(true);
    expect(saveNoNextPracticeSessionSnapshot(session, storage)).toBe(true);
    const originalNoNext = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);

    const failedClear = {
      ...storage,
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(
      finishPracticeSessionAndNavigate(
        completionLatch,
        session,
        null,
        session.completedResults,
        navigate,
        failedClear,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(originalNoNext);
    expect(readLatestCompletedResults(storage)).toEqual(previous);

    const failedCompletedWrite = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key === PRACTICE_LATEST_COMPLETED_STORAGE_KEY)
          throw new Error("QuotaExceededError");
        storage.setItem(key, value);
      },
    };
    expect(
      finishPracticeSessionAndNavigate(
        completionLatch,
        session,
        null,
        session.completedResults,
        navigate,
        failedCompletedWrite,
      ),
    ).toBe(false);
    expect(completionLatch.current).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(originalNoNext);
    expect(readLatestCompletedResults(storage)).toEqual(previous);

    expect(
      finishPracticeSessionAndNavigate(
        completionLatch,
        session,
        null,
        session.completedResults,
        navigate,
        storage,
      ),
    ).toBe(true);
    expect(completionLatch.current).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(readPracticeSessionSnapshot(storage)).toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(
      session.completedResults,
    );
  });

  it("keeps no-next Finish retryable in memory even if rollback storage also fails", () => {
    const storage = memoryStorage();
    const previous = [result(0, "eventually-correct")];
    const session: NoNextTwoProblemSessionState = {
      status: "no-next",
      completedResults: [
        result(0, "eventually-correct"),
        result(1, "no-valid-submissions", true),
      ],
    };
    const latch = { current: false };
    const navigate = vi.fn();
    saveLatestCompletedResults(previous, storage);
    saveNoNextPracticeSessionSnapshot(session, storage);
    const failedWrites = {
      ...storage,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };

    expect(
      finishPracticeSessionAndNavigate(
        latch,
        session,
        null,
        session.completedResults,
        navigate,
        failedWrites,
      ),
    ).toBe(false);
    expect(latch.current).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(readLatestCompletedResults(storage)).toEqual(previous);
    expect(readPracticeSessionSnapshot(storage)).toBeNull();

    expect(
      finishPracticeSessionAndNavigate(
        latch,
        session,
        null,
        session.completedResults,
        navigate,
        storage,
      ),
    ).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(readLatestCompletedResults(storage)).toEqual(
      session.completedResults,
    );
  });
});

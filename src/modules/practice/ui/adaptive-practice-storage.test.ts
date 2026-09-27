import { beforeEach, describe, expect, it } from "vitest";

import {
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import { startAdaptivePracticeSession } from "./fixed-practice-session-state";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import {
  completePracticeSession,
  createPracticeSessionSnapshot,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  validateLatestCompletedResults,
  type ServerPracticeFinishPayload,
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

const observation = {
  checkpointId: "brothers-ages-products-youngest-lower-bound" as const,
  selectedOptionId: "A" as const,
  outcome: "correct" as const,
  validSubmissionCountAtSubmit: 1,
};

describe("one adaptive transfer episode", () => {
  it("persists an immutable exact Finish request before a lost server response", async () => {
    const store = storage();
    const session = startAdaptivePracticeSession();
    const initial = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await createPracticeSessionSnapshot(session, initial, store)).toBe(
      true,
    );
    const answer = {
      rawAnswer: "2",
      status: "correct" as const,
      practice: recordAnswerResult(startPractice(), {
        status: "correct",
        normalizedAnswer: "2",
      }),
    };
    expect(
      await savePracticeSessionSnapshot(session, answer, store, observation),
    ).toBe(true);
    const result = {
      problemId: "brothers-ages-products",
      problemTitle: "Возраст братьев",
      summary: {
        outcome: "eventually-correct" as const,
        validSubmissionCount: 1,
        hintExposures: [],
        solutionExposure: null,
      },
      reasoningCheckpointObservation: observation,
      firstCorrectSubmissionCount: 1,
    };
    const requests: ServerPracticeFinishPayload[] = [];
    expect(
      await completePracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
          throw new Error("response lost");
        },
      ),
    ).toBe(false);
    expect(requests[0]).toMatchObject({
      sessionId: session.sessionId,
      adaptiveFacts: { attempted: true, solutionExposed: false },
    });
    expect(requests[0].contributions).toHaveLength(1);
    expect(requests[0].contributions[0]).toMatchObject({
      bucket: "impossibility",
      value: { problemId: "brothers-ages-products" },
    });
    expect(await savePracticeSessionSnapshot(session, initial, store)).toBe(
      false,
    );
    const altered = {
      ...result,
      reasoningCheckpointObservation: undefined,
      firstCorrectSubmissionCount: undefined,
    };
    expect(
      await completePracticeSession(
        session,
        answer,
        [altered],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe(true);
    expect(requests[1]).toEqual(requests[0]);
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(
      validateLatestCompletedResults(
        JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!),
      ),
    ).toEqual([result]);
  });

  it("records an attempted no-checkpoint episode without positive evidence", async () => {
    const store = storage();
    const session = startAdaptivePracticeSession();
    const initial = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    await createPracticeSessionSnapshot(session, initial, store);
    const answer = {
      rawAnswer: "3",
      status: "incorrect" as const,
      practice: recordAnswerResult(startPractice(), {
        status: "incorrect",
        normalizedAnswer: "3",
      }),
    };
    await savePracticeSessionSnapshot(session, answer, store);
    const result = {
      problemId: "brothers-ages-products",
      problemTitle: "Возраст братьев",
      summary: {
        outcome: "incorrect-only" as const,
        validSubmissionCount: 1,
        hintExposures: [],
        solutionExposure: null,
      },
    };
    const requests: ServerPracticeFinishPayload[] = [];
    expect(
      await completePracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe(true);
    expect(requests[0]).toMatchObject({
      adaptiveFacts: { attempted: true, solutionExposed: false },
      contributions: [],
    });
    expect(await readPracticeSessionSnapshot(store)).toBeNull();
  });

  it("retries adaptive local Summary finalization with the identical durable request", async () => {
    const store = storage();
    const session = startAdaptivePracticeSession();
    const initial = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    await createPracticeSessionSnapshot(session, initial, store);
    const answer = {
      rawAnswer: "2",
      status: "correct" as const,
      practice: recordAnswerResult(startPractice(), {
        status: "correct",
        normalizedAnswer: "2",
      }),
    };
    await savePracticeSessionSnapshot(session, answer, store, observation);
    const result = {
      problemId: "brothers-ages-products",
      problemTitle: "Возраст братьев",
      summary: {
        outcome: "eventually-correct" as const,
        validSubmissionCount: 1,
        hintExposures: [],
        solutionExposure: null,
      },
      reasoningCheckpointObservation: observation,
      firstCorrectSubmissionCount: 1,
    };
    let failSummary = true;
    const failingStore = {
      ...store,
      setItem: (key: string, value: string) => {
        if (key === PRACTICE_LATEST_COMPLETED_STORAGE_KEY && failSummary) {
          failSummary = false;
          throw new Error("local Summary failed");
        }
        store.setItem(key, value);
      },
    } as Storage;
    const requests: ServerPracticeFinishPayload[] = [];
    expect(
      await completePracticeSession(
        session,
        answer,
        [result],
        failingStore,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe(false);
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).not.toBeNull();
    expect(
      await completePracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe(true);
    expect(requests).toHaveLength(2);
    expect(requests[1]).toEqual(requests[0]);
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it.each(["restore", "retry"] as const)(
    "recovers an acknowledged transfer Finish after failed pending cleanup via %s",
    async (recovery) => {
      const store = storage();
      const session = startAdaptivePracticeSession();
      const initial = {
        rawAnswer: "",
        status: "typing" as const,
        practice: startPractice(),
      };
      expect(await createPracticeSessionSnapshot(session, initial, store)).toBe(
        true,
      );
      const answer = {
        rawAnswer: "2",
        status: "correct" as const,
        practice: recordAnswerResult(startPractice(), {
          status: "correct",
          normalizedAnswer: "2",
        }),
      };
      expect(
        await savePracticeSessionSnapshot(session, answer, store, observation),
      ).toBe(true);
      const result = {
        problemId: "brothers-ages-products",
        problemTitle: "Возраст братьев",
        summary: {
          outcome: "eventually-correct" as const,
          validSubmissionCount: 1,
          hintExposures: [],
          solutionExposure: null,
        },
        reasoningCheckpointObservation: observation,
        firstCorrectSubmissionCount: 1,
      };
      const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
      const requestKey = "olympiad-trainer:practice-server-finish-request";
      let failCleanup = true;
      const failingStore = {
        getItem: store.getItem,
        setItem: store.setItem,
        removeItem: (key: string) => {
          if (key === pendingKey && failCleanup) {
            failCleanup = false;
            throw new Error("pending cleanup interrupted");
          }
          store.removeItem(key);
        },
      } as Storage;
      const requests: ServerPracticeFinishPayload[] = [];
      const persist = async (request: ServerPracticeFinishPayload) => {
        requests.push(request);
      };
      expect(
        await completePracticeSession(
          session,
          answer,
          [result],
          failingStore,
          persist,
        ),
      ).toBe(false);
      expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
      expect(
        store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
      ).not.toBeNull();
      expect(store.getItem(pendingKey)).not.toBeNull();
      expect(store.getItem(requestKey)).not.toBeNull();

      if (recovery === "restore")
        expect(await readPracticeSessionSnapshot(store)).toBeNull();
      else
        expect(
          await completePracticeSession(
            session,
            answer,
            [result],
            store,
            persist,
          ),
        ).toBe(true);
      expect(store.getItem(pendingKey)).toBeNull();
      expect(store.getItem(requestKey)).toBeNull();
      expect(requests).toHaveLength(1);
      expect(await readPracticeSessionSnapshot(store)).toBeNull();
      expect(
        validateLatestCompletedResults(
          JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!),
        ),
      ).toEqual([result]);
    },
  );
});

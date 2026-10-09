import { beforeEach, describe, expect, it } from "vitest";

import {
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import { startAdaptivePracticeSession } from "./fixed-practice-session-state";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import {
  completeServerBackedPracticeSession,
  createPracticeSessionSnapshot,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  readLatestCompletedResults,
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
  it("preserves pages exploration identity through pause, lost Finish response, and retry", async () => {
    const store = storage();
    const session = startAdaptivePracticeSession("pages-without-digit-one");
    expect(session.mode).toBe("exploration");
    const answer = {
      rawAnswer: "232",
      status: "correct" as const,
      practice: recordAnswerResult(startPractice(), {
        status: "correct",
        normalizedAnswer: "232",
      }),
    };
    const pagesObservation = {
      checkpointId: "pages-without-digit-one-complete-enumeration" as const,
      selectedOptionId: "A" as const,
      outcome: "correct" as const,
      validSubmissionCountAtSubmit: 1,
    };
    expect(await createPracticeSessionSnapshot(session, answer, store)).toBe(
      true,
    );
    expect(
      await savePracticeSessionSnapshot(
        session,
        answer,
        store,
        pagesObservation,
      ),
    ).toBe(true);
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      mode: "exploration",
      problemIds: ["pages-without-digit-one"],
      reasoningCheckpointObservation: pagesObservation,
    });
    const result = {
      problemId: "pages-without-digit-one",
      problemTitle: "Страницы без цифры 1",
      summary: {
        outcome: "eventually-correct" as const,
        validSubmissionCount: 1,
        hintExposures: [],
        solutionExposure: null,
      },
      reasoningCheckpointObservation: pagesObservation,
      firstCorrectSubmissionCount: 1,
    };
    const requests: ServerPracticeFinishPayload[] = [];
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
          throw new Error("response lost");
        },
      ),
    ).toBe("outcome-unknown");
    expect(requests[0]).toMatchObject({
      adaptiveFacts: {
        problemId: "pages-without-digit-one",
        attempted: true,
        solutionExposed: false,
      },
      episodeMode: "exploration",
      episodeFacts: { problems: [{ problemId: "pages-without-digit-one" }] },
      contributions: [
        {
          bucket: "enumeration",
          value: { problemId: "pages-without-digit-one" },
        },
      ],
    });
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      mode: "exploration",
      problemIds: ["pages-without-digit-one"],
    });
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe("completed");
    expect(requests[1]).toEqual(requests[0]);
    expect(readLatestCompletedResults(store)).toEqual([result]);
    expect(
      JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!)
        .sessionId,
    ).toBe(session.sessionId);
  });
  it("preserves exact parrots identity through pause, pending Finish, and retry", async () => {
    const store = storage();
    const session = startAdaptivePracticeSession("parrots-guaranteed-colors");
    const initial = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await createPracticeSessionSnapshot(session, initial, store)).toBe(
      true,
    );
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      mode: "transfer",
      problemIds: ["parrots-guaranteed-colors"],
    });
    const answer = {
      rawAnswer: "19",
      status: "correct" as const,
      practice: recordAnswerResult(startPractice(), {
        status: "correct",
        normalizedAnswer: "19",
      }),
    };
    const parrotsObservation = {
      checkpointId: "parrots-guaranteed-colors-guarantee-argument" as const,
      selectedOptionId: "A" as const,
      outcome: "correct" as const,
      validSubmissionCountAtSubmit: 1,
    };
    expect(
      await savePracticeSessionSnapshot(
        session,
        answer,
        store,
        parrotsObservation,
      ),
    ).toBe(true);
    const result = {
      problemId: "parrots-guaranteed-colors",
      problemTitle: "Попугаи в зоопарке",
      summary: {
        outcome: "eventually-correct" as const,
        validSubmissionCount: 1,
        hintExposures: [],
        solutionExposure: null,
      },
      reasoningCheckpointObservation: parrotsObservation,
      firstCorrectSubmissionCount: 1,
    };
    const requests: ServerPracticeFinishPayload[] = [];
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
          throw new Error("response lost");
        },
      ),
    ).toBe("outcome-unknown");
    expect(requests[0]).toMatchObject({
      adaptiveFacts: {
        problemId: "parrots-guaranteed-colors",
        attempted: true,
        solutionExposed: false,
      },
      contributions: [
        {
          bucket: "guarantee",
          value: { problemId: "parrots-guaranteed-colors" },
        },
      ],
    });
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      problemIds: ["parrots-guaranteed-colors"],
    });
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe("completed");
    expect(requests[1]).toEqual(requests[0]);
    expect(readLatestCompletedResults(store)).toEqual([result]);
    expect(
      JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!)
        .sessionId,
    ).toBe(session.sessionId);
  });
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
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
          throw new Error("response lost");
        },
      ),
    ).toBe("outcome-unknown");
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
      await completeServerBackedPracticeSession(
        session,
        answer,
        [altered],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe("completed");
    expect(requests[1]).toEqual(requests[0]);
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(readLatestCompletedResults(store)).toEqual([result]);
    expect(
      JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!)
        .sessionId,
    ).toBe(session.sessionId);
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
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe("completed");
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
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        failingStore,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe("reconciliation-pending");
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).not.toBeNull();
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
        },
      ),
    ).toBe("completed");
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
        await completeServerBackedPracticeSession(
          session,
          answer,
          [result],
          failingStore,
          persist,
        ),
      ).toBe("reconciliation-pending");
      expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
      expect(
        store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
      ).not.toBeNull();
      expect(store.getItem(pendingKey)).not.toBeNull();
      expect(store.getItem(requestKey)).not.toBeNull();

      if (recovery === "restore") {
        expect((await readPracticeSessionSnapshot(store))?.sessionId).toBe(
          session.sessionId,
        );
        expect(store.getItem(requestKey)).not.toBeNull();
      }
      expect(
        await completeServerBackedPracticeSession(
          session,
          answer,
          [result],
          store,
          persist,
        ),
      ).toBe("completed");
      expect(store.getItem(pendingKey)).toBeNull();
      expect(store.getItem(requestKey)).toBeNull();
      expect(requests).toHaveLength(2);
      expect(requests[1]).toEqual(requests[0]);
      expect(await readPracticeSessionSnapshot(store)).toBeNull();
      expect(readLatestCompletedResults(store)).toEqual([result]);
      expect(
        JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!)
          .sessionId,
      ).toBe(session.sessionId);
    },
  );
});

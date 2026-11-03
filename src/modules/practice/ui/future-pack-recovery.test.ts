// Legacy generation tests isolate the IDB-existence query; the native
// canonical rehearsal verifies the real query and fail-closed transition.
vi.mock("../../learner/canonical-local-store", async (original) => ({
  ...(await original<typeof import("../../learner/canonical-local-store")>()),
  assertLegacyIdentityTransition: vi.fn(async () => {}),
}));
import { beforeEach, describe, expect, it, vi } from "vitest";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import {
  installTestLocalOwner,
  TEST_LOCAL_OWNER,
} from "../../learner/local-ownership.test-helper";
import {
  captureLearnerStorage,
  ownerStorageKey,
  suspendLocalLearner,
  transitionLocalIdentity,
} from "../../learner/local-ownership";
import {
  clearPracticeSessionSnapshot,
  completePracticeSession,
  completeServerBackedPracticeSession,
  createPracticeSessionSnapshot,
  isCurrentPracticeFinish,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  readVerifiedPracticeSessionSnapshot,
  saveLatestCompletedResults,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  UnsupportedPracticeStateError,
  validatePracticeSessionSnapshot,
} from "./practice-session-storage";
import { startPracticeSession } from "./fixed-practice-session-state";
import { createShortNumericAnswerState } from "./short-numeric-answer-state";
import { ensureServerProgressImported } from "./server-progress-import";
import { isUnsupportedFuturePackSnapshot } from "./future-pack-snapshot";

vi.mock("../../../app/progress/actions", () => ({
  importBrowserProgressEvidence: vi.fn(),
}));

beforeEach(installImmediatePracticeSessionLock);

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => values.clear(),
  };
}

function futureSnapshot() {
  return {
    sessionId: crypto.randomUUID(),
    mode: "pack",
    problemIds: ["future-one", "future-two", "future-three"],
    activeProblemIndex: 0,
    completedResults: [],
    activePractice: {
      status: "active",
      submissions: [],
      hintExposures: [],
      solutionExposure: null,
    },
    rawAnswer: "",
  };
}

const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
const requestKey = "olympiad-trainer:practice-server-finish-request";
const latestKey = "olympiad-trainer:practice-latest-completed";
const progressKey = "olympiad-trainer:progress-evidence-v0";

describe("future Pack browser recovery", () => {
  it("preserves exact bytes through downgrade, refresh, repeated reads and new-session attempts", async () => {
    const store = memoryStorage();
    const snapshot = futureSnapshot();
    const raw = `  ${JSON.stringify(snapshot)}\n`;
    store.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
    const verify = vi.fn();
    expect(isUnsupportedFuturePackSnapshot(snapshot)).toBe(true);
    for (let attempt = 0; attempt < 2; attempt++) {
      await expect(readPracticeSessionSnapshot(store)).rejects.toBeInstanceOf(
        UnsupportedPracticeStateError,
      );
      await expect(
        readVerifiedPracticeSessionSnapshot(verify, store),
      ).rejects.toBeInstanceOf(UnsupportedPracticeStateError);
      expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);
    }
    expect(verify).not.toHaveBeenCalled();
    expect(
      await createPracticeSessionSnapshot(
        startPracticeSession(),
        createShortNumericAnswerState(),
        store,
      ),
    ).toBe(false);
    expect(await clearPracticeSessionSnapshot(store)).toBe(false);
    await expect(ensureServerProgressImported(store)).rejects.toBeInstanceOf(
      UnsupportedPracticeStateError,
    );
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);
  });

  it("preserves future pending Finish and refuses false acknowledgement or legacy import", async () => {
    const store = memoryStorage();
    const snapshot = futureSnapshot();
    const raw = JSON.stringify(snapshot);
    const request = JSON.stringify({
      version: 2,
      sessionId: snapshot.sessionId,
      contributions: [],
      episodeMode: "pack",
      episodeFacts: { version: 1, problems: [] },
      unfinishedBefore: raw,
      completedBefore: null,
      progressBefore: null,
      completedAfter: "future-completion",
    });
    const pending = JSON.stringify({
      sessionId: snapshot.sessionId,
      unfinishedBefore: raw,
      completedBefore: null,
      progressBefore: null,
      completedAfter: "future-completion",
      progressAfter: null,
      serverBacked: true,
    });
    store.setItem(requestKey, request);
    store.setItem(pendingKey, pending);
    store.setItem(progressKey, "future-progress-bytes");
    await expect(
      readVerifiedPracticeSessionSnapshot(vi.fn(), store),
    ).rejects.toBeInstanceOf(UnsupportedPracticeStateError);
    await expect(ensureServerProgressImported(store)).rejects.toBeInstanceOf(
      UnsupportedPracticeStateError,
    );
    expect(
      await isCurrentPracticeFinish(
        startPracticeSession(),
        createShortNumericAnswerState(),
        [],
        store,
      ),
    ).toBe(false);
    expect(
      await createPracticeSessionSnapshot(
        startPracticeSession(),
        createShortNumericAnswerState(),
        store,
      ),
    ).toBe(false);
    expect(store.getItem(requestKey)).toBe(request);
    expect(store.getItem(pendingKey)).toBe(pending);
    expect(store.getItem(progressKey)).toBe("future-progress-bytes");
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("protects a future completed summary against replacement and fresh starts", async () => {
    const store = memoryStorage();
    const summary = JSON.stringify({
      sessionId: crypto.randomUUID(),
      results: [
        {
          problemId: "future-one",
          problemTitle: "Будущая задача",
          summary: {
            outcome: "no-valid-submissions",
            validSubmissionCount: 0,
            hintExposures: [],
            solutionExposure: null,
          },
          taskOutcome: "skipped",
        },
      ],
    });
    store.setItem(latestKey, summary);
    expect(
      saveLatestCompletedResults(
        [
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
        ],
        store,
      ),
    ).toBe(false);
    expect(store.getItem(latestKey)).toBe(summary);
    expect(
      await createPracticeSessionSnapshot(
        startPracticeSession(),
        createShortNumericAnswerState(),
        store,
      ),
    ).toBe(false);
  });

  it("rejects malformed and contradictory snapshots and resumes when compatible bytes return", async () => {
    const store = memoryStorage();
    const bad = {
      ...futureSnapshot(),
      problemIds: ["future-one", "future-one", "future-three"],
    };
    expect(isUnsupportedFuturePackSnapshot(bad)).toBe(false);
    store.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(bad));
    expect(await readPracticeSessionSnapshot(store)).toBeNull();
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();

    const future = JSON.stringify(futureSnapshot());
    store.setItem(PRACTICE_SESSION_STORAGE_KEY, future);
    await expect(readPracticeSessionSnapshot(store)).rejects.toBeInstanceOf(
      UnsupportedPracticeStateError,
    );
    const compatible = memoryStorage();
    const session = startPracticeSession();
    expect(
      await createPracticeSessionSnapshot(
        session,
        createShortNumericAnswerState(),
        compatible,
      ),
    ).toBe(true);
    store.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      compatible.getItem(PRACTICE_SESSION_STORAGE_KEY)!,
    );
    expect((await readPracticeSessionSnapshot(store))?.sessionId).toBe(
      session.sessionId,
    );
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(
      compatible.getItem(PRACTICE_SESSION_STORAGE_KEY),
    );
  });

  it("protects a plausible future no-next snapshot but rejects malformed known and future records", async () => {
    const store = memoryStorage();
    const ids = ["future-one", "future-two", "future-three"];
    const noNext = {
      sessionId: crypto.randomUUID(),
      mode: "pack",
      status: "no-next",
      completedResults: ids.map((problemId) => ({
        problemId,
        problemTitle: problemId,
        summary: {
          outcome: "no-valid-submissions",
          validSubmissionCount: 0,
          hintExposures: [],
          solutionExposure: null,
        },
        taskOutcome: "skipped",
      })),
    };
    const raw = JSON.stringify(noNext);
    store.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
    expect(isUnsupportedFuturePackSnapshot(noNext)).toBe(true);
    await expect(readPracticeSessionSnapshot(store)).rejects.toBeInstanceOf(
      UnsupportedPracticeStateError,
    );
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);
    const malformed = {
      ...futureSnapshot(),
      activePractice: {
        status: "active",
        submissions: [{ answer: "1", outcome: "impossible" }],
        hintExposures: [],
        solutionExposure: null,
      },
    };
    store.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(malformed));
    expect(isUnsupportedFuturePackSnapshot(malformed)).toBe(false);
    expect(await readPracticeSessionSnapshot(store)).toBeNull();
    const knownTuple = {
      ...futureSnapshot(),
      problemIds: [
        "granddaughters-first",
        "cutout-area-ratio",
        "domino-placements",
      ],
    };
    store.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(knownTuple));
    expect(isUnsupportedFuturePackSnapshot(knownTuple)).toBe(false);
    expect(await readPracticeSessionSnapshot(store)).toBeNull();
    const contradictoryKnown = {
      ...futureSnapshot(),
      problemIds: ["granddaughters-first", "future-two", "future-three"],
      rawAnswer: undefined,
      selectedOptionIds: ["unknown-option"],
    };
    delete (contradictoryKnown as { rawAnswer?: string }).rawAnswer;
    store.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify(contradictoryKnown),
    );
    expect(await readPracticeSessionSnapshot(store)).toBeNull();
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("rechecks under the Practice lock when another tab saves future state first", async () => {
    const store = memoryStorage();
    const raw = JSON.stringify(futureSnapshot());
    vi.stubGlobal("navigator", {
      locks: {
        request: (
          _name: string,
          _options: LockOptions,
          callback: () => unknown,
        ) => {
          if (_name === "olympiad-trainer:practice-session-mutation")
            store.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
          return Promise.resolve(callback());
        },
      },
    });
    expect(
      await createPracticeSessionSnapshot(
        startPracticeSession(),
        createShortNumericAnswerState(),
        store,
      ),
    ).toBe(false);
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);
  });

  it("blocks stale saves and both Finish paths without calling the server", async () => {
    const store = memoryStorage();
    const raw = JSON.stringify(futureSnapshot());
    store.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
    const session = startPracticeSession();
    const answer = createShortNumericAnswerState();
    const noValid = {
      outcome: "no-valid-submissions" as const,
      validSubmissionCount: 0,
      hintExposures: [],
      solutionExposure: null,
    };
    const correct = {
      outcome: "eventually-correct" as const,
      validSubmissionCount: 1,
      hintExposures: [],
      solutionExposure: null,
    };
    const result = {
      problemId: "coinciding-seats",
      problemTitle: "Совпадающие места",
      summary: noValid,
    };
    const noNext = {
      sessionId: session.sessionId,
      status: "no-next" as const,
      completedResults: [
        {
          problemId: "coinciding-seats",
          problemTitle: "Совпадающие места",
          summary: correct,
        },
        {
          problemId: "guaranteed-sock-pair",
          problemTitle: "Носки в пакете",
          summary: correct,
        },
        {
          problemId: "table-impossible-sums",
          problemTitle: "Невозможные суммы",
          summary: noValid,
          taskOutcome: "skipped" as const,
        },
      ],
    };
    expect(validatePracticeSessionSnapshot(noNext)).not.toBeNull();
    expect(await savePracticeSessionSnapshot(session, answer, store)).toBe(
      false,
    );
    expect(await saveNoNextPracticeSessionSnapshot(noNext, store)).toBe(false);
    expect(
      await completePracticeSession(session, answer, [result], store),
    ).toBe(false);
    const persist = vi.fn(async () => {});
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        persist,
      ),
    ).toBe("blocked");
    expect(persist).not.toHaveBeenCalled();
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);
  });

  it("keeps future bytes bound to their learner across an identity change", async () => {
    const rawStore = memoryStorage();
    suspendLocalLearner();
    await installTestLocalOwner(rawStore);
    const firstLease = captureLearnerStorage();
    const future = JSON.stringify(futureSnapshot());
    firstLease.setItem(PRACTICE_SESSION_STORAGE_KEY, future);
    const firstNamespace = rawStore.getItem(
      ownerStorageKey(TEST_LOCAL_OWNER, PRACTICE_SESSION_STORAGE_KEY),
    );
    const secondOwner = {
      learnerId: "00000000-0000-4000-8000-000000000002",
      generation: "0",
    };
    await transitionLocalIdentity(
      secondOwner,
      async () => secondOwner,
      rawStore,
    );
    expect(() => firstLease.getItem(PRACTICE_SESSION_STORAGE_KEY)).toThrow();
    expect(
      captureLearnerStorage().getItem(PRACTICE_SESSION_STORAGE_KEY),
    ).toBeNull();
    expect(
      await createPracticeSessionSnapshot(
        startPracticeSession(),
        createShortNumericAnswerState(),
      ),
    ).toBe(true);
    expect(
      rawStore.getItem(
        ownerStorageKey(TEST_LOCAL_OWNER, PRACTICE_SESSION_STORAGE_KEY),
      ),
    ).toBe(firstNamespace);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeServerBackedPracticeSession,
  createPracticeSessionSnapshot,
} from "../practice/ui/practice-session-storage";
import { createShortNumericAnswerState } from "../practice/ui/short-numeric-answer-state";
import {
  captureLearnerStorage,
  currentLocalLearnerOwner,
  hasLocalLearnerBytes,
  reconcileAuthenticatedLocalOwner,
  requestForLocalOwner,
  transitionLocalIdentity,
  transitionRecoveredLocalIdentity,
  suspendLocalLearner,
  LEARNER_LOCAL_KEYS,
  LOCAL_OWNER_KEY,
  IDENTITY_SWITCH_KEY,
  IDENTITY_LOCK,
  PRACTICE_LOCK,
  SIMULATION_LOCK,
  ownerStorageKey,
} from "./local-ownership";

const a = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "0",
};
const b = {
  learnerId: "00000000-0000-4000-8000-000000000002",
  generation: "0",
};
const renewed = { ...a, generation: "1" };
let store: Storage;
let held: Set<string>;
let requests: string[];
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
  };
}
beforeEach(() => {
  suspendLocalLearner();
  store = memoryStorage();
  held = new Set();
  requests = [];
  vi.stubGlobal("navigator", {
    locks: {
      request: async (
        name: string,
        _options: LockOptions,
        callback: (lock: Lock | null) => unknown,
      ) => {
        requests.push(name);
        return callback(held.has(name) ? null : ({ name } as Lock));
      },
    },
  });
});

describe("authenticated local ownership", () => {
  it("preserves an already captured lease through routine same-owner reconciliation", async () => {
    await reconcileAuthenticatedLocalOwner(a, false, store);
    const lease = captureLearnerStorage();
    lease.setItem(LEARNER_LOCAL_KEYS[0], "saved work");
    await reconcileAuthenticatedLocalOwner({ ...a }, true, store);
    expect(lease.getItem(LEARNER_LOCAL_KEYS[0])).toBe("saved work");
    lease.setItem(LEARNER_LOCAL_KEYS[0], "continued work");
    expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[0])).toBe(
      "continued work",
    );
  });
  it("accepts an in-flight owner-scoped response after routine reconciliation", async () => {
    await reconcileAuthenticatedLocalOwner(a, true, store);
    let respond!: (value: string) => void;
    const pending = requestForLocalOwner(
      () =>
        new Promise<string>((resolve) => {
          respond = resolve;
        }),
    );
    await reconcileAuthenticatedLocalOwner({ ...a }, true, store);
    respond("authenticated response");
    await expect(pending).resolves.toBe("authenticated response");
  });
  it.each(["binding", "store", "suspension", "corruption"])(
    "invalidates captured leases after %s changes even for the same owner",
    async (change) => {
      await reconcileAuthenticatedLocalOwner(a, true, store);
      const lease = captureLearnerStorage();
      if (change === "binding") {
        store.setItem(
          LOCAL_OWNER_KEY,
          JSON.stringify({ owner: a, legacyOwner: null }),
        );
      } else if (change === "store") {
        store = memoryStorage();
      } else if (change === "suspension") {
        suspendLocalLearner();
      } else {
        const key = ownerStorageKey(a, LEARNER_LOCAL_KEYS[0]);
        store.setItem(key, "corrupt");
        await expect(
          reconcileAuthenticatedLocalOwner(a, true, store),
        ).rejects.toThrow();
        store.removeItem(key);
      }
      await reconcileAuthenticatedLocalOwner(a, true, store);
      expect(() => lease.getItem(LEARNER_LOCAL_KEYS[0])).toThrow();
      expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[0])).toBeNull();
    },
  );
  it("completes Finish when the same owner is reconciled during acknowledgement", async () => {
    await reconcileAuthenticatedLocalOwner(a, true, store);
    const lease = captureLearnerStorage();
    const session = {
      sessionId: crypto.randomUUID(),
      activeProblemIndex: 0 as const,
      completedResults: [],
    };
    const answer = createShortNumericAnswerState();
    expect(await createPracticeSessionSnapshot(session, answer, lease)).toBe(
      true,
    );
    const persist = vi.fn(async () => {
      await reconcileAuthenticatedLocalOwner({ ...a }, true, store);
    });
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
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
        lease,
        persist,
      ),
    ).toBe("completed");
    expect(persist).toHaveBeenCalledOnce();
    expect(lease.getItem(LEARNER_LOCAL_KEYS[0])).toBeNull();
    expect(lease.getItem(LEARNER_LOCAL_KEYS[4])).toBeNull();
    expect(lease.getItem(LEARNER_LOCAL_KEYS[1])).not.toBeNull();
  });
  it.each(["foreign", "newer", "corrupt"])(
    "never overwrites/removes a %s existing envelope, across all learner-local keys",
    async (kind) => {
      await reconcileAuthenticatedLocalOwner(a, true, store);
      const scoped = captureLearnerStorage();
      for (const key of LEARNER_LOCAL_KEYS) {
        const raw =
          kind === "corrupt"
            ? "{corrupt envelope"
            : JSON.stringify({
                version: 1,
                owner: kind === "foreign" ? b : renewed,
                payload: "preserve original bytes",
              });
        const namespaced = ownerStorageKey(a, key);
        store.setItem(namespaced, raw);
        expect(() => scoped.getItem(key)).toThrow();
        expect(() => scoped.setItem(key, "replacement")).toThrow();
        expect(store.getItem(namespaced)).toBe(raw);
        expect(() => scoped.removeItem(key)).toThrow();
        expect(store.getItem(namespaced)).toBe(raw);
      }
      await expect(
        reconcileAuthenticatedLocalOwner(a, true, store),
      ).rejects.toThrow();
      expect(() => captureLearnerStorage()).toThrow();
    },
  );
  it("does not bind legacy originals over an inconsistent partial namespace", async () => {
    store.setItem(LEARNER_LOCAL_KEYS[0], "legacy original");
    const key = ownerStorageKey(a, LEARNER_LOCAL_KEYS[0]);
    const raw = JSON.stringify({
      version: 1,
      owner: b,
      payload: "foreign original",
    });
    store.setItem(key, raw);
    await expect(
      reconcileAuthenticatedLocalOwner(a, true, store),
    ).rejects.toThrow();
    expect(store.getItem(key)).toBe(raw);
    expect(store.getItem(LEARNER_LOCAL_KEYS[0])).toBe("legacy original");
    expect(store.getItem(LOCAL_OWNER_KEY)).toBeNull();
  });
  it("late Practice Finish acknowledgement cannot clear or finalize local work after generation reconciliation", async () => {
    await reconcileAuthenticatedLocalOwner(a, true, store);
    const scoped = captureLearnerStorage();
    const session = {
      sessionId: crypto.randomUUID(),
      activeProblemIndex: 0 as const,
      completedResults: [],
    };
    const answer = createShortNumericAnswerState();
    expect(await createPracticeSessionSnapshot(session, answer, scoped)).toBe(
      true,
    );
    const unfinished = scoped.getItem(LEARNER_LOCAL_KEYS[0]);
    let acknowledge!: () => void;
    let entered!: () => void;
    const sending = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const pending = completeServerBackedPracticeSession(
      session,
      answer,
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
      scoped,
      async () => {
        entered();
        await new Promise<void>((resolve) => {
          acknowledge = resolve;
        });
      },
    );
    await sending;
    const request = scoped.getItem(LEARNER_LOCAL_KEYS[4]);
    await reconcileAuthenticatedLocalOwner(renewed, true, store);
    acknowledge();
    expect(await pending).toBe("reconciliation-pending");
    const current = captureLearnerStorage();
    expect(current.getItem(LEARNER_LOCAL_KEYS[0])).toBe(unfinished);
    expect(current.getItem(LEARNER_LOCAL_KEYS[4])).toBe(request);
    expect(current.getItem(LEARNER_LOCAL_KEYS[1])).toBeNull();
  });
  it("binds every legacy payload exactly once without changing original or payload bytes", async () => {
    for (const key of LEARNER_LOCAL_KEYS) store.setItem(key, `original ${key}`);
    await reconcileAuthenticatedLocalOwner(a, true, store);
    const scoped = captureLearnerStorage();
    for (const key of LEARNER_LOCAL_KEYS) {
      expect(store.getItem(key)).toBe(`original ${key}`);
      expect(scoped.getItem(key)).toBe(`original ${key}`);
      expect(JSON.parse(store.getItem(ownerStorageKey(a, key))!)).toEqual({
        version: 1,
        owner: a,
        payload: `original ${key}`,
      });
    }
    scoped.removeItem(LEARNER_LOCAL_KEYS[2]);
    await reconcileAuthenticatedLocalOwner(a, true, store);
    expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[2])).toBeNull();
  });
  it("does not associate legacy bytes with a newly initialized credential", async () => {
    store.setItem(LEARNER_LOCAL_KEYS[0], "work");
    await expect(
      reconcileAuthenticatedLocalOwner(a, false, store),
    ).rejects.toThrow();
    expect(store.getItem(LEARNER_LOCAL_KEYS[0])).toBe("work");
    expect(store.getItem(LOCAL_OWNER_KEY)).toBeNull();
    expect(() => captureLearnerStorage()).toThrow();
  });
  it("normal same-owner resume retains the exact pending request identity", async () => {
    const pending =
      '{"sessionId":"request-123","hash":"same-hash","draft":"text"}';
    store.setItem(LEARNER_LOCAL_KEYS[4], pending);
    await reconcileAuthenticatedLocalOwner(a, true, store);
    await reconcileAuthenticatedLocalOwner(a, true, store);
    expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[4])).toBe(
      pending,
    );
  });
  it("newer generation preserves all payloads while invalidating old async leases", async () => {
    await reconcileAuthenticatedLocalOwner(a, true, store);
    const old = captureLearnerStorage();
    for (const key of LEARNER_LOCAL_KEYS) old.setItem(key, `pending ${key}`);
    await reconcileAuthenticatedLocalOwner(renewed, true, store);
    for (const key of LEARNER_LOCAL_KEYS) {
      expect(captureLearnerStorage().getItem(key)).toBe(`pending ${key}`);
      expect(() => old.setItem(key, "late response")).toThrow();
      expect(() => old.removeItem(key)).toThrow();
    }
    expect(currentLocalLearnerOwner()).toEqual(renewed);
  });
  it("blocks older generation and an unexpected foreign owner without changing bytes", async () => {
    await reconcileAuthenticatedLocalOwner(renewed, true, store);
    captureLearnerStorage().setItem(LEARNER_LOCAL_KEYS[0], "same-owner");
    const before = Array.from({ length: store.length }, (_, i) => [
      store.key(i),
      store.getItem(store.key(i)!),
    ]);
    await expect(
      reconcileAuthenticatedLocalOwner(a, true, store),
    ).rejects.toThrow();
    await expect(
      reconcileAuthenticatedLocalOwner(b, true, store),
    ).rejects.toThrow();
    expect(
      Array.from({ length: store.length }, (_, i) => [
        store.key(i),
        store.getItem(store.key(i)!),
      ]),
    ).toEqual(before);
  });
  it("explicit simulated switch isolates every source namespace, including Finish and Simulation", async () => {
    await reconcileAuthenticatedLocalOwner(a, true, store);
    const old = captureLearnerStorage();
    for (const key of LEARNER_LOCAL_KEYS) old.setItem(key, "source work");
    requests = [];
    const acknowledge = vi.fn(async () => {
      expect(JSON.parse(store.getItem(IDENTITY_SWITCH_KEY)!)).toMatchObject({
        source: a,
        target: b,
      });
      expect(() => old.getItem(LEARNER_LOCAL_KEYS[0])).toThrow();
      return b;
    });
    await transitionLocalIdentity(b, acknowledge, store);
    expect(requests).toEqual([IDENTITY_LOCK, PRACTICE_LOCK, SIMULATION_LOCK]);
    for (const key of LEARNER_LOCAL_KEYS) {
      expect(captureLearnerStorage().getItem(key)).toBeNull();
      expect(JSON.parse(store.getItem(ownerStorageKey(a, key))!).payload).toBe(
        "source work",
      );
      expect(() => old.setItem(key, "late")).toThrow();
    }
    expect(acknowledge).toHaveBeenCalledOnce();
    await transitionLocalIdentity(renewed, async () => renewed, store);
    for (const key of LEARNER_LOCAL_KEYS)
      expect(captureLearnerStorage().getItem(key)).toBe("source work");
  });
  it.each([IDENTITY_LOCK, PRACTICE_LOCK, SIMULATION_LOCK])(
    "held %s blocks transition before acknowledgement or storage mutation",
    async (lock) => {
      await reconcileAuthenticatedLocalOwner(a, true, store);
      held.add(lock);
      const acknowledge = vi.fn(async () => b);
      await expect(
        transitionLocalIdentity(b, acknowledge, store),
      ).rejects.toThrow();
      expect(acknowledge).not.toHaveBeenCalled();
      expect(store.getItem(IDENTITY_SWITCH_KEY)).toBeNull();
      expect(currentLocalLearnerOwner()).toEqual(a);
    },
  );
  it("response loss reload reconciles only authenticated target, not local marker authority", async () => {
    await reconcileAuthenticatedLocalOwner(a, true, store);
    captureLearnerStorage().setItem(LEARNER_LOCAL_KEYS[4], "pending request");
    await expect(
      transitionLocalIdentity(
        renewed,
        async () => {
          throw new Error("lost");
        },
        store,
      ),
    ).rejects.toThrow("lost");
    expect(() => currentLocalLearnerOwner()).toThrow();
    await expect(
      reconcileAuthenticatedLocalOwner(a, true, store),
    ).rejects.toThrow();
    expect(store.getItem(IDENTITY_SWITCH_KEY)).not.toBeNull();
    await reconcileAuthenticatedLocalOwner(renewed, true, store);
    expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[4])).toBe(
      "pending request",
    );
    expect(store.getItem(IDENTITY_SWITCH_KEY)).toBeNull();
    await reconcileAuthenticatedLocalOwner(renewed, true, store);
    expect(currentLocalLearnerOwner()).toEqual(renewed);
  });
  it("lost-cookie recovery enters the existing barrier without importing legacy or foreign work", async () => {
    store.setItem(LEARNER_LOCAL_KEYS[0], "ambiguous legacy practice");
    const foreignNamespace = ownerStorageKey(a, LEARNER_LOCAL_KEYS[5]);
    store.setItem(
      foreignNamespace,
      JSON.stringify({ version: 1, owner: a, payload: "foreign simulation" }),
    );
    const acknowledge = vi.fn(async () => {
      expect(requests).toEqual([IDENTITY_LOCK, PRACTICE_LOCK, SIMULATION_LOCK]);
      expect(JSON.parse(store.getItem(IDENTITY_SWITCH_KEY)!)).toMatchObject({
        source: null,
        target: b,
      });
      expect(() => currentLocalLearnerOwner()).toThrow();
      return b;
    });

    await transitionRecoveredLocalIdentity(b, acknowledge, store);

    expect(acknowledge).toHaveBeenCalledOnce();
    expect(store.getItem(LEARNER_LOCAL_KEYS[0])).toBe(
      "ambiguous legacy practice",
    );
    expect(JSON.parse(store.getItem(foreignNamespace)!)).toMatchObject({
      owner: a,
      payload: "foreign simulation",
    });
    expect(store.getItem(ownerStorageKey(b, LEARNER_LOCAL_KEYS[0]))).toBeNull();
    expect(store.getItem(LOCAL_OWNER_KEY)).toContain(b.learnerId);
    expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[0])).toBeNull();
  });
  it("rebinds same-learner local work after lost-cookie recovery and rejects stale leases", async () => {
    await reconcileAuthenticatedLocalOwner(a, true, store);
    const old = captureLearnerStorage();
    old.setItem(LEARNER_LOCAL_KEYS[4], "same learner pending Finish");
    await transitionRecoveredLocalIdentity(renewed, async () => renewed, store);
    expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[4])).toBe(
      "same learner pending Finish",
    );
    expect(() => old.setItem(LEARNER_LOCAL_KEYS[4], "late Finish")).toThrow();
  });
  it("recovers a committed lost response from an unbound browser without importing legacy bytes", async () => {
    store.setItem(LEARNER_LOCAL_KEYS[2], "unowned legacy evidence");
    await expect(
      transitionRecoveredLocalIdentity(
        b,
        async () => {
          throw new Error("response lost");
        },
        store,
      ),
    ).rejects.toThrow("response lost");
    expect(store.getItem(IDENTITY_SWITCH_KEY)).not.toBeNull();
    await reconcileAuthenticatedLocalOwner(b, true, store);
    expect(store.getItem(IDENTITY_SWITCH_KEY)).toBeNull();
    expect(store.getItem(LEARNER_LOCAL_KEYS[2])).toBe(
      "unowned legacy evidence",
    );
    expect(captureLearnerStorage().getItem(LEARNER_LOCAL_KEYS[2])).toBeNull();
  });
  it.each([IDENTITY_LOCK, PRACTICE_LOCK, SIMULATION_LOCK])(
    "recovery in an unbound browser waits for the existing %s barrier",
    async (lock) => {
      held.add(lock);
      const acknowledge = vi.fn(async () => b);
      await expect(
        transitionRecoveredLocalIdentity(b, acknowledge, store),
      ).rejects.toThrow();
      expect(acknowledge).not.toHaveBeenCalled();
      expect(store.getItem(IDENTITY_SWITCH_KEY)).toBeNull();
      expect(store.getItem(LOCAL_OWNER_KEY)).toBeNull();
    },
  );
  it.each(["read", "write", "readback"])(
    "storage %s failure blocks acknowledgement and preserves payloads",
    async (mode) => {
      await reconcileAuthenticatedLocalOwner(a, true, store);
      captureLearnerStorage().setItem(
        LEARNER_LOCAL_KEYS[5],
        "unsent simulation",
      );
      const original = store.getItem(ownerStorageKey(a, LEARNER_LOCAL_KEYS[5]));
      const get = store.getItem.bind(store);
      if (mode === "write")
        vi.spyOn(store, "setItem").mockImplementation(() => {
          throw new Error("storage");
        });
      else
        vi.spyOn(store, "getItem").mockImplementation((key) =>
          key === IDENTITY_SWITCH_KEY
            ? mode === "read"
              ? (() => {
                  throw new Error("storage");
                })()
              : "invalid readback"
            : get(key),
        );
      const acknowledge = vi.fn(async () => b);
      await expect(
        transitionLocalIdentity(b, acknowledge, store),
      ).rejects.toThrow();
      expect(acknowledge).not.toHaveBeenCalled();
      expect(get(ownerStorageKey(a, LEARNER_LOCAL_KEYS[5]))).toBe(original);
    },
  );
  it("does not bind legacy bytes when a switch marker is unresolved", async () => {
    store.setItem(LEARNER_LOCAL_KEYS[0], "ambiguous");
    store.setItem(
      IDENTITY_SWITCH_KEY,
      JSON.stringify({ operationId: "lost", source: a, target: b }),
    );
    await expect(
      reconcileAuthenticatedLocalOwner(b, true, store),
    ).rejects.toThrow();
    expect(store.getItem(LEARNER_LOCAL_KEYS[0])).toBe("ambiguous");
    expect(store.getItem(ownerStorageKey(b, LEARNER_LOCAL_KEYS[0]))).toBeNull();
    expect(hasLocalLearnerBytes(store)).toBe(true);
  });
});

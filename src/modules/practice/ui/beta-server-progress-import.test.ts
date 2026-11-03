import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  importEvidence: vi.fn(),
  current: vi.fn(),
  mutate: vi.fn(),
  plan: vi.fn(),
  owner: { learnerId: "00000000-0000-4000-8000-000000000001", generation: "0" },
}));
vi.mock("../../learner/canonical-local-store", () => ({
  isCanonicalStorage: () => true,
  assertCanonicalStorageCurrent: mocks.current,
  mutateCanonicalStorage: mocks.mutate,
  CANONICAL_SLOTS: [],
  canonicalStorageRevision: () => 0,
  CanonicalPersistenceError: class extends Error {},
}));
vi.mock("../../learner/local-ownership", () => ({
  captureLearnerStorage: () => {
    throw new Error("explicit storage required");
  },
  currentLocalLearnerOwner: () => mocks.owner,
  withLocalIdentityRead: (operation: () => unknown) => operation(),
}));
vi.mock("../../../app/progress/actions", () => ({
  importBrowserProgressEvidence: mocks.importEvidence,
}));
vi.mock("./practice-session-storage", () => ({
  assertNoUnsupportedPracticeStateInsideLock: vi.fn(),
  acknowledgeLegacyFinishImportInsideLock: vi.fn(),
  recoverLegacyFinishBeforeImportInsideLock: vi.fn(),
  prepareCanonicalLegacyImportInsideLock: mocks.plan,
}));
vi.mock("./progress-evidence-storage", () => ({
  PROGRESS_EVIDENCE_STORAGE_KEY: "olympiad-trainer:progress-evidence-v0",
}));
import { ensureServerProgressImported } from "./server-progress-import";
const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
const progressKey = "olympiad-trainer:progress-evidence-v0";
function storage(entries: [string, string][] = []): Storage {
  const values = new Map(entries);
  return {
    get length() {
      return values.size;
    },
    key: (i) => [...values.keys()][i] ?? null,
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      values.set(k, v);
    },
    removeItem: (k) => {
      values.delete(k);
    },
    clear: () => values.clear(),
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.current.mockResolvedValue(undefined);
  mocks.importEvidence.mockResolvedValue(undefined);
  vi.stubGlobal("navigator", {
    locks: {
      request: (_name: string, _options: unknown, operation: () => unknown) =>
        Promise.resolve().then(operation),
    },
  });
});
describe("canonical beta import preservation", () => {
  it.each([false, true])(
    "never acknowledges empty progress with a pending Finish (serverBacked=%s), including repeated reads",
    async (serverBacked) => {
      const sessionId = crypto.randomUUID();
      const observation = {
        checkpointId: "guaranteed-sock-pair-guarantee-argument",
        selectedOptionId: "A",
        outcome: "correct",
        validSubmissionCountAtSubmit: 1,
      };
      const summary = {
        outcome: "eventually-correct",
        validSubmissionCount: 1,
        hintExposures: [],
        solutionExposure: null,
      };
      const firstResult = {
        problemId: "coinciding-seats",
        problemTitle: "Совпадающие места",
        summary,
      };
      const sockResult = {
        problemId: "guaranteed-sock-pair",
        problemTitle: "Носки в пакете",
        summary,
        reasoningCheckpointObservation: observation,
        firstCorrectSubmissionCount: 1,
      };
      const progressAfter = JSON.stringify({
        version: 1,
        nextSequence: 2,
        latestCorrectWithoutHints: {
          sequence: 1,
          problemId: "guaranteed-sock-pair",
          observation,
          hintLevelsExposedBeforeCheckpoint: [],
          solutionExposedBeforeCheckpoint: false,
        },
        latestCorrectWithHints: null,
        latestIncorrect: null,
      });
      // Same local transition as the existing compatible recovery fixture.
      // Canonical adapter and transport are doubles; beta must not invoke either
      // the recovery planner or the importer merely to view History.
      const marker = JSON.stringify({
        sessionId,
        unfinishedBefore: JSON.stringify({
          sessionId,
          activeProblemIndex: 1,
          completedResults: [firstResult],
          activePractice: {
            status: "active",
            submissions: [{ answer: "7", outcome: "correct" }],
            hintExposures: [],
            solutionExposure: null,
          },
          rawAnswer: "7",
          reasoningCheckpointObservation: observation,
        }),
        completedBefore: null,
        progressBefore: null,
        completedAfter: JSON.stringify([firstResult, sockResult]),
        progressAfter: serverBacked ? null : progressAfter,
        ...(serverBacked ? { serverBacked: true } : {}),
      });
      const entries: [string, string][] = [
        [pendingKey, marker],
        [
          "olympiad-trainer:practice-server-finish-request",
          "retained request bytes",
        ],
      ];
      const store = storage(entries);
      expect(store.getItem(progressKey)).toBeNull();
      await expect(
        ensureServerProgressImported(store, true),
      ).resolves.toBeNull();
      await expect(
        ensureServerProgressImported(store, true),
      ).resolves.toBeNull();
      expect(mocks.current).toHaveBeenCalledTimes(4);
      expect(mocks.importEvidence).not.toHaveBeenCalled();
      expect(mocks.plan).not.toHaveBeenCalled();
      expect(mocks.mutate).not.toHaveBeenCalled();
      expect(store.length).toBe(entries.length);
      for (const [key, value] of entries)
        expect(store.getItem(key)).toBe(value);
    },
  );
  it("still imports a truly empty baseline on repeated reads without local writes", async () => {
    const store = storage();
    await ensureServerProgressImported(store, true);
    await ensureServerProgressImported(store, true);
    expect(mocks.importEvidence).toHaveBeenCalledTimes(2);
    expect(mocks.importEvidence).toHaveBeenNthCalledWith(1, null, mocks.owner);
    expect(mocks.importEvidence).toHaveBeenNthCalledWith(2, null, mocks.owner);
    expect(mocks.current).toHaveBeenCalledTimes(4);
    expect(mocks.plan).not.toHaveBeenCalled();
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(store.length).toBe(0);
  });
});

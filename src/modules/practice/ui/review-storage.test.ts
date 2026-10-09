import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import {
  completeServerBackedPracticeSession,
  createPracticeSessionSnapshot,
  readPracticeSessionSnapshot,
  readVerifiedLatestCompletedResults,
  saveNoNextPracticeSessionSnapshot,
  validatePracticeSessionSnapshot,
  type ServerPracticeFinishPayload,
  PRACTICE_SESSION_STORAGE_KEY,
} from "./practice-session-storage";
import type { AdaptivePracticeSessionState } from "./fixed-practice-session-state";
beforeEach(installImmediatePracticeSessionLock);
const session: AdaptivePracticeSessionState = {
  sessionId: "00000000-0000-4000-8000-000000000010",
  mode: "review",
  problemId: "coinciding-seats",
  activeProblemIndex: 0,
  completedResults: [],
};
function storage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}
const answer = {
  rawAnswer: "6",
  status: "correct" as const,
  practice: recordAnswerResult(startPractice(), {
    status: "correct",
    normalizedAnswer: "6",
  }),
};
const result = {
  problemId: "coinciding-seats",
  problemTitle: "Совпадающие места",
  summary: {
    outcome: "eventually-correct" as const,
    validSubmissionCount: 1,
    hintExposures: [],
    solutionExposure: null,
  },
};
describe("Review reuses durable browser Practice Finish and resume", () => {
  it("preserves mode and empty evidence across pause/lost Finish response/retry/Summary", async () => {
    const store = storage();
    expect(await createPracticeSessionSnapshot(session, answer, store)).toBe(
      true,
    );
    expect(await readPracticeSessionSnapshot(store)).toMatchObject({
      mode: "review",
      problemIds: ["coinciding-seats"],
    });
    const requests: ServerPracticeFinishPayload[] = [];
    expect(
      await completeServerBackedPracticeSession(
        session,
        answer,
        [result],
        store,
        async (request) => {
          requests.push(request);
          throw Error("lost response");
        },
      ),
    ).toBe("outcome-unknown");
    expect(requests[0]).toMatchObject({
      episodeMode: "review",
      contributions: [],
    });
    expect(requests[0].adaptiveFacts).toBeUndefined();
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
    expect(requests[1]).toEqual(requests[0]);
    expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    const verify = vi.fn();
    expect(
      await readVerifiedLatestCompletedResults(verify, store),
    ).toMatchObject({
      mode: "review",
      sessionId: session.sessionId,
      value: [result],
    });
    expect(verify).not.toHaveBeenCalled();
  });
  it("records Skip-only Review through no-next Finish without adaptive/checkpoint facts", async () => {
    const store = storage();
    const empty = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    expect(await createPracticeSessionSnapshot(session, empty, store)).toBe(
      true,
    );
    const skipped = {
      ...result,
      taskOutcome: "skipped" as const,
      summary: {
        ...result.summary,
        outcome: "no-valid-submissions" as const,
        validSubmissionCount: 0,
      },
    };
    const noNext = {
      sessionId: session.sessionId,
      mode: "review" as const,
      status: "no-next" as const,
      completedResults: [skipped] as const,
    };
    expect(await saveNoNextPracticeSessionSnapshot(noNext, store)).toBe(true);
    expect(await readPracticeSessionSnapshot(store)).toEqual(noNext);
    let request: ServerPracticeFinishPayload | undefined;
    expect(
      await completeServerBackedPracticeSession(
        noNext,
        null,
        [skipped],
        store,
        async (value) => {
          request = value;
        },
      ),
    ).toBe("completed");
    expect(request).toMatchObject({
      episodeMode: "review",
      contributions: [],
      episodeFacts: { problems: [{ skipped: true, checkpoint: null }] },
    });
    expect(request?.adaptiveFacts).toBeUndefined();
  });
  it("rejects Review identity mismatch and client checkpoint observations", async () => {
    const store = storage();
    await createPracticeSessionSnapshot(session, answer, store);
    const snapshot = await readPracticeSessionSnapshot(store);
    expect(
      validatePracticeSessionSnapshot({ ...snapshot, mode: "transfer" }),
    ).toBeNull();
    expect(
      validatePracticeSessionSnapshot({
        ...snapshot,
        problemIds: ["brothers-ages-products"],
      }),
    ).toBeNull();
    expect(
      validatePracticeSessionSnapshot({
        ...snapshot,
        reasoningCheckpointObservation: {
          checkpointId: "invented",
          selectedOptionId: "A",
          outcome: "correct",
          validSubmissionCountAtSubmit: 1,
        },
      }),
    ).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  recordHintExposure,
  recordSolutionExposure,
  startPractice,
} from "../application/practice-state";
import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
} from "./short-numeric-answer-state";
import {
  clearPracticeSessionSnapshot,
  completePracticeSession,
  createPracticeSessionSnapshot,
  getStoredProblemTitle,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  readVerifiedPracticeSessionSnapshot,
  restoreAnswerState,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  type PracticeSessionSnapshot,
  validatePracticeSessionSnapshot,
} from "./practice-session-storage";
import {
  advanceTwoProblemSession,
  startTwoProblemSession,
} from "./two-problem-session-state";

beforeEach(installImmediatePracticeSessionLock);

const first = {
  id: "coinciding-seats",
  title: "Совпадающие места",
  hints: [
    "coinciding-seats-focus-simultaneous-rules",
    "coinciding-seats-strategy-repeat-interval",
    "coinciding-seats-next-step-list-common-seats",
  ],
  solution: "coinciding-seats-full-solution",
} as const;
const second = {
  id: "guaranteed-sock-pair",
  title: "Носки в пакете",
} as const;

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

async function initialSnapshot() {
  const storage = memoryStorage();
  await createPracticeSessionSnapshot(
    startTwoProblemSession(),
    createShortNumericAnswerState(),
    storage,
  );
  return {
    storage,
    snapshot: JSON.parse(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
  };
}

async function seedActiveSnapshot(
  session: Parameters<typeof savePracticeSessionSnapshot>[0],
  answer: Parameters<typeof savePracticeSessionSnapshot>[1],
  storage: Storage,
) {
  expect(
    await createPracticeSessionSnapshot(
      {
        sessionId: session.sessionId,
        activeProblemIndex: 0,
        completedResults: [],
      },
      createShortNumericAnswerState(),
      storage,
    ),
  ).toBe(true);
  expect(await savePracticeSessionSnapshot(session, answer, storage)).toBe(
    true,
  );
}

async function readActiveSnapshot(
  storage: Storage,
): Promise<PracticeSessionSnapshot> {
  const snapshot = await readPracticeSessionSnapshot(storage);
  if (!snapshot || "status" in snapshot)
    throw new Error("Expected an active Practice snapshot");
  return snapshot;
}

function noNextSession() {
  const firstPractice = recordAnswerResult(startPractice(), {
    status: "correct",
    normalizedAnswer: "17",
  });
  const secondPractice = recordHintExposure(
    recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    }),
    {
      hintId: "guaranteed-sock-pair-focus-guarantee",
      level: "focus",
    },
  );
  return {
    sessionId: crypto.randomUUID(),
    status: "no-next" as const,
    completedResults: [
      {
        problemId: first.id,
        problemTitle: first.title,
        summary: getPracticeSummary(finishPractice(firstPractice)),
      },
      {
        problemId: second.id,
        problemTitle: second.title,
        summary: getPracticeSummary(finishPractice(secondPractice)),
        taskOutcome: "skipped" as const,
      },
      {
        problemId: "table-impossible-sums",
        problemTitle: "Невозможные суммы",
        summary: getPracticeSummary(finishPractice(startPractice())),
        taskOutcome: "skipped" as const,
      },
    ] as const,
  };
}

describe("unfinished Practice storage", () => {
  it("saves an untouched session and restores the same active problem", async () => {
    const { storage } = await initialSnapshot();
    const snapshot = await readActiveSnapshot(storage);

    expect(snapshot.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(snapshot.activeProblemIndex).toBe(0);
    expect(snapshot.completedResults).toEqual([]);
    expect(snapshot.activePractice).toEqual(startPractice());
    expect(getStoredProblemTitle(snapshot)).toBe(first.title);
    expect(restoreAnswerState(snapshot).status).toBe("typing");
  });

  it("assigns and persists one session ID when restoring valid legacy active and no-next snapshots", async () => {
    for (const source of [
      (await initialSnapshot()).snapshot,
      noNextSession(),
    ]) {
      const storage = memoryStorage();
      const { sessionId: _priorId, ...legacy } = source;
      expect(_priorId).toBeDefined();
      storage.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(legacy));

      const migrated = (
        await readVerifiedPracticeSessionSnapshot(async () => {
          throw new Error("No checkpoint verification expected");
        }, storage)
      ).value;
      expect(migrated?.sessionId).toMatch(/^[0-9a-f-]{36}$/);
      expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(
        JSON.stringify(migrated),
      );
      expect(await readPracticeSessionSnapshot(storage)).toEqual(migrated);
    }
  });

  it("does not continue a legacy restore until its session ID is persisted", async () => {
    const storage = memoryStorage();
    const { sessionId: _priorId, ...legacy } = noNextSession();
    expect(_priorId).toBeDefined();
    const original = JSON.stringify(legacy);
    storage.setItem(PRACTICE_SESSION_STORAGE_KEY, original);
    const failedMigration = {
      ...storage,
      setItem: () => {
        throw new Error("Storage write failed");
      },
    } as Storage;

    await expect(
      readVerifiedPracticeSessionSnapshot(async () => {
        throw new Error("No checkpoint verification expected");
      }, failedMigration),
    ).rejects.toThrow("Storage write failed");
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(original);
    expect((await readPracticeSessionSnapshot(storage))?.sessionId).toMatch(
      /^[0-9a-f-]{36}$/,
    );
  });

  it("retains a dirty draft and factual incorrect submission without inventing an attempt", async () => {
    const storage = memoryStorage();
    const incorrect = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    });
    await seedActiveSnapshot(
      startTwoProblemSession(),
      editShortNumericAnswer(
        {
          rawAnswer: "16",
          status: "incorrect",
          practice: incorrect,
        },
        "18",
      ),
      storage,
    );
    const snapshot = await readActiveSnapshot(storage);

    expect(snapshot.rawAnswer).toBe("18");
    expect(snapshot.activePractice.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
    ]);
    expect(restoreAnswerState(snapshot)).toMatchObject({
      rawAnswer: "18",
      status: "typing",
    });
    expect(restoreAnswerState(snapshot).practice.submissions).toHaveLength(1);
  });

  it("keeps later submissions after a correct answer without erasing the earlier success", async () => {
    const storage = memoryStorage();
    const correct = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: "17",
    });
    const later = recordAnswerResult(correct, {
      status: "incorrect",
      normalizedAnswer: "16",
    });
    await seedActiveSnapshot(
      startTwoProblemSession(),
      { rawAnswer: "16", status: "incorrect", practice: later },
      storage,
    );

    const restored = await readActiveSnapshot(storage);
    expect(restored.activePractice.submissions).toEqual([
      { answer: "17", outcome: "correct" },
      { answer: "16", outcome: "incorrect" },
    ]);
    expect(restoreAnswerState(restored).status).toBe("incorrect");
  });

  it("retains hint and solution evidence once without storing protected text", async () => {
    const storage = memoryStorage();
    let practice = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "16",
    });
    for (const [index, hintId] of first.hints.entries()) {
      practice = recordHintExposure(practice, {
        hintId,
        level: ["focus", "strategy", "next-step"][index] as
          "focus" | "strategy" | "next-step",
      });
    }
    practice = recordSolutionExposure(practice, { solutionId: first.solution });
    await seedActiveSnapshot(
      startTwoProblemSession(),
      { rawAnswer: "16", status: "incorrect", practice },
      storage,
    );
    const raw = storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!;
    const restored = await readActiveSnapshot(storage);

    expect(restored.activePractice).toEqual(practice);
    expect(restored.activePractice.hintExposures).toHaveLength(3);
    expect(restored.activePractice.solutionExposure).toEqual({
      solutionId: first.solution,
      validSubmissionCountAtOpen: 1,
    });
    expect(raw).not.toContain("text");
    expect(raw).not.toContain("expectedAnswer");
    expect(raw).not.toContain("assessment");
    expect(raw).not.toContain("loading");
  });

  it("restores skipped problem 1 and a separate active problem 2 in order", async () => {
    const storage = memoryStorage();
    const firstPractice = recordHintExposure(startPractice(), {
      hintId: first.hints[0],
      level: "focus",
    });
    const summary = getPracticeSummary(finishPractice(firstPractice));
    const session = advanceTwoProblemSession(startTwoProblemSession(), {
      problemId: first.id,
      problemTitle: first.title,
      summary,
      taskOutcome: "skipped",
    })!;
    await seedActiveSnapshot(
      session,
      editShortNumericAnswer(createShortNumericAnswerState(), "6"),
      storage,
    );
    const restored = await readActiveSnapshot(storage);

    expect(restored.activeProblemIndex).toBe(1);
    expect(restored.completedResults).toEqual([
      {
        problemId: first.id,
        problemTitle: first.title,
        summary,
        taskOutcome: "skipped",
      },
    ]);
    expect(restored.activePractice).toEqual(startPractice());
    expect(restored.rawAnswer).toBe("6");
    expect(getStoredProblemTitle(restored)).toBe(second.title);
  });

  it("rejects malformed, stale, impossible, and protected-content snapshots", async () => {
    const { snapshot } = await initialSnapshot();
    const invalid = [
      { ...snapshot, sessionId: "not-a-uuid" },
      { ...snapshot, problemIds: ["unknown", second.id] },
      { ...snapshot, activeProblemIndex: 1 },
      { ...snapshot, rawAnswer: 4 },
      { ...snapshot, expectedAnswer: "17" },
      {
        ...snapshot,
        activePractice: { ...snapshot.activePractice, status: "loading" },
      },
      {
        ...snapshot,
        activePractice: {
          ...snapshot.activePractice,
          submissions: [{ answer: "abc", outcome: "correct" }],
        },
      },
      {
        ...snapshot,
        activePractice: {
          ...snapshot.activePractice,
          hintExposures: [
            {
              hintId: "unknown",
              level: "focus",
              validSubmissionCountAtOpen: 0,
            },
          ],
        },
      },
      {
        ...snapshot,
        activePractice: {
          ...snapshot.activePractice,
          solutionExposure: {
            solutionId: "unknown",
            validSubmissionCountAtOpen: 0,
          },
        },
      },
    ];

    for (const value of invalid) {
      expect(validatePracticeSessionSnapshot(value)).toBeNull();
    }
    const storage = memoryStorage();
    storage.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(invalid[0]));
    expect(await readPracticeSessionSnapshot(storage)).toBeNull();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("accepts reachable completed evidence and explicit Skip", async () => {
    const { snapshot } = await initialSnapshot();
    const withResult = (summary: unknown, taskOutcome?: "skipped") => ({
      ...snapshot,
      activeProblemIndex: 1,
      completedResults: [
        {
          problemId: first.id,
          problemTitle: first.title,
          summary,
          ...(taskOutcome ? { taskOutcome } : {}),
        },
      ],
    });
    const focusAtOne = {
      hintId: first.hints[0],
      level: "focus",
      validSubmissionCountAtOpen: 1,
    };
    const hintsAtZero = first.hints.map((hintId, index) => ({
      hintId,
      level: ["focus", "strategy", "next-step"][index],
      validSubmissionCountAtOpen: 0,
    }));

    expect(
      validatePracticeSessionSnapshot(
        withResult({
          outcome: "eventually-correct",
          validSubmissionCount: 2,
          hintExposures: [focusAtOne],
          solutionExposure: null,
        }),
      ),
    ).not.toBeNull();
    expect(
      validatePracticeSessionSnapshot(
        withResult({
          outcome: "incorrect-only",
          validSubmissionCount: 1,
          hintExposures: hintsAtZero,
          solutionExposure: {
            solutionId: first.solution,
            validSubmissionCountAtOpen: 1,
          },
        }),
      ),
    ).not.toBeNull();
    expect(
      validatePracticeSessionSnapshot(
        withResult(
          {
            outcome: "incorrect-only",
            validSubmissionCount: 1,
            hintExposures: [focusAtOne],
            solutionExposure: null,
          },
          "skipped",
        ),
      ),
    ).not.toBeNull();
  });

  it("rejects unreachable completed-result exposure histories", async () => {
    const { snapshot } = await initialSnapshot();
    const withResult = (summary: unknown, taskOutcome?: "skipped") => ({
      ...snapshot,
      activeProblemIndex: 1,
      completedResults: [
        {
          problemId: first.id,
          problemTitle: first.title,
          summary,
          ...(taskOutcome ? { taskOutcome } : {}),
        },
      ],
    });
    const hints = first.hints.map((hintId, index) => ({
      hintId,
      level: ["focus", "strategy", "next-step"][index],
      validSubmissionCountAtOpen: 0,
    }));
    const validSummary = {
      outcome: "incorrect-only",
      validSubmissionCount: 1,
      hintExposures: hints,
      solutionExposure: {
        solutionId: first.solution,
        validSubmissionCountAtOpen: 1,
      },
    };
    const impossible = [
      withResult({
        ...validSummary,
        solutionExposure: {
          solutionId: first.solution,
          validSubmissionCountAtOpen: 0,
        },
      }),
      withResult({ ...validSummary, outcome: "eventually-correct" }),
      withResult({
        ...validSummary,
        outcome: "eventually-correct",
        hintExposures: [
          {
            ...hints[0],
            validSubmissionCountAtOpen: 1,
          },
        ],
        solutionExposure: null,
      }),
      withResult(
        {
          ...validSummary,
          hintExposures: [
            {
              ...hints[0],
              validSubmissionCountAtOpen: 2,
            },
          ],
          solutionExposure: null,
        },
        "skipped",
      ),
      withResult(
        {
          ...validSummary,
          hintExposures: [
            {
              ...hints[1],
              validSubmissionCountAtOpen: 0,
            },
          ],
          solutionExposure: null,
        },
        "skipped",
      ),
      withResult(
        {
          ...validSummary,
          hintExposures: [
            {
              ...hints[0],
              level: "strategy",
            },
          ],
          solutionExposure: null,
        },
        "skipped",
      ),
      withResult({ ...validSummary, solutionExposure: null }),
      {
        ...withResult(validSummary),
        completedResults: [
          {
            problemId: second.id,
            problemTitle: second.title,
            summary: validSummary,
          },
        ],
      },
    ];

    for (const value of impossible) {
      expect(validatePracticeSessionSnapshot(value)).toBeNull();
    }
  });

  it("does not persist transient loading or system states as evidence", async () => {
    for (const status of ["loading", "system"] as const) {
      const storage = memoryStorage();
      await seedActiveSnapshot(
        startTwoProblemSession(),
        { rawAnswer: "16", status, practice: startPractice() },
        storage,
      );
      const restored = await readActiveSnapshot(storage);
      expect(restoreAnswerState(restored).status).toBe("typing");
      expect(restored.activePractice.submissions).toEqual([]);
      expect(restored.activePractice.hintExposures).toEqual([]);
    }
  });

  it("clears the unfinished snapshot after explicit Finish", async () => {
    const { storage } = await initialSnapshot();
    expect(await clearPracticeSessionSnapshot(storage)).toBe(true);
    expect(await readPracticeSessionSnapshot(storage)).toBeNull();
  });

  it("reports failed writes and removals so Pause and Finish can be retried", async () => {
    const storage = memoryStorage();
    const session = startTwoProblemSession();
    const oldAnswer = editShortNumericAnswer(
      createShortNumericAnswerState(),
      "old",
    );
    const newAnswer = editShortNumericAnswer(oldAnswer, "new draft");
    await seedActiveSnapshot(session, oldAnswer, storage);
    const failingStorage = {
      ...storage,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };

    expect(
      await savePracticeSessionSnapshot(session, newAnswer, failingStorage),
    ).toBe(false);
    expect((await readActiveSnapshot(storage)).rawAnswer).toBe("old");
    expect(await clearPracticeSessionSnapshot(failingStorage)).toBe(false);
    expect(await readPracticeSessionSnapshot(storage)).not.toBeNull();
    expect(await savePracticeSessionSnapshot(session, newAnswer, storage)).toBe(
      true,
    );
    expect((await readActiveSnapshot(storage)).rawAnswer).toBe("new draft");
    expect(await clearPracticeSessionSnapshot(storage)).toBe(true);
    expect(await readPracticeSessionSnapshot(storage)).toBeNull();
  });

  it("rechecks ownership inside the lock after another tab replaces the session", async () => {
    const storage = memoryStorage();
    const firstSession = startTwoProblemSession();
    const secondSession = startTwoProblemSession();
    const answer = createShortNumericAnswerState();
    await seedActiveSnapshot(firstSession, answer, storage);
    const secondRaw = JSON.stringify({
      ...JSON.parse(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
      sessionId: secondSession.sessionId,
    });
    let enterOtherTab!: () => void;
    let releaseOtherTab!: () => void;
    const otherTabEntered = new Promise<void>((resolve) => {
      enterOtherTab = resolve;
    });
    const otherTabHeld = new Promise<void>((resolve) => {
      releaseOtherTab = resolve;
    });
    let queue: Promise<unknown> = Promise.resolve();
    vi.stubGlobal("navigator", {
      locks: {
        request: (
          name: string,
          options: LockOptions,
          operation: () => unknown,
        ) => {
          expect(name).toBe("olympiad-trainer:practice-session-mutation");
          expect(options.mode).toBe("exclusive");
          const result = queue.then(operation);
          queue = result.then(
            () => undefined,
            () => undefined,
          );
          return result;
        },
      },
    });

    const otherTabWrite = navigator.locks.request(
      "olympiad-trainer:practice-session-mutation",
      { mode: "exclusive" },
      async () => {
        enterOtherTab();
        await otherTabHeld;
        storage.setItem(PRACTICE_SESSION_STORAGE_KEY, secondRaw);
      },
    );
    await otherTabEntered;
    const staleWrite = savePracticeSessionSnapshot(
      firstSession,
      editShortNumericAnswer(answer, "7"),
      storage,
    );
    releaseOtherTab();
    await otherTabWrite;
    expect(await staleWrite).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(secondRaw);
  });

  it("fails closed when the Practice lock is unavailable", async () => {
    const storage = memoryStorage();
    const session = noNextSession();
    expect(
      await createPracticeSessionSnapshot(
        {
          sessionId: session.sessionId,
          activeProblemIndex: 0,
          completedResults: [],
        },
        createShortNumericAnswerState(),
        storage,
      ),
    ).toBe(true);
    expect(await saveNoNextPracticeSessionSnapshot(session, storage)).toBe(
      true,
    );
    const before = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    vi.stubGlobal("navigator", {});

    expect(await saveNoNextPracticeSessionSnapshot(session, storage)).toBe(
      false,
    );
    expect(
      await completePracticeSession(
        session,
        null,
        session.completedResults,
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(before);
  });

  it("persists and reloads no-next without an active episode or protected text", async () => {
    const storage = memoryStorage();
    const session = noNextSession();

    expect(
      await createPracticeSessionSnapshot(
        {
          sessionId: session.sessionId,
          activeProblemIndex: 0,
          completedResults: [],
        },
        createShortNumericAnswerState(),
        storage,
      ),
    ).toBe(true);
    expect(await saveNoNextPracticeSessionSnapshot(session, storage)).toBe(
      true,
    );
    expect(await readPracticeSessionSnapshot(storage)).toEqual(session);
    const raw = storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!;
    expect(JSON.parse(raw)).toEqual(session);
    expect(raw).not.toContain("activeProblemIndex");
    expect(raw).not.toContain("activePractice");
    expect(raw).not.toContain("rawAnswer");
    expect(raw).not.toContain("text");
    expect(raw).not.toContain("expectedAnswer");
  });

  it("rejects malformed or impossible no-next snapshots and removes them", async () => {
    const session = noNextSession();
    const [firstResult, secondResult, thirdResult] = session.completedResults;
    const invalid = [
      { ...session, sessionId: "not-a-uuid" },
      { ...session, activeProblemIndex: 1 },
      {
        ...session,
        completedResults: [secondResult, firstResult, thirdResult],
      },
      { ...session, completedResults: [firstResult] },
      {
        ...session,
        completedResults: [
          firstResult,
          { ...secondResult, taskOutcome: undefined },
          thirdResult,
        ],
      },
      {
        ...session,
        completedResults: [
          {
            ...firstResult,
            summary: { ...firstResult.summary, outcome: "incorrect-only" },
          },
          secondResult,
          thirdResult,
        ],
      },
      {
        ...session,
        completedResults: [
          firstResult,
          { ...secondResult, problemTitle: "Wrong" },
          thirdResult,
        ],
      },
      {
        ...session,
        completedResults: [
          firstResult,
          {
            ...secondResult,
            summary: {
              ...secondResult.summary,
              hintExposures: [
                {
                  hintId: "unknown",
                  level: "focus",
                  validSubmissionCountAtOpen: 1,
                },
              ],
            },
          },
          thirdResult,
        ],
      },
      {
        ...session,
        completedResults: [
          firstResult,
          {
            ...secondResult,
            summary: {
              ...secondResult.summary,
              solutionExposure: {
                solutionId: "guaranteed-sock-pair-full-solution",
                validSubmissionCountAtOpen: 1,
              },
            },
          },
          thirdResult,
        ],
      },
    ];

    for (const value of invalid) {
      expect(validatePracticeSessionSnapshot(value)).toBeNull();
      const storage = memoryStorage();
      storage.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(value));
      expect(await readPracticeSessionSnapshot(storage)).toBeNull();
      expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    }
  });
});

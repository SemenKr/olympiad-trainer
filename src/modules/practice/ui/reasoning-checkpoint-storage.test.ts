import { beforeEach, describe, expect, it, vi } from "vitest";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";

vi.mock("server-only", () => ({}));

import { verifyPersistedReasoningCheckpointObservation } from "../../../app/practice/actions";

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  recordHintExposure,
  startPractice,
} from "../application/practice-state";
import {
  SOCK_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointObservation,
} from "../application/reasoning-checkpoint";
import {
  completePracticeSession,
  createPracticeSessionSnapshot,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  readLatestCompletedResults,
  readPracticeSessionSnapshot,
  readVerifiedLatestCompletedResults,
  readVerifiedPracticeSessionSnapshot,
  saveLatestCompletedResults,
  savePracticeSessionSnapshot,
  validateLatestCompletedResults,
  validatePracticeSessionSnapshot,
} from "./practice-session-storage";
import { createShortNumericAnswerState } from "./short-numeric-answer-state";
import {
  advanceTwoProblemSession,
  createPracticeSessionResult,
  startTwoProblemSession,
} from "./two-problem-session-state";

beforeEach(installImmediatePracticeSessionLock);

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

async function seedCheckpointSnapshot(
  storage: Storage,
  evidence: ReasoningCheckpointObservation,
): Promise<boolean> {
  return (
    (await createPracticeSessionSnapshot(
      {
        sessionId: secondSession.sessionId,
        activeProblemIndex: 0,
        completedResults: [],
      },
      createShortNumericAnswerState(),
      storage,
    )) &&
    (await savePracticeSessionSnapshot(
      secondSession,
      answer,
      storage,
      evidence,
    ))
  );
}

const firstProblem = {
  problemId: "coinciding-seats",
  response: { kind: "short-numeric" },
  title: "Совпадающие места",
  statement: "First problem",
  hints: [
    { hintId: "coinciding-seats-focus-simultaneous-rules", level: "focus" },
    { hintId: "coinciding-seats-strategy-repeat-interval", level: "strategy" },
    {
      hintId: "coinciding-seats-next-step-list-common-seats",
      level: "next-step",
    },
  ],
  solution: { solutionId: "coinciding-seats-full-solution" },
} as const;
const secondProblem = {
  problemId: "guaranteed-sock-pair",
  response: { kind: "short-numeric" },
  title: "Носки в пакете",
  statement: "Second problem",
  hints: [
    { hintId: "guaranteed-sock-pair-focus-guarantee", level: "focus" },
    { hintId: "guaranteed-sock-pair-strategy-worst-case", level: "strategy" },
    {
      hintId: "guaranteed-sock-pair-next-step-bound-without-pair",
      level: "next-step",
    },
  ],
  solution: { solutionId: "guaranteed-sock-pair-full-solution" },
  reasoningCheckpoint: { checkpointId: SOCK_REASONING_CHECKPOINT_ID },
} as const;
const firstPractice = recordAnswerResult(startPractice(), {
  status: "correct",
  normalizedAnswer: "17",
});
const firstResult = createPracticeSessionResult(
  firstProblem,
  getPracticeSummary(finishPractice(firstPractice)),
);
const secondSession = advanceTwoProblemSession(
  startTwoProblemSession(),
  firstResult,
)!;
const secondPractice = recordAnswerResult(
  recordHintExposure(
    recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "6",
    }),
    { hintId: "guaranteed-sock-pair-focus-guarantee", level: "focus" },
  ),
  { status: "correct", normalizedAnswer: "7" },
);
const answer = {
  rawAnswer: "7",
  status: "correct" as const,
  practice: secondPractice,
};
const observation: ReasoningCheckpointObservation = {
  checkpointId: SOCK_REASONING_CHECKPOINT_ID,
  selectedOptionId: "A",
  outcome: "correct",
  validSubmissionCountAtSubmit: 2,
};
const secondResult = createPracticeSessionResult(
  secondProblem,
  getPracticeSummary(finishPractice(secondPractice)),
  undefined,
  observation,
  2,
);

describe("reasoning checkpoint persistence", () => {
  it.each([
    ["A", "correct", true],
    ["B", "incorrect", true],
    ["C", "incorrect", true],
    ["A", "incorrect", false],
    ["B", "correct", false],
    ["C", "correct", false],
  ] as const)(
    "gates restored %s + %s evidence (%s)",
    async (selectedOptionId, outcome, valid) => {
      const storage = memoryStorage();
      const evidence = { ...observation, selectedOptionId, outcome };
      const result = {
        ...secondResult,
        reasoningCheckpointObservation: evidence,
      };
      expect(await seedCheckpointSnapshot(storage, evidence)).toBe(true);
      expect(
        validatePracticeSessionSnapshot(
          JSON.parse(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
        ),
      ).not.toBeNull();
      const restored = await readVerifiedPracticeSessionSnapshot(
        verifyPersistedReasoningCheckpointObservation,
        storage,
      );
      expect(restored.value !== null).toBe(valid);
      expect(
        restored.interpretation?.progressGroup === "Начинаю разбираться",
      ).toBe(valid && selectedOptionId === "A");
      expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY) !== null).toBe(
        valid,
      );

      const completedRaw = JSON.stringify([firstResult, result]);
      storage.setItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY, completedRaw);
      expect(
        validateLatestCompletedResults([firstResult, result]),
      ).not.toBeNull();
      const completed = await readVerifiedLatestCompletedResults(
        verifyPersistedReasoningCheckpointObservation,
        storage,
      );
      expect(completed.value !== null).toBe(valid);
      expect(
        completed.interpretation?.progressGroup === "Начинаю разбираться",
      ).toBe(valid && selectedOptionId === "A");
      expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
        completedRaw,
      );
    },
  );

  it("keeps a valid snapshot for retry when server verification is unavailable", async () => {
    const storage = memoryStorage();
    expect(await seedCheckpointSnapshot(storage, observation)).toBe(true);
    const before = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    await expect(
      readVerifiedPracticeSessionSnapshot(async () => {
        throw new Error("Network unavailable");
      }, storage),
    ).rejects.toThrow("Network unavailable");
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(before);
  });

  it("does not let stale verification delete a newer unfinished episode", async () => {
    const storage = memoryStorage();
    expect(
      await seedCheckpointSnapshot(storage, {
        ...observation,
        selectedOptionId: "B",
        outcome: "correct",
      }),
    ).toBe(true);
    let resolveVerification!: (value: { valid: false }) => void;
    const verification = new Promise<{ valid: false }>((resolve) => {
      resolveVerification = resolve;
    });
    const verify = vi.fn(() => verification);
    const pending = readVerifiedPracticeSessionSnapshot(verify, storage);
    const replacement = JSON.stringify({
      sessionId: crypto.randomUUID(),
      problemIds: [
        "coinciding-seats",
        "guaranteed-sock-pair",
        "table-impossible-sums",
      ],
      activeProblemIndex: 0,
      completedResults: [],
      activePractice: startPractice(),
      rawAnswer: "",
    });
    storage.setItem(PRACTICE_SESSION_STORAGE_KEY, replacement);
    resolveVerification({ valid: false });
    expect(await pending).toEqual({
      value: JSON.parse(replacement),
      interpretation: null,
    });
    expect(verify).not.toHaveBeenCalled();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(replacement);
  });

  it("rejects checkpoint evidence attached to no-next Skip before server verification", async () => {
    const storage = memoryStorage();
    const noNext = {
      sessionId: crypto.randomUUID(),
      status: "no-next",
      completedResults: [
        firstResult,
        {
          problemId: "guaranteed-sock-pair",
          problemTitle: "Носки в пакете",
          summary: getPracticeSummary(finishPractice(startPractice())),
          taskOutcome: "skipped",
          reasoningCheckpointObservation: observation,
          firstCorrectSubmissionCount: 1,
        },
      ],
    };
    storage.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(noNext));
    const verify = vi.fn(verifyPersistedReasoningCheckpointObservation);
    expect(
      (await readVerifiedPracticeSessionSnapshot(verify, storage)).value,
    ).toBeNull();
    expect(verify).not.toHaveBeenCalled();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
  });
  it("restores one factual observation without protected content or a renewed attempt", async () => {
    const storage = memoryStorage();
    expect(await seedCheckpointSnapshot(storage, observation)).toBe(true);
    const raw = storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!;
    const restored = await readPracticeSessionSnapshot(storage);
    expect(restored).toMatchObject({
      activeProblemIndex: 1,
      reasoningCheckpointObservation: observation,
      activePractice: { submissions: secondPractice.submissions },
    });
    expect(raw).not.toContain("Почему 7 носков");
    expect(raw).not.toContain("Если нужной пары нет");
    expect(raw).not.toContain("correctOptionId");
    expect(raw).not.toContain("expectedAnswer");
  });

  it("transitions the observation to ordered completed results", async () => {
    const storage = memoryStorage();
    const results = [firstResult, secondResult];
    expect(await seedCheckpointSnapshot(storage, observation)).toBe(true);
    expect(
      await completePracticeSession(secondSession, answer, results, storage),
    ).toBe(true);
    expect(await readPracticeSessionSnapshot(storage)).toBeNull();
    expect(readLatestCompletedResults(storage)).toEqual(results);
    const raw = storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!;
    expect(raw).not.toContain("rawAnswer");
    expect(raw).not.toContain("Почему 7 носков");
    expect(raw).not.toContain("correctOptionId");
  });

  it("restores checkpoint evidence and preserves the previous Summary when Finish write fails", async () => {
    const storage = memoryStorage();
    const prior = [firstResult];
    expect(saveLatestCompletedResults(prior, storage)).toBe(true);
    expect(await seedCheckpointSnapshot(storage, observation)).toBe(true);
    const failingStorage = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key === PRACTICE_LATEST_COMPLETED_STORAGE_KEY)
          throw new Error("QuotaExceededError");
        storage.setItem(key, value);
      },
    } as Storage;
    expect(
      await completePracticeSession(
        secondSession,
        answer,
        [firstResult, secondResult],
        failingStorage,
      ),
    ).toBe(false);
    expect(await readPracticeSessionSnapshot(storage)).toMatchObject({
      activeProblemIndex: 1,
      reasoningCheckpointObservation: observation,
    });
    expect(readLatestCompletedResults(storage)).toEqual(prior);
    expect(
      await completePracticeSession(
        secondSession,
        answer,
        [firstResult, secondResult],
        storage,
      ),
    ).toBe(true);
    expect(readLatestCompletedResults(storage)).toEqual([
      firstResult,
      secondResult,
    ]);
  });

  it("fails closed for forged, repeated, premature, or misplaced evidence", async () => {
    const storage = memoryStorage();
    expect(await seedCheckpointSnapshot(storage, observation)).toBe(true);
    const active = JSON.parse(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!);
    const completed = [firstResult, secondResult];
    const badObservation = [
      { ...observation, checkpointId: "unknown" },
      { ...observation, selectedOptionId: "D" },
      { ...observation, outcome: "maybe" },
      { ...observation, validSubmissionCountAtSubmit: 1 },
      { ...observation, validSubmissionCountAtSubmit: 3 },
      { ...observation, repeated: true },
      [observation, observation],
    ];
    for (const evidence of badObservation) {
      expect(
        validatePracticeSessionSnapshot({
          ...active,
          reasoningCheckpointObservation: evidence,
        }),
      ).toBeNull();
      expect(
        validateLatestCompletedResults([
          firstResult,
          { ...secondResult, reasoningCheckpointObservation: evidence },
        ]),
      ).toBeNull();
    }
    expect(
      validatePracticeSessionSnapshot({
        ...active,
        activeProblemIndex: 0,
        completedResults: [],
        reasoningCheckpointObservation: observation,
      }),
    ).toBeNull();
    expect(
      validatePracticeSessionSnapshot({
        ...active,
        activePractice: {
          ...active.activePractice,
          submissions: [{ answer: "6", outcome: "incorrect" }],
        },
      }),
    ).toBeNull();
    expect(
      validateLatestCompletedResults([
        {
          ...firstResult,
          reasoningCheckpointObservation: observation,
          firstCorrectSubmissionCount: 1,
        },
      ]),
    ).toBeNull();
    expect(
      validateLatestCompletedResults([
        firstResult,
        {
          ...secondResult,
          firstCorrectSubmissionCount: 1,
        },
      ]),
    ).toBeNull();
    expect(
      validateLatestCompletedResults([
        firstResult,
        {
          ...secondResult,
          firstCorrectSubmissionCount: 3,
        },
      ]),
    ).toBeNull();
    expect(
      validateLatestCompletedResults([
        firstResult,
        {
          ...secondResult,
          firstCorrectSubmissionCount: 2,
          taskOutcome: "skipped",
        },
      ]),
    ).toBeNull();
    expect(validateLatestCompletedResults(completed)).toEqual(completed);
  });
});

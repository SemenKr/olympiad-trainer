import { beforeEach, describe, expect, it, vi } from "vitest";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/practice/actions", () => ({
  revealReasoningCheckpoint: vi.fn(),
  revealPracticeHint: vi.fn(),
  revealPracticeSolution: vi.fn(),
  submitReasoningCheckpointOption: vi.fn(),
  submitPracticeAnswer: vi.fn(),
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));

import { verifyPersistedGuaranteeEvidenceFacts } from "../../../app/practice/actions";
import {
  appendGuaranteeEvidence,
  deriveGuaranteeProgressInterpretation,
  emptyGuaranteeProgressEvidence,
  getGuaranteeEvidenceContribution,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceFact,
} from "../application/guarantee-progress-evidence";
import {
  recordAnswerResult,
  startPractice,
  type PracticeSummary,
} from "../application/practice-state";
import { SOCK_REASONING_CHECKPOINT_ID } from "../application/reasoning-checkpoint";
import {
  finishPracticeSessionAndNavigate,
  savePracticeSessionWhileActive,
} from "./practice-session";
import {
  createPracticeSessionSnapshot,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  saveLatestCompletedResults,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
} from "./practice-session-storage";
import { createShortNumericAnswerState } from "./short-numeric-answer-state";
import {
  PROGRESS_EVIDENCE_STORAGE_KEY,
  readVerifiedGuaranteeProgressEvidence,
} from "./progress-evidence-storage";
import type { PracticeSessionResult } from "./two-problem-session-state";
import type { NoNextPracticeSessionState as NoNextTwoProblemSessionState } from "./fixed-practice-session-state";

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

async function seedActiveSnapshot(
  session: Parameters<typeof savePracticeSessionSnapshot>[0],
  answer: Parameters<typeof savePracticeSessionSnapshot>[1],
  storage: Storage,
  observation?: Parameters<typeof savePracticeSessionSnapshot>[3],
): Promise<boolean> {
  return (
    (await createPracticeSessionSnapshot(
      {
        sessionId: session.sessionId,
        activeProblemIndex: 0,
        completedResults: [],
      },
      createShortNumericAnswerState(),
      storage,
    )) &&
    (await savePracticeSessionSnapshot(session, answer, storage, observation))
  );
}

async function seedNoNextSnapshot(
  session: NoNextTwoProblemSessionState,
  storage: Storage,
): Promise<boolean> {
  return (
    (await createPracticeSessionSnapshot(
      {
        sessionId: session.sessionId,
        activeProblemIndex: 0,
        completedResults: [],
      },
      createShortNumericAnswerState(),
      storage,
    )) && (await saveNoNextPracticeSessionSnapshot(session, storage))
  );
}

const firstResult: PracticeSessionResult = {
  problemId: "coinciding-seats",
  problemTitle: "Совпадающие места",
  summary: {
    outcome: "eventually-correct",
    validSubmissionCount: 1,
    hintExposures: [],
    solutionExposure: null,
  },
};
const observation = {
  checkpointId: SOCK_REASONING_CHECKPOINT_ID,
  selectedOptionId: "A" as const,
  outcome: "correct" as const,
  validSubmissionCountAtSubmit: 1,
};
const sockSummary: PracticeSummary = {
  outcome: "eventually-correct",
  validSubmissionCount: 1,
  hintExposures: [],
  solutionExposure: null,
};
const sockResult: PracticeSessionResult = {
  problemId: "guaranteed-sock-pair",
  problemTitle: "Носки в пакете",
  summary: sockSummary,
  reasoningCheckpointObservation: observation,
  firstCorrectSubmissionCount: 1,
};
const session = {
  sessionId: crypto.randomUUID(),
  activeProblemIndex: 1 as const,
  completedResults: [firstResult],
};
const answer = {
  rawAnswer: "7",
  status: "correct" as const,
  practice: recordAnswerResult(startPractice(), {
    status: "correct",
    normalizedAnswer: "7",
  }),
};

function fact(
  sequence: number,
  selectedOptionId: "A" | "B" | "C",
  outcome: "correct" | "incorrect",
  hints: readonly ("focus" | "strategy" | "next-step")[] = [],
): GuaranteeEvidenceFact {
  return {
    sequence,
    problemId: "guaranteed-sock-pair",
    observation: { ...observation, selectedOptionId, outcome },
    hintLevelsExposedBeforeCheckpoint: hints,
    solutionExposedBeforeCheckpoint: false,
  };
}

describe("guarantee Progress evidence", () => {
  it("replaces only the contributed slot and derives bounded sequence-aware wording", async () => {
    const independent = getGuaranteeEvidenceContribution(sockResult)!;
    const supported = getGuaranteeEvidenceContribution({
      ...sockResult,
      summary: {
        ...sockSummary,
        hintExposures: [
          {
            hintId: "guaranteed-sock-pair-focus-guarantee",
            level: "focus",
            validSubmissionCountAtOpen: 0,
          },
        ],
      },
    })!;
    const incorrect = {
      ...independent,
      observation: {
        ...observation,
        selectedOptionId: "B" as const,
        outcome: "incorrect" as const,
      },
    };
    const first = appendGuaranteeEvidence(
      emptyGuaranteeProgressEvidence(),
      independent,
    )!;
    expect(first.latestCorrectWithoutHints?.sequence).toBe(1);
    expect(first.nextSequence).toBe(2);
    expect(deriveGuaranteeProgressInterpretation(first).conclusion).toBe(
      "Без открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Это пока показывает распознавание готового аргумента, а не самостоятельное доказательство.",
    );
    const second = appendGuaranteeEvidence(first, supported)!;
    expect(second.latestCorrectWithoutHints).toEqual(
      first.latestCorrectWithoutHints,
    );
    expect(second.latestCorrectWithHints?.sequence).toBe(2);
    const supportedOnly = appendGuaranteeEvidence(
      emptyGuaranteeProgressEvidence(),
      supported,
    )!;
    expect(
      deriveGuaranteeProgressInterpretation(supportedOnly).conclusion,
    ).toBe(
      "После открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Самостоятельное построение такого доказательства пока не проверено.",
    );
    const third = appendGuaranteeEvidence(second, incorrect)!;
    expect(third.latestCorrectWithoutHints).toEqual(
      first.latestCorrectWithoutHints,
    );
    expect(third.latestCorrectWithHints).toEqual(second.latestCorrectWithHints);
    expect(third.latestIncorrect?.sequence).toBe(3);
    expect(deriveGuaranteeProgressInterpretation(third)).toMatchObject({
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Раньше ты верно выбирал подходящее объяснение, но в более поздней такой проверке ответ был другим. Пока рано говорить о стабильности.",
    });
    const fourth = appendGuaranteeEvidence(third, supported)!;
    expect(fourth.latestCorrectWithHints?.sequence).toBe(4);
    expect(fourth.latestIncorrect).toEqual(third.latestIncorrect);
    expect(deriveGuaranteeProgressInterpretation(fourth).conclusion).toBe(
      "Без открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Это пока показывает распознавание готового аргумента, а не самостоятельное доказательство.",
    );
    expect(
      deriveGuaranteeProgressInterpretation(emptyGuaranteeProgressEvidence()),
    ).toMatchObject({
      progressGroup: null,
      conclusion:
        "Пока рано сказать: в сохранённых тренировках ещё нет верно выполненной проверки этого шага рассуждения.",
    });
  });

  it("does not contribute absent, skipped, or solution-exposed checkpoints", async () => {
    expect(
      getGuaranteeEvidenceContribution({
        ...sockResult,
        reasoningCheckpointObservation: undefined,
      }),
    ).toBeNull();
    expect(
      getGuaranteeEvidenceContribution({
        ...sockResult,
        taskOutcome: "skipped",
      }),
    ).toBeNull();
    expect(
      getGuaranteeEvidenceContribution({
        ...sockResult,
        summary: {
          ...sockSummary,
          solutionExposure: {
            solutionId: "guaranteed-sock-pair-full-solution",
            validSubmissionCountAtOpen: 1,
          },
        },
      }),
    ).toBeNull();
  });

  it("rejects impossible structure without using the canonical answer mapping", async () => {
    const base = {
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 3,
      latestCorrectWithoutHints: fact(1, "B", "correct"),
      latestIncorrect: fact(2, "A", "incorrect"),
    };
    expect(validateGuaranteeProgressEvidence(base)).not.toBeNull();
    for (const changed of [
      { ...base, version: 2 },
      { ...base, nextSequence: 2 },
      { ...base, latestIncorrect: fact(1, "A", "incorrect") },
      {
        ...base,
        latestCorrectWithoutHints: {
          ...fact(1, "A", "correct"),
          problemId: "other",
        },
      },
      {
        ...base,
        latestCorrectWithoutHints: {
          ...fact(1, "A", "correct"),
          solutionExposedBeforeCheckpoint: true,
        },
      },
      {
        ...base,
        latestCorrectWithoutHints: fact(1, "A", "correct", ["focus"]),
      },
      {
        ...base,
        latestCorrectWithHints: fact(2, "A", "correct", ["strategy"]),
      },
      {
        ...base,
        latestIncorrect: {
          ...fact(2, "B", "incorrect"),
          observation: { ...observation, validSubmissionCountAtSubmit: 0 },
        },
      },
      { ...base, extra: true },
    ]) {
      expect(validateGuaranteeProgressEvidence(changed)).toBeNull();
    }
  });

  it("canonically rejects tampered pairs and preserves storage on transient failure", async () => {
    const storage = memoryStorage();
    for (const [option, outcome, valid] of [
      ["A", "correct", true],
      ["B", "incorrect", true],
      ["C", "incorrect", true],
      ["A", "incorrect", false],
      ["B", "correct", false],
      ["C", "correct", false],
    ] as const) {
      const evidence = {
        ...emptyGuaranteeProgressEvidence(),
        nextSequence: 2,
        [outcome === "correct"
          ? "latestCorrectWithoutHints"
          : "latestIncorrect"]: fact(1, option, outcome),
      };
      storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, JSON.stringify(evidence));
      const read = await readVerifiedGuaranteeProgressEvidence(
        verifyPersistedGuaranteeEvidenceFacts,
        storage,
      );
      expect(read.evidence.nextSequence).toBe(valid ? 2 : 1);
      expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(
        JSON.stringify(evidence),
      );
      expect(read.interpretation.progressGroup).toBe(
        valid && outcome === "correct" ? "Начинаю разбираться" : null,
      );
    }
    const prior = JSON.stringify({
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 2,
      latestCorrectWithoutHints: fact(1, "A", "correct"),
    });
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, prior);
    await expect(
      readVerifiedGuaranteeProgressEvidence(async () => {
        throw new Error("Network unavailable");
      }, storage),
    ).rejects.toThrow("Network unavailable");
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(prior);
  });

  it("checks all retained facts and fails closed for malformed or canonical-invalid snapshots", async () => {
    const storage = memoryStorage();
    const verify = vi.fn(verifyPersistedGuaranteeEvidenceFacts);
    storage.setItem(
      PROGRESS_EVIDENCE_STORAGE_KEY,
      JSON.stringify({
        ...emptyGuaranteeProgressEvidence(),
        nextSequence: 4,
        latestCorrectWithoutHints: fact(1, "A", "correct"),
        latestCorrectWithHints: fact(2, "A", "correct", ["focus"]),
        latestIncorrect: fact(3, "C", "incorrect"),
      }),
    );
    const verified = await readVerifiedGuaranteeProgressEvidence(
      verify,
      storage,
    );
    expect(verify).toHaveBeenCalledOnce();
    expect(verify.mock.calls[0][0]).toHaveLength(3);
    expect(verified.evidence.nextSequence).toBe(4);

    storage.setItem(
      PROGRESS_EVIDENCE_STORAGE_KEY,
      JSON.stringify({
        ...verified.evidence,
        latestCorrectWithHints: fact(2, "B", "correct", ["focus"]),
      }),
    );
    const invalid = await readVerifiedGuaranteeProgressEvidence(
      verifyPersistedGuaranteeEvidenceFacts,
      storage,
    );
    expect(invalid.evidence).toEqual(emptyGuaranteeProgressEvidence());
    expect(invalid.interpretation.progressGroup).toBeNull();
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(
      JSON.stringify({
        ...verified.evidence,
        latestCorrectWithHints: fact(2, "B", "correct", ["focus"]),
      }),
    );

    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, "{malformed");
    const malformed = await readVerifiedGuaranteeProgressEvidence(
      verifyPersistedGuaranteeEvidenceFacts,
      storage,
    );
    expect(malformed.evidence).toEqual(emptyGuaranteeProgressEvidence());
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe("{malformed");
  });

  it("does not let stale Progress verification erase a newer Finish", async () => {
    const storage = memoryStorage();
    storage.setItem(
      PROGRESS_EVIDENCE_STORAGE_KEY,
      JSON.stringify({
        ...emptyGuaranteeProgressEvidence(),
        nextSequence: 2,
        latestCorrectWithoutHints: fact(1, "B", "correct"),
      }),
    );
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const remove = vi.spyOn(storage, "removeItem");
    const write = vi.spyOn(storage, "setItem");
    let resolve!: (valid: boolean) => void;
    const pending = readVerifiedGuaranteeProgressEvidence(
      () =>
        new Promise<boolean>((done) => {
          resolve = done;
        }),
      storage,
    );
    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        session,
        answer,
        [firstResult, sockResult],
        vi.fn(),
        storage,
      ),
    ).toBe(true);
    const replacement = storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
    const removalsAfterFinish = remove.mock.calls.length;
    const writesAfterFinish = write.mock.calls.length;
    resolve(false);
    await expect(pending).rejects.toThrow("changed during verification");
    expect(remove).toHaveBeenCalledTimes(removalsAfterFinish);
    expect(write).toHaveBeenCalledTimes(writesAfterFinish);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(replacement);
    expect(JSON.parse(replacement!).latestCorrectWithoutHints.sequence).toBe(2);
  });

  it("finishes only after Progress write, then rolls back exact prior values on failure", async () => {
    const storage = memoryStorage();
    const priorProgress = JSON.stringify({
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 2,
      latestIncorrect: fact(1, "B", "incorrect"),
    });
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, priorProgress);
    expect(saveLatestCompletedResults([firstResult], storage)).toBe(true);
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const priorUnfinished = storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!;
    const priorCompleted = storage.getItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
    );
    let failProgress = true;
    const failingStorage = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key === PROGRESS_EVIDENCE_STORAGE_KEY && failProgress) {
          failProgress = false;
          throw new Error("Progress write failed");
        }
        storage.setItem(key, value);
      },
    } as Storage;
    const latch = { current: false };
    const navigate = vi.fn();
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        failingStorage,
      ),
    ).toBe(false);
    expect(latch.current).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(priorUnfinished);
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      priorCompleted,
    );
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(priorProgress);

    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(true);
    expect(latch.current).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    const completed = JSON.parse(
      storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!,
    );
    expect(completed).toEqual([firstResult, sockResult]);
    const progress = JSON.parse(
      storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)!,
    );
    expect(progress.nextSequence).toBe(3);
    expect(progress.latestCorrectWithoutHints.sequence).toBe(2);
    expect(progress.latestIncorrect).toEqual(fact(1, "B", "incorrect"));
    expect(JSON.stringify(progress)).not.toContain("rawAnswer");
    expect(JSON.stringify(progress)).not.toContain("Почему 7 носков");
  });

  it("rejects stale active and no-next Finish without touching newer storage", async () => {
    const storage = memoryStorage();
    const priorProgress = JSON.stringify(emptyGuaranteeProgressEvidence());
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, priorProgress);
    saveLatestCompletedResults([firstResult], storage);
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);

    const newerSession = {
      sessionId: crypto.randomUUID(),
      activeProblemIndex: 0 as const,
      completedResults: [],
    };
    const newerAnswer = {
      rawAnswer: "",
      status: "typing" as const,
      practice: startPractice(),
    };
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    expect(await seedActiveSnapshot(newerSession, newerAnswer, storage)).toBe(
      true,
    );
    const newerUnfinished = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    const priorCompleted = storage.getItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
    );
    const navigate = vi.fn();
    expect(
      await savePracticeSessionWhileActive(
        { current: false },
        session,
        { ...answer, rawAnswer: "8", status: "typing" },
        storage,
        observation,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(newerUnfinished);
    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(newerUnfinished);
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      priorCompleted,
    );
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(priorProgress);

    const noNext: NoNextTwoProblemSessionState = {
      sessionId: crypto.randomUUID(),
      status: "no-next",
      completedResults: [
        firstResult,
        {
          problemId: "guaranteed-sock-pair",
          problemTitle: "Носки в пакете",
          summary: {
            outcome: "no-valid-submissions",
            validSubmissionCount: 0,
            hintExposures: [],
            solutionExposure: null,
          },
          taskOutcome: "skipped",
        },
        {
          problemId: "table-impossible-sums",
          problemTitle: "Невозможные суммы",
          summary: {
            outcome: "no-valid-submissions",
            validSubmissionCount: 0,
            hintExposures: [],
            solutionExposure: null,
          },
          taskOutcome: "skipped",
        },
      ],
    };
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    expect(await seedNoNextSnapshot(noNext, storage)).toBe(true);
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    expect(await seedActiveSnapshot(newerSession, newerAnswer, storage)).toBe(
      true,
    );
    expect(await saveNoNextPracticeSessionSnapshot(noNext, storage)).toBe(
      false,
    );
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(newerUnfinished);
    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        noNext,
        null,
        noNext.completedResults,
        navigate,
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(newerUnfinished);
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      priorCompleted,
    );
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(priorProgress);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("rejects stale Finish when a distinct session has identical factual state", async () => {
    const storage = memoryStorage();
    const firstSession = { ...session, sessionId: crypto.randomUUID() };
    const secondSession = { ...session, sessionId: crypto.randomUUID() };
    expect(
      await seedActiveSnapshot(firstSession, answer, storage, observation),
    ).toBe(true);
    const priorUnfinished = storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!;
    const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
    const pendingRaw = JSON.stringify({
      sessionId: firstSession.sessionId,
      unfinishedBefore: priorUnfinished,
      completedBefore: null,
      progressBefore: null,
      completedAfter: JSON.stringify([firstResult, sockResult]),
      progressAfter: JSON.stringify(
        appendGuaranteeEvidence(
          emptyGuaranteeProgressEvidence(),
          getGuaranteeEvidenceContribution(sockResult)!,
        ),
      ),
    });
    storage.setItem(pendingKey, pendingRaw);
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    expect(
      await savePracticeSessionWhileActive(
        { current: false },
        firstSession,
        { ...answer, rawAnswer: "8", status: "typing" },
        storage,
        observation,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(
      await seedActiveSnapshot(secondSession, answer, storage, observation),
    ).toBe(true);
    const beforeUnfinished = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    const beforeCompleted = storage.getItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
    );
    const beforeProgress = storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
    const navigate = vi.fn();

    expect(
      await savePracticeSessionWhileActive(
        { current: false },
        firstSession,
        { ...answer, rawAnswer: "8", status: "typing" },
        storage,
        observation,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(
      beforeUnfinished,
    );
    expect(
      await createPracticeSessionSnapshot(
        {
          sessionId: crypto.randomUUID(),
          activeProblemIndex: 0,
          completedResults: [],
        },
        createShortNumericAnswerState(),
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(
      beforeUnfinished,
    );

    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        firstSession,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(
      beforeUnfinished,
    );
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      beforeCompleted,
    );
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(beforeProgress);
    expect(storage.getItem(pendingKey)).toBe(pendingRaw);
    expect(navigate).not.toHaveBeenCalled();

    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        secondSession,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(
      beforeUnfinished,
    );
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      beforeCompleted,
    );
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(beforeProgress);
    expect(storage.getItem(pendingKey)).toBe(pendingRaw);

    const skipped: PracticeSessionResult = {
      problemId: "guaranteed-sock-pair",
      problemTitle: "Носки в пакете",
      summary: {
        outcome: "no-valid-submissions",
        validSubmissionCount: 0,
        hintExposures: [],
        solutionExposure: null,
      },
      taskOutcome: "skipped",
    };
    const firstNoNext: NoNextTwoProblemSessionState = {
      sessionId: crypto.randomUUID(),
      status: "no-next",
      completedResults: [
        firstResult,
        skipped,
        {
          problemId: "table-impossible-sums",
          problemTitle: "Невозможные суммы",
          summary: {
            outcome: "no-valid-submissions",
            validSubmissionCount: 0,
            hintExposures: [],
            solutionExposure: null,
          },
          taskOutcome: "skipped",
        },
      ],
    };
    const secondNoNext = {
      ...firstNoNext,
      sessionId: crypto.randomUUID(),
    };
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    expect(await seedNoNextSnapshot(secondNoNext, storage)).toBe(true);
    const beforeNoNext = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    expect(await saveNoNextPracticeSessionSnapshot(firstNoNext, storage)).toBe(
      false,
    );
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(beforeNoNext);
    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        firstNoNext,
        null,
        firstNoNext.completedResults,
        navigate,
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(beforeNoNext);
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      beforeCompleted,
    );
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(beforeProgress);
  });

  it("accepts a Progress write that reports failure after the intended value is durable", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const reportingStorage = {
      ...storage,
      setItem: (key: string, value: string) => {
        storage.setItem(key, value);
        if (key === PROGRESS_EVIDENCE_STORAGE_KEY)
          throw new Error("Write reported failure after mutation");
      },
    } as Storage;
    const latch = { current: false };
    const navigate = vi.fn();
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        reportingStorage,
      ),
    ).toBe(true);
    expect(latch.current).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    const progress = JSON.parse(
      storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)!,
    );
    expect(progress.nextSequence).toBe(2);
    expect(progress.latestCorrectWithoutHints.sequence).toBe(1);
  });

  it("reconciles a mutated Progress write after rollback failure without appending twice", async () => {
    const storage = memoryStorage();
    const priorProgress = JSON.stringify(emptyGuaranteeProgressEvidence());
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, priorProgress);
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    let maskProgressRead = false;
    let failRollback = true;
    const failingStorage = {
      ...storage,
      getItem: (key: string) => {
        if (key === PROGRESS_EVIDENCE_STORAGE_KEY && maskProgressRead) {
          maskProgressRead = false;
          return priorProgress;
        }
        return storage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        if (key === PROGRESS_EVIDENCE_STORAGE_KEY && value !== priorProgress) {
          storage.setItem(key, value);
          maskProgressRead = true;
          throw new Error("Progress write reported failure after mutation");
        }
        if (
          key === PROGRESS_EVIDENCE_STORAGE_KEY &&
          value === priorProgress &&
          failRollback
        ) {
          failRollback = false;
          throw new Error("Progress rollback failed");
        }
        storage.setItem(key, value);
      },
    } as Storage;
    const latch = { current: false };
    const navigate = vi.fn();
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        failingStorage,
      ),
    ).toBe(false);
    expect(latch.current).toBe(false);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    const afterFailedFinish = storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
    expect(JSON.parse(afterFailedFinish!).nextSequence).toBe(2);

    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(true);
    expect(latch.current).toBe(true);
    expect(navigate).toHaveBeenCalledOnce();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(
      afterFailedFinish,
    );
    expect(
      JSON.parse(afterFailedFinish!).latestCorrectWithoutHints.sequence,
    ).toBe(1);
  });

  it("restores the unfinished and previous completed values after earlier transition failures", async () => {
    for (const failingKey of [
      PRACTICE_SESSION_STORAGE_KEY,
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
    ]) {
      const storage = memoryStorage();
      expect(
        await seedActiveSnapshot(session, answer, storage, observation),
      ).toBe(true);
      saveLatestCompletedResults([firstResult], storage);
      const beforeUnfinished = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
      const beforeCompleted = storage.getItem(
        PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      );
      let fail = true;
      const failingStorage = {
        ...storage,
        removeItem: (key: string) => {
          storage.removeItem(key);
          if (key === failingKey && fail) {
            fail = false;
            throw new Error("Clear failed after mutation");
          }
        },
        setItem: (key: string, value: string) => {
          storage.setItem(key, value);
          if (key === failingKey && fail) {
            fail = false;
            throw new Error("Write failed after mutation");
          }
        },
      } as Storage;
      const latch = { current: false };
      const navigate = vi.fn();
      expect(
        await finishPracticeSessionAndNavigate(
          latch,
          session,
          answer,
          [firstResult, sockResult],
          navigate,
          failingStorage,
        ),
      ).toBe(false);
      expect(latch.current).toBe(false);
      expect(navigate).not.toHaveBeenCalled();
      expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(
        beforeUnfinished,
      );
      expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
        beforeCompleted,
      );
      expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    }
  });

  it("leaves Progress untouched for a completed session without checkpoint evidence", async () => {
    const storage = memoryStorage();
    const prior = JSON.stringify(emptyGuaranteeProgressEvidence());
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, prior);
    expect(await seedActiveSnapshot(session, answer, storage)).toBe(true);
    const result = {
      ...sockResult,
      reasoningCheckpointObservation: undefined,
      firstCorrectSubmissionCount: undefined,
    };
    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        session,
        answer,
        [
          firstResult,
          {
            problemId: result.problemId,
            problemTitle: result.problemTitle,
            summary: result.summary,
          },
        ],
        vi.fn(),
        storage,
      ),
    ).toBe(true);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(prior);
  });
});

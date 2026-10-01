import { beforeEach, describe, expect, it, vi } from "vitest";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";

vi.mock("server-only", () => ({}));
vi.mock("../../../app/practice/knowledge-support-actions", () => ({
  readKnowledgeSupport: vi.fn(async () => null),
  readKnowledgeSupportEligibility: vi.fn(async () => false),
}));

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
vi.mock("../../../app/progress/actions", () => ({
  importBrowserProgressEvidence: vi.fn(async () => {}),
  persistPracticeFinishEvidence: vi.fn(async () => {}),
}));

import {
  importBrowserProgressEvidence,
  persistPracticeFinishEvidence,
} from "../../../app/progress/actions";

import { verifyPersistedGuaranteeEvidenceFacts } from "../../../app/practice/actions";
import {
  appendGuaranteeEvidence,
  deriveGuaranteeProgressInterpretation,
  emptyGuaranteeProgressEvidence,
  getGuaranteeEvidenceContribution,
  guaranteeSockSlots,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceFact,
} from "../application/guarantee-progress-evidence";
import {
  recordAnswerResult,
  startPractice,
  type PracticeSummary,
} from "../application/practice-state";
import {
  SOCK_REASONING_CHECKPOINT_ID,
  TABLE_REASONING_CHECKPOINT_ID,
} from "../application/reasoning-checkpoint";
import { getPracticeProgressContribution } from "../application/practice-progress-evidence";
import { completedEpisodeFacts } from "../application/completed-practice-episode";
import {
  finishPracticeSessionAndNavigate,
  savePracticeSessionWhileActive,
} from "./practice-session";
import {
  clearPracticeSessionSnapshot,
  completePracticeSession,
  createPracticeSessionSnapshot,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  readVerifiedPracticeSessionSnapshot,
  saveLatestCompletedResults,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
} from "./practice-session-storage";
import { createShortNumericAnswerState } from "./short-numeric-answer-state";
import { createMultipleChoiceSetAnswerState } from "./multiple-choice-set-answer-state";
import { finishPracticeSession } from "./fixed-practice-session-state";
import {
  PROGRESS_EVIDENCE_STORAGE_KEY,
  readVerifiedGuaranteeProgressEvidence,
} from "./progress-evidence-storage";
import { ensureServerProgressImported } from "./server-progress-import";
import type { PracticeSessionResult } from "./two-problem-session-state";
import type { NoNextPracticeSessionState as NoNextTwoProblemSessionState } from "./fixed-practice-session-state";

beforeEach(() => {
  vi.clearAllMocks();
  installImmediatePracticeSessionLock();
});

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

async function seedStoredLegacyFinish(
  storage: Storage,
  results = [firstResult, sockResult],
) {
  await ensureServerProgressImported(storage);
  storage.setItem(
    "olympiad-trainer:practice-server-finish-request",
    JSON.stringify({
      sessionId: session.sessionId,
      contributions: results
        .map(getPracticeProgressContribution)
        .filter((value) => value !== null),
      unfinishedBefore: storage.getItem(PRACTICE_SESSION_STORAGE_KEY),
      completedBefore: storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY),
      progressBefore: storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY),
      completedAfter: JSON.stringify(results),
    }),
  );
}

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
  it.each([0, 1] as const)(
    "rejects new early core Finish at problem index %s without freezing Practice or submitting a legacy receipt",
    async (activeProblemIndex) => {
      const storage = memoryStorage();
      const earlySession = {
        sessionId: crypto.randomUUID(),
        activeProblemIndex,
        completedResults: activeProblemIndex === 0 ? [] : [firstResult],
      };
      const earlyAnswer = createShortNumericAnswerState();
      const currentResult: PracticeSessionResult = {
        problemId:
          activeProblemIndex === 0
            ? firstResult.problemId
            : sockResult.problemId,
        problemTitle:
          activeProblemIndex === 0
            ? firstResult.problemTitle
            : sockResult.problemTitle,
        summary: {
          outcome: "no-valid-submissions",
          validSubmissionCount: 0,
          hintExposures: [],
          solutionExposure: null,
        },
      };
      await seedActiveSnapshot(earlySession, earlyAnswer, storage);
      saveLatestCompletedResults([firstResult], storage);
      const before = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
      const previousSummary = storage.getItem(
        PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      );
      const latch = { current: false };
      const navigate = vi.fn();
      for (let retry = 0; retry < 2; retry++) {
        expect(
          await finishPracticeSessionAndNavigate(
            latch,
            earlySession,
            earlyAnswer,
            [...earlySession.completedResults, currentResult],
            navigate,
            storage,
          ),
        ).toBe(false);
        expect(persistPracticeFinishEvidence).not.toHaveBeenCalled();
        expect(
          storage.getItem("olympiad-trainer:practice-server-finish-request"),
        ).toBeNull();
        expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(before);
        expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
          previousSummary,
        );
        expect(latch.current).toBe(false);
        expect(navigate).not.toHaveBeenCalled();
        expect(
          await savePracticeSessionWhileActive(
            latch,
            earlySession,
            earlyAnswer,
            storage,
          ),
        ).toBe(true);
      }
    },
  );

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
    expect(guaranteeSockSlots(first).latestCorrectWithoutHints?.sequence).toBe(
      1,
    );
    expect(first.nextSequence).toBe(2);
    expect(deriveGuaranteeProgressInterpretation(first).conclusion).toBe(
      "Без открытых подсказок ты верно выбрал объяснение, почему результат гарантирован. Это пока показывает распознавание готового аргумента, а не самостоятельное доказательство.",
    );
    const second = appendGuaranteeEvidence(first, supported)!;
    expect(guaranteeSockSlots(second).latestCorrectWithoutHints).toEqual(
      guaranteeSockSlots(first).latestCorrectWithoutHints,
    );
    expect(guaranteeSockSlots(second).latestCorrectWithHints?.sequence).toBe(2);
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
    expect(guaranteeSockSlots(third).latestCorrectWithoutHints).toEqual(
      guaranteeSockSlots(first).latestCorrectWithoutHints,
    );
    expect(guaranteeSockSlots(third).latestCorrectWithHints).toEqual(
      guaranteeSockSlots(second).latestCorrectWithHints,
    );
    expect(guaranteeSockSlots(third).latestIncorrect?.sequence).toBe(3);
    expect(deriveGuaranteeProgressInterpretation(third)).toMatchObject({
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Раньше ты верно выбирал подходящее объяснение, но в более поздней такой проверке ответ был другим. Пока рано говорить о стабильности.",
    });
    const fourth = appendGuaranteeEvidence(third, supported)!;
    expect(guaranteeSockSlots(fourth).latestCorrectWithHints?.sequence).toBe(4);
    expect(guaranteeSockSlots(fourth).latestIncorrect).toEqual(
      guaranteeSockSlots(third).latestIncorrect,
    );
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

  it("stored legacy request: does not let stale Progress verification erase a newer Finish", async () => {
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
    await seedStoredLegacyFinish(storage);
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
    await pending.catch(() => undefined);
    expect(remove).toHaveBeenCalledTimes(removalsAfterFinish);
    expect(write).toHaveBeenCalledTimes(writesAfterFinish);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(replacement);
    expect(replacement).toBeNull();
    expect(importBrowserProgressEvidence).toHaveBeenCalledTimes(2);
    expect(persistPracticeFinishEvidence).toHaveBeenCalledOnce();
  });

  it("stored legacy request: keeps unfinished Practice after server write failure and retries the same session", async () => {
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
    vi.mocked(persistPracticeFinishEvidence)
      .mockRejectedValueOnce(new Error("Database unavailable"))
      .mockResolvedValueOnce(null);
    const latch = { current: false };
    const navigate = vi.fn();
    await seedStoredLegacyFinish(storage);
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(false);
    expect(latch.current).toBe(false);
    expect(navigate).not.toHaveBeenCalled();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(priorUnfinished);
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      priorCompleted,
    );
    expect(importBrowserProgressEvidence).toHaveBeenCalledWith(priorProgress);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    const requestKey = "olympiad-trainer:practice-server-finish-request";
    const immutableRequest = storage.getItem(requestKey);
    expect(immutableRequest).not.toBeNull();

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
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(requestKey)).toBeNull();
    expect(vi.mocked(persistPracticeFinishEvidence).mock.calls).toEqual([
      [session.sessionId, JSON.parse(immutableRequest!).contributions],
      [session.sessionId, JSON.parse(immutableRequest!).contributions],
    ]);
  });

  it("captures both checkpoints in one immutable Finish request immediately after P3 saves", async () => {
    const storage = memoryStorage();
    const thirdSession = {
      sessionId: crypto.randomUUID(),
      activeProblemIndex: 2 as const,
      completedResults: [firstResult, sockResult],
    };
    const thirdAnswer = {
      ...createMultipleChoiceSetAnswerState(),
      selectedOptionIds: ["sum-20"],
      status: "correct" as const,
      practice: recordAnswerResult(startPractice(), {
        status: "correct",
        normalizedAnswer: '["sum-20"]',
      }),
    };
    const thirdObservation = {
      checkpointId: TABLE_REASONING_CHECKPOINT_ID,
      selectedOptionId: "A" as const,
      outcome: "correct" as const,
      validSubmissionCountAtSubmit: 1,
    };
    const thirdResult: PracticeSessionResult = {
      problemId: "table-impossible-sums",
      problemTitle: "Невозможные суммы",
      summary: sockSummary,
      reasoningCheckpointObservation: thirdObservation,
      firstCorrectSubmissionCount: 1,
    };
    const results = finishPracticeSession(thirdSession, thirdResult);
    expect(await seedActiveSnapshot(thirdSession, thirdAnswer, storage)).toBe(
      true,
    );
    expect(
      await savePracticeSessionWhileActive(
        { current: false },
        thirdSession,
        thirdAnswer,
        storage,
        thirdObservation,
      ),
    ).toBe(true);
    expect(
      JSON.parse(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!)
        .reasoningCheckpointObservation,
    ).toEqual(thirdObservation);
    const requestKey = "olympiad-trainer:practice-server-finish-request";
    const expectedContributions = [sockResult, thirdResult].map(
      getPracticeProgressContribution,
    );
    expect(expectedContributions.map((entry) => entry?.bucket)).toEqual([
      "guarantee",
      "impossibility",
    ]);
    vi.mocked(persistPracticeFinishEvidence)
      .mockImplementationOnce(async () => {
        expect(JSON.parse(storage.getItem(requestKey)!)).toMatchObject({
          sessionId: thirdSession.sessionId,
          contributions: expectedContributions,
        });
        throw new Error("Response lost after commit");
      })
      .mockResolvedValueOnce(null);
    const latch = { current: false };
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        thirdSession,
        thirdAnswer,
        results,
        vi.fn(),
        storage,
      ),
    ).toBe(false);
    const immutableRequest = storage.getItem(requestKey);
    expect(immutableRequest).not.toBeNull();
    expect(JSON.parse(immutableRequest!).contributions).toEqual(
      expectedContributions,
    );
    const expectedEpisode = {
      mode: "core",
      facts: completedEpisodeFacts(results),
    };
    expect(JSON.parse(immutableRequest!)).toMatchObject({
      episodeMode: expectedEpisode.mode,
      episodeFacts: expectedEpisode.facts,
    });
    expect(JSON.stringify(expectedEpisode)).not.toMatch(
      /selectedOptionId|sum-20|problemTitle|normalizedAnswer/,
    );
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        thirdSession,
        thirdAnswer,
        results,
        vi.fn(),
        storage,
      ),
    ).toBe(true);
    expect(vi.mocked(persistPracticeFinishEvidence).mock.calls).toEqual([
      [
        thirdSession.sessionId,
        expectedContributions,
        undefined,
        expectedEpisode,
      ],
      [
        thirdSession.sessionId,
        expectedContributions,
        undefined,
        expectedEpisode,
      ],
    ]);
    expect(storage.getItem(requestKey)).toBeNull();
  });

  it("stored legacy request: retries the persisted Finish request after a lost response and later Practice edits", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const requestKey = "olympiad-trainer:practice-server-finish-request";
    const originalContribution = getGuaranteeEvidenceContribution(sockResult)!;
    vi.mocked(persistPracticeFinishEvidence)
      .mockImplementationOnce(async () => {
        expect(JSON.parse(storage.getItem(requestKey)!)).toMatchObject({
          sessionId: session.sessionId,
          contributions: [{ bucket: "guarantee", value: originalContribution }],
        });
        throw new Error("Response lost after commit");
      })
      .mockResolvedValueOnce(null);
    const latch = { current: false };
    const navigate = vi.fn();
    await seedStoredLegacyFinish(storage);
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(false);
    const savedRequest = storage.getItem(requestKey);
    expect(savedRequest).not.toBeNull();
    expect(JSON.parse(savedRequest!)).toMatchObject({
      sessionId: session.sessionId,
      contributions: [{ bucket: "guarantee", value: originalContribution }],
    });
    expect(
      await savePracticeSessionSnapshot(
        session,
        { ...answer, rawAnswer: "8" },
        storage,
        observation,
      ),
    ).toBe(false);
    const changedSnapshot = JSON.parse(
      storage.getItem(PRACTICE_SESSION_STORAGE_KEY)!,
    );
    storage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify({ ...changedSnapshot, rawAnswer: "8" }),
    );
    const changedResult = {
      ...sockResult,
      reasoningCheckpointObservation: {
        ...observation,
        selectedOptionId: "B" as const,
        outcome: "incorrect" as const,
      },
    };
    expect(
      await completePracticeSession(
        session,
        { ...answer, rawAnswer: "8" },
        [firstResult, changedResult],
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(requestKey)).toBe(savedRequest);
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        { ...answer, rawAnswer: "8" },
        [firstResult, changedResult],
        navigate,
        storage,
      ),
    ).toBe(true);
    expect(vi.mocked(persistPracticeFinishEvidence).mock.calls).toEqual([
      [
        session.sessionId,
        [{ bucket: "guarantee", value: originalContribution }],
      ],
      [
        session.sessionId,
        [{ bucket: "guarantee", value: originalContribution }],
      ],
    ]);
    expect(storage.getItem(requestKey)).toBeNull();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledOnce();
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
    ).toBe(false);
    const newerStorage = memoryStorage();
    expect(
      await seedActiveSnapshot(
        secondSession,
        answer,
        newerStorage,
        observation,
      ),
    ).toBe(true);
    storage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      newerStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!,
    );
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
    expect(await seedNoNextSnapshot(secondNoNext, storage)).toBe(false);
    const newerNoNextStorage = memoryStorage();
    expect(await seedNoNextSnapshot(secondNoNext, newerNoNextStorage)).toBe(
      true,
    );
    storage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      newerNoNextStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!,
    );
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

  it("finishes an already-pending legacy local transition and imports its result as baseline", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
    const localProgress = JSON.stringify(
      appendGuaranteeEvidence(
        emptyGuaranteeProgressEvidence(),
        getGuaranteeEvidenceContribution(sockResult)!,
      ),
    );
    storage.setItem(
      pendingKey,
      JSON.stringify({
        sessionId: session.sessionId,
        unfinishedBefore: storage.getItem(PRACTICE_SESSION_STORAGE_KEY),
        completedBefore: null,
        progressBefore: null,
        completedAfter: JSON.stringify([firstResult, sockResult]),
        progressAfter: localProgress,
      }),
    );
    const navigate = vi.fn();
    expect(
      await finishPracticeSessionAndNavigate(
        { current: false },
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(true);
    expect(importBrowserProgressEvidence).toHaveBeenCalledWith(localProgress);
    expect(persistPracticeFinishEvidence).not.toHaveBeenCalled();
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledOnce();
  });

  it("imports the recovered legacy Finish result before a Progress read can take a baseline", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
    const afterProgress = JSON.stringify(
      appendGuaranteeEvidence(
        emptyGuaranteeProgressEvidence(),
        getGuaranteeEvidenceContribution(sockResult)!,
      ),
    );
    storage.setItem(
      pendingKey,
      JSON.stringify({
        sessionId: session.sessionId,
        unfinishedBefore: storage.getItem(PRACTICE_SESSION_STORAGE_KEY),
        completedBefore: null,
        progressBefore: JSON.stringify(emptyGuaranteeProgressEvidence()),
        completedAfter: JSON.stringify([firstResult, sockResult]),
        progressAfter: afterProgress,
      }),
    );
    const pendingRaw = storage.getItem(pendingKey);
    storage.setItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      JSON.stringify([firstResult, sockResult]),
    );
    storage.setItem(
      PROGRESS_EVIDENCE_STORAGE_KEY,
      JSON.stringify(emptyGuaranteeProgressEvidence()),
    );
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    expect(
      (
        await readVerifiedPracticeSessionSnapshot(
          async () => ({
            valid: true,
            interpretation: deriveGuaranteeProgressInterpretation(
              emptyGuaranteeProgressEvidence(),
            ),
          }),
          storage,
        )
      ).value?.sessionId,
    ).toBe(session.sessionId);
    expect(storage.getItem(pendingKey)).toBe(pendingRaw);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(
      JSON.stringify(emptyGuaranteeProgressEvidence()),
    );
    vi.mocked(importBrowserProgressEvidence).mockImplementationOnce(
      async (raw) => {
        expect(raw).toBe(afterProgress);
        expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
        expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(
          afterProgress,
        );
        expect(storage.getItem(pendingKey)).not.toBeNull();
      },
    );
    expect(await ensureServerProgressImported(storage)).toBe(session.sessionId);
    expect(storage.getItem(pendingKey)).toBeNull();
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBe(
      JSON.stringify([firstResult, sockResult]),
    );
  });

  it("keeps recovered legacy bytes and pending Finish retryable when import fails", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
    const afterProgress = JSON.stringify(
      appendGuaranteeEvidence(
        emptyGuaranteeProgressEvidence(),
        getGuaranteeEvidenceContribution(sockResult)!,
      ),
    );
    storage.setItem(
      pendingKey,
      JSON.stringify({
        sessionId: session.sessionId,
        unfinishedBefore: storage.getItem(PRACTICE_SESSION_STORAGE_KEY),
        completedBefore: null,
        progressBefore: null,
        completedAfter: JSON.stringify([firstResult, sockResult]),
        progressAfter: afterProgress,
      }),
    );
    vi.mocked(importBrowserProgressEvidence)
      .mockRejectedValueOnce(new Error("Import response lost"))
      .mockResolvedValueOnce();
    const latch = { current: false };
    const navigate = vi.fn();
    expect(
      await finishPracticeSessionAndNavigate(
        latch,
        session,
        answer,
        [firstResult, sockResult],
        navigate,
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(afterProgress);
    const pendingRaw = storage.getItem(pendingKey);
    expect(pendingRaw).not.toBeNull();
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect((await readPracticeSessionSnapshot(storage))?.sessionId).toBe(
      session.sessionId,
    );
    expect(storage.getItem(pendingKey)).toBe(pendingRaw);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(afterProgress);
    expect(
      await savePracticeSessionSnapshot(session, answer, storage, observation),
    ).toBe(false);
    expect(await clearPracticeSessionSnapshot(storage)).toBe(false);
    expect(storage.getItem(pendingKey)).toBe(pendingRaw);
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
    expect(vi.mocked(importBrowserProgressEvidence).mock.calls).toEqual([
      [afterProgress],
      [afterProgress],
    ]);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(pendingKey)).toBeNull();
    expect(persistPracticeFinishEvidence).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledOnce();
  });

  it("does not replace malformed legacy bytes while recovering a pending Finish", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const pendingKey = "olympiad-trainer:practice-progress-finish-pending";
    const malformed = "{malformed";
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, malformed);
    storage.setItem(
      pendingKey,
      JSON.stringify({
        sessionId: session.sessionId,
        unfinishedBefore: storage.getItem(PRACTICE_SESSION_STORAGE_KEY),
        completedBefore: null,
        progressBefore: malformed,
        completedAfter: JSON.stringify([firstResult, sockResult]),
        progressAfter: JSON.stringify(
          appendGuaranteeEvidence(
            emptyGuaranteeProgressEvidence(),
            getGuaranteeEvidenceContribution(sockResult)!,
          ),
        ),
      }),
    );
    const pendingRaw = storage.getItem(pendingKey);
    storage.setItem(
      PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
      JSON.stringify([firstResult, sockResult]),
    );
    storage.setItem(
      PROGRESS_EVIDENCE_STORAGE_KEY,
      JSON.parse(pendingRaw!).progressAfter,
    );
    storage.removeItem(PRACTICE_SESSION_STORAGE_KEY);
    expect((await readPracticeSessionSnapshot(storage))?.sessionId).toBe(
      session.sessionId,
    );
    expect(storage.getItem(pendingKey)).toBe(pendingRaw);
    expect(JSON.parse(storage.getItem(pendingKey)!).progressBefore).toBe(
      malformed,
    );
    await expect(ensureServerProgressImported(storage)).rejects.toThrow(
      "could not be verified",
    );
    expect(importBrowserProgressEvidence).not.toHaveBeenCalled();
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(
      JSON.parse(pendingRaw!).progressAfter,
    );
    expect(storage.getItem(pendingKey)).toBe(pendingRaw);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).not.toBeNull();
  });

  it("stored legacy request: does not write a browser-local Progress snapshot after server acknowledgement", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const write = vi.spyOn(storage, "setItem");
    const latch = { current: false };
    const navigate = vi.fn();
    await seedStoredLegacyFinish(storage);
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
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    expect(
      write.mock.calls.filter(([key]) => key === PROGRESS_EVIDENCE_STORAGE_KEY),
    ).toEqual([]);
  });

  it("stored legacy request: retries local finalization after server acknowledgement with the same session ID", async () => {
    const storage = memoryStorage();
    expect(
      await seedActiveSnapshot(session, answer, storage, observation),
    ).toBe(true);
    const before = storage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    let failCompleted = true;
    const failingStorage = {
      ...storage,
      setItem: (key: string, value: string) => {
        if (key === PRACTICE_LATEST_COMPLETED_STORAGE_KEY && failCompleted) {
          failCompleted = false;
          throw new Error("Summary write failed");
        }
        storage.setItem(key, value);
      },
    } as Storage;
    const latch = { current: false };
    const navigate = vi.fn();
    await seedStoredLegacyFinish(storage);
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
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(before);
    expect(storage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)).toBeNull();
    const requestKey = "olympiad-trainer:practice-server-finish-request";
    const immutableRequest = storage.getItem(requestKey);
    expect(immutableRequest).not.toBeNull();

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
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(requestKey)).toBeNull();
    expect(vi.mocked(persistPracticeFinishEvidence).mock.calls).toEqual([
      [session.sessionId, JSON.parse(immutableRequest!).contributions],
      [session.sessionId, JSON.parse(immutableRequest!).contributions],
    ]);
  });

  it("stored legacy request: restores the unfinished and previous completed values after earlier transition failures", async () => {
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
      await seedStoredLegacyFinish(storage);
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

  it("stored legacy request: imports existing Progress and records a Finish without checkpoint evidence", async () => {
    const storage = memoryStorage();
    const prior = JSON.stringify(emptyGuaranteeProgressEvidence());
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, prior);
    expect(await seedActiveSnapshot(session, answer, storage)).toBe(true);
    const result = {
      ...sockResult,
      reasoningCheckpointObservation: undefined,
      firstCorrectSubmissionCount: undefined,
    };
    await seedStoredLegacyFinish(storage, [
      firstResult,
      {
        problemId: sockResult.problemId,
        problemTitle: sockResult.problemTitle,
        summary: sockResult.summary,
      },
    ]);
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
    expect(importBrowserProgressEvidence).toHaveBeenCalledWith(prior);
    expect(persistPracticeFinishEvidence).toHaveBeenCalledWith(
      session.sessionId,
      [],
    );
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
  });
});

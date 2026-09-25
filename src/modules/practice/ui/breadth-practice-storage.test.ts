import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  verifyPersistedPracticeProgressEvidenceFacts,
  verifyPersistedReasoningCheckpointObservation,
} from "../../../app/practice/actions";
import {
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import {
  SOCK_REASONING_CHECKPOINT_ID,
  TABLE_REASONING_CHECKPOINT_ID,
} from "../application/reasoning-checkpoint";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import {
  emptyPracticeProgressEvidence,
  progressEvidenceBuckets,
} from "../application/practice-progress-evidence";
import { createMultipleChoiceSetAnswerState } from "./multiple-choice-set-answer-state";
import {
  completePracticeSession,
  createPracticeSessionSnapshot,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  readVerifiedLatestCompletedResults,
  restoreAnswerState,
  savePracticeSessionSnapshot,
} from "./practice-session-storage";
import {
  PROGRESS_EVIDENCE_STORAGE_KEY,
  readVerifiedPracticeProgressEvidence,
} from "./progress-evidence-storage";
import { startPracticeSession } from "./fixed-practice-session-state";
import { createShortNumericAnswerState } from "./short-numeric-answer-state";

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

const emptySummary = {
  outcome: "no-valid-submissions" as const,
  validSubmissionCount: 0,
  hintExposures: [],
  solutionExposure: null,
};
const correctSummary = {
  outcome: "eventually-correct" as const,
  validSubmissionCount: 1,
  hintExposures: [],
  solutionExposure: null,
};
const first = {
  problemId: "coinciding-seats",
  problemTitle: "Совпадающие места",
  summary: correctSummary,
};
const second = {
  problemId: "guaranteed-sock-pair",
  problemTitle: "Носки в пакете",
  summary: correctSummary,
  reasoningCheckpointObservation: {
    checkpointId: SOCK_REASONING_CHECKPOINT_ID,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  firstCorrectSubmissionCount: 1,
};
const table = {
  problemId: "table-impossible-sums",
  problemTitle: "Невозможные суммы",
  summary: correctSummary,
  reasoningCheckpointObservation: {
    checkpointId: TABLE_REASONING_CHECKPOINT_ID,
    selectedOptionId: "A" as const,
    outcome: "correct" as const,
    validSubmissionCountAtSubmit: 1,
  },
  firstCorrectSubmissionCount: 1,
};

describe("fixed three-problem persistence", () => {
  it("migrates a valid two-problem active session and old no-next into the third problem", async () => {
    const storage = memoryStorage();
    const legacy = {
      sessionId: crypto.randomUUID(),
      problemIds: ["coinciding-seats", "guaranteed-sock-pair"],
      activeProblemIndex: 1,
      completedResults: [first],
      activePractice: startPractice(),
      rawAnswer: "7",
    };
    storage.setItem(PRACTICE_SESSION_STORAGE_KEY, JSON.stringify(legacy));
    expect(await readPracticeSessionSnapshot(storage)).toMatchObject({
      sessionId: legacy.sessionId,
      problemIds: [
        "coinciding-seats",
        "guaranteed-sock-pair",
        "table-impossible-sums",
      ],
      activeProblemIndex: 1,
      rawAnswer: "7",
    });
    storage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify({
        sessionId: legacy.sessionId,
        status: "no-next",
        completedResults: [
          first,
          {
            problemId: "guaranteed-sock-pair",
            problemTitle: "Носки в пакете",
            summary: emptySummary,
            taskOutcome: "skipped",
          },
        ],
      }),
    );
    expect(await readPracticeSessionSnapshot(storage)).toMatchObject({
      activeProblemIndex: 2,
      selectedOptionIds: [],
      completedResults: [first, { taskOutcome: "skipped" }],
    });
  });

  it("restores mixed table response and persists both verified Progress buckets in one Finish", async () => {
    const storage = memoryStorage();
    const sessionId = crypto.randomUUID();
    expect(
      await createPracticeSessionSnapshot(
        { ...startPracticeSession(), sessionId },
        createShortNumericAnswerState(),
        storage,
      ),
    ).toBe(true);
    const practice = recordAnswerResult(startPractice(), {
      status: "correct",
      normalizedAnswer: '["sum-20"]',
    });
    const answer = {
      ...createMultipleChoiceSetAnswerState(),
      selectedOptionIds: ["sum-20"],
      status: "correct" as const,
      practice,
    };
    const session = {
      sessionId,
      activeProblemIndex: 2 as const,
      completedResults: [first, second],
    };
    expect(
      await savePracticeSessionSnapshot(
        session,
        answer,
        storage,
        table.reasoningCheckpointObservation,
      ),
    ).toBe(true);
    const saved = await readPracticeSessionSnapshot(storage);
    expect(
      saved && !("status" in saved) && restoreAnswerState(saved),
    ).toMatchObject({ selectedOptionIds: ["sum-20"], status: "correct" });
    expect(
      await completePracticeSession(
        session,
        answer,
        [first, second, table],
        storage,
      ),
    ).toBe(true);
    expect(storage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    const summary = await readVerifiedLatestCompletedResults(
      verifyPersistedReasoningCheckpointObservation,
      storage,
    );
    expect(summary.value).toHaveLength(3);
    expect(summary.interpretation?.progressGroup).toBe("Начинаю разбираться");
    expect(summary.tableInterpretation?.progressGroup).toBe(
      "Начинаю разбираться",
    );
    const progress = await readVerifiedPracticeProgressEvidence(
      verifyPersistedPracticeProgressEvidenceFacts,
      storage,
    );
    expect(progress.interpretations.map((item) => item.progressGroup)).toEqual([
      "Начинаю разбираться",
      "Начинаю разбираться",
    ]);
    expect(
      progressEvidenceBuckets(progress.evidence).guarantee
        .latestCorrectWithoutHints,
    ).not.toBeNull();
    expect(
      progressEvidenceBuckets(progress.evidence).impossibility
        .latestCorrectWithoutHints,
    ).not.toBeNull();
    const durableProgress = storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
    expect(
      await completePracticeSession(
        session,
        answer,
        [first, second, table],
        storage,
      ),
    ).toBe(false);
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(
      durableProgress,
    );
  });

  it("treats malformed and unverifiable Progress as an error without mutating storage", async () => {
    const storage = memoryStorage();
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, "{bad");
    await expect(
      readVerifiedPracticeProgressEvidence(async () => true, storage),
    ).rejects.toThrow();
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe("{bad");
    const valid = JSON.stringify({
      version: 2,
      guarantee: emptyPracticeProgressEvidence(),
      impossibility: {
        version: 1,
        nextSequence: 2,
        latestCorrectWithoutHints: {
          sequence: 1,
          problemId: "table-impossible-sums",
          observation: table.reasoningCheckpointObservation,
          hintLevelsExposedBeforeCheckpoint: [],
          solutionExposedBeforeCheckpoint: false,
        },
        latestCorrectWithHints: null,
        latestIncorrect: null,
      },
    });
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, valid);
    await expect(
      readVerifiedPracticeProgressEvidence(async () => false, storage),
    ).rejects.toThrow();
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(valid);
  });
});

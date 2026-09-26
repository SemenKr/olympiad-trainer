import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/practice/actions", () => ({
  verifyPersistedGuaranteeEvidenceFacts: vi.fn(),
}));
vi.mock("../../../app/progress/actions", () => ({
  importBrowserProgressEvidence: vi.fn(async () => {}),
  readServerProgress: vi.fn(),
}));

import {
  emptyGuaranteeProgressEvidence,
  type GuaranteeEvidenceFact,
  type GuaranteeProgressEvidenceV0,
} from "../application/guarantee-progress-evidence";
import { SOCK_REASONING_CHECKPOINT_ID } from "../application/reasoning-checkpoint";
import { ProgressEvidenceContent } from "./progress-overview";
import {
  PROGRESS_EVIDENCE_STORAGE_KEY,
  readVerifiedGuaranteeProgressEvidence,
  readVerifiedPracticeProgressEvidence,
} from "./progress-evidence-storage";

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

function fact(
  sequence: number,
  selectedOptionId: "A" | "B",
  outcome: "correct" | "incorrect",
  hints: readonly ("focus" | "strategy" | "next-step")[] = [],
): GuaranteeEvidenceFact {
  return {
    sequence,
    problemId: "guaranteed-sock-pair",
    observation: {
      checkpointId: SOCK_REASONING_CHECKPOINT_ID,
      selectedOptionId,
      outcome,
      validSubmissionCountAtSubmit: 1,
    },
    hintLevelsExposedBeforeCheckpoint: hints,
    solutionExposedBeforeCheckpoint: false,
  };
}

async function renderEvidence(evidence?: GuaranteeProgressEvidenceV0) {
  const storage = memoryStorage();
  const verify = vi.fn(async () => true);
  storage.setItem("olympiad-trainer:practice-session", "unfinished sentinel");
  storage.setItem(
    "olympiad-trainer:practice-latest-completed",
    "summary sentinel",
  );
  if (evidence) {
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, JSON.stringify(evidence));
  }

  const read = await readVerifiedGuaranteeProgressEvidence(verify, storage);
  const markup = renderToStaticMarkup(
    <ProgressEvidenceContent interpretation={read.interpretation} />,
  );
  expect(storage.getItem("olympiad-trainer:practice-session")).toBe(
    "unfinished sentinel",
  );
  expect(storage.getItem("olympiad-trainer:practice-latest-completed")).toBe(
    "summary sentinel",
  );
  expect(markup).not.toContain("selectedOptionId");
  expect(markup).not.toContain("nextSequence");
  expect(markup).not.toContain("sequence");
  expect(markup).not.toContain(SOCK_REASONING_CHECKPOINT_ID);
  expect(markup).not.toContain("guaranteed-sock-pair");
  expect(markup).not.toContain("Ещё не пробовал");
  return { markup, read, verify };
}

describe("Progress overview", () => {
  it("renders both derived capabilities without exposing raw facts and retries verified reads", async () => {
    const storage = memoryStorage();
    const evidence = {
      version: 2,
      guarantee: {
        ...emptyGuaranteeProgressEvidence(),
        nextSequence: 2,
        latestCorrectWithoutHints: fact(1, "A", "correct"),
      },
      impossibility: {
        version: 1,
        nextSequence: 2,
        latestCorrectWithoutHints: {
          sequence: 1,
          problemId: "table-impossible-sums",
          observation: {
            checkpointId: "table-impossible-sums-impossibility-argument",
            selectedOptionId: "A",
            outcome: "correct",
            validSubmissionCountAtSubmit: 1,
          },
          hintLevelsExposedBeforeCheckpoint: [],
          solutionExposedBeforeCheckpoint: false,
        },
        latestCorrectWithHints: null,
        latestIncorrect: null,
      },
    };
    const raw = JSON.stringify(evidence);
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, raw);
    const verify = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce(true);
    await expect(
      readVerifiedPracticeProgressEvidence(verify, storage),
    ).rejects.toThrow("Network unavailable");
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(raw);
    const retried = await readVerifiedPracticeProgressEvidence(verify, storage);
    expect(verify).toHaveBeenCalledTimes(2);
    const markup = renderToStaticMarkup(
      <>
        {retried.interpretations.map((interpretation) => (
          <ProgressEvidenceContent
            interpretation={interpretation}
            key={interpretation.learnerLabel}
          />
        ))}
      </>,
    );
    expect(markup).toContain("Как гарантировать результат");
    expect(markup).toContain("Доказывать, что что-то невозможно");
    expect(markup.match(/Начинаю разбираться/g)).toHaveLength(2);
    expect(markup).not.toContain("selectedOptionId");
    expect(markup).not.toContain("sum-20");
    expect(markup).not.toContain("sequence");
    expect(markup).not.toContain("Уже получается");
  });

  it("keeps a verification failure distinct from empty evidence and re-verifies on retry", async () => {
    const storage = memoryStorage();
    const evidence = {
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 2,
      latestCorrectWithoutHints: fact(1, "A", "correct"),
    };
    const raw = JSON.stringify(evidence);
    storage.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, raw);
    const verify = vi
      .fn<() => Promise<boolean>>()
      .mockRejectedValueOnce(new Error("Verification unavailable"))
      .mockResolvedValueOnce(true);

    await expect(
      readVerifiedGuaranteeProgressEvidence(verify, storage),
    ).rejects.toThrow("Verification unavailable");
    expect(storage.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe(raw);

    const retried = await readVerifiedGuaranteeProgressEvidence(
      verify,
      storage,
    );
    expect(verify).toHaveBeenCalledTimes(2);
    expect(retried.interpretation.progressGroup).toBe("Начинаю разбираться");
  });

  it("shows a neutral conclusion for empty evidence", async () => {
    const { markup, verify } = await renderEvidence();

    expect(verify).not.toHaveBeenCalled();
    expect(markup).toContain("Как гарантировать результат");
    expect(markup).toContain("Пока рано сказать");
    expect(markup).not.toContain("Начинаю разбираться");
  });

  it("shows bounded recognition for verified no-hint evidence", async () => {
    const evidence = {
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 2,
      latestCorrectWithoutHints: fact(1, "A", "correct"),
    };
    const { markup, verify } = await renderEvidence(evidence);

    expect(verify).toHaveBeenCalledOnce();
    expect(markup).toContain("Начинаю разбираться");
    expect(markup).toContain("Без открытых подсказок");
    expect(markup).toContain("не самостоятельное доказательство");
    expect(markup).not.toContain("Уже получается");
  });

  it("distinguishes verified hinted recognition from independent proof", async () => {
    const evidence = {
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 2,
      latestCorrectWithHints: fact(1, "A", "correct", ["focus"]),
    };
    const { markup, verify } = await renderEvidence(evidence);

    expect(verify).toHaveBeenCalledOnce();
    expect(markup).toContain("Начинаю разбираться");
    expect(markup).toContain("После открытых подсказок");
    expect(markup).toContain("Самостоятельное построение");
  });

  it("retains earlier positive evidence but shows uncertainty after a later incorrect check", async () => {
    const positive = fact(1, "A", "correct");
    const evidence = {
      ...emptyGuaranteeProgressEvidence(),
      nextSequence: 3,
      latestCorrectWithoutHints: positive,
      latestIncorrect: fact(2, "B", "incorrect"),
    };
    const { markup, read, verify } = await renderEvidence(evidence);

    expect(verify).toHaveBeenCalledOnce();
    expect(read.evidence.latestCorrectWithoutHints).toEqual(positive);
    expect(markup).toContain("Начинаю разбираться");
    expect(markup).toContain("в более поздней такой проверке ответ был другим");
    expect(markup).toContain("Пока рано говорить о стабильности");
    expect(markup).not.toContain("Уже получается");
  });
});

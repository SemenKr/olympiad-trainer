import { JSDOM } from "jsdom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../../../app/practice/knowledge-support-actions", () => ({
  readKnowledgeSupport: vi.fn(),
  readKnowledgeSupportEligibility: vi.fn(),
  submitKnowledgeDiagnostic: vi.fn(),
  openKnowledgeLesson: vi.fn(),
  submitKnowledgeMicroCheck: vi.fn(),
}));
vi.mock("../../../app/progress/actions", () => ({
  persistPracticeFinishEvidence: vi.fn(),
  readServerAdaptiveAvailability: vi.fn(),
  readServerNextUsefulProblem: vi.fn(),
}));
vi.mock("@/app/practice/actions", () => ({
  revealPracticeHint: vi.fn(),
  revealPracticeSolution: vi.fn(),
  submitPracticeAnswer: vi.fn(),
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
import {
  readKnowledgeSupport,
  readKnowledgeSupportEligibility,
  submitKnowledgeDiagnostic,
  openKnowledgeLesson,
  submitKnowledgeMicroCheck,
} from "../../../app/practice/knowledge-support-actions";
import { persistPracticeFinishEvidence } from "../../../app/progress/actions";
import {
  revealPracticeHint,
  revealPracticeSolution,
  submitPracticeAnswer,
} from "@/app/practice/actions";
import { PracticeSession } from "../../practice/ui/practice-session";
import { createPracticeAnswerState } from "../../practice/ui/practice-answer-state";
import {
  startPackPracticeSession,
  advancePracticeSession,
  createPracticeSessionResult,
} from "../../practice/ui/fixed-practice-session-state";
import {
  getLearnerSafePackProblems,
  getLearnerSafePracticeProblem,
  getRevealedPracticeHint,
} from "../../practice/server/problem-catalog";
import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  recordHintExposure,
  startPractice,
} from "../../practice/application/practice-state";
import {
  createPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  readPracticeSessionSnapshot,
  restoreAnswerState,
  PRACTICE_SESSION_STORAGE_KEY,
} from "../../practice/ui/practice-session-storage";
import { installImmediatePracticeSessionLock } from "../../practice/ui/practice-session-lock.test-helper";
import type { SupportObservation } from "../domain/knowledge-support";
import { MINI_LESSON, MICRO_INCORRECT } from "../server/content";
import { MICRO_CORRECT } from "../domain/content";
import * as practiceStorage from "../../practice/ui/practice-session-storage";
import { assessDiagnostic, assessMicroCheck } from "../server/assessment";

import { requireDiagnosticEligibility } from "../server/eligibility";

const packs = getLearnerSafePackProblems();
const problems = [
  getLearnerSafePracticeProblem("coinciding-seats"),
  getLearnerSafePracticeProblem("guaranteed-sock-pair"),
  getLearnerSafePracticeProblem("table-impossible-sums"),
] as const;
let root: Root;
let container: HTMLDivElement;
let persisted: SupportObservation | null;
let dom: JSDOM;

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost",
  });
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("localStorage", dom.window.localStorage);
  vi.stubGlobal("Event", dom.window.Event);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.clearAllMocks();
  installImmediatePracticeSessionLock();
  localStorage.clear();
  persisted = null;
  vi.mocked(readKnowledgeSupport).mockImplementation(async () => persisted);
  vi.mocked(readKnowledgeSupportEligibility).mockImplementation(
    async (context) => requireDiagnosticEligibility(context),
  );
  vi.mocked(submitKnowledgeDiagnostic).mockImplementation(
    async (_session, option) => {
      persisted = {
        diagnosticSelectedOptionId: option as "A" | "B",
        diagnosticOutcome: assessDiagnostic(option),
        lessonOpened: false,
        microCheckSelectedOptionId: null,
        microCheckOutcome: null,
      };
      return persisted;
    },
  );
  vi.mocked(openKnowledgeLesson).mockImplementation(async () => {
    persisted = { ...persisted!, lessonOpened: true };
    return { observation: persisted, lesson: MINI_LESSON };
  });
  vi.mocked(submitKnowledgeMicroCheck).mockImplementation(
    async (_session, option) => {
      persisted = {
        ...persisted!,
        microCheckSelectedOptionId: option as "A" | "D",
        microCheckOutcome: assessMicroCheck(option),
      };
      return {
        observation: persisted,
        feedback:
          persisted.microCheckOutcome === "correct"
            ? MICRO_CORRECT
            : MICRO_INCORRECT,
      };
    },
  );
  vi.mocked(revealPracticeHint).mockImplementation(async (id, hint) =>
    getRevealedPracticeHint(String(id), String(hint)),
  );
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  dom.window.close();
});

async function seed(focusOnly = false) {
  const pack = packs["pack-f"];
  let session = startPackPracticeSession("pack-f");
  await createPracticeSessionSnapshot(
    session,
    createPracticeAnswerState(pack[0]),
  );
  const index = pack.findIndex(
    (problem) => problem.problemId === "five-piles-stones",
  );
  for (let i = 0; i < index; i++) {
    session = advancePracticeSession(
      session,
      createPracticeSessionResult(
        pack[i],
        getPracticeSummary(finishPractice(startPractice())),
        "skipped",
      ),
    )!;
    await savePracticeSessionSnapshot(
      session,
      createPracticeAnswerState(pack[i + 1]),
    );
  }
  const practice = recordHintExposure(
    focusOnly
      ? startPractice()
      : recordAnswerResult(startPractice(), {
          status: "incorrect",
          normalizedAnswer: "7",
        }),
    pack[index].hints[0],
  );
  const answer = { rawAnswer: " 007 ", status: "typing" as const, practice };
  expect(await savePracticeSessionSnapshot(session, answer)).toBe(true);
  return { answer, session };
}
async function mount() {
  await act(async () =>
    root.render(<PracticeSession problems={problems} packs={packs} />),
  );
}
function visibleText() {
  return Array.from(container.querySelectorAll("main"))
    .filter((main) => !main.closest("[hidden]"))
    .map((main) => main.textContent)
    .join(" ");
}
async function click(text: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (item) => !item.closest("[hidden]") && item.textContent === text,
  );
  expect(button, text).toBeDefined();
  await act(async () => button!.click());
}
async function choose(option: string) {
  const radio = container.querySelector<HTMLInputElement>(
    `main:not([hidden]) input[name="knowledge-option"][value="${option}"]`,
  )!;
  await act(async () => radio.click());
  await act(async () =>
    radio.form!.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    ),
  );
}

describe("Knowledge Support inside the persisted Practice episode", () => {
  it.each(["A", "D"])(
    "keeps Pack F bytes and every Practice fact through full round-trip (micro %s) and resume",
    async (microOption) => {
      const original = await seed();
      const bytes = localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY);
      await mount();
      expect(visibleText()).toContain("Нужна проверка формулировок?");
      expect(visibleText()).not.toContain("У Лены");
      await click("Проверить формулировки");
      expect(visibleText()).toContain("У Лены 12 фишек");
      expect(visibleText()).not.toContain("Условие задачи");
      await choose("B");
      expect(visibleText()).toContain("Разберём эти формулировки отдельно");
      expect(openKnowledgeLesson).not.toHaveBeenCalled();
      await click("Разобрать за минуту");
      expect(visibleText()).toContain("12 ÷ 3 = 4");
      await click("Проверить на новом примере");
      expect(visibleText()).toContain("У Лёши 24 фишки");
      await choose(microOption);
      expect(visibleText()).toContain(
        microOption === "A" ? "Верно" : "Есть ошибка в этой проверке",
      );
      await click("Вернуться к «Пять кучек камней»");
      expect(visibleText()).toContain("Пять кучек камней");
      expect(visibleText()).not.toContain("Нужна проверка формулировок?");
      expect(document.activeElement?.textContent).toBe("Пять кучек камней");
      expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(bytes);
      const restored = await readPracticeSessionSnapshot();
      expect(restored).toMatchObject({
        sessionId: original.session.sessionId,
        activeProblemIndex: original.session.activeProblemIndex,
      });
      expect(
        restored &&
          !("status" in restored) &&
          restored.reasoningCheckpointObservation,
      ).toBeUndefined();
      expect(
        restored && !("status" in restored) && restoreAnswerState(restored),
      ).toEqual(original.answer);
      expect(persistPracticeFinishEvidence).not.toHaveBeenCalled();
      expect(submitPracticeAnswer).not.toHaveBeenCalled();
      expect(revealPracticeSolution).not.toHaveBeenCalled();
      expect(revealPracticeHint).toHaveBeenCalledTimes(1); // Only restoration of the existing focus hint.
      await act(async () => root.unmount());
      root = createRoot(container);
      await mount();
      expect(visibleText()).toContain("Пять кучек камней");
      expect(
        container.querySelector<HTMLInputElement>('input[type="text"]')?.value,
      ).toBe(" 007 ");
      expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(bytes);
      expect(visibleText()).not.toContain("Нужна проверка формулировок?");
    },
  );
  it.each(["success", "failure", "throw"])(
    "waits for a pending Practice save (%s) before opening support",
    async (result) => {
      await seed();
      await mount();
      const bytes = localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY);
      const originalSave = practiceStorage.savePracticeSessionSnapshot;
      let completeSave!: () => Promise<void>;
      const pendingSave = new Promise<boolean>((resolve, reject) => {
        completeSave = async () => {
          if (result === "throw") reject(new Error("Storage unavailable"));
          else
            resolve(
              result === "success"
                ? await originalSave(...save.mock.calls[1])
                : false,
            );
        };
      });
      const save = vi
        .spyOn(practiceStorage, "savePracticeSessionSnapshot")
        .mockImplementationOnce(originalSave)
        .mockImplementationOnce(() => pendingSave);
      vi.mocked(submitPracticeAnswer).mockResolvedValueOnce({
        status: "incorrect",
        normalizedAnswer: "7",
      });
      await click("Проверить");
      expect(save).toHaveBeenCalledTimes(2);
      await click("Проверить формулировки");
      expect(visibleText()).toContain("Условие задачи");
      expect(visibleText()).not.toContain("У Лены");
      await act(async () => completeSave());
      if (result === "success") {
        expect(visibleText()).toContain("У Лены");
        await click("Вернуться к задаче");
        const saved = await readPracticeSessionSnapshot();
        expect(
          saved && !("status" in saved) && saved.activePractice.submissions,
        ).toHaveLength(2);
      } else {
        expect(visibleText()).toContain("Условие задачи");
        expect(visibleText()).toContain("Не удалось сохранить тренировку");
        expect(visibleText()).not.toContain("У Лены");
        expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(bytes);
        expect(
          container.querySelector<HTMLInputElement>('input[name="answer"]')
            ?.value,
        ).toBe(" 007 ");
      }
      expect(submitKnowledgeDiagnostic).not.toHaveBeenCalled();
    },
  );
  it("focus hint alone offers only a diagnostic; correct diagnostic never recommends a lesson", async () => {
    await seed(true);
    const bytes = localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    await mount();
    expect(submitKnowledgeDiagnostic).not.toHaveBeenCalled();
    await click("Проверить формулировки");
    await choose("A");
    expect(visibleText()).toContain("Формулировки различены верно");
    expect(visibleText()).not.toContain("Разобрать за минуту");
    expect(openKnowledgeLesson).not.toHaveBeenCalled();
    await click("Вернуться к задаче");
    expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(bytes);
  });
  it("does not surface an offer for the correct carrier answer labelled incorrect", async () => {
    const { session, answer } = await seed();
    const forged = {
      ...answer,
      practice: {
        ...answer.practice,
        submissions: [{ answer: "60", outcome: "incorrect" as const }],
      },
    };
    expect(await savePracticeSessionSnapshot(session, forged)).toBe(true);
    await mount();
    expect(readKnowledgeSupportEligibility).toHaveBeenCalled();
    expect(visibleText()).not.toContain("Нужна проверка формулировок?");
    expect(visibleText()).toContain("Условие задачи");
  });
  it("reload during support returns to the exact original episode", async () => {
    await seed();
    const bytes = localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY);
    await mount();
    await click("Проверить формулировки");
    await choose("B");
    await click("Разобрать за минуту");
    await act(async () => root.unmount());
    root = createRoot(container);
    await mount();
    expect(visibleText()).toContain("Условие задачи");
    expect(visibleText()).not.toContain("Возьмём число 12");
    expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(bytes);
  });
  it("keeps selected input and displays a retryable server error", async () => {
    await seed();
    await mount();
    await click("Проверить формулировки");
    vi.mocked(submitKnowledgeDiagnostic).mockRejectedValueOnce(
      new Error("Unavailable"),
    );
    await choose("B");
    expect(
      container.querySelector<HTMLInputElement>('input[value="B"]')?.checked,
    ).toBe(true);
    expect(visibleText()).toContain("Не удалось сохранить проверку");
    await choose("B");
    expect(visibleText()).toContain("Разберём эти формулировки отдельно");
  });
});

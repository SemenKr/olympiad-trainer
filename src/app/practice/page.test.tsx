import { JSDOM } from "jsdom";
import { act } from "react";
import type { Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/app/practice/actions", () => ({
  revealPracticeHint: vi.fn(),
  revealPracticeSolution: vi.fn(),
  submitPracticeAnswer: vi.fn(),
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("../../app/progress/actions", () => ({
  importBrowserProgressEvidence: vi.fn(async () => {}),
  persistPracticeFinishEvidence: vi.fn(async () => {}),
}));
vi.mock(
  "@/modules/practice/server/problem-catalog",
  async () => import("../../modules/practice/server/problem-catalog"),
);
vi.mock(
  "@/modules/practice/ui/practice-session",
  async () => import("../../modules/practice/ui/practice-session"),
);

import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  startPractice,
} from "../../modules/practice/application/practice-state";
import {
  PRACTICE_SESSION_STORAGE_KEY,
  validatePracticeSessionSnapshot,
} from "../../modules/practice/ui/practice-session-storage";
import {
  getActivePracticeProblem,
  PracticeSession,
} from "../../modules/practice/ui/practice-session";
import PracticePage from "./page";

const sessionId = "00000000-0000-4000-8000-000000000001";
let container: HTMLDivElement;
let root: Root;
let dom: JSDOM;

beforeEach(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost",
  });
  Object.defineProperty(dom.window.navigator, "locks", {
    value: {
      request: async (
        _name: string,
        _options: unknown,
        operation: () => unknown,
      ) => operation(),
    },
  });
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("self", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("navigator", dom.window.navigator);
  vi.stubGlobal("localStorage", dom.window.localStorage);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = (await import("react-dom/client")).createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  localStorage.clear();
  vi.unstubAllGlobals();
  dom.window.close();
});

function pageProblems() {
  return PracticePage().props as ComponentProps<typeof PracticeSession>;
}

async function mountPractice(
  props: ComponentProps<typeof PracticeSession> = pageProblems(),
) {
  await act(async () => {
    root.render(<PracticeSession {...props} />);
  });
}

function savedTransfer(
  problemId: "brothers-ages-products" | "parrots-guaranteed-colors",
) {
  const raw = JSON.stringify({
    sessionId,
    mode: "transfer",
    problemIds: [problemId],
    activeProblemIndex: 0,
    completedResults: [],
    activePractice: startPractice(),
    rawAnswer: "",
  });
  localStorage.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
  return raw;
}

describe("direct /practice restore", () => {
  it.each([
    ["brothers-ages-products", "Возраст братьев"],
    ["parrots-guaranteed-colors", "Попугаи в зоопарке"],
  ] as const)("renders the saved %s transfer problem", (problemId, title) => {
    const snapshot = validatePracticeSessionSnapshot({
      sessionId,
      mode: "transfer",
      problemIds: [problemId],
      activeProblemIndex: 0,
      completedResults: [],
      activePractice: startPractice(),
      rawAnswer: "",
    });
    expect(snapshot).not.toBeNull();
    if (!snapshot || !("mode" in snapshot) || "status" in snapshot) return;

    const { problems, transferProblem, parrotsProblem } = pageProblems();
    const problem = getActivePracticeProblem(
      {
        sessionId: snapshot.sessionId,
        mode: "transfer",
        problemId: snapshot.problemIds[0],
        activeProblemIndex: 0,
        completedResults: [],
      },
      problems,
      transferProblem,
      parrotsProblem,
    );
    expect(problem).not.toBeNull();
    if (!problem) return;
    expect(renderToStaticMarkup(<h1>{problem.title}</h1>)).toContain(title);
    expect(problem.problemId).toBe(problemId);
    expect(problem.problemId).not.toBe(problems[0].problemId);
  });

  it("restores the saved core problem", () => {
    const { problems, transferProblem, parrotsProblem } = pageProblems();
    const snapshot = validatePracticeSessionSnapshot({
      sessionId,
      problemIds: problems.map((problem) => problem.problemId),
      activeProblemIndex: 1,
      completedResults: [
        {
          problemId: problems[0].problemId,
          problemTitle: problems[0].title,
          summary: getPracticeSummary(
            finishPractice(
              recordAnswerResult(startPractice(), {
                status: "correct",
                normalizedAnswer: "17",
              }),
            ),
          ),
        },
      ],
      activePractice: startPractice(),
      rawAnswer: "",
    });
    expect(snapshot).not.toBeNull();
    if (!snapshot || "mode" in snapshot || "status" in snapshot) return;

    const problem = getActivePracticeProblem(
      {
        sessionId: snapshot.sessionId,
        activeProblemIndex: snapshot.activeProblemIndex,
        completedResults: snapshot.completedResults,
      },
      problems,
      transferProblem,
      parrotsProblem,
    );
    expect(problem).not.toBeNull();
    if (!problem) return;
    expect(renderToStaticMarkup(<h1>{problem.title}</h1>)).toContain(
      "Носки в пакете",
    );
    expect(problem.problemId).toBe(snapshot.problemIds[1]);
  });

  it("does not substitute the first core problem for a transfer", () => {
    const { problems, transferProblem, parrotsProblem } = pageProblems();
    const session = {
      sessionId,
      mode: "transfer" as const,
      problemId: "parrots-guaranteed-colors" as const,
      activeProblemIndex: 0 as const,
      completedResults: [] as const,
    };
    expect(
      getActivePracticeProblem(session, problems, transferProblem, undefined),
    ).toBeNull();
    expect(
      getActivePracticeProblem(
        session,
        problems,
        transferProblem,
        transferProblem,
      ),
    ).toBeNull();
    expect(parrotsProblem?.problemId).toBe("parrots-guaranteed-colors");
  });

  it.each([
    ["missing", undefined],
    ["mismatched", pageProblems().transferProblem],
  ] as const)(
    "shows recovery for %s transfer configuration and preserves the snapshot",
    async (_case, parrotsProblem) => {
      const raw = savedTransfer("parrots-guaranteed-colors");
      const props = { ...pageProblems(), parrotsProblem };
      await mountPractice(props);

      expect(container.querySelector('[role="alert"]')?.textContent).toContain(
        "Не удалось проверить сохранённую тренировку.",
      );
      expect(container.querySelector("button")?.textContent).toBe("Повторить");
      expect(container.textContent).not.toContain("Совпадающие места");
      expect(container.textContent).not.toContain("Возраст братьев");
      expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);

      const validProps = pageProblems();
      await act(async () => {
        root.render(<PracticeSession {...validProps} />);
        container.querySelector("button")?.click();
      });
      expect(container.textContent).toContain("Попугаи в зоопарке");
      expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);
    },
  );

  it.each([
    ["brothers-ages-products", "Возраст братьев"],
    ["parrots-guaranteed-colors", "Попугаи в зоопарке"],
  ] as const)(
    "mounts the saved %s transfer problem",
    async (problemId, title) => {
      savedTransfer(problemId);
      await mountPractice();
      expect(container.querySelector("h1")?.textContent).toBe(title);
    },
  );

  it("mounts the exact saved core problem", async () => {
    const { problems } = pageProblems();
    localStorage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify({
        sessionId,
        problemIds: problems.map((problem) => problem.problemId),
        activeProblemIndex: 1,
        completedResults: [
          {
            problemId: problems[0].problemId,
            problemTitle: problems[0].title,
            summary: getPracticeSummary(
              finishPractice(
                recordAnswerResult(startPractice(), {
                  status: "correct",
                  normalizedAnswer: "17",
                }),
              ),
            ),
          },
        ],
        activePractice: startPractice(),
        rawAnswer: "",
      }),
    );
    await mountPractice();
    expect(container.querySelector("h1")?.textContent).toBe("Носки в пакете");
  });
});

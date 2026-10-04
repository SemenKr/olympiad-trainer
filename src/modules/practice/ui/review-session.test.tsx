import { JSDOM } from "jsdom";
import { act, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../../knowledge-support/ui/knowledge-support", () => ({
  KnowledgeSupport: ({
    children,
  }: {
    children: (offer: ReactNode) => ReactNode;
  }) => children(null),
}));
vi.mock("@/app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
vi.mock("../../../app/progress/actions", () => ({
  startServerReview: vi.fn(),
  readServerNextUsefulProblem: vi.fn(),
}));
vi.mock("./server-progress-import", () => ({
  ensureServerProgressImported: vi.fn(async () => null),
}));
vi.mock("./practice-session-storage", () => ({
  readVerifiedPracticeSessionSnapshot: vi.fn(async () => ({
    value: null,
    interpretation: null,
  })),
  restoreAnswerState: (snapshot: {
    rawAnswer: string;
    activePractice: unknown;
  }) => ({
    rawAnswer: snapshot.rawAnswer,
    practice: snapshot.activePractice,
    status: "typing",
  }),
  createPracticeSessionSnapshot: vi.fn(async () => true),
  savePracticeSessionSnapshot: vi.fn(async () => true),
}));
import {
  startServerReview,
  readServerNextUsefulProblem,
} from "../../../app/progress/actions";
import {
  createPracticeSessionSnapshot,
  readVerifiedPracticeSessionSnapshot,
} from "./practice-session-storage";
import { PracticeSession } from "./practice-session";
import { getLearnerSafePracticeProblem } from "../server/problem-catalog";
import { startPractice } from "../application/practice-state";
const problems = [
  getLearnerSafePracticeProblem("coinciding-seats"),
  getLearnerSafePracticeProblem("guaranteed-sock-pair"),
  getLearnerSafePracticeProblem("table-impossible-sums"),
] as const;
let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost",
  });
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("self", dom.window);
  vi.stubGlobal("document", dom.window.document);
  vi.stubGlobal("navigator", dom.window.navigator);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  dom.window.close();
});
describe("Review Practice entry", () => {
  it("starts a fresh one-problem server-owned attempt and displays distinct mode", async () => {
    vi.mocked(startServerReview).mockResolvedValue(
      "00000000-0000-4000-8000-000000000011",
    );
    const container = document.createElement("div");
    document.body.append(container);
    const root = (await import("react-dom/client")).createRoot(container);
    await act(async () => {
      root.render(<PracticeSession problems={problems} startMode="review" />);
    });
    expect(container.textContent).toContain("Повторная попытка");
    expect(container.textContent).toContain("Совпадающие места");
    expect(createPracticeSessionSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "review",
        problemId: "coinciding-seats",
        sessionId: "00000000-0000-4000-8000-000000000011",
      }),
      expect.objectContaining({ rawAnswer: "", practice: startPractice() }),
    );
    expect(readServerNextUsefulProblem).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("Проверить рассуждение");
    await act(async () => {
      root.unmount();
    });
  });
  it.each(["empty", "error"])(
    "shows explicit %s state without creating local practice",
    async (kind) => {
      if (kind === "empty")
        vi.mocked(startServerReview).mockResolvedValue(null);
      else vi.mocked(startServerReview).mockRejectedValue(Error("db offline"));
      const container = document.createElement("div");
      document.body.append(container);
      const root = (await import("react-dom/client")).createRoot(container);
      await act(async () => {
        root.render(<PracticeSession problems={problems} startMode="review" />);
      });
      expect(container.textContent).toContain(
        kind === "empty" ? "Пока нет подходящей" : "Не удалось проверить",
      );
      expect(createPracticeSessionSnapshot).not.toHaveBeenCalled();
      await act(async () => {
        root.unmount();
      });
    },
  );
  it("keeps existing core Resume ahead of Review start", async () => {
    vi.mocked(readVerifiedPracticeSessionSnapshot).mockResolvedValueOnce({
      value: {
        sessionId: "00000000-0000-4000-8000-000000000012",
        problemIds: problems.map((p) => p.problemId) as [
          string,
          string,
          string,
        ],
        activeProblemIndex: 0,
        completedResults: [],
        activePractice: startPractice(),
        rawAnswer: "7",
      },
      interpretation: null,
    });
    const container = document.createElement("div");
    document.body.append(container);
    const root = (await import("react-dom/client")).createRoot(container);
    await act(async () => {
      root.render(<PracticeSession problems={problems} startMode="review" />);
    });
    expect(startServerReview).not.toHaveBeenCalled();
    expect(container.querySelector<HTMLInputElement>("input")?.value).toBe("7");
    await act(async () => {
      root.unmount();
    });
  });
});

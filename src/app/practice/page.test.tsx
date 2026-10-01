import { JSDOM } from "jsdom";
import { act } from "react";
import type { Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./knowledge-support-actions", () => ({
  readKnowledgeSupport: vi.fn(async () => null),
  readKnowledgeSupportEligibility: vi.fn(async () => false),
}));

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
  readServerNextUsefulProblem: vi.fn(async () => null),
  readServerAdaptiveAvailability: vi.fn(async () => ({
    availability: { status: "insufficient-evidence" },
    hasPracticeHistory: true,
  })),
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
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  validatePracticeSessionSnapshot,
} from "../../modules/practice/ui/practice-session-storage";
import {
  getActivePracticeProblem,
  PracticeSession,
} from "../../modules/practice/ui/practice-session";
import PracticePage from "./page";
import TransferPracticePage from "./transfer/page";
import PackPracticePage from "./pack/page";
import { readServerNextUsefulProblem } from "../../app/progress/actions";
import { PRACTICE_PACKS } from "../../modules/practice/application/completed-practice-episode";

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
  it.each(PRACTICE_PACKS.slice(3))(
    "starts $id from the registry tuple without route changes",
    async (pack) => {
      const route = await PackPracticePage({
        searchParams: Promise.resolve({ pack: pack.id }),
      });
      const props = route.props as ComponentProps<typeof PracticeSession>;
      expect(props.startPackId).toBe(pack.id);
      expect(
        props.packs?.[pack.id].map((problem) => problem.problemId),
      ).toEqual(pack.problemIds);
      await mountPractice(props);
      expect(container.querySelector("h1")?.textContent).toBe(
        props.packs?.[pack.id][0].title,
      );
      expect(
        JSON.parse(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
      ).toMatchObject({
        mode: "pack",
        problemIds: pack.problemIds,
      });
    },
  );
  it.each(
    PRACTICE_PACKS.flatMap((storedPack) =>
      PRACTICE_PACKS.filter(
        (requestedPack) => requestedPack.id !== storedPack.id,
      ).map((requestedPack) => [storedPack, requestedPack] as const),
    ),
  )(
    "keeps stored %s identity when the route requests %s",
    async (storedPack, requestedPack) => {
      const route = await PackPracticePage({
        searchParams: Promise.resolve({ pack: requestedPack.id }),
      });
      const props = route.props as ComponentProps<typeof PracticeSession>;
      const first = props.packs![storedPack.id][0];
      const snapshot = {
        sessionId,
        mode: "pack",
        problemIds: storedPack.problemIds,
        activeProblemIndex: 0,
        completedResults: [],
        activePractice: startPractice(),
        ...(first.response.kind === "multiple-choice-set"
          ? { selectedOptionIds: [] }
          : { rawAnswer: "" }),
      };
      localStorage.setItem(
        PRACTICE_SESSION_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
      await mountPractice(props);
      expect(container.querySelector("h1")?.textContent).toBe(first.title);
      expect(
        JSON.parse(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
      ).toEqual(snapshot);
    },
  );
  it("starts Pack A by default, Pack B only for its literal query, and rejects invalid queries", async () => {
    const a = await PackPracticePage({ searchParams: Promise.resolve({}) });
    const aProps = a.props as ComponentProps<typeof PracticeSession>;
    expect(aProps.startPackId).toBe("pack-a");
    expect(
      aProps.packs?.["pack-a"].map((problem) => problem.problemId),
    ).toEqual([
      "granddaughters-first",
      "cutout-area-ratio",
      "domino-placements",
    ]);
    const b = await PackPracticePage({
      searchParams: Promise.resolve({ pack: "pack-b" }),
    });
    const bProps = b.props as ComponentProps<typeof PracticeSession>;
    expect(bProps.startPackId).toBe("pack-b");
    expect(
      bProps.packs?.["pack-b"].map((problem) => problem.problemId),
    ).toEqual([
      "truck-car-same-arrival",
      "knights-all-or-none",
      "boastful-fisherman-streak",
    ]);
    const c = await PackPracticePage({
      searchParams: Promise.resolve({ pack: "pack-c" }),
    });
    const cProps = c.props as ComponentProps<typeof PracticeSession>;
    expect(cProps.startPackId).toBe("pack-c");
    expect(
      cProps.packs?.["pack-c"].map((problem) => problem.problemId),
    ).toEqual([
      "largest-valid-eight-digit",
      "three-numbers-digit-sums",
      "mountain-plain-flights",
    ]);
    const explicitA = await PackPracticePage({
      searchParams: Promise.resolve({ pack: "pack-a" }),
    });
    expect(
      (explicitA.props as ComponentProps<typeof PracticeSession>).startPackId,
    ).toBe("pack-a");
    await expect(
      PackPracticePage({ searchParams: Promise.resolve({ pack: "unknown" }) }),
    ).rejects.toThrow();
    await expect(
      PackPracticePage({
        searchParams: Promise.resolve({ pack: ["pack-a", "pack-b"] }),
      }),
    ).rejects.toThrow();
    await mountPractice(bProps);
    expect(container.querySelector("h1")?.textContent).toBe(
      "Одновременно в город",
    );
    expect(
      JSON.parse(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
    ).toMatchObject({
      mode: "pack",
      problemIds: [
        "truck-car-same-arrival",
        "knights-all-or-none",
        "boastful-fisherman-streak",
      ],
    });
  });

  it("skips through Pack B in order and finishes its three-result Summary", async () => {
    const route = await PackPracticePage({
      searchParams: Promise.resolve({ pack: "pack-b" }),
    });
    await mountPractice(route.props as ComponentProps<typeof PracticeSession>);
    for (const title of ["Рыцари и лжецы", "Хвастливый рыбак"]) {
      await act(async () => {
        [...container.querySelectorAll("button")]
          .find((button) => button.textContent?.includes("Пропустить задачу"))
          ?.click();
      });
      expect(container.querySelector("h1")?.textContent).toBe(title);
    }
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("Пропустить задачу"))
        ?.click();
    });
    expect(container.textContent).toContain(
      "Сейчас больше нет задач в этой тренировке.",
    );
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("Завершить тренировку"))
        ?.click();
    });
    expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(
      JSON.parse(
        localStorage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!,
      ).results.map((result: { problemId: string }) => result.problemId),
    ).toEqual([
      "truck-car-same-arrival",
      "knights-all-or-none",
      "boastful-fisherman-streak",
    ]);
  });

  it("restores stored Pack B even when the route requests Pack A", async () => {
    const snapshot = {
      sessionId,
      mode: "pack",
      problemIds: [
        "truck-car-same-arrival",
        "knights-all-or-none",
        "boastful-fisherman-streak",
      ],
      activeProblemIndex: 1,
      completedResults: [
        {
          problemId: "truck-car-same-arrival",
          problemTitle: "Одновременно в город",
          summary: getPracticeSummary(finishPractice(startPractice())),
          taskOutcome: "skipped",
        },
      ],
      activePractice: startPractice(),
      selectedOptionIds: ["count-0"],
    };
    localStorage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
    const route = await PackPracticePage({ searchParams: Promise.resolve({}) });
    await mountPractice(route.props as ComponentProps<typeof PracticeSession>);
    expect(container.querySelector("h1")?.textContent).toBe("Рыцари и лжецы");
    expect(
      JSON.parse(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
    ).toEqual(snapshot);
  });
  it("skips through Pack C, finishes, and keeps its exact latest tuple", async () => {
    const route = await PackPracticePage({
      searchParams: Promise.resolve({ pack: "pack-c" }),
    });
    await mountPractice(route.props as ComponentProps<typeof PracticeSession>);
    expect(container.querySelector("h1")?.textContent).toBe(
      "Самое большое число",
    );
    for (const title of ["Три загадочных числа", "Рейсы между городами"]) {
      await act(async () => {
        [...container.querySelectorAll("button")]
          .find((button) => button.textContent?.includes("Пропустить задачу"))
          ?.click();
      });
      expect(container.querySelector("h1")?.textContent).toBe(title);
    }
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("Пропустить задачу"))
        ?.click();
    });
    expect(container.textContent).toContain(
      "Сейчас больше нет задач в этой тренировке.",
    );
    await act(async () => {
      [...container.querySelectorAll("button")]
        .find((button) => button.textContent?.includes("Завершить тренировку"))
        ?.click();
    });
    expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    expect(
      JSON.parse(
        localStorage.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!,
      ).results.map((result: { problemId: string }) => result.problemId),
    ).toEqual([
      "largest-valid-eight-digit",
      "three-numbers-digit-sums",
      "mountain-plain-flights",
    ]);
  });

  it("restores stored Pack C even when the route requests Pack B", async () => {
    const snapshot = {
      sessionId,
      mode: "pack",
      problemIds: [
        "largest-valid-eight-digit",
        "three-numbers-digit-sums",
        "mountain-plain-flights",
      ],
      activeProblemIndex: 1,
      completedResults: [
        {
          problemId: "largest-valid-eight-digit",
          problemTitle: "Самое большое число",
          summary: getPracticeSummary(finishPractice(startPractice())),
          taskOutcome: "skipped",
        },
      ],
      activePractice: startPractice(),
      rawAnswer: "24",
    };
    localStorage.setItem(
      PRACTICE_SESSION_STORAGE_KEY,
      JSON.stringify(snapshot),
    );
    const route = await PackPracticePage({
      searchParams: Promise.resolve({ pack: "pack-b" }),
    });
    await mountPractice(route.props as ComponentProps<typeof PracticeSession>);
    expect(container.querySelector("h1")?.textContent).toBe(
      "Три загадочных числа",
    );
    expect(
      JSON.parse(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
    ).toEqual(snapshot);
  });
  it("restores the exact saved pages exploration through the core and adaptive routes", async () => {
    const raw = JSON.stringify({
      sessionId,
      mode: "exploration",
      problemIds: ["pages-without-digit-one"],
      activeProblemIndex: 0,
      completedResults: [],
      activePractice: startPractice(),
      rawAnswer: "",
    });
    localStorage.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
    expect(validatePracticeSessionSnapshot(JSON.parse(raw))).toMatchObject({
      mode: "exploration",
    });
    await mountPractice();
    expect(container.querySelector("h1")?.textContent).toBe(
      "Страницы без цифры 1",
    );
    expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBe(raw);
  });

  it("uses the server recommendation for direct pages opening", async () => {
    const route = await TransferPracticePage({
      searchParams: Promise.resolve({ problem: "pages-without-digit-one" }),
    });
    const props = route.props as ComponentProps<typeof PracticeSession>;
    vi.mocked(readServerNextUsefulProblem).mockResolvedValueOnce({
      problemId: "brothers-ages-products",
      reason: "existing transfer first",
    });
    await mountPractice(props);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Не удалось проверить сохранённую тренировку.",
    );
    expect(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
    vi.mocked(readServerNextUsefulProblem).mockResolvedValueOnce({
      problemId: "pages-without-digit-one",
      reason: "new idea",
    });
    await act(async () => {
      root.render(<PracticeSession {...props} />);
      container.querySelector("button")?.click();
    });
    expect(container.querySelector("h1")?.textContent).toBe(
      "Страницы без цифры 1",
    );
    expect(
      JSON.parse(localStorage.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
    ).toMatchObject({
      mode: "exploration",
      problemIds: ["pages-without-digit-one"],
    });
  });
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
    if (!snapshot || snapshot.mode !== "transfer" || "status" in snapshot)
      return;

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

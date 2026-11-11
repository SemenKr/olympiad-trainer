// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
vi.mock("../modules/learner/local-ownership", () => ({
  captureLearnerStorage: vi.fn(),
}));
vi.mock("../modules/learner/canonical-local-store", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../modules/learner/canonical-local-store")
  >()),
  isCanonicalStorage: vi.fn(() => true),
  refreshCanonicalStorage: vi.fn(async () => {}),
  assertCanonicalStorageCurrent: vi.fn(async () => {}),
}));
vi.mock("./practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));
import { captureLearnerStorage } from "../modules/learner/local-ownership";
import {
  refreshCanonicalStorage,
  assertCanonicalStorageCurrent,
  isCanonicalStorage,
} from "../modules/learner/canonical-local-store";
import { verifyPersistedReasoningCheckpointObservation } from "./practice/actions";
import { packProblemIds } from "../modules/practice/application/completed-practice-episode";
import { startPractice } from "../modules/practice/application/practice-state";
import { BetaHomeAction, readBetaHomeTarget } from "./beta-home-action";
const ids = [...packProblemIds("pack-s"), ...packProblemIds("pack-t")];
const key = "olympiad-trainer:practice-session";
let values: Map<string, string>;
let storage: Storage;
function session(pack: "pack-s" | "pack-t" = "pack-s") {
  return {
    sessionId: "00000000-0000-4000-8000-000000000065",
    mode: "pack",
    problemIds: packProblemIds(pack),
    activeProblemIndex: 0,
    completedResults: [],
    activePractice: startPractice(),
    rawAnswer: "draft",
  };
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  values = new Map();
  storage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: vi.fn(() => {
      throw Error("Home wrote storage");
    }),
    removeItem: vi.fn(() => {
      throw Error("Home deleted storage");
    }),
    clear: vi.fn(),
    key: () => null,
    length: 0,
  };
  vi.mocked(captureLearnerStorage).mockReturnValue(storage);
  vi.mocked(isCanonicalStorage).mockReturnValue(true);
});
afterEach(() => vi.unstubAllGlobals());
it("offers fresh S only after a verified empty canonical read", async () => {
  expect(await readBetaHomeTarget(ids)).toBeNull();
  expect(assertCanonicalStorageCurrent).toHaveBeenCalled();
  expect(storage.setItem).not.toHaveBeenCalled();
  expect(storage.removeItem).not.toHaveBeenCalled();
});
it.each(["pack-s", "pack-t"] as const)(
  "routes %s to its exact pack without mutating bytes",
  async (pack) => {
    const raw = JSON.stringify(session(pack));
    values.set(key, raw);
    expect(await readBetaHomeTarget(ids)).toBe(`/practice/pack?pack=${pack}`);
    expect(values.get(key)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
  },
);
it.each([
  [key, "{"],
  [key, JSON.stringify({ ...session(), mode: "review" })],
  [key, JSON.stringify({ ...session(), problemIds: ["coinciding-seats"] })],
  [key, JSON.stringify({ ...session(), problemIds: packProblemIds("pack-u") })],
  [
    "olympiad-trainer:practice-server-finish-request",
    JSON.stringify({
      episodeMode: "pack",
      episodeFacts: {
        version: 1,
        problems: [{ problemId: "original-box-totals" }],
      },
    }),
  ],
  [key, JSON.stringify({ ...session(), activeProblemIndex: 99 })],
  ["olympiad-trainer:practice-progress-finish-pending", "{}"],
  ["olympiad-trainer:progress-evidence-v0", "{}"],
  ["olympiad-trainer:practice-server-finish-request", "{}"],
])(
  "fails closed and retains invalid/restricted bytes: %s %s",
  async (slot, raw) => {
    values.set(slot, raw);
    await expect(readBetaHomeTarget(ids)).rejects.toThrow();
    expect(values.get(slot)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(
      verifyPersistedReasoningCheckpointObservation,
    ).not.toHaveBeenCalled();
  },
);
it("blocks noncanonical storage and owner/revision failures", async () => {
  vi.mocked(isCanonicalStorage).mockReturnValueOnce(false);
  await expect(readBetaHomeTarget(ids)).rejects.toThrow();
  vi.mocked(assertCanonicalStorageCurrent).mockRejectedValueOnce(
    Error("owner changed"),
  );
  await expect(readBetaHomeTarget(ids)).rejects.toThrow("owner changed");
});
it("renders noninteractive loading, fails closed, then retries into fresh entry", async () => {
  let reject!: (error: Error) => void;
  vi.mocked(refreshCanonicalStorage).mockImplementationOnce(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const container = document.createElement("div");
  const root = createRoot(container);
  await act(async () =>
    root.render(<BetaHomeAction allowedProblemIds={ids} />),
  );
  expect(container.querySelector('[role="status"]')).not.toBeNull();
  expect(container.querySelector("a,button")).toBeNull();
  await act(async () => reject(Error("UnsupportedPracticeStateError")));
  expect(container.textContent).toContain("Данные сохранены");
  expect(container.textContent).not.toContain("Начать тренировку");
  await act(async () => container.querySelector("button")!.click());
  expect(container.querySelector("a")?.getAttribute("href")).toBe("/practice");
  await act(async () => root.unmount());
});

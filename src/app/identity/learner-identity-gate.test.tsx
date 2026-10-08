// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./actions", () => ({
  readLearnerIdentityStatus: vi.fn(),
  initializeFreshAnonymousLearner: vi.fn(),
}));
import {
  readLearnerIdentityStatus,
  initializeFreshAnonymousLearner,
} from "./actions";
import LearnerIdentityGate from "./learner-identity-gate";
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: { request: async (_name: string, fn: () => Promise<void>) => fn() },
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
async function render() {
  await act(async () =>
    root.render(
      <LearnerIdentityGate>
        <p>learner content</p>
      </LearnerIdentityGate>,
    ),
  );
}
describe("explicit fresh-browser initialization gate", () => {
  it("initializes fresh storage before rendering learner operations", async () => {
    vi.mocked(readLearnerIdentityStatus)
      .mockResolvedValueOnce("missing")
      .mockResolvedValueOnce("available");
    await render();
    expect(initializeFreshAnonymousLearner).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("learner content");
  });
  it("retains existing cookie/local work without initializing", async () => {
    localStorage.setItem(
      "olympiad-trainer:practice-server-finish-request",
      "pending bytes",
    );
    vi.mocked(readLearnerIdentityStatus).mockResolvedValue("available");
    await render();
    expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
    expect(container.textContent).toContain("learner content");
    expect(
      localStorage.getItem("olympiad-trainer:practice-server-finish-request"),
    ).toBe("pending bytes");
  });
  it.each([
    "practice-session",
    "practice-latest-completed",
    "progress-evidence-v0",
    "practice-progress-finish-pending",
    "practice-server-finish-request",
    "simulation-pending-v0",
  ])(
    "blocks cookie-loss initialization when %s exists, without deleting it",
    async (key) => {
      const name = `olympiad-trainer:${key}`;
      localStorage.setItem(name, "saved bytes");
      vi.mocked(readLearnerIdentityStatus).mockResolvedValue("missing");
      await render();
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      expect(container.textContent).not.toContain("learner content");
      expect(localStorage.getItem(name)).toBe("saved bytes");
    },
  );
  it("does not replace unavailable identity and retries a transient failure", async () => {
    vi.mocked(readLearnerIdentityStatus)
      .mockResolvedValueOnce("unavailable")
      .mockResolvedValueOnce("available");
    await render();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await act(async () => container.querySelector("button")!.click());
    expect(container.textContent).toContain("learner content");
    expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
  });
  it("fails closed when local storage inspection fails", async () => {
    vi.mocked(readLearnerIdentityStatus).mockResolvedValue("missing");
    const spy = vi
      .spyOn(Storage.prototype, "length", "get")
      .mockImplementation(() => {
        throw new Error("unavailable");
      });
    try {
      await render();
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});

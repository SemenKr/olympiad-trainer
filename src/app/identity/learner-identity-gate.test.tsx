// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./actions", () => ({
  readAuthenticatedLearnerContext: vi.fn(),
  initializeFreshAnonymousLearner: vi.fn(),
}));
const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));
import {
  readAuthenticatedLearnerContext,
  initializeFreshAnonymousLearner,
} from "./actions";
import LearnerIdentityGate from "./learner-identity-gate";
const owner = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "0",
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  navigation.pathname = "/";
  localStorage.clear();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: async (
        _name: string,
        options: unknown,
        callback?: (lock: Lock) => unknown,
      ) =>
        typeof options === "function"
          ? options()
          : callback!({ name: _name } as Lock),
    },
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
  it.each(["malformed", "unknown", "expired", "revoked"])(
    "%s credential never binds/imports/deletes legacy work",
    async () => {
      const key = "olympiad-trainer:practice-server-finish-request";
      localStorage.setItem(key, "legacy pending request");
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(
        "unavailable",
      );
      await render();
      expect(container.textContent).not.toContain("learner content");
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
      expect(localStorage.getItem(key)).toBe("legacy pending request");
      expect(
        localStorage.getItem("olympiad-trainer:local-owner-v1"),
      ).toBeNull();
      expect(
        Object.keys(localStorage).some((key) =>
          key.startsWith("olympiad-trainer:learner:"),
        ),
      ).toBe(false);
    },
  );
  it("initializes fresh storage before rendering learner operations", async () => {
    vi.mocked(readAuthenticatedLearnerContext)
      .mockResolvedValueOnce("missing")
      .mockResolvedValueOnce("missing")
      .mockResolvedValueOnce(owner);
    await render();
    expect(initializeFreshAnonymousLearner).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("learner content");
  });
  it("retains existing cookie/local work without initializing", async () => {
    localStorage.setItem(
      "olympiad-trainer:practice-server-finish-request",
      "pending bytes",
    );
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(owner);
    await render();
    expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
    expect(container.textContent).toContain("learner content");
    expect(
      localStorage.getItem("olympiad-trainer:practice-server-finish-request"),
    ).toBe("pending bytes");
    expect(
      JSON.parse(
        localStorage.getItem(
          `olympiad-trainer:learner:${owner.learnerId}:practice-server-finish-request`,
        )!,
      ).payload,
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
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("missing");
      await render();
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      expect(container.textContent).not.toContain("learner content");
      expect(localStorage.getItem(name)).toBe("saved bytes");
    },
  );
  it("does not replace unavailable identity and retries a transient failure", async () => {
    vi.mocked(readAuthenticatedLearnerContext)
      .mockResolvedValueOnce("unavailable")
      .mockResolvedValueOnce(owner);
    await render();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await act(async () => container.querySelector("button")!.click());
    expect(container.textContent).toContain("learner content");
    expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
  });
  it("fails closed when local storage inspection fails", async () => {
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("missing");
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
  it("keeps Restore reachable without initializing a replacement learner", async () => {
    navigation.pathname = "/restore";
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("missing");
    await render();
    expect(container.textContent).toContain("learner content");
    expect(readAuthenticatedLearnerContext).not.toHaveBeenCalled();
    expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("./actions", () => ({
  readAuthenticatedLearnerContext: vi.fn(),
  initializeFreshAnonymousLearner: vi.fn(),
  confirmStartFreshLearner: vi.fn(),
}));
// Gate behavior is isolated here; native rehearsal exercises real IDB.
vi.mock("../../modules/learner/canonical-local-store", async (original) => ({
  ...(await original<
    typeof import("../../modules/learner/canonical-local-store")
  >()),
  assertLegacyIdentityTransition: vi.fn(async () => {}),
  prepareCanonicalOwner: vi.fn(async () => {}),
  confirmCanonicalHandoff: vi.fn(async () => {}),
}));
import {
  prepareCanonicalOwner,
  confirmCanonicalHandoff,
  CanonicalPersistenceError,
} from "../../modules/learner/canonical-local-store";
const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));
import {
  readAuthenticatedLearnerContext,
  confirmStartFreshLearner,
  initializeFreshAnonymousLearner,
} from "./actions";
import LearnerIdentityGate from "./learner-identity-gate";
import { captureLearnerStorage } from "../../modules/learner/local-ownership";
import {
  createPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
} from "../../modules/practice/ui/practice-session-storage";
import { createShortNumericAnswerState } from "../../modules/practice/ui/short-numeric-answer-state";
const owner = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "0",
};
let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(prepareCanonicalOwner).mockReset().mockResolvedValue();
  vi.mocked(confirmCanonicalHandoff).mockReset().mockResolvedValue();
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
  it.each(["missing", "invalid", "unavailable"] as const)(
    "opens Sources with %s identity and retained local work without identity calls",
    async (status) => {
      navigation.pathname = "/sources";
      localStorage.setItem("olympiad-trainer:practice-session", "saved work");
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(status);
      Object.defineProperty(navigator, "locks", {
        configurable: true,
        value: undefined,
      });
      await render();
      expect(container.textContent).toContain("learner content");
      expect(readAuthenticatedLearnerContext).not.toHaveBeenCalled();
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
      expect(confirmStartFreshLearner).not.toHaveBeenCalled();
      expect(localStorage.getItem("olympiad-trainer:practice-session")).toBe(
        "saved work",
      );
    },
  );
  it.each(["/practice", "/progress", "/simulation", "/sources/private"])(
    "still guards %s after leaving public Sources",
    async (path) => {
      navigation.pathname = "/sources";
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("invalid");
      await render();
      navigation.pathname = path;
      await render();
      expect(readAuthenticatedLearnerContext).toHaveBeenCalled();
      expect(container.textContent).not.toContain("learner content");
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
    },
  );
  it("opens Sources from a failed learner guard without recovery or storage mutation", async () => {
    localStorage.setItem("olympiad-trainer:practice-session", "saved work");
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("invalid");
    await render();
    const reads = vi.mocked(readAuthenticatedLearnerContext).mock.calls.length;
    navigation.pathname = "/sources";
    await render();
    expect(container.textContent).toContain("learner content");
    expect(readAuthenticatedLearnerContext).toHaveBeenCalledTimes(reads);
    expect(confirmStartFreshLearner).not.toHaveBeenCalled();
    expect(localStorage.getItem("olympiad-trainer:practice-session")).toBe(
      "saved work",
    );
  });
  it("fresh initialization followed by immediate navigation keeps Practice's captured storage writable", async () => {
    vi.mocked(readAuthenticatedLearnerContext)
      .mockResolvedValueOnce("missing")
      .mockResolvedValueOnce("missing")
      .mockResolvedValue(owner);
    await render();
    let lease!: Storage;
    function PracticeProbe() {
      [lease] = useState(captureLearnerStorage);
      return <p>Practice mounted</p>;
    }
    navigation.pathname = "/practice";
    await act(async () =>
      root.render(
        <LearnerIdentityGate>
          <PracticeProbe />
        </LearnerIdentityGate>,
      ),
    );
    const session = {
      sessionId: crypto.randomUUID(),
      activeProblemIndex: 0 as const,
      completedResults: [],
    };
    const answer = createShortNumericAnswerState();
    expect(await createPracticeSessionSnapshot(session, answer, lease)).toBe(
      true,
    );
    expect(await savePracticeSessionSnapshot(session, answer, lease)).toBe(
      true,
    );
    expect(initializeFreshAnonymousLearner).toHaveBeenCalledOnce();
  });
  it.each(["malformed", "unknown", "expired", "revoked"])(
    "%s credential never binds/imports/deletes legacy work",
    async () => {
      const key = "olympiad-trainer:practice-server-finish-request";
      localStorage.setItem(key, "legacy pending request");
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("invalid");
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
  it.each(["unavailable", "missing"] as const)(
    "offers Restore after %s identity without initializing or exposing learner content",
    async (status) => {
      const key = "olympiad-trainer:practice-session";
      localStorage.setItem(key, "saved work");
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(status);
      await render();
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      expect(container.querySelector("button")?.textContent).toBe(
        "Попробовать ещё раз",
      );
      expect(container.textContent).toContain(
        "Есть сохранённый код восстановления?",
      );
      const recovery =
        container.querySelector<HTMLAnchorElement>('a[href="/restore"]')!;
      expect(recovery.textContent).toBe("Восстановить доступ по коду");
      recovery.focus();
      expect(document.activeElement).toBe(recovery);
      expect(container.textContent).not.toContain("learner content");
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
      expect(localStorage.getItem(key)).toBe("saved work");
      const readsBeforeNavigation = vi.mocked(readAuthenticatedLearnerContext)
        .mock.calls.length;
      navigation.pathname = recovery.getAttribute("href")!;
      await render();
      expect(container.textContent).toContain("learner content");
      expect(readAuthenticatedLearnerContext).toHaveBeenCalledTimes(
        readsBeforeNavigation,
      );
      expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
      expect(localStorage.getItem(key)).toBe("saved work");
    },
  );
  it("keeps Restore reachable without initializing a replacement learner", async () => {
    navigation.pathname = "/restore";
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("missing");
    await render();
    expect(container.textContent).toContain("learner content");
    expect(readAuthenticatedLearnerContext).not.toHaveBeenCalled();
    expect(initializeFreshAnonymousLearner).not.toHaveBeenCalled();
  });
});

function button(label: string) {
  const found = [...container.querySelectorAll("button")].find(
    (node) => node.textContent === label,
  );
  expect(found).toBeDefined();
  return found!;
}
const freshOwner = {
  ...owner,
  learnerId: "00000000-0000-4000-8000-000000000002",
};
describe("Start fresh UX", () => {
  it.each(["/practice", "/progress"])(
    "confirms cookie loss without a code and restores %s with isolated local state",
    async (path) => {
      navigation.pathname = path;
      localStorage.setItem(
        "olympiad-trainer:practice-session",
        "old unfinished work",
      );
      localStorage.setItem(
        "olympiad-trainer:progress-evidence-v0",
        "old evidence",
      );
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("missing");
      vi.mocked(confirmStartFreshLearner).mockImplementation(async () => {
        vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(
          freshOwner,
        );
        return freshOwner;
      });
      await render();
      await act(async () => button("Начать заново").click());
      expect(container.textContent).toContain(
        "Прежняя история и незавершённая работа не перенесутся",
      );
      expect(document.activeElement?.id).toBe("start-fresh-heading");
      expect(confirmStartFreshLearner).not.toHaveBeenCalled();
      await act(async () => button("Отмена").click());
      expect(confirmStartFreshLearner).not.toHaveBeenCalled();
      expect(
        localStorage.getItem("olympiad-trainer:start-fresh-v1"),
      ).toBeNull();
      await act(async () => button("Начать заново").click());
      await act(async () => button("Подтверждаю: начать заново").click());
      expect(confirmStartFreshLearner).toHaveBeenCalledExactlyOnceWith(true);
      expect(container.textContent).toContain("learner content");
      expect(
        captureLearnerStorage().getItem("olympiad-trainer:practice-session"),
      ).toBeNull();
      expect(
        captureLearnerStorage().getItem(
          "olympiad-trainer:progress-evidence-v0",
        ),
      ).toBeNull();
      expect(localStorage.getItem("olympiad-trainer:practice-session")).toBe(
        "old unfinished work",
      );
      expect(container.querySelector('a[href="/restore"]')).toBeNull();
    },
  );
  it("offers Start fresh for a stale cookie after database replacement", async () => {
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("invalid");
    await render();
    expect(button("Начать заново")).toBeDefined();
    expect(container.querySelector('a[href="/restore"]')).not.toBeNull();
    expect(confirmStartFreshLearner).not.toHaveBeenCalled();
  });
  it.each(["database", "network", "storage", "locks"])(
    "never offers reset for %s failure",
    async (failure) => {
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(
        "unavailable",
      );
      if (failure === "network")
        vi.mocked(readAuthenticatedLearnerContext).mockRejectedValue(
          new Error("network"),
        );
      if (failure === "locks")
        Object.defineProperty(navigator, "locks", {
          configurable: true,
          value: undefined,
        });
      const spy =
        failure === "storage"
          ? vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
              throw new Error("storage");
            })
          : null;
      if (failure === "storage")
        vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("invalid");
      try {
        await render();
        expect(container.textContent).not.toContain("Начать заново");
        expect(confirmStartFreshLearner).not.toHaveBeenCalled();
      } finally {
        spy?.mockRestore();
      }
    },
  );
  it("retries after a lost response by authenticated read without creating another profile", async () => {
    localStorage.setItem("olympiad-trainer:practice-session", "old work");
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue("invalid");
    vi.mocked(confirmStartFreshLearner).mockImplementation(async () => {
      vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(freshOwner);
      throw new Error("response lost");
    });
    await render();
    await act(async () => button("Начать заново").click());
    await act(async () => button("Подтверждаю: начать заново").click());
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await act(async () => button("Попробовать ещё раз").click());
    expect(container.textContent).toContain("learner content");
    expect(confirmStartFreshLearner).toHaveBeenCalledOnce();
    expect(
      captureLearnerStorage().getItem("olympiad-trainer:practice-session"),
    ).toBeNull();
  });
});

describe("canonical migration gate", () => {
  it("waits for explicit legacy handoff before rendering learner views", async () => {
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(owner);
    vi.mocked(prepareCanonicalOwner).mockRejectedValueOnce(
      new CanonicalPersistenceError("handoff-required"),
    );
    await render();
    expect(container.textContent).not.toContain("learner content");
    expect(container.textContent).toContain("Перенос сохранённой работы");
    expect(confirmCanonicalHandoff).not.toHaveBeenCalled();
    await act(async () => container.querySelector("button")!.click());
    expect(confirmCanonicalHandoff).toHaveBeenCalledWith(owner);
    expect(container.textContent).toContain("learner content");
  });
  it("keeps unavailable or conflicting migration blocked without starting fresh", async () => {
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(owner);
    vi.mocked(prepareCanonicalOwner).mockRejectedValueOnce(
      new CanonicalPersistenceError("handoff-required"),
    );
    vi.mocked(confirmCanonicalHandoff).mockRejectedValueOnce(
      new CanonicalPersistenceError("conflict"),
    );
    await render();
    await act(async () => container.querySelector("button")!.click());
    expect(container.textContent).not.toContain("learner content");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(confirmStartFreshLearner).not.toHaveBeenCalled();
  });
  it("mounts Simulation after canonical owner preparation", async () => {
    navigation.pathname = "/simulation";
    vi.mocked(readAuthenticatedLearnerContext).mockResolvedValue(owner);
    await render();
    expect(container.textContent).toContain("learner content");
  });
});

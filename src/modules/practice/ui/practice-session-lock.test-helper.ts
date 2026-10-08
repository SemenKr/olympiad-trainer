import { vi } from "vitest";
import { installTestLocalOwner } from "../../learner/local-ownership.test-helper";

export async function installImmediatePracticeSessionLock() {
  vi.stubGlobal("navigator", {
    userAgent: typeof navigator === "undefined" ? "" : navigator.userAgent,
    locks: {
      request: (
        _name: string,
        _options: LockOptions,
        callback: () => unknown,
      ) =>
        Promise.resolve().then(() =>
          (callback as (lock: Lock) => unknown)({ name: _name } as Lock),
        ),
    },
  });
  await installTestLocalOwner();
}

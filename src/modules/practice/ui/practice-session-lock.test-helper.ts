import { vi } from "vitest";

export function installImmediatePracticeSessionLock() {
  vi.stubGlobal("navigator", {
    locks: {
      request: (
        _name: string,
        _options: LockOptions,
        callback: () => unknown,
      ) => Promise.resolve().then(callback),
    },
  });
}

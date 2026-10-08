import { vi } from "vitest";
import {
  captureLearnerStorage,
  reconcileAuthenticatedLocalOwner,
} from "./local-ownership";

export const TEST_LOCAL_OWNER = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "0",
};
const originals = new WeakMap<Storage, Storage>();
export function rawTestLearnerStorage(storage: Storage) {
  return originals.get(storage) ?? storage;
}

export async function installTestLocalOwner(raw?: Storage) {
  if (raw) raw = originals.get(raw) ?? raw;
  const values = new Map<string, string>();
  const store = raw ?? {
    get length() {
      return values.size;
    },
    key: (index: number) => [...values.keys()][index] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
    clear: () => values.clear(),
  };
  await reconcileAuthenticatedLocalOwner(TEST_LOCAL_OWNER, true, store);
  if (raw) {
    const scoped = captureLearnerStorage();
    const original = raw;
    const fixture = { ...scoped, clear: () => original.clear() };
    originals.set(fixture, original);
    vi.stubGlobal("localStorage", fixture);
  }
}

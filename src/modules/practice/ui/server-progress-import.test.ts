import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../app/progress/actions", () => ({
  importBrowserProgressEvidence: vi.fn(),
}));

import { importBrowserProgressEvidence } from "../../../app/progress/actions";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import { PROGRESS_EVIDENCE_STORAGE_KEY } from "./progress-evidence-storage";
import { ensureServerProgressImported } from "./server-progress-import";

beforeEach(() => {
  vi.resetAllMocks();
  installImmediatePracticeSessionLock();
});

function storage(initial: string): Storage {
  const values = new Map([[PROGRESS_EVIDENCE_STORAGE_KEY, initial]]);
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("legacy browser Progress import", () => {
  it("preserves bytes on failure and removes only after server acknowledgement", async () => {
    const store = storage("{malformed");
    vi.mocked(importBrowserProgressEvidence)
      .mockRejectedValueOnce(new Error("Unverifiable"))
      .mockResolvedValueOnce();
    await expect(ensureServerProgressImported(store)).rejects.toThrow(
      "Unverifiable",
    );
    expect(store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe("{malformed");
    await ensureServerProgressImported(store);
    expect(importBrowserProgressEvidence).toHaveBeenCalledWith("{malformed");
    expect(store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBeNull();
  });

  it("does not clear a newer local value after a stale acknowledgement", async () => {
    const store = storage("old");
    vi.mocked(importBrowserProgressEvidence).mockImplementationOnce(
      async () => {
        store.setItem(PROGRESS_EVIDENCE_STORAGE_KEY, "new");
      },
    );
    await expect(ensureServerProgressImported(store)).rejects.toThrow(
      "changed during import",
    );
    expect(store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY)).toBe("new");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { installImmediatePracticeSessionLock } from "../practice/ui/practice-session-lock.test-helper";
import { readServerProgress } from "./progress-client";
import {
  captureLearnerStorage,
  currentLocalLearnerOwner,
} from "./local-ownership";
import * as actions from "../../app/progress/actions";

vi.mock("../../app/progress/actions", () => ({ readServerProgress: vi.fn() }));
beforeEach(installImmediatePracticeSessionLock);
describe("owner-scoped derived Progress responses", () => {
  it("rejects late cache activation after generation changes", async () => {
    let finish!: (
      value: Awaited<ReturnType<typeof actions.readServerProgress>>,
    ) => void;
    vi.mocked(actions.readServerProgress).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const source = currentLocalLearnerOwner();
    const pending = readServerProgress();
    const target = { ...source, generation: "1" };
    // Fixture locks are immediate; production held locks prevent an unsafe switch.
    // The state update also models a remote generation change while a read awaits.
    const raw = new Map<string, string>();
    // Use the current context's storage to verify local source payload remains intact.
    captureLearnerStorage().setItem(
      "olympiad-trainer:practice-session",
      "source payload",
    );
    expect(actions.readServerProgress).toHaveBeenCalledWith(source);
    // Change the authenticated context through reconciliation on a separate storage
    // (a replaced document), invalidating all old in-memory response leases.
    const storage: Storage = {
      get length() {
        return raw.size;
      },
      key: (i) => [...raw.keys()][i] ?? null,
      getItem: (k) => raw.get(k) ?? null,
      setItem: (k, v) => {
        raw.set(k, v);
      },
      removeItem: (k) => {
        raw.delete(k);
      },
      clear: () => raw.clear(),
    };
    const { reconcileAuthenticatedLocalOwner } =
      await import("./local-ownership");
    await reconcileAuthenticatedLocalOwner(target, true, storage);
    finish([
      { learnerLabel: "A", progressGroup: null, conclusion: "A" },
      { learnerLabel: "B", progressGroup: null, conclusion: "B" },
      { learnerLabel: "C", progressGroup: null, conclusion: "C" },
    ]);
    await expect(pending).rejects.toThrow(
      "Local learner ownership unavailable",
    );
  });
});

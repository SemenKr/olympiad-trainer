import { beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ cookie: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      state.cookie === undefined ? undefined : { value: state.cookie },
  }),
}));
vi.mock("../../modules/practice/server/learner-identity", () => ({
  LEARNER_COOKIE_NAME: "learner",
  resolveLearnerFromCookie: vi.fn(),
  initializeAnonymousLearner: vi.fn(),
  startFreshAnonymousLearner: vi.fn(),
}));
vi.mock("../../modules/practice/server/learner-auth", () => ({
  LearnerIdentityUnavailable: class extends Error {},
}));
import { LearnerIdentityUnavailable } from "../../modules/practice/server/learner-auth";
import {
  resolveLearnerFromCookie,
  startFreshAnonymousLearner,
} from "../../modules/practice/server/learner-identity";
import {
  readAuthenticatedLearnerContext,
  confirmStartFreshLearner,
} from "./actions";
beforeEach(() => {
  vi.resetAllMocks();
  state.cookie = undefined;
});
it("distinguishes absent cookie, invalid credential and database failure without creating identity", async () => {
  expect(await readAuthenticatedLearnerContext()).toBe("missing");
  expect(resolveLearnerFromCookie).not.toHaveBeenCalled();
  state.cookie = "stale";
  vi.mocked(resolveLearnerFromCookie).mockRejectedValueOnce(
    new LearnerIdentityUnavailable(),
  );
  expect(await readAuthenticatedLearnerContext()).toBe("invalid");
  vi.mocked(resolveLearnerFromCookie).mockRejectedValueOnce(
    new Error("database offline"),
  );
  expect(await readAuthenticatedLearnerContext()).toBe("unavailable");
  expect(startFreshAnonymousLearner).not.toHaveBeenCalled();
});
it("returns only authenticated public owner metadata and forwards confirmation to the deliberate boundary", async () => {
  state.cookie = "valid";
  const owner = {
    learnerId: "00000000-0000-4000-8000-000000000001",
    generation: "2",
  };
  vi.mocked(resolveLearnerFromCookie).mockResolvedValue({
    learnerId: owner.learnerId,
    generation: BigInt(2),
    tokenHash: "secret hash",
  });
  expect(await readAuthenticatedLearnerContext()).toEqual(owner);
  vi.mocked(startFreshAnonymousLearner).mockResolvedValue(owner);
  expect(await confirmStartFreshLearner(true)).toEqual(owner);
  expect(startFreshAnonymousLearner).toHaveBeenCalledExactlyOnceWith(true);
});

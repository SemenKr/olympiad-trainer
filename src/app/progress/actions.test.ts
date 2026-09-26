import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../modules/practice/server/learner-identity", () => ({
  resolveLearnerFromCookie: vi.fn(async () => "cookie-owned-learner"),
}));
vi.mock("../../modules/practice/server/learner-progress-persistence", () => ({
  importLegacyProgress: vi.fn(async () => {}),
  persistFinishContributions: vi.fn(async () => {}),
  readLearnerProgress: vi.fn(async () => []),
}));

import {
  importBrowserProgressEvidence,
  persistPracticeFinishEvidence,
  readServerProgress,
} from "./actions";
import {
  importLegacyProgress,
  persistFinishContributions,
  readLearnerProgress,
} from "../../modules/practice/server/learner-progress-persistence";

beforeEach(() => vi.clearAllMocks());

describe("Progress server actions", () => {
  it("always scopes import, Finish and read to the cookie-resolved learner", async () => {
    await importBrowserProgressEvidence(null);
    await persistPracticeFinishEvidence(crypto.randomUUID(), [
      { bucket: "guarantee", value: { learnerId: "forged" } },
    ]);
    await readServerProgress();
    expect(importLegacyProgress).toHaveBeenCalledWith(
      "cookie-owned-learner",
      null,
    );
    expect(persistFinishContributions).toHaveBeenCalledWith(
      "cookie-owned-learner",
      expect.any(String),
      expect.any(Array),
    );
    expect(readLearnerProgress).toHaveBeenCalledWith("cookie-owned-learner");
  });
});

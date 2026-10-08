import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../modules/practice/server/learner-identity", () => ({
  resolveExpectedLearnerFromCookie: vi.fn(async () => "cookie-owned-learner"),
  resolveLearnerFromCookie: vi.fn(async () => "cookie-owned-learner"),
}));
vi.mock("../../modules/practice/server/learner-progress-persistence", () => ({
  importLegacyProgress: vi.fn(async () => {}),
  persistFinishContributions: vi.fn(async () => {}),
  readLearnerProgress: vi.fn(async () => []),
  readRecentPracticeEpisodes: vi.fn(async () => []),
  readPracticeJourneyTotal: vi.fn(async () => 0),
  readPracticeJourneyFinish: vi.fn(async () => null),
  readCompletedPackIds: vi.fn(async () => []),
}));

import {
  importBrowserProgressEvidence,
  persistPracticeFinishEvidence,
  readServerProgress,
  readServerRecentPracticeEpisodes,
  readServerPracticeJourney,
  readServerLearningPath,
} from "./actions";
import {
  importLegacyProgress,
  persistFinishContributions,
  readLearnerProgress,
  readRecentPracticeEpisodes,
  readPracticeJourneyTotal,
  readCompletedPackIds,
} from "../../modules/practice/server/learner-progress-persistence";

const owner = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "0",
};
beforeEach(() => vi.clearAllMocks());

describe("Progress server actions", () => {
  it("always scopes import, Finish and read to the cookie-resolved learner", async () => {
    await importBrowserProgressEvidence(null, owner);
    await persistPracticeFinishEvidence(crypto.randomUUID(), [
      { bucket: "guarantee", value: { learnerId: "forged" } },
    ]);
    await readServerProgress(owner);
    await readServerRecentPracticeEpisodes(owner);
    await readServerPracticeJourney(owner);
    await readServerLearningPath(owner);
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
    expect(readRecentPracticeEpisodes).toHaveBeenCalledWith(
      "cookie-owned-learner",
    );
    expect(readPracticeJourneyTotal).toHaveBeenCalledWith(
      "cookie-owned-learner",
    );
    expect(readCompletedPackIds).toHaveBeenCalledWith("cookie-owned-learner");
  });
});

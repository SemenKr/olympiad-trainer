import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: () => ({ value: "token" }) })),
}));
vi.mock("../../practice/server/learner-identity", () => ({
  LEARNER_COOKIE_NAME: "learner",
  resolveLearnerFromCookie: vi.fn(async () => "owner"),
  resolveExpectedLearnerFromCookie: vi.fn(async () => "owner"),
}));
vi.mock("./persistence", () => ({ transactSimulation: vi.fn() }));
import { transactSimulation } from "./persistence";
import { requireSimulationAssistanceAllowed } from "./assistance-guard";
import { newSimulation } from "../domain/simulation";
import {
  revealPracticeHint,
  revealPracticeSolution,
  submitPracticeAnswer,
} from "../../../app/practice/actions";
import {
  openKnowledgeLesson,
  readKnowledgeSupportEligibility,
} from "../../../app/practice/knowledge-support-actions";
const attempt = newSimulation("00000000-0000-4000-8000-000000000001", 1000);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(transactSimulation).mockResolvedValue({ attempt, serverNow: 1000 });
});
describe("existing assistance endpoints cannot bypass active Simulation", () => {
  it("blocks hints, solutions and answer checking for selected problems", async () => {
    await expect(
      revealPracticeHint("exact-coin-payments", "exact-coin-payments-focus"),
    ).rejects.toThrow("until Simulation Finish");
    await expect(
      revealPracticeSolution(
        "largest-valid-eight-digit",
        "largest-valid-eight-digit-full-solution",
      ),
    ).rejects.toThrow("until Simulation Finish");
    await expect(
      submitPracticeAnswer("knights-all-or-none", ["count-0"]),
    ).rejects.toThrow("until Simulation Finish");
  });
  it("blocks Knowledge Support even through its existing server actions", async () => {
    const owner = { learnerId: attempt.sessionId, generation: "0" };
    await expect(openKnowledgeLesson(attempt.sessionId, owner)).rejects.toThrow(
      "until Simulation Finish",
    );
    await expect(readKnowledgeSupportEligibility({}, owner)).rejects.toThrow(
      "until Simulation Finish",
    );
  });
  it("permits assistance once server read reports Finish", async () => {
    vi.mocked(transactSimulation).mockResolvedValue({
      attempt: {
        ...attempt,
        finishedAt: attempt.deadlineAt,
        finishReason: "timeout",
      },
      serverNow: attempt.deadlineAt,
    });
    await expect(
      requireSimulationAssistanceAllowed("exact-coin-payments"),
    ).resolves.toBeUndefined();
    await expect(
      revealPracticeSolution(
        "largest-valid-eight-digit",
        "largest-valid-eight-digit-full-solution",
      ),
    ).resolves.toHaveProperty("text");
  });
  it("leaves unrelated Practice problem checks independent", async () => {
    await expect(
      submitPracticeAnswer("coinciding-seats", "17"),
    ).resolves.toMatchObject({ status: "correct" });
    expect(transactSimulation).not.toHaveBeenCalled();
  });
});

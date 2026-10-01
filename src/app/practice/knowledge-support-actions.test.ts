import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../../modules/practice/server/learner-identity", () => ({
  resolveLearnerFromCookie: vi.fn(async () => "cookie-learner"),
}));
vi.mock("../../modules/knowledge-support/server/persistence", () => ({
  persistSupportStep: vi.fn(),
  readSupportObservation: vi.fn(async () => null),
}));
import { resolveLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import {
  persistSupportStep,
  readSupportObservation,
} from "../../modules/knowledge-support/server/persistence";
import {
  readKnowledgeSupport,
  readKnowledgeSupportEligibility,
  submitKnowledgeDiagnostic,
  openKnowledgeLesson,
  submitKnowledgeMicroCheck,
} from "./knowledge-support-actions";
import {
  recordAnswerResult,
  startPractice,
} from "../../modules/practice/application/practice-state";

const sessionId = "00000000-0000-4000-8000-000000000001";
const context = {
  problemId: "five-piles-stones",
  practice: recordAnswerResult(startPractice(), {
    status: "incorrect",
    normalizedAnswer: "7",
  }),
};
const observation = {
  diagnosticSelectedOptionId: "B" as const,
  diagnosticOutcome: "incorrect" as const,
  lessonOpened: true,
  microCheckSelectedOptionId: null,
  microCheckOutcome: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(persistSupportStep).mockResolvedValue(observation);
});
describe("Knowledge Support server actions", () => {
  it("takes identity from the cookie and passes no caller-provided outcome or topic to persistence", async () => {
    await readKnowledgeSupport(sessionId);
    expect(readSupportObservation).toHaveBeenCalledWith(
      "cookie-learner",
      sessionId,
    );
    await submitKnowledgeDiagnostic(sessionId, "B", {
      ...context,
      outcome: "correct",
      learnerId: "another-learner",
      topicId: "other",
    });
    expect(persistSupportStep).toHaveBeenLastCalledWith(
      "cookie-learner",
      sessionId,
      "diagnostic",
      "B",
      true,
    );
    await openKnowledgeLesson(sessionId);
    expect(persistSupportStep).toHaveBeenLastCalledWith(
      "cookie-learner",
      sessionId,
      "lesson",
      null,
    );
    await submitKnowledgeMicroCheck(sessionId, "A");
    expect(persistSupportStep).toHaveBeenLastCalledWith(
      "cookie-learner",
      sessionId,
      "micro-check",
      "A",
    );
  });
  it("returns protected content only after successful authorized persistence", async () => {
    expect(await readKnowledgeSupport(sessionId)).toBeNull();
    expect(await submitKnowledgeDiagnostic(sessionId, "B", context)).toEqual(
      observation,
    );
    expect(await openKnowledgeLesson(sessionId)).toEqual({
      observation,
      lesson: expect.stringContaining("12 ÷ 3 = 4"),
    });
    vi.mocked(persistSupportStep).mockResolvedValueOnce({
      ...observation,
      microCheckSelectedOptionId: "D",
      microCheckOutcome: "incorrect",
    });
    expect(
      (await submitKnowledgeMicroCheck(sessionId, "D")).feedback.text,
    ).toContain("6 + 4 = 10");
    vi.mocked(persistSupportStep).mockRejectedValueOnce(
      new Error("An incorrect diagnostic is required."),
    );
    await expect(openKnowledgeLesson(sessionId)).rejects.toThrow(
      "incorrect diagnostic",
    );
    vi.mocked(persistSupportStep).mockRejectedValueOnce(
      new Error("Open the lesson first."),
    );
    await expect(submitKnowledgeMicroCheck(sessionId, "D")).rejects.toThrow(
      "lesson first",
    );
  });
  it("uses authoritative carrier eligibility for both availability and diagnostic submission", async () => {
    const forged = {
      ...context,
      practice: {
        ...context.practice,
        submissions: [{ answer: "60", outcome: "incorrect" }],
      },
    };
    expect(await readKnowledgeSupportEligibility(forged)).toBe(false);
    await submitKnowledgeDiagnostic(sessionId, "B", forged);
    expect(persistSupportStep).toHaveBeenLastCalledWith(
      "cookie-learner",
      sessionId,
      "diagnostic",
      "B",
      false,
    );
    expect(await readKnowledgeSupportEligibility(context)).toBe(true);
  });
  it("validates request values before resolving identity or accessing persistence", async () => {
    await expect(readKnowledgeSupport("bad-session")).rejects.toThrow();
    await expect(openKnowledgeLesson("bad-session")).rejects.toThrow();
    await expect(submitKnowledgeMicroCheck(sessionId, "E")).rejects.toThrow();
    await expect(
      submitKnowledgeDiagnostic(sessionId, "E", context),
    ).rejects.toThrow();
    await expect(
      submitKnowledgeDiagnostic(sessionId, "A", {
        ...context,
        problemId: "other",
      }),
    ).rejects.toThrow();
    expect(resolveLearnerFromCookie).not.toHaveBeenCalled();
    expect(persistSupportStep).not.toHaveBeenCalled();
  });
});

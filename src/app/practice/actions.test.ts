import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { revealPracticeHint, submitPracticeAnswer } from "./actions";

const problemId = "coinciding-seats";

describe("practice answer server boundary", () => {
  it("checks a correct answer through the catalog", async () => {
    await expect(submitPracticeAnswer(problemId, " 017 ")).resolves.toEqual({
      status: "correct",
      normalizedAnswer: "17",
    });
  });

  it("checks an incorrect answer through the catalog", async () => {
    await expect(submitPracticeAnswer(problemId, "16")).resolves.toEqual({
      status: "incorrect",
      normalizedAnswer: "16",
    });
  });

  it("keeps invalid learner input invalid", async () => {
    await expect(submitPracticeAnswer(problemId, "12,5")).resolves.toEqual({
      status: "invalid",
    });
    await expect(submitPracticeAnswer(problemId, null)).resolves.toEqual({
      status: "invalid",
    });
  });

  it("rejects an unknown or invalid problem identity as a boundary failure", async () => {
    await expect(submitPracticeAnswer("missing-problem", "17")).rejects.toThrow(
      "Unknown practice problem",
    );
    await expect(submitPracticeAnswer(null, "17")).rejects.toThrow(
      "Invalid practice problem ID",
    );
  });
});

describe("practice hint reveal server boundary", () => {
  it("reveals the exact focus hint on explicit request", async () => {
    await expect(
      revealPracticeHint(
        problemId,
        "coinciding-seats-focus-simultaneous-rules",
      ),
    ).resolves.toEqual({
      hintId: "coinciding-seats-focus-simultaneous-rules",
      level: "focus",
      text: "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.",
    });
  });

  it("reveals the exact strategy hint on explicit request", async () => {
    await expect(
      revealPracticeHint(
        problemId,
        "coinciding-seats-strategy-repeat-interval",
      ),
    ).resolves.toEqual({
      hintId: "coinciding-seats-strategy-repeat-interval",
      level: "strategy",
      text: "Подумай, через сколько мест отметки по обоим правилам снова совпадут.",
    });
  });

  it("fails safely for unknown problem and hint IDs", async () => {
    await expect(
      revealPracticeHint("missing-problem", "missing-hint"),
    ).rejects.toThrow("Unknown practice problem");
    await expect(revealPracticeHint(problemId, "missing-hint")).rejects.toThrow(
      "Unknown hint for practice problem",
    );
  });
});

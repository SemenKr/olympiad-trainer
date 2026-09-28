import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { readRows } = vi.hoisted(() => ({ readRows: vi.fn() }));
vi.mock("./progress-db", () => ({
  getProgressDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({ limit: readRows }),
        }),
      }),
    }),
  }),
}));

import { readRecentPracticeEpisodes } from "./learner-progress-persistence";

const checkpointId = "guaranteed-sock-pair-guarantee-argument";
function storedRow(outcome: "correct" | "incorrect") {
  return {
    learnerId: "private-learner",
    sessionId: "private-session",
    contributionHash: "private-hash",
    mode: "core",
    completedAt: new Date("2026-09-28T12:00:00.000Z"),
    facts: {
      version: 1,
      problems: [
        "coinciding-seats",
        "guaranteed-sock-pair",
        "table-impossible-sums",
      ].map((problemId, index) => ({
        problemId,
        outcome: index === 1 ? "eventually-correct" : "no-valid-submissions",
        skipped: false,
        validSubmissionCount: index === 1 ? 1 : 0,
        hintLevelsExposed: [],
        solutionExposed: false,
        checkpoint: index === 1 ? { checkpointId, outcome } : null,
      })),
    },
  };
}

describe("public Practice history projection", () => {
  it.each(["correct", "incorrect"] as const)(
    "returns factual %s checkpoint outcome without internal identifiers",
    async (outcome) => {
      const row = storedRow(outcome);
      readRows.mockResolvedValueOnce([row]);
      const history = await readRecentPracticeEpisodes("private-learner");
      expect(history[0]).toEqual({
        mode: "core",
        completedAt: "2026-09-28T12:00:00.000Z",
        problems: [
          "Совпадающие места",
          "Носки в пакете",
          "Невозможные суммы",
        ].map((problemTitle, index) => ({
          problemTitle,
          outcome: index === 1 ? "eventually-correct" : "no-valid-submissions",
          skipped: false,
          validSubmissionCount: index === 1 ? 1 : 0,
          hintLevelsExposed: [],
          solutionExposed: false,
          checkpoint: index === 1 ? { outcome } : null,
        })),
      });
      const serialized = JSON.stringify(history);
      expect(serialized).not.toMatch(
        /checkpointId|problemId|learnerId|sessionId|contributionHash|private-/,
      );
      expect(serialized).not.toContain(checkpointId);
      for (const problem of row.facts.problems)
        expect(serialized).not.toContain(problem.problemId);
      expect(row.facts.problems[1].checkpoint).toEqual({
        checkpointId,
        outcome,
      });
    },
  );

  it("still rejects a stored checkpoint that does not belong to the canonical problem", async () => {
    const row = storedRow("correct");
    row.facts.problems[1].checkpoint = {
      checkpointId: "unknown-checkpoint",
      outcome: "correct",
    };
    readRows.mockResolvedValueOnce([row]);
    await expect(readRecentPracticeEpisodes("private-learner")).rejects.toThrow(
      "could not be verified",
    );
  });
});

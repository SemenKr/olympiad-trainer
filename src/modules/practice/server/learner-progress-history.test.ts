import { learnerContext } from "../../../test/learner-fixture";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { readRows } = vi.hoisted(() => ({ readRows: vi.fn() }));
vi.mock("./progress-db", () => ({
  getProgressDb: () => ({
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: () => ({ orderBy: () => ({ limit: readRows }) }),
        }),
      }),
    }),
  }),
}));

import { readRecentPracticeEpisodes } from "./learner-progress-persistence";
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import { getLearnerSafePracticeProblem } from "./problem-catalog";

const checkpointId = "guaranteed-sock-pair-guarantee-argument";
function storedRow(outcome: "correct" | "incorrect") {
  return {
    learnerId: "private-learner",
    sessionId: "private-session",
    contributionHash: "private-hash",
    mode: "core",
    receiptPackId: null,
    receiptMode: null,
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
  it.each(PRACTICE_PACKS)(
    "projects $id through ordinary Pack history without protected content or adaptive facts",
    async (pack) => {
      const row = {
        learnerId: "private-learner",
        sessionId: "private-session",
        contributionHash: "private-hash",
        mode: "pack",
        receiptPackId: pack.id,
        receiptMode: "pack",
        completedAt: new Date("2026-10-01T09:00:00.000Z"),
        facts: {
          version: 1,
          problems: pack.problemIds.map((problemId) => ({
            problemId,
            outcome: "eventually-correct",
            skipped: false,
            validSubmissionCount: 1,
            hintLevelsExposed: [],
            solutionExposed: false,
            checkpoint: null,
          })),
        },
      };
      readRows.mockResolvedValueOnce([row]);
      const history = await readRecentPracticeEpisodes(
        learnerContext("private-learner"),
      );
      expect(history).toEqual([
        {
          mode: "pack",
          completedAt: "2026-10-01T09:00:00.000Z",
          problems: pack.problemIds.map((problemId) => ({
            problemTitle: getLearnerSafePracticeProblem(problemId).title,
            outcome: "eventually-correct",
            skipped: false,
            validSubmissionCount: 1,
            hintLevelsExposed: [],
            solutionExposed: false,
            checkpoint: null,
          })),
        },
      ]);
      expect(JSON.stringify(history)).not.toMatch(
        /problemId|expectedAnswer|expectedOptionIds|adaptiveFacts|checkpointId|private-/,
      );
    },
  );

  it.each(["correct", "incorrect"] as const)(
    "returns factual %s checkpoint outcome without internal identifiers",
    async (outcome) => {
      const row = storedRow(outcome);
      readRows.mockResolvedValueOnce([row]);
      const history = await readRecentPracticeEpisodes(
        learnerContext("private-learner"),
      );
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

  function futureRow() {
    return {
      ...storedRow("correct"),
      mode: "pack",
      receiptPackId: "pack-t",
      receiptMode: "pack",
      facts: {
        version: 1,
        problems: [
          {
            problemId: "future-problem",
            outcome: "no-valid-submissions",
            skipped: false,
            validSubmissionCount: 0,
            hintLevelsExposed: [],
            solutionExposed: false,
            checkpoint: null,
          },
        ],
      },
    };
  }

  it("omits only identified future Pack episodes and retains known History in order", async () => {
    readRows.mockResolvedValueOnce([
      futureRow(),
      storedRow("correct"),
      futureRow(),
    ]);
    const history = await readRecentPracticeEpisodes(
      learnerContext("private-learner"),
    );
    expect(history).toHaveLength(1);
    expect(history[0].mode).toBe("core");
  });

  it("keeps known legacy Pack History with NULL or missing receipt identity", async () => {
    const row = futureRow();
    row.facts.problems[0].problemId = PRACTICE_PACKS[0].problemIds[0];
    readRows.mockResolvedValueOnce([
      { ...row, receiptPackId: null, receiptMode: null },
    ]);
    expect(
      await readRecentPracticeEpisodes(learnerContext("private-learner")),
    ).toHaveLength(1);
  });

  it.each([
    [
      "missing receipt",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        receiptPackId: null,
        receiptMode: null,
      }),
    ],
    [
      "legacy NULL receipt",
      (row: ReturnType<typeof futureRow>) => ({ ...row, receiptPackId: null }),
    ],
    [
      "invalid Pack syntax",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        receiptPackId: "pack--s",
      }),
    ],
    [
      "receipt mode mismatch",
      (row: ReturnType<typeof futureRow>) => ({ ...row, receiptMode: "core" }),
    ],
    [
      "invalid History mode",
      (row: ReturnType<typeof futureRow>) => ({ ...row, mode: "future-mode" }),
    ],
    [
      "known receipt with unknown facts",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        receiptPackId: "pack-a",
      }),
    ],
    [
      "invalid date",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        completedAt: new Date(NaN),
      }),
    ],
    [
      "unknown facts version",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: { ...row.facts, version: 2 },
      }),
    ],
    [
      "empty facts",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: { ...row.facts, problems: [] },
      }),
    ],
    [
      "duplicate facts",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: {
          ...row.facts,
          problems: [row.facts.problems[0], row.facts.problems[0]],
        },
      }),
    ],
    [
      "negative submission count",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: {
          ...row.facts,
          problems: [{ ...row.facts.problems[0], validSubmissionCount: -1 }],
        },
      }),
    ],
    [
      "inconsistent outcome",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: {
          ...row.facts,
          problems: [
            { ...row.facts.problems[0], outcome: "eventually-correct" },
          ],
        },
      }),
    ],
    [
      "unexpected property",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: { ...row.facts, extra: true },
      }),
    ],
    [
      "checkpoint in Pack",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: {
          ...row.facts,
          problems: [
            {
              ...row.facts.problems[0],
              checkpoint: {
                checkpointId: "future-checkpoint",
                outcome: "correct",
              },
            },
          ],
        },
      }),
    ],
    [
      "malformed problem ID",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: {
          ...row.facts,
          problems: [{ ...row.facts.problems[0], problemId: "bad id" }],
        },
      }),
    ],
    [
      "unknown receipt disguising known tuple",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        facts: {
          ...row.facts,
          problems: [
            {
              ...row.facts.problems[0],
              problemId: PRACTICE_PACKS[0].problemIds[0],
            },
          ],
        },
      }),
    ],
    [
      "known receipt wrong tuple",
      (row: ReturnType<typeof futureRow>) => ({
        ...row,
        receiptPackId: "pack-b",
        facts: {
          ...row.facts,
          problems: [
            {
              ...row.facts.problems[0],
              problemId: PRACTICE_PACKS[0].problemIds[0],
            },
          ],
        },
      }),
    ],
  ] as const)(
    "rejects %s instead of hiding corrupt History",
    async (_name, change) => {
      readRows.mockResolvedValueOnce([change(futureRow())]);
      await expect(
        readRecentPracticeEpisodes(learnerContext("private-learner")),
      ).rejects.toThrow("could not be verified");
    },
  );

  it("propagates database failure without returning empty History", async () => {
    readRows.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(
      readRecentPracticeEpisodes(learnerContext("private-learner")),
    ).rejects.toThrow("database unavailable");
  });

  it("still rejects a stored checkpoint that does not belong to the canonical problem", async () => {
    const row = storedRow("correct");
    row.facts.problems[1].checkpoint = {
      checkpointId: "unknown-checkpoint",
      outcome: "correct",
    };
    readRows.mockResolvedValueOnce([row]);
    await expect(
      readRecentPracticeEpisodes(learnerContext("private-learner")),
    ).rejects.toThrow("could not be verified");
  });
});

vi.mock("./learner-auth", () => ({
  withAuthenticatedLearner: async (
    _context: unknown,
    operation: (tx: ReturnType<typeof getProgressDb>) => Promise<unknown>,
  ) => operation(getProgressDb()),
}));
import { getProgressDb } from "./progress-db";

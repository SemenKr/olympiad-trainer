import { learnerContext } from "../../../test/learner-fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
vi.mock("server-only", () => ({}));
const { state } = vi.hoisted(() => ({
  state: {
    rows: [] as unknown[][],
    operations: [] as unknown[],
    writes: [] as { table: unknown; value: unknown }[],
  },
}));
vi.mock("./progress-db", () => ({
  getProgressDb: () => {
    const db = {
      select: () => ({
        from: (table: unknown) => ({
          where: (condition: unknown) => {
            const finish = (kind: string) => {
              state.operations.push({ table, condition, kind });
              if (kind === "lock") {
                const rows = state.rows.shift() ?? [];
                state.rows.unshift([{ valid: true }]);
                return Promise.resolve(
                  rows.map((row) => ({
                    ...(row as object),
                    anonymousTokenHash: "test-token-hash",
                    credentialGeneration: BigInt(0),
                  })),
                );
              }
              return Promise.resolve(state.rows.shift() ?? []);
            };
            return {
              for: () => finish("lock"),
              limit: () => finish("limit"),
              orderBy: (...order: unknown[]) => ({
                limit: () => {
                  state.operations.push({ order });
                  return finish("ordered");
                },
              }),
              then: (resolve: (rows: unknown[]) => unknown) =>
                finish("read").then(resolve),
            };
          },
        }),
      }),
      insert: (table: unknown) => ({
        values: async (value: unknown) => {
          state.writes.push({ table, value });
        },
      }),
      update: (table: unknown) => ({
        set: (value: unknown) => ({
          where: async () => {
            state.writes.push({ table, value });
          },
        }),
      }),
      execute: vi.fn(async () => {}),
    };
    return {
      ...db,
      transaction: async (callback: (tx: typeof db) => unknown) => callback(db),
    };
  },
}));
import {
  startReview,
  persistFinishContributions,
} from "./learner-progress-persistence";
import {
  practiceCompletedEpisodes,
  practiceReviewAssignments,
} from "./progress-schema";
import { emptyGuaranteeProgressEvidence } from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";
import { emptyEnumerationProgressEvidence } from "../application/enumeration-progress-evidence";
const learnerId = "00000000-0000-4000-8000-000000000001";
const sessionId = "00000000-0000-4000-8000-000000000002";
const sourceId = "00000000-0000-4000-8000-000000000003";
const problem = {
  problemId: "coinciding-seats",
  outcome: "eventually-correct",
  skipped: false,
  validSubmissionCount: 1,
  hintLevelsExposed: [],
  solutionExposed: false,
  checkpoint: null,
};
const sourceFacts = {
  version: 1,
  problems: [
    problem,
    ...["guaranteed-sock-pair", "table-impossible-sums"].map((problemId) => ({
      ...problem,
      problemId,
      outcome: "no-valid-submissions",
      validSubmissionCount: 0,
    })),
  ],
};
const episode = { mode: "review", facts: { version: 1, problems: [problem] } };
const learner = {
  legacyImportHash: "imported",
  guaranteeEvidence: emptyGuaranteeProgressEvidence(),
  impossibilityEvidence: emptyImpossibilityProgressEvidence(),
  enumerationEvidence: emptyEnumerationProgressEvidence(),
};
const assignment = { sessionId, reviewSourceSessionId: sourceId };
beforeEach(() => {
  state.rows = [];
  state.operations = [];
  state.writes = [];
});

describe("server-owned Review boundary", () => {
  it("locks learner before selecting source with ownership, eligibility and stable newest ordering", async () => {
    state.rows = [
      [learner],
      [],
      [{ sessionId: sourceId, mode: "core", episodeFacts: sourceFacts }],
    ];
    const issued = await startReview(learnerContext(learnerId));
    expect(issued).toMatch(/^[0-9a-f-]{36}$/);
    expect(state.operations[0]).toMatchObject({ kind: "lock" });
    const operations = state.operations as {
      condition?: Parameters<PgDialect["sqlToQuery"]>[0];
      order?: Parameters<PgDialect["sqlToQuery"]>[0][];
    }[];
    const dialect = new PgDialect();
    const condition = dialect.sqlToQuery(operations[4].condition!);
    expect(condition.params).toContain(learnerId);
    expect(condition.sql).toContain("NOT EXISTS");
    expect(condition.sql).toContain("eventually-correct");
    expect(condition.sql).toContain("solutionExposed");
    expect(
      operations[3]
        .order!.map((order) => dialect.sqlToQuery(order).sql)
        .join(" "),
    ).toMatch(/completed_at.*desc.*session_id.*desc/);
    expect(state.writes).toEqual([
      {
        table: practiceReviewAssignments,
        value: {
          learnerId,
          sessionId: issued,
          reviewSourceSessionId: sourceId,
        },
      },
    ]);
  });
  it("reuses a pending attempt without picking another source", async () => {
    state.rows = [[learner], [assignment]];
    expect(await startReview(learnerContext(learnerId))).toBe(sessionId);
    expect(state.writes).toEqual([]);
  });
  it.each(["missing", "foreign", "ineligible"])(
    "rejects %s assignment/source before Finish writes",
    async (kind) => {
      state.rows = [
        [learner],
        kind === "missing" ? [] : [assignment],
        kind === "foreign"
          ? []
          : [
              {
                mode: "core",
                episodeFacts: {
                  ...sourceFacts,
                  problems: [
                    { ...problem, outcome: "incorrect-only" },
                    ...sourceFacts.problems.slice(1),
                  ],
                },
              },
            ],
      ];
      await expect(
        persistFinishContributions(
          learnerContext(learnerId),
          sessionId,
          [],
          undefined,
          episode,
        ),
      ).rejects.toThrow();
      expect(state.writes).toEqual([]);
    },
  );
  it.each([undefined, { mode: "core", facts: sourceFacts }])(
    "rejects omitted or forged core mode for a reserved session",
    async (value) => {
      state.rows = [[learner], [assignment]];
      await expect(
        persistFinishContributions(
          learnerContext(learnerId),
          sessionId,
          [],
          undefined,
          value,
        ),
      ).rejects.toThrow("assignment");
      expect(state.writes).toEqual([]);
    },
  );
  it("rejects client-supplied provenance, adaptive facts and checkpoint evidence", async () => {
    for (const bad of [
      { ...episode, reviewSourceSessionId: sourceId },
      {
        ...episode,
        facts: {
          version: 1,
          problems: [
            {
              ...problem,
              checkpoint: { checkpointId: "invented", outcome: "correct" },
            },
          ],
        },
      },
    ])
      await expect(
        persistFinishContributions(
          learnerContext(learnerId),
          sessionId,
          [],
          undefined,
          bad,
        ),
      ).rejects.toThrow();
    await expect(
      persistFinishContributions(
        learnerContext(learnerId),
        sessionId,
        [],
        { attempted: true, solutionExposed: false },
        episode,
      ),
    ).rejects.toThrow();
    expect(state.operations).toEqual([]);
  });
  it("persists explicit server provenance and engagement award without evidence changes", async () => {
    state.rows = [
      [learner],
      [assignment],
      [{ mode: "core", episodeFacts: sourceFacts }],
      [],
      [],
    ];
    const award = await persistFinishContributions(
      learnerContext(learnerId),
      sessionId,
      [],
      undefined,
      episode,
    );
    expect(award?.earnedXp).toBeGreaterThan(0);
    expect(
      state.writes.find((write) => write.table === practiceCompletedEpisodes)
        ?.value,
    ).toMatchObject({
      mode: "review",
      reviewSourceSessionId: sourceId,
      episodeFacts: episode.facts,
    });
    expect(state.writes[0].value).toMatchObject({
      guaranteeEvidence: learner.guaranteeEvidence,
      impossibilityEvidence: learner.impossibilityEvidence,
      enumerationEvidence: learner.enumerationEvidence,
    });
    expect(JSON.stringify(state.writes[0].value)).not.toMatch(
      /Attempted|SolutionExposed/,
    );
  });
});

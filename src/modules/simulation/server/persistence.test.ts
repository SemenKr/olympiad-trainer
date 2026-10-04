import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  writes: [] as unknown[],
  predicates: [] as unknown[],
  locks: [] as string[],
}));
vi.mock("../../practice/server/progress-db", () => ({
  getProgressDb: () => ({
    transaction: async (operation: (tx: unknown) => Promise<unknown>) => {
      let selections = 0;
      const tx = {
        select: () => ({
          from: () => ({
            where: (predicate: unknown) => {
              state.predicates.push(predicate);
              const rows =
                selections++ === 0
                  ? [{ id: "owner" }]
                  : state.row
                    ? [state.row]
                    : [];
              const result = Promise.resolve(rows);
              return Object.assign(result, {
                for: (lock: string) => {
                  state.locks.push(lock);
                  return result;
                },
              });
            },
          }),
        }),
        insert: (table: unknown) => ({
          values: async (value: Record<string, unknown>) => {
            state.row = value;
            state.writes.push(table);
          },
        }),
        update: (table: unknown) => ({
          set: (value: Record<string, unknown>) => ({
            where: async (predicate: unknown) => {
              state.predicates.push(predicate);
              state.row = { ...state.row, ...value };
              state.writes.push(table);
            },
          }),
        }),
      };
      return operation(tx);
    },
  }),
}));
import { transactSimulation } from "./persistence";
import { simulationAttempts } from "./schema";
import { SIMULATION_DURATION_MS } from "../domain/simulation";
beforeEach(() => {
  state.row = null;
  state.writes = [];
  state.predicates = [];
  state.locks = [];
  vi.restoreAllMocks();
  vi.spyOn(Date, "now").mockReturnValue(1000);
});
describe("isolated simulation persistence", () => {
  it("serializes Start, resumes the same attempt and scopes operations to the cookie learner", async () => {
    const started = await transactSimulation("owner", { kind: "start" });
    expect(started.attempt).toMatchObject({ mode: "simulation", revision: 0 });
    expect(
      (await transactSimulation("owner", { kind: "start" })).attempt,
    ).toEqual(started.attempt);
    expect(state.locks).toEqual(["update", "update"]);
    const dialect = new PgDialect();
    for (const predicate of state.predicates) {
      const query = dialect.sqlToQuery(
        predicate as Parameters<typeof dialect.sqlToQuery>[0],
      );
      expect(query.sql).toMatch(/(id|learner_id)/);
      expect(query.params).toContain("owner");
    }
    expect(state.writes).toEqual([simulationAttempts]);
  });
  it("saves/finishes only Simulation data, never Practice evidence/episodes/awards", async () => {
    const { attempt } = await transactSimulation("owner", { kind: "start" });
    if (!attempt) throw new Error("missing test attempt");
    const work = { drafts: ["reasoning", "", "", ""], selectedIndex: 2 };
    const saved = await transactSimulation("owner", {
      kind: "save",
      sessionId: attempt.sessionId,
      revision: 0,
      work,
    });
    expect(saved.attempt).toMatchObject({ ...work, revision: 1 });
    const finished = await transactSimulation("owner", {
      kind: "finish",
      sessionId: attempt.sessionId,
      revision: 1,
      work,
      confirmed: true,
    });
    expect(finished.attempt).toMatchObject({
      finishedAt: 1000,
      finishReason: "early",
      drafts: work.drafts,
    });
    expect(state.writes.every((table) => table === simulationAttempts)).toBe(
      true,
    );
    expect(Object.keys(state.row!)).not.toContain("adaptiveFacts");
  });
  it("read finalizes an expired attempt at its deadline; late requests cannot replace drafts", async () => {
    const { attempt } = await transactSimulation("owner", { kind: "start" });
    if (!attempt) throw new Error("missing test attempt");
    vi.mocked(Date.now).mockReturnValue(1000 + SIMULATION_DURATION_MS);
    const expired = await transactSimulation("owner", { kind: "read" });
    expect(expired.attempt).toMatchObject({
      finishedAt: attempt.deadlineAt,
      finishReason: "timeout",
    });
    const late = await transactSimulation("owner", {
      kind: "save",
      sessionId: attempt.sessionId,
      revision: 0,
      work: { drafts: ["late", "", "", ""], selectedIndex: 0 },
    });
    expect(late.attempt?.drafts).toEqual(["", "", "", ""]);
  });
  it("rejects foreign sessions, malformed work, stale overwrites and unconfirmed Finish", async () => {
    const { attempt } = await transactSimulation("owner", { kind: "start" });
    if (!attempt) throw new Error("missing test attempt");
    const base = {
      kind: "finish" as const,
      sessionId: attempt.sessionId,
      revision: 0,
      work: attempt,
    };
    await expect(transactSimulation("owner", base)).rejects.toThrow(
      "confirmation",
    );
    await expect(
      transactSimulation("owner", {
        ...base,
        sessionId: "00000000-0000-4000-8000-000000000009",
      }),
    ).rejects.toThrow("Unknown simulation");
    await expect(
      transactSimulation("owner", { ...base, work: {} }),
    ).rejects.toThrow("work");
    await expect(
      transactSimulation("owner", { ...base, revision: 7 }),
    ).rejects.toThrow("another tab");
    expect(state.writes).toHaveLength(1);
  });
});

import { learnerContext } from "../../../test/learner-fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../../practice/server/progress-db", () => ({
  getProgressDb: () => database,
}));
import { learners } from "../../practice/server/progress-schema";
import { knowledgeSupportAttempts as attempts } from "./schema";
import { persistSupportStep, readSupportObservation } from "./persistence";

let row: typeof attempts.$inferSelect | null = null;
const writeTables: unknown[] = [];
const queryBoundary = {
  select: () => ({
    from: (table: unknown) => ({
      where: () => {
        const result =
          table === learners
            ? [
                {
                  id: "learner",
                  anonymousTokenHash: "test-token-hash",
                  credentialGeneration: BigInt(0),
                  valid: true,
                },
              ]
            : row
              ? [row]
              : [];
        return Object.assign(Promise.resolve(result), {
          for: async () => result,
        });
      },
    }),
  }),
  insert: (table: unknown) => ({
    values: (values: typeof attempts.$inferInsert) => {
      writeTables.push(table);
      row = {
        ...values,
        lessonOpened: false,
        microCheckSelectedOptionId: null,
        microCheckOutcome: null,
        diagnosticCompletedAt: new Date(),
        lessonOpenedAt: null,
        microCheckCompletedAt: null,
      };
      return { returning: async () => [row] };
    },
  }),
  update: (table: unknown) => ({
    set: (values: Partial<typeof attempts.$inferSelect>) => ({
      where: () => {
        writeTables.push(table);
        if (!row) throw new Error("Missing row");
        row = { ...row, ...values };
        return { returning: async () => [row] };
      },
    }),
  }),
};
const database = {
  ...queryBoundary,
  transaction: async <T>(
    action: (tx: typeof queryBoundary) => Promise<T>,
  ): Promise<T> => action(queryBoundary),
};
const sessionId = "12345678-1234-1234-1234-123456789abc";
const step = (
  kind: "diagnostic" | "lesson" | "micro-check",
  option: unknown = null,
  eligible = true,
) =>
  persistSupportStep(
    learnerContext("learner"),
    sessionId,
    kind,
    option,
    eligible,
  );
beforeEach(() => {
  row = null;
  writeTables.length = 0;
});

describe("dedicated persistence boundary (transaction double)", () => {
  it("stores only factual support observations; identical retries preserve all timestamps", async () => {
    expect(
      await readSupportObservation(learnerContext("learner"), sessionId),
    ).toBeNull();
    await step("diagnostic", "B");
    const diagnosticBytes = JSON.stringify(row);
    await step("diagnostic", "B");
    expect(JSON.stringify(row)).toBe(diagnosticBytes);
    await expect(step("diagnostic", "C")).rejects.toThrow("conflicts");
    await step("lesson");
    const lessonBytes = JSON.stringify(row);
    await step("lesson");
    expect(JSON.stringify(row)).toBe(lessonBytes);
    await step("micro-check", "A");
    const completedBytes = JSON.stringify(row);
    await step("micro-check", "A");
    expect(JSON.stringify(row)).toBe(completedBytes);
    await expect(step("micro-check", "D")).rejects.toThrow("conflicts");
    expect(
      await readSupportObservation(learnerContext("learner"), sessionId),
    ).toEqual({
      diagnosticSelectedOptionId: "B",
      diagnosticOutcome: "incorrect",
      lessonOpened: true,
      microCheckSelectedOptionId: "A",
      microCheckOutcome: "correct",
    });
    expect(row).toMatchObject({
      carrierProblemId: "five-piles-stones",
      topicId: "multiplicative-additive-comparisons",
      practiceSessionId: sessionId,
      learnerId: "learner",
    });
    expect(writeTables).toEqual([attempts, attempts, attempts]);
    expect(completedBytes).not.toMatch(
      /mastery|weakness|score|adaptiveFacts|contribution|progressGroup/,
    );
  });
  it("never permits a lesson after a correct diagnostic", async () => {
    await step("diagnostic", "A");
    await expect(step("lesson")).rejects.toThrow("incorrect diagnostic");
    await expect(step("micro-check", "A")).rejects.toThrow(
      "incorrect diagnostic",
    );
    expect(writeTables).toEqual([attempts]);
  });
  it("requires eligibility, a diagnostic, and a recorded lesson in order", async () => {
    await expect(step("diagnostic", "B", false)).rejects.toThrow(
      "not eligible",
    );
    await expect(step("lesson")).rejects.toThrow();
    await expect(step("micro-check", "A")).rejects.toThrow();
    await step("diagnostic", "D");
    await expect(step("micro-check", "A")).rejects.toThrow("lesson first");
    await step("lesson");
    expect((await step("micro-check", "D")).microCheckOutcome).toBe(
      "incorrect",
    );
  });
});

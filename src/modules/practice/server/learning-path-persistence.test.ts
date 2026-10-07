import { learnerContext } from "../../../test/learner-fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { readRows } = vi.hoisted(() => ({ readRows: vi.fn() }));
vi.mock("./progress-db", () => ({
  getProgressDb: () => ({
    select: () => ({ from: () => ({ where: readRows }) }),
  }),
}));
import { readCompletedPackIds } from "./learner-progress-persistence";
beforeEach(() => vi.clearAllMocks());
describe("Learning Path receipt reads", () => {
  it("keeps old null receipts unknown and deduplicates repeated Pack finishes", async () => {
    readRows.mockResolvedValue([
      { packId: null, mode: "pack" },
      { packId: null, mode: null },
      { packId: "pack-j", mode: "pack" },
      { packId: "pack-j", mode: "pack" },
    ]);
    expect(await readCompletedPackIds(learnerContext("learner"))).toEqual([
      "pack-j",
    ]);
  });
  it.each([
    { packId: "pack-z", mode: "pack" },
    { packId: "pack-a", mode: "core" },
    { packId: "pack-a", mode: null },
  ])("rejects malformed persisted identity $packId/$mode", async (row) => {
    readRows.mockResolvedValue([row]);
    await expect(
      readCompletedPackIds(learnerContext("learner")),
    ).rejects.toThrow("could not be verified");
  });
  it("propagates read failure instead of inventing an empty path", async () => {
    readRows.mockRejectedValue(new Error("database unavailable"));
    await expect(
      readCompletedPackIds(learnerContext("learner")),
    ).rejects.toThrow("database unavailable");
  });
});

vi.mock("./learner-auth", () => ({
  withAuthenticatedLearner: async (
    _context: unknown,
    operation: (tx: ReturnType<typeof getProgressDb>) => Promise<unknown>,
  ) => operation(getProgressDb()),
}));
import { getProgressDb } from "./progress-db";

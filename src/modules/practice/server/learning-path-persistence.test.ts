import { learnerContext } from "../../../test/learner-fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const { readRows } = vi.hoisted(() => ({ readRows: vi.fn() }));
vi.mock("./progress-db", () => ({
  getProgressDb: () => ({
    select: () => ({ from: () => ({ where: readRows }) }),
  }),
}));
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
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
    ...[
      "",
      "pack-",
      "Pack-z",
      "pack-Z",
      "pack-z ",
      "pack--z",
      "pack-z/other",
      "other-z",
      42,
      undefined,
    ].map((packId) => ({ packId, mode: "pack" })),
    { packId: "pack-z", mode: "core" },
    { packId: "pack-z", mode: null },
    { packId: null, mode: "future-mode" },
    { packId: "pack-a", mode: "core" },
    { packId: "pack-a", mode: null },
  ])("rejects malformed persisted identity $packId/$mode", async (row) => {
    readRows.mockResolvedValue([row]);
    await expect(
      readCompletedPackIds(learnerContext("learner")),
    ).rejects.toThrow("could not be verified");
  });
  it.each(PRACTICE_PACKS)("retains known $id completion", async ({ id }) => {
    readRows.mockResolvedValue([{ packId: id, mode: "pack" }]);
    expect(await readCompletedPackIds(learnerContext("learner"))).toEqual([id]);
  });
  it("ignores well-formed future identities without assigning known completion", async () => {
    readRows.mockResolvedValue([
      { packId: "pack-t", mode: "pack" },
      { packId: "pack-future-2", mode: "pack" },
      { packId: "pack-j", mode: "pack" },
      { packId: "pack-t", mode: "pack" },
    ]);
    expect(await readCompletedPackIds(learnerContext("learner"))).toEqual([
      "pack-j",
    ]);
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

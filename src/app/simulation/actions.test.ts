import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../../modules/practice/server/learner-identity", () => ({
  resolveLearnerFromCookie: vi.fn(async () => "owner"),
}));
vi.mock("../../modules/simulation/server/persistence", () => ({
  transactSimulation: vi.fn(),
}));
import { transactSimulation } from "../../modules/simulation/server/persistence";
import { newSimulation } from "../../modules/simulation/domain/simulation";
import {
  readSimulationReferences,
  saveSimulation,
  finishSimulation,
  startSimulation,
} from "./actions";
const id = "00000000-0000-4000-8000-000000000001";
const attempt = newSimulation(id, 1000);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(transactSimulation).mockResolvedValue({ attempt, serverNow: 1000 });
});
describe("simulation server actions", () => {
  it("takes identity from the cookie and delegates distinct simulation operations", async () => {
    await startSimulation();
    expect(transactSimulation).toHaveBeenCalledWith("owner", { kind: "start" });
    await saveSimulation(id, 0, attempt);
    expect(transactSimulation).toHaveBeenLastCalledWith("owner", {
      kind: "save",
      sessionId: id,
      revision: 0,
      work: attempt,
    });
    await finishSimulation(id, 0, attempt, true);
    expect(transactSimulation).toHaveBeenLastCalledWith("owner", {
      kind: "finish",
      sessionId: id,
      revision: 0,
      work: attempt,
      confirmed: true,
    });
  });
  it("never sends references for an unfinished or foreign attempt", async () => {
    await expect(readSimulationReferences(id)).rejects.toThrow(
      "only after Finish",
    );
    vi.mocked(transactSimulation).mockResolvedValue({
      attempt: { ...attempt, finishedAt: 2000, finishReason: "early" },
      serverNow: 2000,
    });
    await expect(
      readSimulationReferences("00000000-0000-4000-8000-000000000002"),
    ).rejects.toThrow();
    const references = await readSimulationReferences(id);
    expect(references).toHaveLength(4);
    expect(references.every((item) => item.text.length > 0)).toBe(true);
  });
  it("rejects forged IDs and absent attempts", async () => {
    await expect(readSimulationReferences("invalid")).rejects.toThrow(
      "session ID",
    );
    vi.mocked(transactSimulation).mockResolvedValue({
      attempt: null,
      serverNow: 1000,
    });
    await expect(readSimulationReferences(id)).rejects.toThrow();
  });
});

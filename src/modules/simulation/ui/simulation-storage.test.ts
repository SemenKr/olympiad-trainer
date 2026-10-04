// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { newSimulation, updateSimulation } from "../domain/simulation";
import {
  hasUnsubmittedDrafts,
  restoreSimulationDraft,
  storeSimulationDraft,
  SIMULATION_PENDING_KEY,
} from "./simulation-storage";
const server = newSimulation("00000000-0000-4000-8000-000000000001", 1000);
beforeEach(() => localStorage.clear());
describe("simulation reload recovery", () => {
  it("restores pending drafts and selection while preserving trusted deadline", () => {
    storeSimulationDraft({
      ...server,
      drafts: ["first", "second", "", "fourth"],
      selectedIndex: 3,
    });
    expect(restoreSimulationDraft(server)).toMatchObject({
      drafts: ["first", "second", "", "fourth"],
      selectedIndex: 3,
      deadlineAt: server.deadlineAt,
    });
  });
  it("recovers newer typing after a save committed but its response was lost", () => {
    const sent = { ...server, drafts: ["sent", "", "", ""] as const };
    const saved = updateSimulation(server, 0, sent, 2000, false, false);
    storeSimulationDraft({ ...sent, drafts: ["newer", "", "", ""] }, sent);
    expect(restoreSimulationDraft(saved)).toMatchObject({
      revision: 1,
      drafts: ["newer", "", "", ""],
    });
  });
  it("does not replace submitted work and retains unsubmitted drafts for export", () => {
    storeSimulationDraft({ ...server, drafts: ["local", "", "", ""] });
    const finished = {
      ...server,
      finishedAt: server.deadlineAt,
      finishReason: "timeout" as const,
    };
    expect(restoreSimulationDraft(finished)).toBe(finished);
    expect(hasUnsubmittedDrafts(finished)).toBe(true);
  });
  it("refuses corrupt/conflicting local work without erasing it", () => {
    localStorage.setItem(SIMULATION_PENDING_KEY, "invalid");
    expect(() => restoreSimulationDraft(server)).toThrow();
    expect(localStorage.getItem(SIMULATION_PENDING_KEY)).toBe("invalid");
    storeSimulationDraft({ ...server, revision: 10 });
    expect(() => restoreSimulationDraft(server)).toThrow("conflicts");
  });
});

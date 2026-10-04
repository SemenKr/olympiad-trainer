import { describe, expect, it } from "vitest";
import {
  expireSimulation,
  newSimulation,
  requireSimulationWork,
  requireSimulationRevision,
  remainingSimulationSeconds,
  updateSimulation,
  SIMULATION_DURATION_MS,
} from "./simulation";

const id = "00000000-0000-4000-8000-000000000001";
const started = newSimulation(id, 1000);
const work = {
  drafts: ["case analysis", "", "distance", ""] as const,
  selectedIndex: 2,
};

describe("fixed simulation semantics", () => {
  it("starts a distinct 45-minute attempt with four empty drafts", () => {
    expect(started).toMatchObject({
      mode: "simulation",
      drafts: ["", "", "", ""],
      revision: 0,
    });
    expect(started.deadlineAt - started.startedAt).toBe(SIMULATION_DURATION_MS);
    expect(remainingSimulationSeconds(started, 1000)).toBe(2700);
  });
  it("preserves all drafts while navigating freely", () => {
    const saved = updateSimulation(started, 0, work, 2000, false, false);
    expect(saved).toMatchObject({ ...work, revision: 1, finishedAt: null });
    expect(
      updateSimulation(
        saved,
        1,
        { ...work, selectedIndex: 0 },
        3000,
        false,
        false,
      ).drafts,
    ).toEqual(work.drafts);
  });
  it("requires confirmation for early Finish and freezes submission", () => {
    expect(() => updateSimulation(started, 0, work, 2000, true, false)).toThrow(
      "confirmation",
    );
    const finished = updateSimulation(started, 0, work, 2000, true, true);
    expect(finished).toMatchObject({
      finishedAt: 2000,
      finishReason: "early",
      drafts: work.drafts,
    });
    expect(
      updateSimulation(
        finished,
        1,
        { ...work, drafts: ["overwrite", "", "", ""] },
        3000,
        false,
        false,
      ),
    ).toBe(finished);
  });
  it("times out exactly at the deadline, ignoring late work and confirmation", () => {
    const saved = updateSimulation(started, 0, work, 2000, false, false);
    const expired = updateSimulation(
      saved,
      1,
      { ...work, drafts: ["late", "", "", ""] },
      saved.deadlineAt,
      true,
      false,
    );
    expect(expired).toMatchObject({
      drafts: work.drafts,
      finishedAt: saved.deadlineAt,
      finishReason: "timeout",
    });
    expect(expireSimulation(saved, saved.deadlineAt - 1)).toBe(saved);
    expect(remainingSimulationSeconds(expired, 2000)).toBe(0);
  });
  it("allows exact lost-response retries but refuses stale overwrites", () => {
    const saved = updateSimulation(started, 0, work, 2000, false, false);
    expect(updateSimulation(saved, 0, work, 3000, false, false).drafts).toEqual(
      work.drafts,
    );
    expect(() =>
      updateSimulation(
        saved,
        0,
        { ...work, selectedIndex: 1 },
        3000,
        false,
        false,
      ),
    ).toThrow("another tab");
  });
  it.each([
    null,
    {},
    { drafts: [""], selectedIndex: 0 },
    { drafts: ["", "", 1, ""], selectedIndex: 0 },
    { drafts: ["x".repeat(12001), "", "", ""], selectedIndex: 0 },
    { ...work, selectedIndex: 4 },
  ])("rejects malformed/oversized work %j", (input) => {
    expect(() => requireSimulationWork(input)).toThrow();
  });
  it.each([-1, 0.5, "0", Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid revision %j",
    (input) => {
      expect(() => requireSimulationRevision(input)).toThrow();
    },
  );
});

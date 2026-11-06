import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  BETA_PROBLEM_IDS,
  originalOnlyBeta,
  requireBetaFinish,
} from "./content-access";
import {
  getLearnerSafePackProblems,
  getLearnerSafePracticeProblem,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
  getProblemDefinition,
  PRACTICE_PROBLEM_DEFINITIONS,
} from "./problem-catalog";
import { submitPracticeAnswer } from "../../../app/practice/actions";
import { getPublicProblemSources } from "./public-problem-sources";
afterEach(() => vi.unstubAllEnvs());
describe("original-only beta boundary", () => {
  it("cannot disable production restrictions with configuration", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGINAL_ONLY_BETA", "false");
    expect(originalOnlyBeta()).toBe(true);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "development");
    expect(originalOnlyBeta()).toBe(true);
    expect(Object.keys(getLearnerSafePackProblems())).toEqual([
      "pack-s",
      "pack-t",
    ]);
    expect(getPublicProblemSources().map((p) => p.problemId)).toEqual(
      BETA_PROBLEM_IDS,
    );
  });
  it("keeps local Pack U outside the Production allowlist", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ORIGINAL_ONLY_BETA", "false");
    const ids = [
      "original-box-totals",
      "original-fourteen-cards",
      "original-bead-badges",
    ];
    expect(BETA_PROBLEM_IDS).toHaveLength(6);
    for (const id of ids) {
      expect(BETA_PROBLEM_IDS as readonly string[]).not.toContain(id);
      expect(() => getLearnerSafePracticeProblem(id)).toThrow();
      await expect(submitPracticeAnswer(id, "1")).rejects.toThrow();
    }
    expect(() =>
      requireBetaFinish([], undefined, {
        mode: "pack",
        facts: { problems: ids.map((problemId) => ({ problemId })) },
      }),
    ).toThrow();
  });
  it("denies direct projection, assistance and assessment for legacy IDs", async () => {
    vi.stubEnv("ORIGINAL_ONLY_BETA", "true");
    for (const id of PRACTICE_PROBLEM_DEFINITIONS.filter(
      (p) => !BETA_PROBLEM_IDS.some((id) => id === p.id),
    ).map((p) => p.id)) {
      const definition = getProblemDefinition(id);
      expect(() => getLearnerSafePracticeProblem(id)).toThrow();
      expect(() =>
        getRevealedPracticeHint(id, definition.hints[0].id),
      ).toThrow();
      expect(() =>
        getRevealedPracticeSolution(id, definition.solution.id),
      ).toThrow();
      await expect(submitPracticeAnswer(id, "1")).rejects.toThrow();
    }
  });
  it("retains the six approved definitions and denies stale/forged Finish before writes", () => {
    vi.stubEnv("ORIGINAL_ONLY_BETA", "true");
    for (const id of BETA_PROBLEM_IDS)
      expect(getLearnerSafePracticeProblem(id).problemId).toBe(id);
    expect(() =>
      requireBetaFinish([], undefined, {
        mode: "core",
        facts: { problems: [{ problemId: "coinciding-seats" }] },
      }),
    ).toThrow();
    expect(() =>
      requireBetaFinish([{}], undefined, {
        mode: "pack",
        facts: { problems: [{ problemId: BETA_PROBLEM_IDS[0] }] },
      }),
    ).toThrow();
    expect(() =>
      requireBetaFinish([], undefined, {
        mode: "pack",
        facts: { problems: [{ problemId: BETA_PROBLEM_IDS[0] }] },
      }),
    ).not.toThrow();
  });
});

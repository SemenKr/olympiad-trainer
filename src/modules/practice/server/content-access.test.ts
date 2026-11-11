import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import {
  getLearnerSafePackProblems,
  getLearnerSafePracticeProblem,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
  getProblemDefinition,
} from "./problem-catalog";
import { getPublicProblemSources } from "./public-problem-sources";
afterEach(() => vi.unstubAllEnvs());
describe("unified catalog", () => {
  it.each(["development", "test", "production"])(
    "serves all registered packs in %s even with obsolete beta configuration",
    (environment) => {
      vi.stubEnv("NODE_ENV", environment);
      vi.stubEnv("VERCEL", "1");
      vi.stubEnv("ORIGINAL_ONLY_BETA", "true");
      expect(Object.keys(getLearnerSafePackProblems())).toHaveLength(21);
      for (const pack of PRACTICE_PACKS)
        for (const id of pack.problemIds) {
          const definition = getProblemDefinition(id);
          expect(getLearnerSafePracticeProblem(id).problemId).toBe(id);
          for (const hint of definition.hints)
            expect(getRevealedPracticeHint(id, hint.id)).toBeDefined();
          expect(
            getRevealedPracticeSolution(id, definition.solution.id),
          ).toBeDefined();
        }
      expect(getPublicProblemSources().length).toBeGreaterThan(6);
    },
  );
  it("still rejects unknown identities and assistance IDs", () => {
    expect(() => getLearnerSafePracticeProblem("unknown")).toThrow();
    expect(() =>
      getRevealedPracticeHint(PRACTICE_PACKS[0].problemIds[0], "unknown"),
    ).toThrow();
    expect(() =>
      getRevealedPracticeSolution(PRACTICE_PACKS[0].problemIds[0], "unknown"),
    ).toThrow();
  });
});

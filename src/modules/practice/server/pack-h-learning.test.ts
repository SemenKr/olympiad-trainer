import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import baseline from "./content-identities.json";
import { validatePracticeContent } from "./content-validation";
import {
  getLearnerSafePracticeProblem,
  getProblemDefinition,
  getRevealedPracticeSolution,
  PRACTICE_PROBLEM_DEFINITIONS,
} from "./problem-catalog";
import { browserProblemMetadata } from "./browser-problem-metadata";

const ids = [
  "rabbit-carrot-shortfall",
  "grade-average-fives",
  "magic-forest-coin-difference",
];
afterEach(() => vi.unstubAllEnvs());
const answer = (id: string) => {
  const assessment = getProblemDefinition(id).assessment;
  if (assessment.kind !== "nonnegative-integer")
    throw new Error("Unexpected assessment");
  return Number(assessment.expectedAnswer);
};

describe("Pack H reasoning slice", () => {
  it("checks the carrot shortfall by allocating both norms group by group", () => {
    const allocated = Array.from({ length: 630 / 70 }, () => 3).reduce(
      (a, b) => a + b,
      0,
    );
    const needed = Array.from({ length: 630 / 90 }, () => 7).reduce(
      (a, b) => a + b,
      0,
    );
    expect(allocated + answer(ids[0])).toBe(needed);
    expect(answer(ids[0])).toBe(22);
  });
  it("enumerates added grades and proves no earlier count reaches four", () => {
    const qualifying = [];
    for (let count = 0; count <= 30; count++) {
      const marks = [3, 3, 3, 2, 2, ...Array<number>(count).fill(5)];
      if (marks.reduce((a, b) => a + b, 0) === 4 * marks.length)
        qualifying.push(count);
    }
    expect(qualifying).toEqual([answer(ids[1])]);
    expect(qualifying).toEqual([7]);
  });
  it("checks the forest difference independently over unspecified tree counts", () => {
    for (let triples = 0; triples <= 30; triples++)
      for (let singles = 0; singles <= 30; singles++) {
        const coins = 3 * triples + singles + 3 * 2 + 4 * 4;
        const trees = triples + 2 * triples + singles + 3 + 4;
        expect(coins - trees).toBe(answer(ids[2]));
      }
    expect(answer(ids[2])).toBe(15);
  });
  it.each(ids)("keeps method metadata protected and optional for %s", (id) => {
    const p = getProblemDefinition(id);
    const initial = getLearnerSafePracticeProblem(id);
    expect(initial).not.toHaveProperty("learning");
    expect(initial.solution).toEqual({ solutionId: p.solution.id });
    expect(browserProblemMetadata([p])[id]).not.toHaveProperty("learning");
    const revealed = getRevealedPracticeSolution(id, p.solution.id);
    expect(revealed.learning?.topic).toBeTruthy();
    expect(revealed.learning?.method).toBeTruthy();
    expect(revealed.learning?.prerequisites).toBeTruthy();
    expect(p.hints.map((h) => h.level)).toEqual([
      "focus",
      "strategy",
      "next-step",
    ]);
    for (const hint of p.hints)
      expect(hint.text).not.toMatch(new RegExp(`\\b${answer(id)}\\b`));
    expect(() => getRevealedPracticeSolution(id, "wrong-solution")).toThrow();
  });
  it("rejects incomplete descriptive metadata without changing the identity contract", () => {
    expect(
      validatePracticeContent(
        PRACTICE_PROBLEM_DEFINITIONS,
        PRACTICE_PACKS,
        baseline,
      ),
    ).toEqual([]);
    const p = getProblemDefinition(ids[0]);
    const invalid = {
      ...p,
      solution: {
        ...p.solution,
        learning: { topic: " ", method: "model", prerequisites: "groups" },
      },
    };
    expect(
      validatePracticeContent([invalid], [], { problems: [], packs: [] }),
    ).toContain(`problem ${p.id}: empty solution learning metadata`);
    expect(
      getRevealedPracticeSolution(
        "coinciding-seats",
        getProblemDefinition("coinciding-seats").solution.id,
      ),
    ).not.toHaveProperty("learning");
  });
});

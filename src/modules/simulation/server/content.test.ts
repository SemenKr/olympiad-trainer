import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getSimulationProblems } from "./content";
import { SIMULATION_PROBLEM_IDS } from "../domain/simulation";
import { getProblemDefinition } from "../../practice/server/problem-catalog";
describe("simulation safe content", () => {
  it("reuses four existing Grade 5 statements/options without shipping assistance or assessment", () => {
    const problems = getSimulationProblems();
    expect(problems.map((problem) => problem.problemId)).toEqual(
      SIMULATION_PROBLEM_IDS,
    );
    for (const problem of problems) {
      const original = getProblemDefinition(problem.problemId);
      expect(original.grade).toBe(5);
      expect(problem.statement).toBe(original.statement);
      expect(Object.keys(problem).sort()).toEqual([
        "options",
        "problemId",
        "statement",
        "title",
      ]);
      expect(JSON.stringify(problem)).not.toContain(original.solution.text);
      expect(JSON.stringify(problem)).not.toContain(original.hints[0].text);
    }
    expect(problems[1].options).toEqual(["0", "1", "2", "3", "4", "5"]);
  });
});

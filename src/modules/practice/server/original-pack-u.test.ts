import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { submitPracticeAnswer } from "../../../app/practice/actions";
import {
  getLearnerSafePracticeProblem,
  getProblemDefinition,
} from "./problem-catalog";
import { packById } from "../application/completed-practice-episode";
import { browserProblemMetadata } from "./browser-problem-metadata";

const cases = [
  ["original-box-totals", "11"],
  ["original-fourteen-cards", "8"],
  ["original-bead-badges", "9"],
] as const;

describe("original Pack U", () => {
  it("registers the exact ordered tuple without new evidence semantics", () => {
    expect(packById("pack-u")).toEqual({
      id: "pack-u",
      name: "От условия к рассуждению",
      problemIds: cases.map(([id]) => id),
    });
    for (const [id] of cases)
      expect(getProblemDefinition(id).reasoningCheckpoint).toBeUndefined();
  });
  it("exhaustively reconstructs the three box counts and verifies uniqueness", () => {
    const solutions: number[][] = [];
    for (let red = 0; red <= 26; red++)
      for (let blue = 0; blue <= 26; blue++)
        for (let green = 0; green <= 26; green++)
          if (red + blue === 19 && red + green === 23 && blue + green === 26)
            solutions.push([red, blue, green]);
    expect(solutions).toEqual([[8, 11, 15]]);
    expect(getProblemDefinition(cases[0][0]).assessment).toMatchObject({
      expectedAnswer: String(solutions[0][1]),
    });
  });
  it("enumerates all distinct card subsets, independently checks both partitions", () => {
    const sets: number[][] = [];
    for (let a = 1; a <= 9; a++)
      for (let b = a + 1; b <= 9; b++)
        for (let c = b + 1; c <= 9; c++)
          if (a + b + c === 14) sets.push([a, b, c]);
    expect(sets).toEqual([
      [1, 4, 9],
      [1, 5, 8],
      [1, 6, 7],
      [2, 3, 9],
      [2, 4, 8],
      [2, 5, 7],
      [3, 4, 7],
      [3, 5, 6],
    ]);
    expect([1, 2, 3].map((n) => sets.filter((s) => s[0] === n).length)).toEqual(
      [3, 3, 2],
    );
    expect(
      [6, 7, 8, 9].map((n) => sets.filter((s) => s[2] === n).length),
    ).toEqual([1, 3, 2, 2]);
    expect(getProblemDefinition(cases[1][0]).assessment).toMatchObject({
      expectedAnswer: String(sets.length),
    });
  });
  it("finds every feasible resource allocation and both attaining maxima", () => {
    // Every badge consumes at least one bead of each colour, so these bounds exhaust all allocations.
    const feasible: number[][] = [];
    for (let first = 0; first <= 13; first++)
      for (let second = 0; second <= 13; second++)
        if (2 * first + second <= 17 && first + 3 * second <= 13)
          feasible.push([first, second]);
    const maximum = Math.max(...feasible.map(([a, b]) => a + b));
    expect(maximum).toBe(9);
    expect(feasible.filter(([a, b]) => a + b === maximum)).toEqual([
      [7, 2],
      [8, 1],
    ]);
    expect(feasible.some(([a, b]) => a + b >= 10)).toBe(false);
    expect(getProblemDefinition(cases[2][0]).assessment).toMatchObject({
      expectedAnswer: String(maximum),
    });
  });
  it.each(cases)(
    "assesses %s numerically and protects authoring data",
    async (id, answer) => {
      expect(await submitPracticeAnswer(id, answer)).toEqual({
        status: "correct",
        normalizedAnswer: answer,
      });
      expect(
        await submitPracticeAnswer(id, String(Number(answer) + 1)),
      ).toMatchObject({ status: "incorrect" });
      const problem = getProblemDefinition(id);
      expect(problem.provenance.kind).toBe("original");
      expect(problem.solution.kind).toBe("original-explanation");
      expect(problem.hints.map((h) => h.level)).toEqual([
        "focus",
        "strategy",
        "next-step",
      ]);
      expect(problem.provenance.rightsNote).toContain(
        "владелец одобрил публичное распространение всех трёх оригинальных задач Pack U",
      );
      expect(problem.provenance.rightsNote).toContain(
        "не является одобрением Production-релиза",
      );
      for (const projection of [
        getLearnerSafePracticeProblem(id),
        browserProblemMetadata([problem]),
      ]) {
        const serialized = JSON.stringify(projection);
        expect(serialized).not.toMatch(
          /expectedAnswer|rightsNote|dossierPath|correctOptionId/,
        );
        for (const text of [
          ...problem.hints.map((h) => h.text),
          problem.solution.text,
        ])
          expect(serialized).not.toContain(text);
      }
    },
  );
});

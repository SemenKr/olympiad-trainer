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
  ["original-linked-code", "462"],
  ["original-signal-flags", "12"],
  ["original-two-color-pairs", "7"],
] as const;

describe("original Pack T", () => {
  it("registers the ordered tuple with no invented adaptive evidence", () => {
    expect(packById("pack-t")).toEqual({
      id: "pack-t",
      name: "Условия, варианты и гарантия",
      problemIds: cases.map(([id]) => id),
    });
    for (const [id] of cases)
      expect(getProblemDefinition(id).reasoningCheckpoint).toBeUndefined();
  });

  it("independently exhausts the digit constraints and proves uniqueness", () => {
    const codes: number[] = [];
    for (let hundreds = 1; hundreds <= 6; hundreds++)
      for (let tens = 1; tens <= 6; tens++)
        for (let units = 1; units <= 6; units++)
          if (
            new Set([hundreds, tens, units]).size === 3 &&
            hundreds === 2 * units &&
            tens === hundreds + units &&
            hundreds + tens + units === 12
          )
            codes.push(100 * hundreds + 10 * tens + units);
    expect(codes).toEqual([462]);
    expect(getProblemDefinition(cases[0][0]).assessment).toMatchObject({
      expectedAnswer: String(codes[0]),
    });
  });

  it("enumerates all flag strings independently, including the case partition", () => {
    const rows: string[] = [];
    const visit = (row: string, remaining: number[]) => {
      if (row.length === 5) {
        rows.push(row);
        return;
      }
      for (let color = 0; color < 3; color++) {
        if (remaining[color] === 0 || row.endsWith(String(color))) continue;
        const next = [...remaining];
        next[color]--;
        visit(row + color, next);
      }
    };
    visit("", [2, 2, 1]);
    expect(new Set(rows).size).toBe(12);
    expect(
      Array.from(
        { length: 5 },
        (_, index) => rows.filter((row) => row[index] === "2").length,
      ),
    ).toEqual([2, 2, 4, 2, 2]);
    expect(getProblemDefinition(cases[1][0]).assessment).toMatchObject({
      expectedAnswer: String(rows.length),
    });
  });

  it("proves the guarantee for every feasible draw and an attainable lower bound", () => {
    const failures: number[] = [];
    const seven: number[][] = [];
    for (let red = 0; red <= 4; red++)
      for (let blue = 0; blue <= 4; blue++)
        for (let green = 0; green <= 4; green++) {
          const counts = [red, blue, green];
          const pairs = counts.filter((count) => count >= 2).length;
          if (pairs < 2) failures.push(red + blue + green);
          if (red + blue + green === 7) {
            seven.push(counts);
            expect(pairs).toBeGreaterThanOrEqual(2);
          }
        }
    expect(seven.length).toBeGreaterThan(0);
    expect(Math.max(...failures)).toBe(6);
    expect([4, 1, 1].filter((count) => count >= 2)).toHaveLength(1);
    expect(getProblemDefinition(cases[2][0]).assessment).toMatchObject({
      expectedAnswer: String(Math.max(...failures) + 1),
    });
  });

  it.each(cases)(
    "checks %s and keeps protected authoring data server-only",
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
      expect(problem.hints.map((hint) => hint.level)).toEqual([
        "focus",
        "strategy",
        "next-step",
      ]);
      expect(problem.provenance.rightsNote).toContain(
        "владелец разрешил публичное распространение",
      );
      expect(problem.provenance.rightsNote).toContain("остаётся незавершённой");
      const projections = [
        getLearnerSafePracticeProblem(id),
        browserProblemMetadata([problem]),
      ];
      for (const projection of projections) {
        const serialized = JSON.stringify(projection);
        expect(serialized).not.toMatch(
          /expectedAnswer|rightsNote|dossierPath|correctOptionId/,
        );
        for (const text of [
          ...problem.hints.map((hint) => hint.text),
          problem.solution.text,
        ])
          expect(serialized).not.toContain(text);
      }
      expect(Object.keys(browserProblemMetadata([problem])[id]).sort()).toEqual(
        ["hints", "id", "solution", "title"],
      );
    },
  );
});

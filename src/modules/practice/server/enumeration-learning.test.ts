import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import { browserProblemMetadata } from "./browser-problem-metadata";
import { validatePracticeContent } from "./content-validation";
import baseline from "./content-identities.json";
import {
  getProblemDefinition,
  getLearnerSafePracticeProblem,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
  PRACTICE_PROBLEM_DEFINITIONS,
} from "./problem-catalog";
const ids = [
  "exact-coin-payments",
  "five-fridays-calendar",
  "multiples-prefix-count",
  "pages-without-digit-one",
];
function numericAnswer(id: string) {
  const assessment = getProblemDefinition(id).assessment;
  if (assessment.kind !== "nonnegative-integer")
    throw Error("Unexpected assessment");
  return Number(assessment.expectedAnswer);
}
describe("enumeration reasoning support", () => {
  it("independently enumerates coin multisets, counting each triple once", () => {
    const triples = [];
    for (let tens = 0; tens <= 20; tens++)
      for (let twos = 0; twos <= 20; twos++)
        for (let ones = 0; ones <= 20; ones++)
          if (10 * tens + 2 * twos + ones === 16)
            triples.push([tens, twos, ones]);
    expect(triples).toHaveLength(13);
    expect(triples).toHaveLength(numericAnswer(ids[0]));
    expect(new Set(triples.map((value) => JSON.stringify(value))).size).toBe(
      triples.length,
    );
  });
  it("checks every month length and weekday offset, including all excluded cases", () => {
    const possibilities = [];
    // Monday=0, Friday=4; actual month lengths, without assuming year or month.
    for (const length of [28, 29, 30, 31])
      for (let first = 0; first < 7; first++) {
        const weekday = (date: number) => (first + date - 1) % 7;
        const fridays = Array.from({ length }, (_, i) => i + 1).filter(
          (date) => weekday(date) === 4,
        );
        if (fridays.length === 5 && weekday(1) !== 4 && weekday(length) !== 4)
          possibilities.push({ length, first, twelfth: weekday(12) });
      }
    expect(possibilities).toEqual([{ length: 31, first: 3, twelfth: 0 }]);
    expect(getProblemDefinition(ids[1]).assessment).toMatchObject({
      expectedOptionIds: ["monday"],
    });
  });
  it("counts divisibility directly for every possible endpoint", () => {
    const endpoints = [];
    // More than 53 numbers already contain at least eighteen multiples of 3.
    for (let end = 1; end <= 54; end++) {
      const values = Array.from({ length: end }, (_, i) => i + 1);
      if (
        values.filter((n) => n % 3 === 0).length === 17 &&
        values.filter((n) => n % 13 === 0).length === 3
      )
        endpoints.push(end);
    }
    expect(endpoints).toEqual([51]);
    expect(endpoints).toEqual([numericAnswer(ids[2])]);
  });
  it("generates page labels directly instead of using the solution's block arithmetic", () => {
    const labels = [];
    for (let n = 1; labels.length < 101; n++)
      if (!String(n).includes("1")) labels.push(n);
    expect(labels[99]).toBe(232);
    expect(labels[99]).toBe(numericAnswer(ids[3]));
    expect(labels.slice(0, 99).every((n) => n < 232)).toBe(true);
    expect(labels[100]).toBe(233);
  });
  it.each(ids)(
    "protects metadata and reveals existing support identities for %s",
    (id) => {
      const p = getProblemDefinition(id);
      expect(getLearnerSafePracticeProblem(id).solution).toEqual({
        solutionId: p.solution.id,
      });
      expect(browserProblemMetadata([p])[id]).not.toHaveProperty("learning");
      const revealed = getRevealedPracticeSolution(id, p.solution.id);
      expect(revealed.learning).toEqual(p.solution.learning);
      expect(Object.values(revealed.learning!)).toHaveLength(3);
      expect(p.hints.map((h) => h.level)).toEqual([
        "focus",
        "strategy",
        "next-step",
      ]);
      for (const hint of p.hints) {
        expect(getRevealedPracticeHint(id, hint.id).text).toBe(hint.text);
        expect(hint.text).not.toMatch(
          id === "five-fridays-calendar"
            ? /понедельник/i
            : new RegExp(`\\b${numericAnswer(id)}\\b`),
        );
      }
      expect(() => getRevealedPracticeSolution(id, "wrong")).toThrow();
    },
  );
  it("preserves content identity and validation contracts", () => {
    expect(
      validatePracticeContent(
        PRACTICE_PROBLEM_DEFINITIONS,
        PRACTICE_PACKS,
        baseline,
      ),
    ).toEqual([]);
  });
});

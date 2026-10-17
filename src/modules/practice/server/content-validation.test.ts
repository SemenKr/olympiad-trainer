import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  PRACTICE_PROBLEM_DEFINITIONS,
  getLearnerSafePracticeProblem,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
} from "./problem-catalog";
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import baseline from "./content-identities.json";
import { validatePracticeContent } from "./content-validation";

const validate = (
  problems = PRACTICE_PROBLEM_DEFINITIONS,
  packs: readonly {
    id: string;
    name: string;
    problemIds: readonly string[];
  }[] = PRACTICE_PACKS,
) => validatePracticeContent(problems, packs, baseline);

describe("repository content pipeline", () => {
  it("validates all authored problems and Packs against the identity baseline", () => {
    expect(PRACTICE_PROBLEM_DEFINITIONS.length).toBeGreaterThanOrEqual(60);
    expect(PRACTICE_PACKS.length).toBeGreaterThanOrEqual(18);
    expect(baseline.problems).toHaveLength(60);
    expect(baseline.packs).toHaveLength(18);
    expect(validate()).toEqual([]);
  });
  it("detects duplicate IDs before lookup construction", () => {
    expect(
      validate([
        ...PRACTICE_PROBLEM_DEFINITIONS,
        PRACTICE_PROBLEM_DEFINITIONS[0],
      ]),
    ).toContain("content IDs must be stable and globally unique");
  });
  it("rejects broken numeric contracts, hint order, provenance and empty solutions", () => {
    const problems = structuredClone(PRACTICE_PROBLEM_DEFINITIONS);
    const first = problems[0];
    const invalid = {
      ...first,
      assessment: {
        kind: "nonnegative-integer" as const,
        expectedAnswer: "01",
      },
      hints: [first.hints[1], first.hints[0], first.hints[2]],
      solution: { ...first.solution, text: " " },
      provenance: {
        ...first.provenance,
        officialSolution: {
          ...first.provenance.officialSolution,
          url: "broken",
          page: 0,
        },
      },
    };
    const errors = validatePracticeContent(
      [invalid as unknown as typeof first, ...problems.slice(1)],
      PRACTICE_PACKS,
      baseline,
    );
    for (const fragment of [
      "numeric answer",
      "hint ordering",
      "empty content",
      "IS source",
    ])
      expect(errors.some((e) => e.includes(fragment))).toBe(true);
  });
  it("accepts and validates positive source variant numbers", () => {
    const problem = PRACTICE_PROBLEM_DEFINITIONS.find(
      (item) => item.id === "rectangle-knight-count",
    );
    expect(problem?.provenance.variant).toBe(3);
    expect(validate()).toEqual([]);
    const changed = {
      ...problem!,
      provenance: { ...problem!.provenance, variant: 0 },
    };
    const errors = validate(
      PRACTICE_PROBLEM_DEFINITIONS.map((item) =>
        item.id === changed.id ? changed : item,
      ),
    );
    expect(errors).toContain(
      "problem rectangle-knight-count: provenance metadata",
    );
  });
  it("rejects unknown, duplicate and empty expected options", () => {
    const source = PRACTICE_PROBLEM_DEFINITIONS.find(
      (p) => p.assessment.kind === "multiple-choice-set",
    )!;
    if (source.assessment.kind !== "multiple-choice-set")
      throw new Error("missing set example");
    for (const expectedOptionIds of [
      [],
      ["missing"],
      [source.assessment.options[0].id, source.assessment.options[0].id],
    ]) {
      const changed = {
        ...source,
        assessment: { ...source.assessment, expectedOptionIds },
      };
      expect(
        validate([changed]).some((e) =>
          e.includes("expected option references"),
        ),
      ).toBe(true);
    }
    const changed = {
      ...source,
      assessment: {
        ...source.assessment,
        options: [source.assessment.options[0], source.assessment.options[0]],
      },
    };
    expect(validate([changed]).some((e) => e.includes("option set"))).toBe(
      true,
    );
  });
  it("rejects missing, repeated, short and reordered Pack references", () => {
    for (const problemIds of [
      ["missing", ...PRACTICE_PACKS[0].problemIds.slice(1)],
      ["coinciding-seats", "coinciding-seats", "coinciding-seats"],
      PRACTICE_PACKS[0].problemIds.slice(1),
      [...PRACTICE_PACKS[0].problemIds].reverse(),
    ]) {
      expect(
        validate(PRACTICE_PROBLEM_DEFINITIONS, [
          { ...PRACTICE_PACKS[0], problemIds },
          ...PRACTICE_PACKS.slice(1),
        ]).length,
      ).toBeGreaterThan(0);
    }
  });
  it("protects existing identities against removal and support-ID changes", () => {
    expect(
      validate(PRACTICE_PROBLEM_DEFINITIONS.slice(1)).some((e) =>
        e.includes("changed or removed"),
      ),
    ).toBe(true);
    const first = PRACTICE_PROBLEM_DEFINITIONS[0];
    const changed = {
      ...first,
      solution: { ...first.solution, id: "replacement-solution" },
    };
    expect(
      validate([changed, ...PRACTICE_PROBLEM_DEFINITIONS.slice(1)]).some((e) =>
        e.includes("changed or removed"),
      ),
    ).toBe(true);
  });
  it.each(["remove", "reorder"] as const)(
    "rejects checkpoint option identity changes: %s",
    (change) => {
      const source = PRACTICE_PROBLEM_DEFINITIONS.find(
        (p) => p.id === "guaranteed-sock-pair",
      );
      if (!source?.reasoningCheckpoint)
        throw new Error("missing checkpoint example");
      const checkpoint = source.reasoningCheckpoint;
      const options =
        change === "remove"
          ? checkpoint.options.filter((option) => option.id !== "B")
          : [...checkpoint.options].reverse();
      const changed = {
        ...source,
        reasoningCheckpoint: { ...checkpoint, options },
      };
      const errors = validate(
        PRACTICE_PROBLEM_DEFINITIONS.map((problem) =>
          problem.id === source.id ? changed : problem,
        ),
      );
      // Both changes retain unique options and the correct answer; only the
      // identity baseline should reject them.
      expect(errors).toEqual([
        `problems ${source.id}: existing identity changed or removed`,
      ]);
    },
  );
  it("resolves every learner-facing support reference without eager protected content", () => {
    for (const p of PRACTICE_PROBLEM_DEFINITIONS) {
      const safe = getLearnerSafePracticeProblem(p.id);
      expect(safe).not.toHaveProperty("assessment");
      expect(safe).not.toHaveProperty("provenance");
      expect(safe.solution).toEqual({ solutionId: p.solution.id });
      expect(safe.hints).toEqual(
        p.hints.map((h) => ({ hintId: h.id, level: h.level })),
      );
      for (const hint of p.hints)
        expect(getRevealedPracticeHint(p.id, hint.id)).toMatchObject({
          text: hint.text,
        });
      expect(getRevealedPracticeSolution(p.id, p.solution.id)).toMatchObject({
        text: p.solution.text,
      });
    }
  });
});

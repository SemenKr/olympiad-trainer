import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { PRACTICE_PROBLEM_DEFINITIONS } from "./problem-catalog";
import { getPublicProblemSources } from "./public-problem-sources";

describe("public source attribution boundary", () => {
  it("projects every registered problem exactly once, using factual provenance", () => {
    const sources = getPublicProblemSources();
    expect(sources).toHaveLength(63);
    expect(sources.map((source) => source.problemId)).toEqual(
      PRACTICE_PROBLEM_DEFINITIONS.map((problem) => problem.id),
    );
    expect(new Set(sources.map((source) => source.problemId)).size).toBe(63);
    expect(sources.filter((source) => source.kind === "sourced")).toHaveLength(
      60,
    );
    for (const [index, source] of sources.entries()) {
      const problem = PRACTICE_PROBLEM_DEFINITIONS[index];
      if (source.kind === "original") {
        if (problem.provenance.kind !== "original")
          throw new Error("incorrect source kind");
        expect(source).toEqual({
          kind: "original",
          problemId: problem.id,
          title: problem.title,
          authorship: problem.provenance.authorship,
        });
        continue;
      }
      if (problem.provenance.kind === "original")
        throw new Error("incorrect source kind");
      expect(source).toEqual({
        kind: "sourced",
        problemId: problem.id,
        title: problem.title,
        academicYear: problem.provenance.academicYear,
        stage: problem.provenance.stage,
        region: problem.provenance.region,
        problemNumber: problem.provenance.problemNumber,
        ...(problem.provenance.variant === undefined
          ? {}
          : { variant: problem.provenance.variant }),
        originalSource: {
          url: problem.provenance.originalSource.url,
          page: problem.provenance.originalSource.page,
        },
      });
      expect(source.originalSource).not.toBe(problem.provenance.originalSource);
      const url = new URL(source.originalSource.url);
      expect(url.protocol).toBe("https:");
      expect(url.hostname).toBe("vos.olimpiada.ru");
      expect(url.pathname).toMatch(/\.pdf$/);
      expect(source.originalSource.page).toBeGreaterThan(0);
    }
  });

  it("excludes content, assessment, support, official solutions and domain data", () => {
    const serialized = JSON.stringify(getPublicProblemSources());
    expect(serialized).not.toMatch(
      /statement|assessment|expectedAnswer|expectedOptionIds|hints|solution|reasoningCheckpoint|correctOptionId|capability|difficulty|mastery|dossierPath|rightsNote/,
    );
    for (const problem of PRACTICE_PROBLEM_DEFINITIONS) {
      for (const protectedText of [
        problem.statement,
        ...problem.hints.map((hint) => hint.text),
        problem.solution.text,
      ]) {
        expect(serialized).not.toContain(JSON.stringify(protectedText));
      }
    }
    for (const path of ["problem-catalog.ts", "public-problem-sources.ts"]) {
      expect(
        readFileSync(`src/modules/practice/server/${path}`, "utf8"),
      ).toMatch(/^import "server-only";/);
    }
    expect(readFileSync("src/app/sources/page.tsx", "utf8")).not.toMatch(
      /["']use client["']|problem-catalog|learner\/|identity\//,
    );
  });
});

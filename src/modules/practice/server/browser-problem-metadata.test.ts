import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { PRACTICE_PROBLEM_DEFINITIONS } from "./problem-catalog";
import {
  browserProblemMetadata,
  renderBrowserProblemMetadata,
} from "./browser-problem-metadata";

const generatedFile = fileURLToPath(
  new URL("../ui/browser-problem-metadata.generated.ts", import.meta.url),
);

describe("browser metadata generation", () => {
  it("is fresh and contains only allowlisted storage fields", async () => {
    const rendered = await prettier.format(
      renderBrowserProblemMetadata(PRACTICE_PROBLEM_DEFINITIONS),
      { parser: "typescript" },
    );
    if (process.env.CONTENT_GENERATE === "write") {
      writeFileSync(generatedFile, rendered);
    }
    expect(readFileSync(generatedFile, "utf8")).toBe(rendered);
    const projected = browserProblemMetadata(PRACTICE_PROBLEM_DEFINITIONS);
    expect(Object.keys(projected)).toHaveLength(
      PRACTICE_PROBLEM_DEFINITIONS.length,
    );
    for (const problem of PRACTICE_PROBLEM_DEFINITIONS) {
      const entry = projected[problem.id];
      expect(entry).toEqual({
        id: problem.id,
        title: problem.title,
        hints: problem.hints.map((hint) => hint.id),
        solution: problem.solution.id,
        ...(problem.assessment.kind === "multiple-choice-set"
          ? { optionIds: problem.assessment.options.map((option) => option.id) }
          : {}),
      });
      expect(Object.keys(entry).sort()).toEqual(
        (problem.assessment.kind === "multiple-choice-set"
          ? ["id", "title", "hints", "solution", "optionIds"]
          : ["id", "title", "hints", "solution"]
        ).sort(),
      );
    }
  });
});

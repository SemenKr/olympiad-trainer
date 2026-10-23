import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { PRACTICE_PROBLEM_DEFINITIONS } from "./problem-catalog";
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import baseline from "./content-identities.json";
import { validatePracticeContent } from "./content-validation";
import {
  browserProblemMetadata,
  renderBrowserProblemMetadata,
} from "./browser-problem-metadata";

const script = fileURLToPath(
  new URL("../../../../scripts/content-new.mjs", import.meta.url),
);
const fixtureRoot = fileURLToPath(new URL("../../../../", import.meta.url));

function withAuthoringFixture(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), "content-authoring-"));
  try {
    for (const path of [
      "src/modules/practice/server/content-identities.json",
      "src/modules/practice/ui/browser-problem-metadata.generated.ts",
    ]) {
      const destination = join(root, path);
      mkdirSync(dirname(destination), { recursive: true });
      writeFileSync(destination, readFileSync(join(fixtureRoot, path)));
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("new content authoring", () => {
  it("scaffolds an isolated, unregistered draft without an answer", () => {
    withAuthoringFixture((root) => {
      const env = { ...process.env, CONTENT_AUTHORING_ROOT: root };
      execFileSync(process.execPath, [script, "new-math-task"], { env });
      const file = join(
        root,
        "src/modules/practice/server/problems/drafts/new-math-task.ts",
      );
      const draft = readFileSync(file, "utf8");
      expect(draft).toContain('id: "new-math-task"');
      expect(draft).not.toMatch(/expectedAnswer|expectedOptionIds|solution:/i);
      expect(() =>
        execFileSync(process.execPath, [script, "new-math-task"], {
          env,
          stdio: "pipe",
        }),
      ).toThrow();
      expect(() =>
        execFileSync(process.execPath, [script, "coinciding-seats"], {
          env,
          stdio: "pipe",
        }),
      ).toThrow();
      for (const id of ["Bad-ID", "../escape", "two--hyphens"]) {
        expect(() =>
          execFileSync(process.execPath, [script, id], { env, stdio: "pipe" }),
        ).toThrow();
      }
      expect(
        existsSync(
          join(root, "src/modules/practice/server/problems/drafts/escape.ts"),
        ),
      ).toBe(false);
    });
  });

  it("validates an isolated registered definition and rejects invalid identity and content", () => {
    const source = PRACTICE_PROBLEM_DEFINITIONS[0];
    const id = "fixture-new-problem";
    const fixture = {
      ...source,
      id,
      hints: source.hints.map((hint) => ({
        ...hint,
        id: `${id}-${hint.level}`,
      })) as unknown as typeof source.hints,
      solution: { ...source.solution, id: `${id}-solution` },
      assessment: {
        kind: "nonnegative-integer" as const,
        expectedAnswer: "314159",
      },
      reasoningCheckpoint: {
        id: `${id}-checkpoint`,
        heading: "PRIVATE_CHECKPOINT_HEADING",
        question: "PRIVATE_CHECKPOINT_QUESTION",
        options: [
          { id: "A" as const, text: "PRIVATE_WRONG_CHOICE" },
          { id: "B" as const, text: "PRIVATE_CORRECT_CHOICE" },
        ],
        correctOptionId: "B" as const,
      },
    };
    const registered = [...PRACTICE_PROBLEM_DEFINITIONS, fixture];
    expect(
      validatePracticeContent(registered, PRACTICE_PACKS, baseline),
    ).toEqual([]);
    expect(Object.keys(browserProblemMetadata(registered))).toHaveLength(
      registered.length,
    );
    const output = renderBrowserProblemMetadata(registered);
    expect(output).toContain(id);
    expect(output).not.toContain("314159");
    expect(output).not.toContain(source.statement);
    expect(output).not.toContain(source.hints[0].text);
    expect(output).not.toContain(source.solution.text);
    expect(output).not.toContain(source.provenance.originalSource.url);
    expect(output).not.toContain("PRIVATE_CHECKPOINT");
    expect(output).not.toContain("PRIVATE_CORRECT_CHOICE");
    expect(output).not.toContain("correctOptionId");
    expect(
      validatePracticeContent(
        [...registered, fixture],
        PRACTICE_PACKS,
        baseline,
      ),
    ).toContain("content IDs must be stable and globally unique");
    expect(
      validatePracticeContent(
        [
          ...PRACTICE_PROBLEM_DEFINITIONS,
          { ...fixture, id: "Bad-ID", statement: "" },
        ],
        PRACTICE_PACKS,
        baseline,
      ),
    ).toEqual(
      expect.arrayContaining([
        "content IDs must be stable and globally unique",
        "problem Bad-ID: empty content",
      ]),
    );
  });
});

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import * as learnerContent from "../domain/content";
import { MINI_LESSON, MICRO_INCORRECT } from "../server/content";

// Follow runtime imports as the client bundler does, stopping at Server Actions.
function clientSources(entry: string, visited = new Set<string>()): string[] {
  if (visited.has(entry)) return [];
  visited.add(entry);
  const source = readFileSync(entry, "utf8");
  if (/^["']use server["'];/.test(source)) return [];
  const file = ts.createSourceFile(entry, source, ts.ScriptTarget.Latest, true);
  const sources = [source];
  for (const statement of file.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier)
    )
      continue;
    const clause = statement.importClause;
    if (clause?.isTypeOnly) continue;
    if (
      clause?.namedBindings &&
      ts.isNamedImports(clause.namedBindings) &&
      !clause.name &&
      clause.namedBindings.elements.every((element) => element.isTypeOnly)
    )
      continue;
    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith(".")) continue;
    const base = resolve(dirname(entry), specifier);
    const target = [base, `${base}.ts`, `${base}.tsx`].find((path) =>
      existsSync(path),
    );
    if (target && /\.tsx?$/.test(target))
      sources.push(...clientSources(target, visited));
  }
  return sources;
}

describe("Knowledge Support client content boundary", () => {
  it("keeps answer-bearing content and assessment out of the pre-assessment client import graph", () => {
    const sources = clientSources(
      resolve("src/modules/knowledge-support/ui/knowledge-support.tsx"),
    ).join("\n");
    expect(sources).not.toContain('import "server-only"');
    expect(sources).not.toContain("12 ÷ 3 = 4");
    expect(sources).not.toContain("6 + 4 = 10");
    expect(sources).not.toContain("assessDiagnostic");
    expect(sources).not.toContain("assessMicroCheck");
    expect(learnerContent).not.toHaveProperty("MINI_LESSON");
    expect(learnerContent).not.toHaveProperty("MICRO_INCORRECT");
    expect(JSON.stringify(learnerContent)).not.toMatch(
      /correctOptionId|expectedOptionId/,
    );
    expect(MINI_LESSON).toContain("12 ÷ 3 = 4");
    expect(MICRO_INCORRECT.text).toContain("6 + 4 = 10");
  });
});

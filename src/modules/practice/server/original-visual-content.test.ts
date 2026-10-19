import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../simulation/server/assistance-guard", () => ({
  requireSimulationAssistanceAllowed: vi.fn(async () => {}),
}));

import { submitPracticeAnswer } from "../../../app/practice/actions";
import { PRACTICE_PACKS } from "../application/completed-practice-episode";
import { getPracticeProgressContribution } from "../application/practice-progress-evidence";
import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import {
  getLearnerSafePracticeProblem,
  getProblemDefinition,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
  type ProblemDefinition,
} from "./problem-catalog";
import { validatePracticeContent } from "./content-validation";

const cases = [
  ["original-two-frames", "8", "two-frames.svg"],
  ["original-notched-sheet", "27", "notched-sheet.svg"],
  ["original-path-via-k", "9", "path-via-k.svg"],
] as const;
const original = getProblemDefinition(cases[0][0]);
const validate = (problem: ProblemDefinition) =>
  validatePracticeContent([problem], [], { problems: [], packs: [] });

describe("original visual Pack S", () => {
  it("registers the exact reviewed tuple without adaptive evidence", () => {
    expect(PRACTICE_PACKS.at(-1)).toEqual({
      id: "pack-s",
      name: "Рисунки и рассуждения",
      problemIds: cases.map(([id]) => id),
    });
  });

  it.each(cases)(
    "checks %s on the server and protects support / provenance",
    async (id, answer, svg) => {
      const definition = getProblemDefinition(id);
      expect(definition.provenance.kind).toBe("original");
      expect(definition.provenance).not.toHaveProperty("originalSource");
      expect(definition.provenance).not.toHaveProperty("officialSolution");
      expect(definition.reasoningCheckpoint).toBeUndefined();
      expect(validate(definition)).toEqual([]);
      const result = await submitPracticeAnswer(id, answer);
      expect(result).toEqual({ status: "correct", normalizedAnswer: answer });
      expect(
        (await submitPracticeAnswer(id, String(Number(answer) + 1))).status,
      ).toBe("incorrect");
      for (const invalid of ["-1", "1.5", "", "три"])
        expect((await submitPracticeAnswer(id, invalid)).status).toBe(
          "invalid",
        );
      const summary = getPracticeSummary(
        finishPractice(recordAnswerResult(startPractice(), result)),
      );
      expect(
        getPracticeProgressContribution({ problemId: id, summary }),
      ).toBeNull();
      const safe = getLearnerSafePracticeProblem(id);
      expect(safe.media).toEqual(definition.media?.presentation);
      expect(safe.statement).toContain(safe.media!.alt);
      expect(safe.media!.src).toBe(`/problem-media/${id}.svg`);
      const serialized = JSON.stringify(safe);
      for (const key of [
        "assessment",
        "expectedAnswer",
        "provenance",
        "dossierPath",
        "rightsNote",
        "authorship",
      ])
        expect(serialized).not.toContain(`"${key}"`);
      for (const hint of definition.hints) {
        expect(serialized).not.toContain(hint.text);
        expect(getRevealedPracticeHint(id, hint.id).text).toBe(hint.text);
      }
      expect(serialized).not.toContain(definition.solution.text);
      expect(
        getRevealedPracticeSolution(id, definition.solution.id).text,
      ).toContain("Другой подход.");
      expect(() => getRevealedPracticeHint(id, `${id}-missing`)).toThrow();
      expect(readFileSync(`public/problem-media/${id}.svg`, "utf8")).toBe(
        readFileSync(`docs/02-research/visual-reasoning-v1/${svg}`, "utf8"),
      );
    },
  );

  it.each(cases)(
    "records the bounded owner decision for %s text and media",
    (id) => {
      const problem = getProblemDefinition(id);
      for (const provenance of [
        problem.provenance,
        problem.media!.provenance,
      ]) {
        if (provenance.kind !== "original")
          throw new Error("missing original provenance");
        expect(provenance.authorship).toBe(
          "Оригинальные материалы проекта Olympiad Trainer, подготовленные с помощью Codex.",
        );
        expect(provenance.rightsNote).toContain("2026-10-19");
        expect(provenance.rightsNote).toContain(
          "трёх задач Pack S, SVG, подсказок и объяснений",
        );
        expect(provenance.rightsNote).toContain(
          "в Olympiad Trainer и его GitHub-репозитории",
        );
        expect(provenance.rightsNote).toContain(
          "публичное указание помощи Codex одобрено",
        );
        expect(provenance.rightsNote).toContain(
          "Владельцу не известно о скопированных",
        );
        expect(provenance.rightsNote).toContain(
          "Независимая проверка оригинальности и открытая лицензия не заявлены",
        );
        expect(provenance.rightsNote).toContain(
          "проверка математики и пригодности для 5 класса остаётся открытой",
        );
        expect(provenance.rightsNote).toContain(
          "не распространяется на 60 задач на основе ВсОШ",
        );
        expect(provenance.rightsNote).not.toContain("публикация не разрешена");
      }
      if (
        problem.provenance.kind === "original" &&
        problem.media!.provenance.kind === "original"
      ) {
        expect(problem.media!.provenance.rightsNote).toBe(
          problem.provenance.rightsNote,
        );
      }
    },
  );

  it("independently enumerates cells/routes and measures the actual reviewed SVG polygon", () => {
    expect(
      execFileSync(
        process.execPath,
        ["docs/02-research/visual-reasoning-v1/verify.mjs"],
        { encoding: "utf8" },
      ),
    ).toContain("PASS:");
  });
});

describe("original provenance validation", () => {
  it.each([
    { kind: "invented" },
    { kind: undefined },
    { authorship: " " },
    { rightsNote: "" },
    { dossierPath: "docs/02-research/missing-dossier.md" },
    { dossierPath: "docs/02-research/../../package.json" },
    { dossierPath: "https://example.com/dossier.md" },
    { dossierPath: "docs/02-research/visual-reasoning-v1.md#approval" },
    { grade: 6 },
    { subject: "physics" },
    ...[
      "olympiad",
      "academicYear",
      "stage",
      "region",
      "sourceArchive",
      "problemNumber",
      "variant",
      "originalSource",
      "officialSolution",
    ].map((key) => ({ [key]: "invented" })),
  ])("rejects invalid/mixed original evidence %j", (changes) => {
    const malformed = {
      ...original,
      provenance: { ...original.provenance, ...changes },
    } as unknown as ProblemDefinition;
    expect(
      validate(malformed).some((error) => error.includes("provenance")),
    ).toBe(true);
  });

  it("requires the correct explanation tag and matching original media authorship/dossier", () => {
    expect(
      validate({
        ...original,
        solution: { ...original.solution, kind: "training-adaptation" },
      }),
    ).toContain(`problem ${original.id}: solution kind`);
    const media = original.media!;
    if (media.provenance.kind !== "original")
      throw new Error("missing original fixture");
    for (const change of [
      { authorship: "Another author" },
      { dossierPath: "docs/02-research/other.md" },
    ]) {
      expect(
        validate({
          ...original,
          media: { ...media, provenance: { ...media.provenance, ...change } },
        }),
      ).toContain(
        `problem ${original.id}: original media provenance correspondence`,
      );
    }
    const sourced = getProblemDefinition("coinciding-seats");
    expect(validate({ ...sourced, media })).toContain(
      `problem ${sourced.id}: original media provenance correspondence`,
    );
    expect(
      validate({
        ...sourced,
        solution: { ...sourced.solution, kind: "original-explanation" },
      }),
    ).toContain(`problem ${sourced.id}: solution kind`);
  });

  it("retains legacy and explicit VSOSh validation, including both positive PDF references", () => {
    const sourced = getProblemDefinition("coinciding-seats");
    if (sourced.provenance.kind === "original")
      throw new Error("missing sourced fixture");
    expect(validate(sourced)).toEqual([]);
    expect(
      validate({
        ...sourced,
        provenance: { ...sourced.provenance, kind: "vsosh" },
      }),
    ).toEqual([]);
    for (const key of ["originalSource", "officialSolution"] as const) {
      for (const changes of [
        { page: 0 },
        { url: "http://vos.olimpiada.ru/source.pdf" },
        { url: "https://example.com/source.pdf" },
        { url: "https://vos.olimpiada.ru/source.txt" },
      ]) {
        expect(
          validate({
            ...sourced,
            provenance: {
              ...sourced.provenance,
              [key]: { ...sourced.provenance[key], ...changes },
            },
          }).some((error) => error.includes("source reference")),
        ).toBe(true);
      }
    }
    expect(
      validate({
        ...sourced,
        provenance: { ...sourced.provenance, problemNumber: 0 },
      }),
    ).toContain(`problem ${sourced.id}: provenance metadata`);
  });
});

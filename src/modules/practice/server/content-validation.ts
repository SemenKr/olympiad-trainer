import type { ProblemDefinition } from "./problem-catalog";
import { existsSync, statSync } from "node:fs";
import { isValidOriginalContentProvenance } from "./original-content-provenance";
import { getLearnerSafeProblemMedia } from "./problem-media";

type Pack = Readonly<{
  id: string;
  name: string;
  problemIds: readonly string[];
}>;
export type ContentIdentities = {
  problems: readonly {
    id: string;
    responseKind: string;
    optionIds: readonly string[];
    hintIds: readonly string[];
    solutionId: string;
    checkpointId: string | null;
    checkpointOptionIds: readonly string[];
  }[];
  packs: readonly { id: string; problemIds: readonly string[] }[];
};

export function contentIdentities(
  problems: readonly ProblemDefinition[],
  packs: readonly Pack[],
): ContentIdentities {
  return {
    problems: problems.map((p) => ({
      id: p.id,
      responseKind: p.assessment.kind,
      optionIds:
        p.assessment.kind === "multiple-choice-set"
          ? p.assessment.options.map((o) => o.id)
          : [],
      hintIds: p.hints.map((h) => h.id),
      solutionId: p.solution.id,
      checkpointId: p.reasoningCheckpoint?.id ?? null,
      checkpointOptionIds:
        p.reasoningCheckpoint?.options.map((o) => o.id) ?? [],
    })),
    packs: packs.map(({ id, problemIds }) => ({ id, problemIds })),
  };
}

// Typed repository authoring is the input boundary; this is not a JSON importer.
export function validatePracticeContent(
  problems: readonly ProblemDefinition[],
  packs: readonly Pack[],
  baseline: ContentIdentities,
): string[] {
  const errors: string[] = [];
  const check = (valid: boolean, message: string) => {
    if (!valid) errors.push(message);
  };
  const nonempty = (value: string) => value.trim().length > 0;
  const unique = (values: readonly string[]) =>
    new Set(values).size === values.length;
  const stableId = (value: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  const globalIds: string[] = [];
  for (const p of problems) {
    const label = `problem ${p.id}`;
    globalIds.push(p.id, ...p.hints.map((h) => h.id), p.solution.id);
    if (p.reasoningCheckpoint) globalIds.push(p.reasoningCheckpoint.id);
    check(
      p.grade === 5 && p.subject === "mathematics",
      `${label}: Grade 5 mathematics required`,
    );
    check(
      [
        p.title,
        p.statement,
        p.solution.text,
        ...p.hints.map((h) => h.text),
      ].every(nonempty),
      `${label}: empty content`,
    );
    check(
      p.hints.length === 3 &&
        p.hints.map((h) => h.level).join() === "focus,strategy,next-step",
      `${label}: hint ordering`,
    );
    check(
      p.solution.kind ===
        (p.provenance.kind === "original"
          ? "original-explanation"
          : "training-adaptation"),
      `${label}: solution kind`,
    );
    const a = p.assessment;
    if (a.kind === "nonnegative-integer") {
      check(
        /^(?:0|[1-9][0-9]*)$/.test(a.expectedAnswer),
        `${label}: numeric answer contract`,
      );
    } else if (a.kind === "multiple-choice-set") {
      const ids = a.options.map((o) => o.id);
      check(
        ids.length >= 2 &&
          unique(ids) &&
          ids.every(stableId) &&
          a.options.every((o) => nonempty(o.label)) &&
          unique(a.options.map((o) => o.label.trim())),
        `${label}: option set`,
      );
      check(
        a.expectedOptionIds.length > 0 &&
          unique(a.expectedOptionIds) &&
          a.expectedOptionIds.every((id) => ids.includes(id)),
        `${label}: expected option references`,
      );
    } else check(false, `${label}: unsupported answer contract`);
    const c = p.reasoningCheckpoint;
    if (c) {
      const ids = c.options.map((o) => o.id);
      check(
        nonempty(c.heading) &&
          nonempty(c.question) &&
          ids.length >= 2 &&
          unique(ids) &&
          c.options.every((o) => nonempty(o.text)) &&
          ids.includes(c.correctOptionId),
        `${label}: checkpoint option references`,
      );
    }
    const v = p.provenance;
    if (v.kind === "original") {
      check(
        isValidOriginalContentProvenance(v) &&
          v.grade === p.grade &&
          v.subject === p.subject &&
          ![
            "olympiad",
            "academicYear",
            "stage",
            "region",
            "sourceArchive",
            "problemNumber",
            "variant",
            "originalSource",
            "officialSolution",
          ].some((key) => key in v),
        `${label}: original provenance metadata`,
      );
      check(
        isValidOriginalContentProvenance(v) &&
          existsSync(v.dossierPath) &&
          statSync(v.dossierPath).isFile(),
        `${label}: original provenance dossier`,
      );
    } else {
      check(
        v.kind === undefined || v.kind === "vsosh",
        `${label}: provenance kind`,
      );
      check(
        v.grade === p.grade &&
          v.subject === p.subject &&
          !["authorship", "rightsNote", "dossierPath"].some(
            (key) => key in v,
          ) &&
          v.olympiad === "Всероссийская олимпиада школьников" &&
          v.region === "Moscow" &&
          v.sourceArchive === "vos.olimpiada.ru" &&
          /^(\d{4})\/\d{2}$/.test(v.academicYear) &&
          ["school", "invitational"].includes(v.stage) &&
          Number.isInteger(v.problemNumber) &&
          v.problemNumber > 0 &&
          (v.variant === undefined ||
            (Number.isInteger(v.variant) && v.variant > 0)),
        `${label}: provenance metadata`,
      );
      for (const [reference, source] of [
        ["I", v.originalSource],
        ["IS", v.officialSolution],
      ] as const) {
        let validUrl = false;
        try {
          const url = new URL(source?.url);
          validUrl =
            url.protocol === "https:" &&
            url.hostname === v.sourceArchive &&
            url.pathname.endsWith(".pdf");
        } catch {
          /* Report malformed URLs together with other issues. */
        }
        check(
          source?.reference === reference &&
            validUrl &&
            Number.isInteger(source.page) &&
            source.page > 0,
          `${label}: ${reference} source reference`,
        );
      }
    }
    if (p.media) {
      try {
        getLearnerSafeProblemMedia(p.media);
      } catch {
        check(false, `${label}: media definition`);
      }
      const mediaProvenance = p.media.provenance;
      if (mediaProvenance.kind === "original") {
        check(
          v.kind === "original" &&
            mediaProvenance.dossierPath === v.dossierPath &&
            mediaProvenance.authorship === v.authorship,
          `${label}: original media provenance correspondence`,
        );
      }
    }
  }
  check(
    globalIds.every(stableId) && unique(globalIds),
    "content IDs must be stable and globally unique",
  );
  check(unique(packs.map((p) => p.id)), "duplicate Pack IDs");
  const problemIds = new Set(problems.map((p) => p.id));
  for (const pack of packs) {
    check(
      stableId(pack.id) && nonempty(pack.name),
      `Pack ${pack.id}: identity/name`,
    );
    check(
      pack.problemIds.length === 3 &&
        unique(pack.problemIds) &&
        pack.problemIds.every((id) => problemIds.has(id)),
      `Pack ${pack.id}: exact three distinct existing problems required`,
    );
  }
  check(
    unique(packs.map((p) => JSON.stringify(p.problemIds))),
    "duplicate Pack tuples",
  );
  const current = contentIdentities(problems, packs);
  for (const category of ["problems", "packs"] as const) {
    for (const prior of baseline[category]) {
      const entry = current[category].find((item) => item.id === prior.id);
      check(
        JSON.stringify(entry) === JSON.stringify(prior),
        `${category} ${prior.id}: existing identity changed or removed`,
      );
    }
  }
  return errors;
}

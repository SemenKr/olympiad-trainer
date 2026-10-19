import "server-only";
import { PRACTICE_PROBLEM_DEFINITIONS } from "./problem-catalog";

// Explicit allowlist: never return a definition or spread its provenance.
export function getPublicProblemSources() {
  return PRACTICE_PROBLEM_DEFINITIONS.map(({ id, title, provenance }) =>
    provenance.kind === "original"
      ? {
          kind: "original" as const,
          problemId: id,
          title,
          authorship: provenance.authorship,
        }
      : {
          kind: "sourced" as const,
          problemId: id,
          title,
          academicYear: provenance.academicYear,
          stage: provenance.stage,
          region: provenance.region,
          problemNumber: provenance.problemNumber,
          ...(provenance.variant === undefined
            ? {}
            : { variant: provenance.variant }),
          originalSource: {
            url: provenance.originalSource.url,
            page: provenance.originalSource.page,
          },
        },
  );
}

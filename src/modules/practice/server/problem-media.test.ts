import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { LearnerSafeProblemMedia } from "../application/problem-media";
import {
  getLearnerSafeProblemMedia,
  type ProblemMediaDefinition,
} from "./problem-media";

const media: LearnerSafeProblemMedia = {
  kind: "diagram",
  src: "/problem-media/test-only/diagram.svg",
  width: 600,
  height: 400,
  title: "Рисунок к условию",
  caption: "Обозначения из условия.",
  alt: "Отрезок с обозначенными концами A и B.",
  enlarge: true,
};
const provenance = {
  sourceUrl: "https://example.com/source",
  rightsNote: "Test-only synthetic fixture; not production content.",
};

describe("authored problem media boundary", () => {
  const original = {
    kind: "original" as const,
    authorship: "Original test fixture",
    rightsNote: "Test only; no publication clearance",
    dossierPath: "docs/02-research/visual-reasoning-v1.md",
  };
  it("supports original statement figures without a fabricated source URL", () => {
    expect(
      getLearnerSafeProblemMedia({ presentation: media, provenance: original }),
    ).toEqual(media);
  });
  it.each([
    { kind: "unknown" },
    { authorship: "" },
    { rightsNote: " " },
    { dossierPath: "../private.md" },
    { sourceUrl: "https://example.com" },
    { page: 1 },
    { crop: "anything" },
  ])("rejects invalid/mixed original media %j", (changes) => {
    expect(() =>
      getLearnerSafeProblemMedia({
        presentation: media,
        provenance: { ...original, ...changes },
      } as unknown as ProblemMediaDefinition),
    ).toThrow();
  });
  it("rejects an original PDF excerpt", () => {
    expect(() =>
      getLearnerSafeProblemMedia({
        presentation: { ...media, kind: "pdf-excerpt" },
        provenance: original,
      }),
    ).toThrow();
  });
  it("projects statement media without provenance or accidental protected content", () => {
    const result = getLearnerSafeProblemMedia({
      presentation: { ...media, solution: "protected" } as typeof media,
      provenance,
    });
    expect(result).toEqual(media);
    expect(JSON.stringify(result)).not.toContain("protected");
    expect(JSON.stringify(result)).not.toContain(provenance.sourceUrl);
  });

  it.each([
    "https://example.com/image.png",
    "//example.com/image.png",
    "/problem-media/../solution.png",
    "/problem-media/%2e%2e/image.png",
    "/problem-media/source.pdf",
    "/api/protected.png",
    "/problem-media/a.svg?answer=3",
  ])("rejects non-static statement media: %s", (src) => {
    expect(() =>
      getLearnerSafeProblemMedia({
        presentation: { ...media, src },
        provenance,
      }),
    ).toThrow();
  });

  it.each([
    { width: 0 },
    { height: -1 },
    { width: 1.5 },
    { alt: " " },
    { caption: "" },
    { title: "" },
  ])("rejects invalid dimensions or missing learner copy: %j", (invalid) => {
    expect(() =>
      getLearnerSafeProblemMedia({
        presentation: { ...media, ...invalid },
        provenance,
      }),
    ).toThrow();
  });

  it("requires page and statement-only crop provenance for a rendered PDF excerpt", () => {
    expect(() =>
      getLearnerSafeProblemMedia({
        presentation: {
          ...media,
          kind: "pdf-excerpt",
          src: "/problem-media/excerpt.webp",
        },
        provenance,
      }),
    ).toThrow();
    expect(
      getLearnerSafeProblemMedia({
        presentation: {
          ...media,
          kind: "pdf-excerpt",
          src: "/problem-media/excerpt.webp",
        },
        provenance: {
          ...provenance,
          page: 2,
          crop: "Statement figure only; no answers.",
        },
      }).kind,
    ).toBe("pdf-excerpt");
  });
});

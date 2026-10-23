import "server-only";
import {
  isValidOriginalContentProvenance,
  type OriginalContentProvenance,
} from "./original-content-provenance";

import {
  validateProblemMedia,
  type LearnerSafeProblemMedia,
} from "../application/problem-media";

type MediaProvenance = Readonly<{
  kind?: "sourced";
  sourceUrl: string;
  rightsNote: string;
  authorship?: never;
  dossierPath?: never;
}>;

export type ProblemMediaDefinition = Readonly<{
  presentation: LearnerSafeProblemMedia;
  provenance:
    | (MediaProvenance &
        (
          | Readonly<{ page: number; crop: string }>
          | Readonly<{ page?: never; crop?: never }>
        ))
    | (OriginalContentProvenance &
        Readonly<{ sourceUrl?: never; page?: never; crop?: never }>);
}>;

export function getLearnerSafeProblemMedia(
  definition: ProblemMediaDefinition,
): LearnerSafeProblemMedia {
  const { presentation: media, provenance } = definition;
  validateProblemMedia(media);
  if (provenance.kind === "original") {
    if (
      !isValidOriginalContentProvenance(provenance) ||
      media.kind === "pdf-excerpt" ||
      ["sourceUrl", "page", "crop"].some((key) => key in provenance)
    ) {
      throw new Error("Invalid original problem media provenance");
    }
  } else {
    if (provenance.kind !== undefined && provenance.kind !== "sourced") {
      throw new Error("Unknown problem media provenance kind");
    }
    const source = new URL(provenance.sourceUrl);
    if (
      source.protocol !== "https:" ||
      ["authorship", "dossierPath"].some((key) => key in provenance) ||
      !provenance.rightsNote.trim() ||
      (media.kind === "pdf-excerpt" &&
        (!Number.isSafeInteger(provenance.page) ||
          !provenance.page ||
          provenance.page < 1 ||
          !provenance.crop?.trim()))
    ) {
      throw new Error("Invalid authored problem media provenance");
    }
  }
  // Explicit projection: no source URL/page/crop or accidental protected fields.
  return {
    kind: media.kind,
    src: media.src,
    width: media.width,
    height: media.height,
    title: media.title,
    caption: media.caption,
    alt: media.alt,
    enlarge: media.enlarge,
  };
}

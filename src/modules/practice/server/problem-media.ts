import "server-only";

import {
  validateProblemMedia,
  type LearnerSafeProblemMedia,
} from "../application/problem-media";

type MediaProvenance = Readonly<{ sourceUrl: string; rightsNote: string }>;

export type ProblemMediaDefinition = Readonly<{
  presentation: LearnerSafeProblemMedia;
  provenance: MediaProvenance &
    (
      | Readonly<{ page: number; crop: string }>
      | Readonly<{ page?: never; crop?: never }>
    );
}>;

export function getLearnerSafeProblemMedia(
  definition: ProblemMediaDefinition,
): LearnerSafeProblemMedia {
  const { presentation: media, provenance } = definition;
  validateProblemMedia(media);
  const source = new URL(provenance.sourceUrl);
  if (
    source.protocol !== "https:" ||
    !provenance.rightsNote.trim() ||
    (media.kind === "pdf-excerpt" &&
      (!Number.isSafeInteger(provenance.page) ||
        !provenance.page ||
        provenance.page < 1 ||
        !provenance.crop?.trim()))
  ) {
    throw new Error("Invalid authored problem media provenance");
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

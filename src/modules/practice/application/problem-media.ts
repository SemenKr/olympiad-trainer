/** Public statement content only. Protected help and source PDFs never belong here. */
export type LearnerSafeProblemMedia = Readonly<{
  kind: "diagram" | "image" | "pdf-excerpt";
  src: string;
  width: number;
  height: number;
  title: string;
  caption: string;
  alt: string;
  enlarge: boolean;
}>;

export function validateProblemMedia(media: LearnerSafeProblemMedia): void {
  if (
    !["diagram", "image", "pdf-excerpt"].includes(media.kind) ||
    !/^\/problem-media\/(?:[a-z0-9_-]+\/)*[a-z0-9_-]+\.(?:png|jpg|jpeg|webp|svg)$/.test(
      media.src,
    ) ||
    !Number.isSafeInteger(media.width) ||
    media.width <= 0 ||
    !Number.isSafeInteger(media.height) ||
    media.height <= 0 ||
    !media.title?.trim() ||
    !media.caption?.trim() ||
    !media.alt?.trim() ||
    typeof media.enlarge !== "boolean"
  ) {
    throw new Error("Invalid authored problem media");
  }
}

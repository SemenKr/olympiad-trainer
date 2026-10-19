export type OriginalContentProvenance = Readonly<{
  kind: "original";
  authorship: string;
  rightsNote: string;
  dossierPath: string;
}>;

/** Repository authoring evidence, not a claim that human release gates passed. */
export function isValidOriginalContentProvenance(
  provenance: OriginalContentProvenance,
): boolean {
  return (
    provenance.kind === "original" &&
    typeof provenance.authorship === "string" &&
    provenance.authorship.trim().length > 0 &&
    typeof provenance.rightsNote === "string" &&
    provenance.rightsNote.trim().length > 0 &&
    /^docs\/02-research\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(
      provenance.dossierPath,
    )
  );
}

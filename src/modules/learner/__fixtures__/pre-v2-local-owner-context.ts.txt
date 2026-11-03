// This context is public metadata. Only the HttpOnly server credential authenticates.
export type LocalLearnerOwner = Readonly<{
  learnerId: string;
  generation: string;
}>;

export function isLocalLearnerOwner(
  value: unknown,
): value is LocalLearnerOwner {
  if (typeof value !== "object" || value === null) return false;
  const owner = value as Record<string, unknown>;
  return (
    typeof owner.learnerId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      owner.learnerId,
    ) &&
    typeof owner.generation === "string" &&
    /^(0|[1-9][0-9]*)$/.test(owner.generation)
  );
}

export function sameLocalLearnerOwner(
  a: LocalLearnerOwner,
  b: LocalLearnerOwner,
) {
  return a.learnerId === b.learnerId && a.generation === b.generation;
}

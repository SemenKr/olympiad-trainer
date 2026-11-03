import "server-only";

// Distribution approval is explicit: original provenance alone is insufficient.
export const BETA_PACKS = {
  "pack-s": [
    "original-two-frames",
    "original-notched-sheet",
    "original-path-via-k",
  ],
  "pack-t": [
    "original-linked-code",
    "original-signal-flags",
    "original-two-color-pairs",
  ],
} as const;
export const BETA_PROBLEM_IDS = Object.values(BETA_PACKS).flat();
export function originalOnlyBeta() {
  return (
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview" ||
    (process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test") ||
    process.env.ORIGINAL_ONLY_BETA === "true"
  );
}
export function problemPermitted(id: unknown) {
  return (
    !originalOnlyBeta() || BETA_PROBLEM_IDS.some((allowed) => allowed === id)
  );
}
export function requireProblemAccess(id: unknown) {
  if (!problemPermitted(id))
    throw new Error(
      "Эта задача недоступна в экспериментальной версии. Сохранённые данные не изменены.",
    );
}
export function requireFullCatalog() {
  if (originalOnlyBeta())
    throw new Error(
      "Этот режим временно недоступен в экспериментальной версии. Сохранённые данные не изменены.",
    );
}
export function requireBetaFinish(
  input: unknown,
  adaptive: unknown,
  episode: unknown,
) {
  if (!originalOnlyBeta()) return;
  const candidate = episode as
    | { mode?: unknown; facts?: { problems?: { problemId?: unknown }[] } }
    | undefined;
  if (
    !Array.isArray(input) ||
    input.length !== 0 ||
    adaptive !== undefined ||
    candidate?.mode !== "pack" ||
    !Array.isArray(candidate.facts?.problems) ||
    candidate.facts.problems.length === 0 ||
    !candidate.facts.problems.every((p) => p && problemPermitted(p.problemId))
  )
    throw new Error(
      "Завершение этой тренировки временно недоступно. Запрос и сохранённая работа должны быть сохранены для совместимой версии.",
    );
}

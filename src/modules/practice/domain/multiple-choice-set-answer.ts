import type { NumericAnswerResult } from "./numeric-answer";

export function normalizeMultipleChoiceSetAnswer(
  input: unknown,
  knownOptionIds: readonly string[],
): string | null {
  if (
    !Array.isArray(input) ||
    input.length === 0 ||
    input.length > knownOptionIds.length ||
    Array.from(input.keys()).some((index) => !Object.hasOwn(input, index)) ||
    input.some(
      (id) => typeof id !== "string" || !knownOptionIds.includes(id),
    ) ||
    new Set(input).size !== input.length
  )
    return null;

  return JSON.stringify(knownOptionIds.filter((id) => input.includes(id)));
}

export function checkMultipleChoiceSetAnswer(
  input: unknown,
  knownOptionIds: readonly string[],
  expectedOptionIds: readonly string[],
): NumericAnswerResult {
  const normalizedAnswer = normalizeMultipleChoiceSetAnswer(
    input,
    knownOptionIds,
  );
  if (normalizedAnswer === null) return { status: "invalid" };
  return {
    status:
      normalizedAnswer ===
      normalizeMultipleChoiceSetAnswer(expectedOptionIds, knownOptionIds)
        ? "correct"
        : "incorrect",
    normalizedAnswer,
  };
}

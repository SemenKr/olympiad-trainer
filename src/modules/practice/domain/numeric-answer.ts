export type NumericAnswerResult =
  | { status: "invalid" }
  | { status: "correct" | "incorrect"; normalizedAnswer: string };

export function checkNonnegativeIntegerAnswer(
  input: string,
  expectedAnswer: string,
): NumericAnswerResult {
  if (!/^(?:0|[1-9][0-9]*)$/.test(expectedAnswer)) {
    throw new Error("Expected answer must be a canonical nonnegative integer");
  }

  const normalizedAnswer = normalizeNonnegativeIntegerAnswer(input);
  if (normalizedAnswer === null) return { status: "invalid" };

  return {
    status: normalizedAnswer === expectedAnswer ? "correct" : "incorrect",
    normalizedAnswer,
  };
}

export function normalizeNonnegativeIntegerAnswer(
  input: string,
): string | null {
  const trimmed = input.trim();
  if (!/^[0-9]+$/.test(trimmed)) return null;
  return trimmed.replace(/^0+(?=[0-9])/, "");
}

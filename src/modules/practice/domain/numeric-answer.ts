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

  const trimmed = input.trim();

  if (!/^[0-9]+$/.test(trimmed)) {
    return { status: "invalid" };
  }

  const normalizedAnswer = trimmed.replace(/^0+(?=[0-9])/, "");

  return {
    status: normalizedAnswer === expectedAnswer ? "correct" : "incorrect",
    normalizedAnswer,
  };
}

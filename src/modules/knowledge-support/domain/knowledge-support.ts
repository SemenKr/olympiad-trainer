export const CARRIER_PROBLEM_ID = "five-piles-stones";
export const TOPIC_ID = "multiplicative-additive-comparisons";
export type OptionId = "A" | "B" | "C" | "D";
export type Outcome = "correct" | "incorrect";
export type SupportObservation = Readonly<{
  diagnosticSelectedOptionId: OptionId;
  diagnosticOutcome: Outcome;
  lessonOpened: boolean;
  microCheckSelectedOptionId: OptionId | null;
  microCheckOutcome: Outcome | null;
}>;

export function canRecommendLesson(observation: SupportObservation): boolean {
  return observation.diagnosticOutcome === "incorrect";
}

export function requireOptionId(value: unknown): OptionId {
  if (value !== "A" && value !== "B" && value !== "C" && value !== "D")
    throw new Error("Invalid support option.");
  return value;
}

export function requireSessionId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    throw new Error("Invalid Practice session ID.");
  return value;
}

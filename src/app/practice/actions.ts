"use server";

import {
  checkNonnegativeIntegerAnswer,
  type NumericAnswerResult,
} from "@/modules/practice/domain/numeric-answer";
import { getPracticeExpectedAnswer } from "@/modules/practice/server/practice-problem";

export async function submitPracticeAnswer(
  input: unknown,
): Promise<NumericAnswerResult> {
  if (typeof input !== "string") {
    return { status: "invalid" };
  }

  return checkNonnegativeIntegerAnswer(input, getPracticeExpectedAnswer());
}

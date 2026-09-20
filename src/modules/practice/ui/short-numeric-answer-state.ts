import {
  recordAnswerResult,
  startPractice,
  type ActivePractice,
} from "../application/practice-state";
import type { NumericAnswerResult } from "../domain/numeric-answer";

export type ShortNumericAnswerStatus =
  "typing" | "loading" | "invalid" | "incorrect" | "correct" | "system";

export type ShortNumericAnswerState = Readonly<{
  rawAnswer: string;
  status: ShortNumericAnswerStatus;
  practice: ActivePractice;
}>;

export type SubmissionGate = { current: boolean };

type SubmitAnswer = (rawAnswer: string) => Promise<NumericAnswerResult>;

type RunSubmissionOptions = Readonly<{
  state: ShortNumericAnswerState;
  gate: SubmissionGate;
  submit: SubmitAnswer;
  onPending: (state: ShortNumericAnswerState) => void;
}>;

export function createShortNumericAnswerState(): ShortNumericAnswerState {
  return {
    rawAnswer: "",
    status: "typing",
    practice: startPractice(),
  };
}

export function editShortNumericAnswer(
  state: ShortNumericAnswerState,
  rawAnswer: string,
): ShortNumericAnswerState {
  return {
    ...state,
    rawAnswer,
    status: "typing",
  };
}

export async function runShortNumericAnswerSubmission({
  state,
  gate,
  submit,
  onPending,
}: RunSubmissionOptions): Promise<ShortNumericAnswerState | null> {
  if (
    gate.current ||
    state.status === "loading" ||
    state.status === "correct"
  ) {
    return null;
  }

  gate.current = true;

  const pendingState: ShortNumericAnswerState = {
    ...state,
    status: "loading",
  };

  onPending(pendingState);

  try {
    const result = await submit(state.rawAnswer);

    return {
      ...pendingState,
      status: result.status,
      practice:
        result.status === "invalid"
          ? state.practice
          : recordAnswerResult(state.practice, result),
    };
  } catch {
    return {
      ...pendingState,
      status: "system",
      practice: state.practice,
    };
  } finally {
    gate.current = false;
  }
}

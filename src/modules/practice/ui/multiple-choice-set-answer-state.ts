import {
  recordAnswerResult,
  startPractice,
  type ActivePractice,
} from "../application/practice-state";
import type { NumericAnswerResult } from "../domain/numeric-answer";
import type {
  ShortNumericAnswerStatus,
  SubmissionGate,
} from "./short-numeric-answer-state";

export type MultipleChoiceSetAnswerState = Readonly<{
  selectedOptionIds: readonly string[];
  status: ShortNumericAnswerStatus;
  practice: ActivePractice;
}>;

export function createMultipleChoiceSetAnswerState(): MultipleChoiceSetAnswerState {
  return { selectedOptionIds: [], status: "typing", practice: startPractice() };
}

export function toggleMultipleChoiceSetOption(
  state: MultipleChoiceSetAnswerState,
  optionId: string,
  knownOptionIds: readonly string[],
): MultipleChoiceSetAnswerState {
  if (!knownOptionIds.includes(optionId) || state.status === "correct")
    return state;
  const selected = new Set(state.selectedOptionIds);
  if (selected.has(optionId)) selected.delete(optionId);
  else selected.add(optionId);
  return {
    ...state,
    selectedOptionIds: knownOptionIds.filter((id) => selected.has(id)),
    status: "typing",
  };
}

export async function runMultipleChoiceSetSubmission({
  state,
  gate,
  submit,
  onPending,
}: Readonly<{
  state: MultipleChoiceSetAnswerState;
  gate: SubmissionGate;
  submit: (
    selectedOptionIds: readonly string[],
  ) => Promise<NumericAnswerResult>;
  onPending: (state: MultipleChoiceSetAnswerState) => void;
}>): Promise<MultipleChoiceSetAnswerState | null> {
  if (gate.current || state.status === "loading" || state.status === "correct")
    return null;
  gate.current = true;
  const pendingState = { ...state, status: "loading" as const };
  onPending(pendingState);
  try {
    const result = await submit(state.selectedOptionIds);
    return {
      ...pendingState,
      status: result.status,
      practice:
        result.status === "invalid"
          ? state.practice
          : recordAnswerResult(state.practice, result),
    };
  } catch {
    return { ...pendingState, status: "system", practice: state.practice };
  } finally {
    gate.current = false;
  }
}

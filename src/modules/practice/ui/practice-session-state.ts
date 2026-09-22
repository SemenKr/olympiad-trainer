import {
  finishPractice,
  getPracticeSummary,
  recordHintExposure,
  type PracticeSummary,
} from "../application/practice-state";
import type {
  LearnerSafeFocusHintDescriptor,
  LearnerSafeHintDescriptor,
  LearnerSafeStrategyHintDescriptor,
  RevealedPracticeHint,
} from "../application/practice-problem-presentation";
import type { ShortNumericAnswerState } from "./short-numeric-answer-state";

type ConfirmDiscard = () => boolean;
type GetAnswerState = () => ShortNumericAnswerState;
type RevealHint = () => Promise<RevealedPracticeHint>;
type HintRevealGate = { current: boolean };

export type SuccessfulHintReveal = Readonly<{
  answerState: ShortNumericAnswerState;
  revealedHint: RevealedPracticeHint;
}>;

type RunHintRevealOptions = Readonly<{
  gate: HintRevealGate;
  hintId: string;
  requestReveal: () => Promise<SuccessfulHintReveal | null>;
  onStart: (hintId: string) => void;
  onSuccess: (result: SuccessfulHintReveal) => void;
  onError: () => void;
  onSettled: () => void;
}>;

function assertMatchingReveal(
  descriptor: LearnerSafeHintDescriptor,
  revealedHint: RevealedPracticeHint,
): void {
  if (
    descriptor.hintId !== revealedHint.hintId ||
    descriptor.level !== revealedHint.level
  ) {
    throw new Error("Revealed hint does not match the requested hint.");
  }
}

export function isFocusHintAvailable(
  answerState: ShortNumericAnswerState,
  hintId: string,
): boolean {
  return (
    answerState.status !== "loading" &&
    !answerState.practice.submissions.some(
      (submission) => submission.outcome === "correct",
    ) &&
    !answerState.practice.hintExposures.some(
      (exposure) => exposure.hintId === hintId,
    )
  );
}

export function openFocusHint(
  answerState: ShortNumericAnswerState,
  hintId: string,
): ShortNumericAnswerState {
  if (!isFocusHintAvailable(answerState, hintId)) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordHintExposure(answerState.practice, {
      hintId,
      level: "focus",
    }),
  };
}

export async function requestFocusHintReveal(
  getAnswerState: GetAnswerState,
  descriptor: LearnerSafeFocusHintDescriptor,
  revealHint: RevealHint,
): Promise<SuccessfulHintReveal | null> {
  if (!isFocusHintAvailable(getAnswerState(), descriptor.hintId)) {
    return null;
  }

  const revealedHint = await revealHint();
  assertMatchingReveal(descriptor, revealedHint);

  const currentState = getAnswerState();
  const answerState = openFocusHint(currentState, descriptor.hintId);

  if (answerState === currentState) {
    return null;
  }

  return { answerState, revealedHint };
}

export function isStrategyHintAvailable(
  answerState: ShortNumericAnswerState,
  focusHintId: string,
  strategyHintId: string,
): boolean {
  const hintExposures = answerState.practice.hintExposures;

  return (
    answerState.status !== "loading" &&
    hintExposures.some((exposure) => exposure.hintId === focusHintId) &&
    !hintExposures.some((exposure) => exposure.hintId === strategyHintId) &&
    !answerState.practice.submissions.some(
      (submission) => submission.outcome === "correct",
    )
  );
}

export function openStrategyHint(
  answerState: ShortNumericAnswerState,
  focusHintId: string,
  strategyHintId: string,
): ShortNumericAnswerState {
  if (!isStrategyHintAvailable(answerState, focusHintId, strategyHintId)) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordHintExposure(answerState.practice, {
      hintId: strategyHintId,
      level: "strategy",
    }),
  };
}

export async function requestStrategyHintReveal(
  getAnswerState: GetAnswerState,
  focusHintId: string,
  descriptor: LearnerSafeStrategyHintDescriptor,
  revealHint: RevealHint,
): Promise<SuccessfulHintReveal | null> {
  if (
    !isStrategyHintAvailable(getAnswerState(), focusHintId, descriptor.hintId)
  ) {
    return null;
  }

  const revealedHint = await revealHint();
  assertMatchingReveal(descriptor, revealedHint);

  const currentState = getAnswerState();
  const answerState = openStrategyHint(
    currentState,
    focusHintId,
    descriptor.hintId,
  );

  if (answerState === currentState) {
    return null;
  }

  return { answerState, revealedHint };
}

export async function runPracticeHintReveal({
  gate,
  hintId,
  requestReveal,
  onStart,
  onSuccess,
  onError,
  onSettled,
}: RunHintRevealOptions): Promise<void> {
  if (gate.current) {
    return;
  }

  gate.current = true;
  onStart(hintId);

  try {
    const result = await requestReveal();

    if (result) {
      onSuccess(result);
    }
  } catch {
    onError();
  } finally {
    gate.current = false;
    onSettled();
  }
}

export function requestPracticeFinish(
  answerState: ShortNumericAnswerState,
  confirmDiscard: ConfirmDiscard,
): PracticeSummary | null {
  if (answerState.status === "loading") {
    return null;
  }

  const hasUnsubmittedAnswer =
    answerState.status === "typing" && answerState.rawAnswer.length > 0;

  if (hasUnsubmittedAnswer && !confirmDiscard()) {
    return null;
  }

  return getPracticeSummary(finishPractice(answerState.practice));
}

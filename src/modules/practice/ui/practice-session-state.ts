import {
  finishPractice,
  getPracticeSummary,
  recordHintExposure,
  recordSolutionExposure,
  type PracticeSummary,
} from "../application/practice-state";
import type {
  LearnerSafeFocusHintDescriptor,
  LearnerSafeHintDescriptor,
  LearnerSafeNextStepHintDescriptor,
  LearnerSafeSolutionDescriptor,
  LearnerSafeStrategyHintDescriptor,
  RevealedPracticeHint,
  RevealedPracticeSolution,
} from "../application/practice-problem-presentation";
import type { ShortNumericAnswerState } from "./short-numeric-answer-state";

type ConfirmDiscard = () => boolean;
type GetAnswerState = () => ShortNumericAnswerState;
type RevealHint = () => Promise<RevealedPracticeHint>;
type RevealSolution = () => Promise<RevealedPracticeSolution>;
type HintRevealGate = { current: boolean };
type SolutionRevealGate = { current: boolean };

export type SuccessfulHintReveal = Readonly<{
  answerState: ShortNumericAnswerState;
  revealedHint: RevealedPracticeHint;
}>;

export type SuccessfulSolutionReveal = Readonly<{
  answerState: ShortNumericAnswerState;
  revealedSolution: RevealedPracticeSolution;
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

type RunSolutionRevealOptions = Readonly<{
  gate: SolutionRevealGate;
  requestReveal: () => Promise<SuccessfulSolutionReveal | null>;
  onStart: () => void;
  onSuccess: (result: SuccessfulSolutionReveal) => void;
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

export function isNextStepHintAvailable(
  answerState: ShortNumericAnswerState,
  strategyHintId: string,
  nextStepHintId: string,
): boolean {
  const hintExposures = answerState.practice.hintExposures;

  return (
    answerState.status !== "loading" &&
    hintExposures.some((exposure) => exposure.hintId === strategyHintId) &&
    !hintExposures.some((exposure) => exposure.hintId === nextStepHintId) &&
    !answerState.practice.submissions.some(
      (submission) => submission.outcome === "correct",
    )
  );
}

export function openNextStepHint(
  answerState: ShortNumericAnswerState,
  strategyHintId: string,
  nextStepHintId: string,
): ShortNumericAnswerState {
  if (!isNextStepHintAvailable(answerState, strategyHintId, nextStepHintId)) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordHintExposure(answerState.practice, {
      hintId: nextStepHintId,
      level: "next-step",
    }),
  };
}

export async function requestNextStepHintReveal(
  getAnswerState: GetAnswerState,
  strategyHintId: string,
  descriptor: LearnerSafeNextStepHintDescriptor,
  revealHint: RevealHint,
): Promise<SuccessfulHintReveal | null> {
  if (
    !isNextStepHintAvailable(
      getAnswerState(),
      strategyHintId,
      descriptor.hintId,
    )
  ) {
    return null;
  }

  const revealedHint = await revealHint();
  assertMatchingReveal(descriptor, revealedHint);

  const currentState = getAnswerState();
  const answerState = openNextStepHint(
    currentState,
    strategyHintId,
    descriptor.hintId,
  );

  if (answerState === currentState) {
    return null;
  }

  return { answerState, revealedHint };
}

export function isSolutionAvailable(
  answerState: ShortNumericAnswerState,
  focusHintId: string,
  strategyHintId: string,
  nextStepHintId: string,
): boolean {
  const practice = answerState.practice;

  return (
    answerState.status !== "loading" &&
    practice.hintExposures.some(
      (exposure) => exposure.hintId === focusHintId,
    ) &&
    practice.hintExposures.some(
      (exposure) => exposure.hintId === strategyHintId,
    ) &&
    practice.hintExposures.some(
      (exposure) => exposure.hintId === nextStepHintId,
    ) &&
    practice.submissions.length > 0 &&
    !practice.submissions.some(
      (submission) => submission.outcome === "correct",
    ) &&
    practice.solutionExposure === null
  );
}

export function openSolution(
  answerState: ShortNumericAnswerState,
  focusHintId: string,
  strategyHintId: string,
  nextStepHintId: string,
  solutionId: string,
): ShortNumericAnswerState {
  if (
    !isSolutionAvailable(
      answerState,
      focusHintId,
      strategyHintId,
      nextStepHintId,
    )
  ) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordSolutionExposure(answerState.practice, { solutionId }),
  };
}

export async function requestSolutionReveal(
  getAnswerState: GetAnswerState,
  focusHintId: string,
  strategyHintId: string,
  nextStepHintId: string,
  descriptor: LearnerSafeSolutionDescriptor,
  revealSolution: RevealSolution,
): Promise<SuccessfulSolutionReveal | null> {
  if (
    !isSolutionAvailable(
      getAnswerState(),
      focusHintId,
      strategyHintId,
      nextStepHintId,
    )
  ) {
    return null;
  }

  const revealedSolution = await revealSolution();

  if (revealedSolution.solutionId !== descriptor.solutionId) {
    throw new Error("Revealed solution does not match the requested solution.");
  }

  const currentState = getAnswerState();
  const answerState = openSolution(
    currentState,
    focusHintId,
    strategyHintId,
    nextStepHintId,
    descriptor.solutionId,
  );

  if (answerState === currentState) {
    return null;
  }

  return { answerState, revealedSolution };
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

export async function runPracticeSolutionReveal({
  gate,
  requestReveal,
  onStart,
  onSuccess,
  onError,
  onSettled,
}: RunSolutionRevealOptions): Promise<void> {
  if (gate.current) {
    return;
  }

  gate.current = true;
  onStart();

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
  supportRevealPending = false,
): PracticeSummary | null {
  if (answerState.status === "loading" || supportRevealPending) {
    return null;
  }

  const hasUnsubmittedAnswer =
    answerState.status === "typing" && answerState.rawAnswer.length > 0;

  if (hasUnsubmittedAnswer && !confirmDiscard()) {
    return null;
  }

  return getPracticeSummary(finishPractice(answerState.practice));
}

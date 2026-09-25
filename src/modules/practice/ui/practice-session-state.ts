import {
  finishPractice,
  getPracticeSummary,
  recordHintExposure,
  recordSolutionExposure,
  type PracticeSummary,
} from "../application/practice-state";
import type {
  LearnerSafePracticeProblem,
  LearnerSafeFocusHintDescriptor,
  LearnerSafeHintDescriptor,
  LearnerSafeNextStepHintDescriptor,
  LearnerSafeSolutionDescriptor,
  LearnerSafeStrategyHintDescriptor,
  RevealedPracticeHint,
  RevealedPracticeSolution,
} from "../application/practice-problem-presentation";
import type { ActivePractice } from "../application/practice-state";
import {
  isMultipleChoiceSetAnswerState,
  type PracticeAnswerState,
} from "./practice-answer-state";

type ConfirmDiscard = () => boolean;
type GetAnswerState<T extends PracticeAnswerState> = () => T;
type RevealHint = () => Promise<RevealedPracticeHint>;
type RevealSolution = () => Promise<RevealedPracticeSolution>;

export function mergeRestoredPracticeHints(
  current: readonly RevealedPracticeHint[],
  restored: readonly RevealedPracticeHint[],
): readonly RevealedPracticeHint[] {
  const ids = new Set(current.map((hint) => hint.hintId));
  return [
    ...current,
    ...restored.filter((hint) => {
      if (ids.has(hint.hintId)) return false;
      ids.add(hint.hintId);
      return true;
    }),
  ];
}

export function keepNewerPracticeSolution(
  current: RevealedPracticeSolution | null,
  restored: RevealedPracticeSolution | null,
): RevealedPracticeSolution | null {
  return current ?? restored;
}

export async function restorePracticePresentation(
  problem: LearnerSafePracticeProblem,
  practice: ActivePractice,
  revealHint: (
    problemId: string,
    hintId: string,
  ) => Promise<RevealedPracticeHint>,
  revealSolution: (
    problemId: string,
    solutionId: string,
  ) => Promise<RevealedPracticeSolution>,
): Promise<
  Readonly<{
    hints: readonly RevealedPracticeHint[];
    solution: RevealedPracticeSolution | null;
  }>
> {
  const [hints, solution] = await Promise.all([
    Promise.all(
      practice.hintExposures.map(async (exposure) => {
        const revealed = await revealHint(problem.problemId, exposure.hintId);
        if (
          revealed.hintId !== exposure.hintId ||
          revealed.level !== exposure.level ||
          typeof revealed.text !== "string"
        ) {
          throw new Error("Restored hint does not match its exposure.");
        }
        return revealed;
      }),
    ),
    practice.solutionExposure
      ? revealSolution(
          problem.problemId,
          practice.solutionExposure.solutionId,
        ).then((revealed) => {
          if (
            revealed.solutionId !== practice.solutionExposure?.solutionId ||
            typeof revealed.text !== "string"
          ) {
            throw new Error("Restored solution does not match its exposure.");
          }
          return revealed;
        })
      : Promise.resolve(null),
  ]);
  return { hints, solution };
}
type HintRevealGate = { current: boolean };
type SolutionRevealGate = { current: boolean };

export type SuccessfulHintReveal<
  T extends PracticeAnswerState = PracticeAnswerState,
> = Readonly<{
  answerState: T;
  revealedHint: RevealedPracticeHint;
}>;

export type SuccessfulSolutionReveal<
  T extends PracticeAnswerState = PracticeAnswerState,
> = Readonly<{
  answerState: T;
  revealedSolution: RevealedPracticeSolution;
}>;

type RunHintRevealOptions<T extends PracticeAnswerState> = Readonly<{
  gate: HintRevealGate;
  hintId: string;
  requestReveal: () => Promise<SuccessfulHintReveal<T> | null>;
  onStart: (hintId: string) => void;
  onSuccess: (result: SuccessfulHintReveal<T>) => void;
  onError: () => void;
  onSettled: () => void;
}>;

type RunSolutionRevealOptions<T extends PracticeAnswerState> = Readonly<{
  gate: SolutionRevealGate;
  requestReveal: () => Promise<SuccessfulSolutionReveal<T> | null>;
  onStart: () => void;
  onSuccess: (result: SuccessfulSolutionReveal<T>) => void;
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
  answerState: PracticeAnswerState,
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

export function openFocusHint<T extends PracticeAnswerState>(
  answerState: T,
  hintId: string,
): T {
  if (!isFocusHintAvailable(answerState, hintId)) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordHintExposure(answerState.practice, {
      hintId,
      level: "focus",
    }),
  } as T;
}

export async function requestFocusHintReveal<T extends PracticeAnswerState>(
  getAnswerState: GetAnswerState<T>,
  descriptor: LearnerSafeFocusHintDescriptor,
  revealHint: RevealHint,
): Promise<SuccessfulHintReveal<T> | null> {
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
  answerState: PracticeAnswerState,
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

export function openStrategyHint<T extends PracticeAnswerState>(
  answerState: T,
  focusHintId: string,
  strategyHintId: string,
): T {
  if (!isStrategyHintAvailable(answerState, focusHintId, strategyHintId)) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordHintExposure(answerState.practice, {
      hintId: strategyHintId,
      level: "strategy",
    }),
  } as T;
}

export async function requestStrategyHintReveal<T extends PracticeAnswerState>(
  getAnswerState: GetAnswerState<T>,
  focusHintId: string,
  descriptor: LearnerSafeStrategyHintDescriptor,
  revealHint: RevealHint,
): Promise<SuccessfulHintReveal<T> | null> {
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
  answerState: PracticeAnswerState,
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

export function openNextStepHint<T extends PracticeAnswerState>(
  answerState: T,
  strategyHintId: string,
  nextStepHintId: string,
): T {
  if (!isNextStepHintAvailable(answerState, strategyHintId, nextStepHintId)) {
    return answerState;
  }

  return {
    ...answerState,
    practice: recordHintExposure(answerState.practice, {
      hintId: nextStepHintId,
      level: "next-step",
    }),
  } as T;
}

export async function requestNextStepHintReveal<T extends PracticeAnswerState>(
  getAnswerState: GetAnswerState<T>,
  strategyHintId: string,
  descriptor: LearnerSafeNextStepHintDescriptor,
  revealHint: RevealHint,
): Promise<SuccessfulHintReveal<T> | null> {
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
  answerState: PracticeAnswerState,
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

export function openSolution<T extends PracticeAnswerState>(
  answerState: T,
  focusHintId: string,
  strategyHintId: string,
  nextStepHintId: string,
  solutionId: string,
): T {
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
  } as T;
}

export async function requestSolutionReveal<T extends PracticeAnswerState>(
  getAnswerState: GetAnswerState<T>,
  focusHintId: string,
  strategyHintId: string,
  nextStepHintId: string,
  descriptor: LearnerSafeSolutionDescriptor,
  revealSolution: RevealSolution,
): Promise<SuccessfulSolutionReveal<T> | null> {
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

export async function runPracticeHintReveal<T extends PracticeAnswerState>({
  gate,
  hintId,
  requestReveal,
  onStart,
  onSuccess,
  onError,
  onSettled,
}: RunHintRevealOptions<T>): Promise<void> {
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

export async function runPracticeSolutionReveal<T extends PracticeAnswerState>({
  gate,
  requestReveal,
  onStart,
  onSuccess,
  onError,
  onSettled,
}: RunSolutionRevealOptions<T>): Promise<void> {
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
  answerState: PracticeAnswerState,
  confirmDiscard: ConfirmDiscard,
  supportRevealPending = false,
): PracticeSummary | null {
  if (answerState.status === "loading" || supportRevealPending) {
    return null;
  }

  const hasUnsubmittedAnswer =
    answerState.status === "typing" &&
    (isMultipleChoiceSetAnswerState(answerState)
      ? answerState.selectedOptionIds.length > 0
      : answerState.rawAnswer.length > 0);

  if (hasUnsubmittedAnswer && !confirmDiscard()) {
    return null;
  }

  return getPracticeSummary(finishPractice(answerState.practice));
}

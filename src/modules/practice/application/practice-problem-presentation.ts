export type PracticeHintLevel = "focus" | "strategy" | "next-step";

export type LearnerSafeFocusHintDescriptor = Readonly<{
  hintId: string;
  level: "focus";
}>;

export type LearnerSafeStrategyHintDescriptor = Readonly<{
  hintId: string;
  level: "strategy";
}>;

export type LearnerSafeNextStepHintDescriptor = Readonly<{
  hintId: string;
  level: "next-step";
}>;

export type LearnerSafeHintDescriptor =
  | LearnerSafeFocusHintDescriptor
  | LearnerSafeStrategyHintDescriptor
  | LearnerSafeNextStepHintDescriptor;

export type LearnerSafeSolutionDescriptor = Readonly<{
  solutionId: string;
}>;

export type LearnerSafePracticeProblem = Readonly<{
  problemId: string;
  title: string;
  statement: string;
  hints: readonly [
    LearnerSafeFocusHintDescriptor,
    LearnerSafeStrategyHintDescriptor,
    LearnerSafeNextStepHintDescriptor,
  ];
  solution: LearnerSafeSolutionDescriptor;
}>;

export type RevealedPracticeHint = Readonly<{
  hintId: string;
  level: PracticeHintLevel;
  text: string;
}>;

export type RevealedPracticeSolution = Readonly<{
  solutionId: string;
  text: string;
}>;

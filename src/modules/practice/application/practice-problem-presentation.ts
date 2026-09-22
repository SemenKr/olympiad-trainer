export type PracticeHintLevel = "focus" | "strategy";

export type LearnerSafeFocusHintDescriptor = Readonly<{
  hintId: string;
  level: "focus";
}>;

export type LearnerSafeStrategyHintDescriptor = Readonly<{
  hintId: string;
  level: "strategy";
}>;

export type LearnerSafeHintDescriptor =
  LearnerSafeFocusHintDescriptor | LearnerSafeStrategyHintDescriptor;

export type LearnerSafePracticeProblem = Readonly<{
  problemId: string;
  title: string;
  statement: string;
  hints: readonly [
    LearnerSafeFocusHintDescriptor,
    LearnerSafeStrategyHintDescriptor,
  ];
}>;

export type RevealedPracticeHint = Readonly<{
  hintId: string;
  level: PracticeHintLevel;
  text: string;
}>;

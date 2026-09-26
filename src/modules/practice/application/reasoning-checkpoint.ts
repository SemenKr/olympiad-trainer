import type { ActivePractice } from "./practice-state";

export const SOCK_REASONING_CHECKPOINT_ID =
  "guaranteed-sock-pair-guarantee-argument" as const;
export const TABLE_REASONING_CHECKPOINT_ID =
  "table-impossible-sums-impossibility-argument" as const;

export type ReasoningCheckpointOptionId = "A" | "B" | "C";

export function isKnownReasoningCheckpointId(
  value: unknown,
): value is ReasoningCheckpointObservation["checkpointId"] {
  return (
    value === SOCK_REASONING_CHECKPOINT_ID ||
    value === TABLE_REASONING_CHECKPOINT_ID
  );
}

export type ReasoningCheckpointObservation = Readonly<{
  checkpointId:
    typeof SOCK_REASONING_CHECKPOINT_ID | typeof TABLE_REASONING_CHECKPOINT_ID;
  selectedOptionId: ReasoningCheckpointOptionId;
  outcome: "correct" | "incorrect";
  validSubmissionCountAtSubmit: number;
}>;

export type ReasoningCheckpointInterpretation = Readonly<{
  capability: string;
  learnerLabel: string;
  progressGroup: "Начинаю разбираться" | null;
  conclusion: string;
}>;

export type LearnerProgressInterpretation = Pick<
  ReasoningCheckpointInterpretation,
  "learnerLabel" | "progressGroup" | "conclusion"
>;

export type ReasoningCheckpointVerification =
  | Readonly<{
      valid: true;
      interpretation: ReasoningCheckpointInterpretation;
    }>
  | Readonly<{ valid: false }>;

export function canAttemptReasoningCheckpoint(
  practice: ActivePractice,
  observation: ReasoningCheckpointObservation | null,
): boolean {
  return (
    observation === null &&
    practice.solutionExposure === null &&
    practice.submissions.some((submission) => submission.outcome === "correct")
  );
}

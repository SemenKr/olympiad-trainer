import {
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  PARROTS_TRANSFER_PROBLEM_ID,
  ENUMERATION_EXPLORATION_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { PracticeSession } from "@/modules/practice/ui/practice-session";

export default async function TransferPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string }>;
}) {
  const requested = (await searchParams).problem;
  const startTransferProblemId =
    requested === PARROTS_TRANSFER_PROBLEM_ID
      ? PARROTS_TRANSFER_PROBLEM_ID
      : requested === ENUMERATION_EXPLORATION_PROBLEM_ID
        ? ENUMERATION_EXPLORATION_PROBLEM_ID
        : ADAPTIVE_TRANSFER_PROBLEM_ID;
  const problems = PRACTICE_SESSION_PROBLEM_IDS.map(
    getLearnerSafePracticeProblem,
  ) as [
    ReturnType<typeof getLearnerSafePracticeProblem>,
    ReturnType<typeof getLearnerSafePracticeProblem>,
    ReturnType<typeof getLearnerSafePracticeProblem>,
  ];
  return (
    <PracticeSession
      problems={problems}
      transferProblem={getLearnerSafePracticeProblem(
        ADAPTIVE_TRANSFER_PROBLEM_ID,
      )}
      parrotsProblem={getLearnerSafePracticeProblem(
        PARROTS_TRANSFER_PROBLEM_ID,
      )}
      pagesProblem={getLearnerSafePracticeProblem(
        ENUMERATION_EXPLORATION_PROBLEM_ID,
      )}
      startTransferProblemId={startTransferProblemId}
      startMode="transfer"
    />
  );
}

import {
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { PracticeSession } from "@/modules/practice/ui/practice-session";

export default function TransferPracticePage() {
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
      startMode="transfer"
    />
  );
}

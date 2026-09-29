import {
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  ENUMERATION_EXPLORATION_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  PACK_A_PROBLEM_IDS,
  PARROTS_TRANSFER_PROBLEM_ID,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { PracticeSession } from "@/modules/practice/ui/practice-session";

export default function PackPracticePage() {
  return (
    <PracticeSession
      problems={
        PRACTICE_SESSION_PROBLEM_IDS.map(getLearnerSafePracticeProblem) as [
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
        ]
      }
      packProblems={
        PACK_A_PROBLEM_IDS.map(getLearnerSafePracticeProblem) as [
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
        ]
      }
      transferProblem={getLearnerSafePracticeProblem(
        ADAPTIVE_TRANSFER_PROBLEM_ID,
      )}
      parrotsProblem={getLearnerSafePracticeProblem(
        PARROTS_TRANSFER_PROBLEM_ID,
      )}
      pagesProblem={getLearnerSafePracticeProblem(
        ENUMERATION_EXPLORATION_PROBLEM_ID,
      )}
      startMode="pack"
    />
  );
}

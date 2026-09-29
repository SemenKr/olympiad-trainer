import {
  getLearnerSafePracticeProblem,
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  PARROTS_TRANSFER_PROBLEM_ID,
  ENUMERATION_EXPLORATION_PROBLEM_ID,
  PRACTICE_SESSION_PROBLEM_IDS,
  PACK_A_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { PracticeSession } from "@/modules/practice/ui/practice-session";

export default function PracticePage() {
  const problems = [
    getLearnerSafePracticeProblem(PRACTICE_SESSION_PROBLEM_IDS[0]),
    getLearnerSafePracticeProblem(PRACTICE_SESSION_PROBLEM_IDS[1]),
    getLearnerSafePracticeProblem(PRACTICE_SESSION_PROBLEM_IDS[2]),
  ] as const;

  return (
    <PracticeSession
      problems={problems}
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
    />
  );
}

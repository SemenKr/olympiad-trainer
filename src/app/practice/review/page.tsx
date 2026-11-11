import {
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  PARROTS_TRANSFER_PROBLEM_ID,
  ENUMERATION_EXPLORATION_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  getLearnerSafePackProblems,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { PracticeSession } from "@/modules/practice/ui/practice-session";

export default function ReviewPracticePage() {
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
      packs={getLearnerSafePackProblems()}
      transferProblem={getLearnerSafePracticeProblem(
        ADAPTIVE_TRANSFER_PROBLEM_ID,
      )}
      parrotsProblem={getLearnerSafePracticeProblem(
        PARROTS_TRANSFER_PROBLEM_ID,
      )}
      pagesProblem={getLearnerSafePracticeProblem(
        ENUMERATION_EXPLORATION_PROBLEM_ID,
      )}
      startMode="review"
    />
  );
}

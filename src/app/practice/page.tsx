import {
  getLearnerSafePracticeProblem,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { PracticeSession } from "@/modules/practice/ui/practice-session";

export default function PracticePage() {
  const problems = [
    getLearnerSafePracticeProblem(PRACTICE_SESSION_PROBLEM_IDS[0]),
    getLearnerSafePracticeProblem(PRACTICE_SESSION_PROBLEM_IDS[1]),
  ] as const;

  return <PracticeSession problems={problems} />;
}

import {
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  ENUMERATION_EXPLORATION_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  PACK_A_PROBLEM_IDS,
  PACK_B_PROBLEM_IDS,
  PACK_C_PROBLEM_IDS,
  PARROTS_TRANSFER_PROBLEM_ID,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { notFound } from "next/navigation";
import { PracticeSession } from "@/modules/practice/ui/practice-session";

export default async function PackPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string | string[] }>;
}) {
  const requested = (await searchParams).pack;
  if (
    requested !== undefined &&
    requested !== "pack-a" &&
    requested !== "pack-b" &&
    requested !== "pack-c"
  )
    notFound();
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
      packBProblems={
        PACK_B_PROBLEM_IDS.map(getLearnerSafePracticeProblem) as [
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
        ]
      }
      packCProblems={
        PACK_C_PROBLEM_IDS.map(getLearnerSafePracticeProblem) as [
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
      startPackId={
        requested === "pack-b"
          ? "pack-b"
          : requested === "pack-c"
            ? "pack-c"
            : "pack-a"
      }
    />
  );
}

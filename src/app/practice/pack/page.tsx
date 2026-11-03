import {
  originalOnlyBeta,
  BETA_PACKS,
} from "../../../modules/practice/server/content-access";
import { BetaPractice, BetaUnavailable } from "../../beta-practice";
import {
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  ENUMERATION_EXPLORATION_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  getLearnerSafePackProblems,
  PARROTS_TRANSFER_PROBLEM_ID,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "@/modules/practice/server/problem-catalog";
import { notFound } from "next/navigation";
import { PracticeSession } from "@/modules/practice/ui/practice-session";
import {
  packById,
  PRACTICE_PACKS,
} from "../../../modules/practice/application/completed-practice-episode";

export default async function PackPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string | string[] }>;
}) {
  const requested = (await searchParams).pack;
  if (originalOnlyBeta()) {
    if (requested === undefined) return <BetaPractice />;
    if (typeof requested !== "string" || !Object.hasOwn(BETA_PACKS, requested))
      return <BetaUnavailable />;
    return <BetaPractice pack={requested as keyof typeof BETA_PACKS} />;
  }
  const pack =
    requested === undefined ? PRACTICE_PACKS[0] : packById(requested);
  if (!pack) notFound();
  return (
    <PracticeSession
      problems={
        PRACTICE_SESSION_PROBLEM_IDS.map(getLearnerSafePracticeProblem) as [
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
          ReturnType<typeof getLearnerSafePracticeProblem>,
        ]
      }
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
      startMode="pack"
      startPackId={pack.id}
    />
  );
}

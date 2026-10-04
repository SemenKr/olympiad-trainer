import "server-only";
import { cookies } from "next/headers";
import {
  LEARNER_COOKIE_NAME,
  resolveLearnerFromCookie,
} from "../../practice/server/learner-identity";
import { SIMULATION_PROBLEM_IDS } from "../domain/simulation";
import { transactSimulation } from "./persistence";

export async function requireSimulationAssistanceAllowed(problemId?: unknown) {
  if (
    problemId !== undefined &&
    !SIMULATION_PROBLEM_IDS.some((id) => id === problemId)
  )
    return;
  // Ordinary first-time Practice remains independent of Simulation persistence.
  if (!(await cookies()).get(LEARNER_COOKIE_NAME)?.value) return;
  const { attempt } = await transactSimulation(
    await resolveLearnerFromCookie(),
    { kind: "read" },
  );
  if (attempt && attempt.finishedAt === null)
    throw new Error("Assistance is unavailable until Simulation Finish.");
}

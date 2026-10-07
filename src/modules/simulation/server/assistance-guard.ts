import "server-only";
import { resolveLearnerFromCookie } from "../../practice/server/learner-identity";
import { SIMULATION_PROBLEM_IDS } from "../domain/simulation";
import { transactSimulation } from "./persistence";

export async function requireSimulationAssistanceAllowed(problemId?: unknown) {
  if (
    problemId !== undefined &&
    !SIMULATION_PROBLEM_IDS.some((id) => id === problemId)
  )
    return;
  const { attempt } = await transactSimulation(
    await resolveLearnerFromCookie(),
    { kind: "read" },
  );
  if (attempt && attempt.finishedAt === null)
    throw new Error("Assistance is unavailable until Simulation Finish.");
}

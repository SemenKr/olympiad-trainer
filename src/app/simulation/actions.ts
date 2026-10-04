"use server";
import { resolveLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import { transactSimulation } from "../../modules/simulation/server/persistence";
import { getSimulationReferences } from "../../modules/simulation/server/content";
import { requireSimulationId } from "../../modules/simulation/domain/simulation";

export async function readSimulation() {
  return transactSimulation(await resolveLearnerFromCookie(), { kind: "read" });
}

export async function startSimulation() {
  return transactSimulation(await resolveLearnerFromCookie(), {
    kind: "start",
  });
}

export async function saveSimulation(
  sessionId: unknown,
  revision: unknown,
  work: unknown,
) {
  return transactSimulation(await resolveLearnerFromCookie(), {
    kind: "save",
    sessionId,
    revision,
    work,
  });
}

export async function finishSimulation(
  sessionId: unknown,
  revision: unknown,
  work: unknown,
  confirmed: unknown,
) {
  return transactSimulation(await resolveLearnerFromCookie(), {
    kind: "finish",
    sessionId,
    revision,
    work,
    confirmed,
  });
}

export async function readSimulationReferences(sessionId: unknown) {
  const id = requireSimulationId(sessionId);
  const { attempt } = await readSimulation();
  if (!attempt || attempt.sessionId !== id || attempt.finishedAt === null)
    throw new Error("Reference solutions are available only after Finish.");
  return getSimulationReferences();
}

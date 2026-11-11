"use server";
import type { LocalLearnerOwner } from "../../modules/learner/local-owner-context";
import { resolveExpectedLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import { transactSimulation } from "../../modules/simulation/server/persistence";
import { getSimulationReferences } from "../../modules/simulation/server/content";
import { requireSimulationId } from "../../modules/simulation/domain/simulation";

export async function readSimulation(expected: LocalLearnerOwner) {
  return transactSimulation(await resolveExpectedLearnerFromCookie(expected), {
    kind: "read",
  });
}

export async function startSimulation(expected: LocalLearnerOwner) {
  return transactSimulation(await resolveExpectedLearnerFromCookie(expected), {
    kind: "start",
  });
}

export async function saveSimulation(
  sessionId: unknown,
  revision: unknown,
  work: unknown,
  expected: LocalLearnerOwner,
) {
  return transactSimulation(await resolveExpectedLearnerFromCookie(expected), {
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
  expected: LocalLearnerOwner,
) {
  return transactSimulation(await resolveExpectedLearnerFromCookie(expected), {
    kind: "finish",
    sessionId,
    revision,
    work,
    confirmed,
  });
}

export async function readSimulationReferences(
  sessionId: unknown,
  expected: LocalLearnerOwner,
) {
  const id = requireSimulationId(sessionId);
  const { attempt } = await readSimulation(expected);
  if (!attempt || attempt.sessionId !== id || attempt.finishedAt === null)
    throw new Error("Reference solutions are available only after Finish.");
  return getSimulationReferences();
}

"use server";

import { requireSimulationAssistanceAllowed } from "../../modules/simulation/server/assistance-guard";

import type { LocalLearnerOwner } from "../../modules/learner/local-owner-context";
import { resolveExpectedLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import {
  requireOptionId,
  requireSessionId,
} from "../../modules/knowledge-support/domain/knowledge-support";
import { requireDiagnosticEligibility } from "../../modules/knowledge-support/server/eligibility";
import {
  persistSupportStep,
  readSupportObservation,
} from "../../modules/knowledge-support/server/persistence";

import {
  MINI_LESSON,
  MICRO_INCORRECT,
} from "../../modules/knowledge-support/server/content";
import { MICRO_CORRECT } from "../../modules/knowledge-support/domain/content";

export async function readKnowledgeSupport(
  sessionId: string,
  expected: LocalLearnerOwner,
) {
  requireSessionId(sessionId);
  const authenticated = await resolveExpectedLearnerFromCookie(expected);
  await requireSimulationAssistanceAllowed();
  return readSupportObservation(authenticated, sessionId);
}

export async function readKnowledgeSupportEligibility(
  context: unknown,
  expected: LocalLearnerOwner,
) {
  await resolveExpectedLearnerFromCookie(expected);
  await requireSimulationAssistanceAllowed();
  return requireDiagnosticEligibility(context);
}

export async function submitKnowledgeDiagnostic(
  sessionId: string,
  selectedOptionId: unknown,
  context: unknown,
  expected: LocalLearnerOwner,
) {
  requireSessionId(sessionId);
  requireOptionId(selectedOptionId);
  const eligible = requireDiagnosticEligibility(context);
  const authenticated = await resolveExpectedLearnerFromCookie(expected);
  await requireSimulationAssistanceAllowed();
  return persistSupportStep(
    authenticated,
    sessionId,
    "diagnostic",
    selectedOptionId,
    eligible,
  );
}

export async function openKnowledgeLesson(
  sessionId: string,
  expected: LocalLearnerOwner,
) {
  requireSessionId(sessionId);
  const authenticated = await resolveExpectedLearnerFromCookie(expected);
  await requireSimulationAssistanceAllowed();
  const observation = await persistSupportStep(
    authenticated,
    sessionId,
    "lesson",
    null,
  );
  return { observation, lesson: MINI_LESSON };
}

export async function submitKnowledgeMicroCheck(
  sessionId: string,
  selectedOptionId: unknown,
  expected: LocalLearnerOwner,
) {
  requireSessionId(sessionId);
  requireOptionId(selectedOptionId);
  const authenticated = await resolveExpectedLearnerFromCookie(expected);
  await requireSimulationAssistanceAllowed();
  const observation = await persistSupportStep(
    authenticated,
    sessionId,
    "micro-check",
    selectedOptionId,
  );
  return {
    observation,
    feedback:
      observation.microCheckOutcome === "correct"
        ? MICRO_CORRECT
        : MICRO_INCORRECT,
  };
}

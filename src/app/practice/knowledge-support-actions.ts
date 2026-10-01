"use server";

import { resolveLearnerFromCookie } from "../../modules/practice/server/learner-identity";
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

export async function readKnowledgeSupport(sessionId: string) {
  requireSessionId(sessionId);
  return readSupportObservation(await resolveLearnerFromCookie(), sessionId);
}

export async function readKnowledgeSupportEligibility(context: unknown) {
  return requireDiagnosticEligibility(context);
}

export async function submitKnowledgeDiagnostic(
  sessionId: string,
  selectedOptionId: unknown,
  context: unknown,
) {
  requireSessionId(sessionId);
  requireOptionId(selectedOptionId);
  const eligible = requireDiagnosticEligibility(context);
  return persistSupportStep(
    await resolveLearnerFromCookie(),
    sessionId,
    "diagnostic",
    selectedOptionId,
    eligible,
  );
}

export async function openKnowledgeLesson(sessionId: string) {
  requireSessionId(sessionId);
  const observation = await persistSupportStep(
    await resolveLearnerFromCookie(),
    sessionId,
    "lesson",
    null,
  );
  return { observation, lesson: MINI_LESSON };
}

export async function submitKnowledgeMicroCheck(
  sessionId: string,
  selectedOptionId: unknown,
) {
  requireSessionId(sessionId);
  requireOptionId(selectedOptionId);
  const observation = await persistSupportStep(
    await resolveLearnerFromCookie(),
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

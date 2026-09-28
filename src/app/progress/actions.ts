"use server";

import type { LearnerProgressInterpretation } from "../../modules/practice/application/reasoning-checkpoint";
import { resolveLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import {
  importLegacyProgress,
  persistFinishContributions,
  readAdaptiveAvailability,
  readLearnerProgress,
  readNextUsefulProblem,
} from "../../modules/practice/server/learner-progress-persistence";

export async function importBrowserProgressEvidence(
  raw: string | null,
): Promise<void> {
  const learnerId = await resolveLearnerFromCookie();
  await importLegacyProgress(learnerId, raw);
}

export async function persistPracticeFinishEvidence(
  sessionId: string,
  contributions: unknown,
  adaptiveFacts?: unknown,
): Promise<void> {
  const learnerId = await resolveLearnerFromCookie();
  if (adaptiveFacts === undefined)
    await persistFinishContributions(learnerId, sessionId, contributions);
  else
    await persistFinishContributions(
      learnerId,
      sessionId,
      contributions,
      adaptiveFacts,
    );
}

export async function readServerNextUsefulProblem() {
  const learnerId = await resolveLearnerFromCookie();
  return readNextUsefulProblem(learnerId);
}

export async function readServerAdaptiveAvailability() {
  const learnerId = await resolveLearnerFromCookie();
  return readAdaptiveAvailability(learnerId);
}

export async function readServerProgress(): Promise<
  readonly [LearnerProgressInterpretation, LearnerProgressInterpretation]
> {
  const learnerId = await resolveLearnerFromCookie();
  return readLearnerProgress(learnerId);
}

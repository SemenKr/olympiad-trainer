"use server";

import type { LearnerProgressInterpretation } from "../../modules/practice/application/reasoning-checkpoint";
import { resolveLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import {
  importLegacyProgress,
  persistFinishContributions,
  readLearnerProgress,
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
): Promise<void> {
  const learnerId = await resolveLearnerFromCookie();
  await persistFinishContributions(learnerId, sessionId, contributions);
}

export async function readServerProgress(): Promise<
  readonly [LearnerProgressInterpretation, LearnerProgressInterpretation]
> {
  const learnerId = await resolveLearnerFromCookie();
  return readLearnerProgress(learnerId);
}

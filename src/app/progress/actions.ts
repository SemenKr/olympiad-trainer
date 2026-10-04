"use server";

import type { LearnerProgressInterpretation } from "../../modules/practice/application/reasoning-checkpoint";
import { resolveLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import {
  importLegacyProgress,
  readReviewAvailability,
  startReview,
  persistFinishContributions,
  readAdaptiveAvailability,
  readLearnerProgress,
  readRecentPracticeEpisodes,
  readNextUsefulProblem,
  readPracticeJourneyFinish,
  readPracticeJourneyTotal,
} from "../../modules/practice/server/learner-progress-persistence";
import type { PracticeJourneyFinish } from "../../modules/practice/application/practice-journey";

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
  episode?: unknown,
): Promise<PracticeJourneyFinish | null> {
  const learnerId = await resolveLearnerFromCookie();
  if (episode !== undefined)
    return persistFinishContributions(
      learnerId,
      sessionId,
      contributions,
      adaptiveFacts,
      episode,
    );
  else if (adaptiveFacts === undefined)
    return persistFinishContributions(learnerId, sessionId, contributions);
  else
    return persistFinishContributions(
      learnerId,
      sessionId,
      contributions,
      adaptiveFacts,
    );
}

export async function readServerPracticeJourney() {
  return readPracticeJourneyTotal(await resolveLearnerFromCookie());
}

export async function readServerPracticeJourneyFinish(sessionId: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  )
    return null;
  return readPracticeJourneyFinish(await resolveLearnerFromCookie(), sessionId);
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
  readonly [
    LearnerProgressInterpretation,
    LearnerProgressInterpretation,
    LearnerProgressInterpretation,
  ]
> {
  const learnerId = await resolveLearnerFromCookie();
  return readLearnerProgress(learnerId);
}

export async function readServerRecentPracticeEpisodes() {
  const learnerId = await resolveLearnerFromCookie();
  return readRecentPracticeEpisodes(learnerId);
}

export async function readServerReviewAvailability() {
  return readReviewAvailability(await resolveLearnerFromCookie());
}

export async function startServerReview() {
  return startReview(await resolveLearnerFromCookie());
}

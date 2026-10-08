"use server";

import type { LearnerProgressInterpretation } from "../../modules/practice/application/reasoning-checkpoint";
import { resolveExpectedLearnerFromCookie } from "../../modules/practice/server/learner-identity";
import type { LocalLearnerOwner } from "../../modules/learner/local-owner-context";
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
  readCompletedPackIds,
} from "../../modules/practice/server/learner-progress-persistence";
import type { PracticeJourneyFinish } from "../../modules/practice/application/practice-journey";

export async function importBrowserProgressEvidence(
  raw: string | null,
  expected: LocalLearnerOwner,
): Promise<void> {
  const learnerId = await resolveExpectedLearnerFromCookie(expected);
  await importLegacyProgress(learnerId, raw);
}

export async function persistPracticeFinishEvidence(
  sessionId: string,
  contributions: unknown,
  adaptiveFacts?: unknown,
  episode?: unknown,
  expected?: LocalLearnerOwner,
): Promise<PracticeJourneyFinish | null> {
  const learnerId = await resolveExpectedLearnerFromCookie(expected!);
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

export async function readServerPracticeJourney(expected: LocalLearnerOwner) {
  return readPracticeJourneyTotal(
    await resolveExpectedLearnerFromCookie(expected),
  );
}

export async function readServerLearningPath(expected: LocalLearnerOwner) {
  return readCompletedPackIds(await resolveExpectedLearnerFromCookie(expected));
}

export async function readServerPracticeJourneyFinish(
  sessionId: string,
  expected: LocalLearnerOwner,
) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  )
    return null;
  return readPracticeJourneyFinish(
    await resolveExpectedLearnerFromCookie(expected),
    sessionId,
  );
}

export async function readServerNextUsefulProblem(expected: LocalLearnerOwner) {
  const learnerId = await resolveExpectedLearnerFromCookie(expected);
  return readNextUsefulProblem(learnerId);
}

export async function readServerAdaptiveAvailability(
  expected: LocalLearnerOwner,
) {
  const learnerId = await resolveExpectedLearnerFromCookie(expected);
  return readAdaptiveAvailability(learnerId);
}

export async function readServerProgress(
  expected: LocalLearnerOwner,
): Promise<
  readonly [
    LearnerProgressInterpretation,
    LearnerProgressInterpretation,
    LearnerProgressInterpretation,
  ]
> {
  const learnerId = await resolveExpectedLearnerFromCookie(expected);
  return readLearnerProgress(learnerId);
}

export async function readServerRecentPracticeEpisodes(
  expected: LocalLearnerOwner,
) {
  const learnerId = await resolveExpectedLearnerFromCookie(expected);
  return readRecentPracticeEpisodes(learnerId);
}

export async function readServerReviewAvailability(
  expected: LocalLearnerOwner,
) {
  return readReviewAvailability(
    await resolveExpectedLearnerFromCookie(expected),
  );
}

export async function startServerReview(expected: LocalLearnerOwner) {
  return startReview(await resolveExpectedLearnerFromCookie(expected));
}

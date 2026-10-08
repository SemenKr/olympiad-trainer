import * as actions from "../../app/progress/actions";
import { requestForLocalOwner as readForCurrentOwner } from "./local-ownership";

// Scope derived responses as well as writes. These are never authentication caches.
export const readServerPracticeJourney = () =>
  readForCurrentOwner(actions.readServerPracticeJourney);
export const readServerLearningPath = () =>
  readForCurrentOwner(actions.readServerLearningPath);
export const readServerNextUsefulProblem = () =>
  readForCurrentOwner(actions.readServerNextUsefulProblem);
export const readServerAdaptiveAvailability = () =>
  readForCurrentOwner(actions.readServerAdaptiveAvailability);
export const readServerProgress = () =>
  readForCurrentOwner(actions.readServerProgress);
export const readServerRecentPracticeEpisodes = () =>
  readForCurrentOwner(actions.readServerRecentPracticeEpisodes);
export const readServerReviewAvailability = () =>
  readForCurrentOwner(actions.readServerReviewAvailability);
export const startServerReview = () =>
  readForCurrentOwner(actions.startServerReview);
export const readServerPracticeJourneyFinish = (sessionId: string) =>
  readForCurrentOwner((owner) =>
    actions.readServerPracticeJourneyFinish(sessionId, owner),
  );
export const persistPracticeFinishEvidence = (
  ...args: Parameters<typeof actions.persistPracticeFinishEvidence>
) => actions.persistPracticeFinishEvidence(...args);

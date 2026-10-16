import type { AdaptiveRecommendationResult } from "./adaptive-recommendation";
import { getLearningPathProjection } from "./learning-path";
import type { PackId } from "./completed-practice-episode";

export function selectNextPracticeWork(
  input: Readonly<{
    hasUnfinished: boolean;
    recommendation: AdaptiveRecommendationResult;
    returning: boolean;
    completedPackIds: readonly PackId[] | null;
  }>,
) {
  if (input.hasUnfinished) return { kind: "resume" } as const;
  if (input.recommendation.status === "recommendation")
    return { kind: "adaptive", recommendation: input.recommendation } as const;
  if (!input.returning) return { kind: "core" } as const;
  if (input.completedPackIds === null) return { kind: "path-error" } as const;
  const path = getLearningPathProjection(input.completedPackIds);
  if (path.nextPackId)
    return { kind: "pack", packId: path.nextPackId } as const;
  return { kind: "choose" } as const;
}

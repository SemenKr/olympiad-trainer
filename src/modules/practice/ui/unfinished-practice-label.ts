import {
  packById,
  packIdFromProblemIds,
} from "../application/completed-practice-episode";
import {
  getStoredProblemTitle,
  type UnfinishedPracticeSessionSnapshot,
} from "./practice-session-storage";

export function getUnfinishedPracticeLabel(
  snapshot: UnfinishedPracticeSessionSnapshot,
): string {
  if (snapshot.mode === "pack") {
    const packId = packIdFromProblemIds(
      "status" in snapshot
        ? snapshot.completedResults.map((result) => result.problemId)
        : snapshot.problemIds,
    );
    if (packId) return `набор «${packById(packId)!.name}»`;
  }
  if ("status" in snapshot) return "тренировка готова к завершению";
  return `«${getStoredProblemTitle(snapshot)}»`;
}

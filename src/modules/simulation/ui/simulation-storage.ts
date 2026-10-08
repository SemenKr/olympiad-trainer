import { captureLearnerStorage } from "../../learner/local-ownership";
import {
  requireSimulationId,
  requireSimulationRevision,
  requireSimulationWork,
  sameSimulationWork,
  type SimulationAttempt,
} from "../domain/simulation";

export const SIMULATION_PENDING_KEY = "olympiad-trainer:simulation-pending-v0";

export function storeSimulationDraft(
  attempt: SimulationAttempt,
  pending: SimulationAttempt | null = null,
  storage: Storage = captureLearnerStorage(),
) {
  storage.setItem(
    SIMULATION_PENDING_KEY,
    JSON.stringify({
      sessionId: attempt.sessionId,
      revision: attempt.revision,
      drafts: attempt.drafts,
      selectedIndex: attempt.selectedIndex,
      pending: pending
        ? {
            revision: pending.revision,
            drafts: pending.drafts,
            selectedIndex: pending.selectedIndex,
          }
        : null,
    }),
  );
}

export function restoreSimulationDraft(
  attempt: SimulationAttempt,
  storage: Storage = captureLearnerStorage(),
): SimulationAttempt {
  const raw = storage.getItem(SIMULATION_PENDING_KEY);
  if (!raw || attempt.finishedAt !== null) return attempt;
  const input: unknown = JSON.parse(raw);
  if (typeof input !== "object" || input === null)
    throw new Error("Invalid local simulation draft.");
  const value = input as Record<string, unknown>;
  const id = requireSimulationId(value.sessionId);
  if (id !== attempt.sessionId) return attempt;
  const revision = requireSimulationRevision(value.revision);
  const work = requireSimulationWork(value);
  if (revision === attempt.revision) return { ...attempt, ...work };
  // The previous save may have committed despite a lost response.
  if (revision === attempt.revision - 1 && sameSimulationWork(work, attempt))
    return attempt;
  if (typeof value.pending === "object" && value.pending !== null) {
    const pending = value.pending as Record<string, unknown>;
    if (
      requireSimulationRevision(pending.revision) === attempt.revision - 1 &&
      sameSimulationWork(requireSimulationWork(pending), attempt)
    )
      return { ...attempt, ...work };
  }
  throw new Error("Local simulation draft conflicts with server state.");
}

export function hasUnsubmittedDrafts(
  attempt: SimulationAttempt,
  storage: Storage = captureLearnerStorage(),
): boolean {
  const raw = storage.getItem(SIMULATION_PENDING_KEY);
  if (!raw) return false;
  try {
    const value = JSON.parse(raw);
    return (
      value.sessionId === attempt.sessionId &&
      !sameSimulationWork(requireSimulationWork(value), attempt)
    );
  } catch {
    return true;
  }
}

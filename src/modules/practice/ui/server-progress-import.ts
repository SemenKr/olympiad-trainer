import { importBrowserProgressEvidence } from "../../../app/progress/actions";

import { PROGRESS_EVIDENCE_STORAGE_KEY } from "./progress-evidence-storage";
import {
  acknowledgeLegacyFinishImportInsideLock,
  recoverLegacyFinishBeforeImportInsideLock,
} from "./practice-session-storage";

const PRACTICE_SESSION_MUTATION_LOCK =
  "olympiad-trainer:practice-session-mutation";

export async function ensureServerProgressImported(storage?: Storage) {
  if (!navigator.locks?.request)
    throw new Error("Practice session lock is unavailable.");
  const store = storage ?? window.localStorage;
  return navigator.locks.request(
    PRACTICE_SESSION_MUTATION_LOCK,
    { mode: "exclusive" },
    async () => {
      const legacyFinish = recoverLegacyFinishBeforeImportInsideLock(store);
      const raw = store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
      await importBrowserProgressEvidence(raw);
      if (store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== raw)
        throw new Error("Local Progress changed during import.");
      if (
        legacyFinish &&
        !acknowledgeLegacyFinishImportInsideLock(store, legacyFinish.pendingRaw)
      )
        throw new Error("Practice Finish recovery changed during import.");
      if (raw !== null) {
        store.removeItem(PROGRESS_EVIDENCE_STORAGE_KEY);
        if (store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== null)
          throw new Error("Local Progress could not be cleared after import.");
      }
      return legacyFinish?.sessionId ?? null;
    },
  );
}

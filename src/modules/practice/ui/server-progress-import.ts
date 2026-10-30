import {
  isCanonicalStorage,
  assertCanonicalStorageCurrent,
  CanonicalPersistenceError,
} from "../../learner/canonical-local-store";
import {
  captureLearnerStorage,
  currentLocalLearnerOwner,
  withLocalIdentityRead,
} from "../../learner/local-ownership";
import { importBrowserProgressEvidence } from "../../../app/progress/actions";

import { PROGRESS_EVIDENCE_STORAGE_KEY } from "./progress-evidence-storage";
import {
  assertNoUnsupportedPracticeStateInsideLock,
  acknowledgeLegacyFinishImportInsideLock,
  recoverLegacyFinishBeforeImportInsideLock,
} from "./practice-session-storage";

const PRACTICE_SESSION_MUTATION_LOCK =
  "olympiad-trainer:practice-session-mutation";

export async function ensureServerProgressImported(storage?: Storage) {
  if (!navigator.locks?.request)
    throw new Error("Practice session lock is unavailable.");
  const store = storage ?? captureLearnerStorage();
  if (isCanonicalStorage(store)) {
    await assertCanonicalStorageCurrent(store);
    if (
      [
        PROGRESS_EVIDENCE_STORAGE_KEY,
        "olympiad-trainer:practice-progress-finish-pending",
      ].some((key) => store.getItem(key) !== null)
    )
      throw new CanonicalPersistenceError("conflict");
    // Empty legacy evidence still requires the existing authenticated baseline
    // acknowledgement. A pending canonical Finish is never consumed here.
    await importBrowserProgressEvidence(null, currentLocalLearnerOwner());
    return null;
  }
  const owner = currentLocalLearnerOwner();
  return withLocalIdentityRead(() =>
    navigator.locks.request(
      PRACTICE_SESSION_MUTATION_LOCK,
      { mode: "exclusive" },
      async () => {
        assertNoUnsupportedPracticeStateInsideLock(store);
        const legacyFinish = recoverLegacyFinishBeforeImportInsideLock(store);
        const raw = store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
        await importBrowserProgressEvidence(raw, owner);
        if (store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== raw)
          throw new Error("Local Progress changed during import.");
        if (
          legacyFinish &&
          !acknowledgeLegacyFinishImportInsideLock(
            store,
            legacyFinish.pendingRaw,
          )
        )
          throw new Error("Practice Finish recovery changed during import.");
        if (raw !== null) {
          store.removeItem(PROGRESS_EVIDENCE_STORAGE_KEY);
          if (store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== null)
            throw new Error(
              "Local Progress could not be cleared after import.",
            );
        }
        return legacyFinish?.sessionId ?? null;
      },
    ),
  );
}

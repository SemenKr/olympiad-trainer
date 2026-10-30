import {
  isCanonicalStorage,
  assertCanonicalStorageCurrent,
  CanonicalPersistenceError,
  CANONICAL_SLOTS,
  canonicalStorageRevision,
  mutateCanonicalStorage,
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
  prepareCanonicalLegacyImportInsideLock,
} from "./practice-session-storage";

const PRACTICE_SESSION_MUTATION_LOCK =
  "olympiad-trainer:practice-session-mutation";

export async function ensureServerProgressImported(storage?: Storage) {
  if (!navigator.locks?.request)
    throw new Error("Practice session lock is unavailable.");
  const store = storage ?? captureLearnerStorage();
  if (isCanonicalStorage(store)) {
    const owner = currentLocalLearnerOwner();
    return withLocalIdentityRead(() =>
      navigator.locks.request(
        PRACTICE_SESSION_MUTATION_LOCK,
        { mode: "exclusive" },
        async () => {
          await assertCanonicalStorageCurrent(store);
          const revision = canonicalStorageRevision(store);
          const before = new Map(
            CANONICAL_SLOTS.map((k) => [k, store.getItem(k)]),
          );
          const planned = new Map(before);
          const draft: Storage = {
            get length() {
              return planned.size;
            },
            key(i) {
              return [...planned.keys()][i] ?? null;
            },
            getItem(k) {
              if (!planned.has(k as (typeof CANONICAL_SLOTS)[number]))
                throw new CanonicalPersistenceError("conflict");
              return planned.get(k as (typeof CANONICAL_SLOTS)[number]) ?? null;
            },
            setItem(k, v) {
              if (!planned.has(k as (typeof CANONICAL_SLOTS)[number]))
                throw new CanonicalPersistenceError("conflict");
              planned.set(k as (typeof CANONICAL_SLOTS)[number], v);
            },
            removeItem(k) {
              if (!planned.has(k as (typeof CANONICAL_SLOTS)[number]))
                throw new CanonicalPersistenceError("conflict");
              planned.set(k as (typeof CANONICAL_SLOTS)[number], null);
            },
            clear() {
              throw new CanonicalPersistenceError("conflict");
            },
          };
          const recoveredSession =
            prepareCanonicalLegacyImportInsideLock(draft);
          const raw = draft.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
          await importBrowserProgressEvidence(raw, owner);
          // Empty baseline imports need no local mutation. Never consume Finish outbox.
          if (
            raw === null &&
            CANONICAL_SLOTS.every((k) => before.get(k) === planned.get(k))
          ) {
            await assertCanonicalStorageCurrent(store);
            return null;
          }
          await mutateCanonicalStorage(
            store,
            (target, record) => {
              if (
                CANONICAL_SLOTS.some((k) => target.getItem(k) !== before.get(k))
              )
                throw new CanonicalPersistenceError("conflict");
              for (const key of CANONICAL_SLOTS) {
                const value =
                  key === PROGRESS_EVIDENCE_STORAGE_KEY &&
                  draft.getItem(
                    "olympiad-trainer:practice-server-finish-request",
                  ) === null
                    ? null
                    : planned.get(key)!;
                if (value === null) target.removeItem(key);
                else target.setItem(key, value);
              }
              if (recoveredSession) {
                record.sessionId = null;
                record.operations[recoveredSession] ??= "legacy-finish";
              }
            },
            revision,
          );
          return recoveredSession;
        },
      ),
    );
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

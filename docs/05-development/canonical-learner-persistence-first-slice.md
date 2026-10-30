# Canonical learner persistence — first integration slice

This is a local A–R prototype from exact `6e7376f073ed5bdef3d6879cf167d3ffb1333b47`, not a release candidate. It does not modify content, SQL, learning facts or server authorization. Do not deploy it or propagate it into M2 as a completed persistence implementation.

## Authority and migration

IndexedDB `olympiad-trainer:learner-canonical-v1` contains one transactional learner binding, all six serialized payloads, their original v2 envelopes, the original binding, migration operation identity, session identity, revision and admission fingerprints/tombstones. The original localStorage slots remain unchanged. No canonical write is mirrored to them.

The learner gate requires explicit confirmation that other old trainer tabs have been saved and closed. This is a handoff precondition, not a technical fence: exact `6e7376f` can still write its old branch. A deployment, storage event, marker or Web Lock cannot upgrade frozen JavaScript. Old tabs must stop being used; reopening a cached old build is unsupported.

Under the existing identity → Practice → Simulation exclusive barrier:

1. Validate the authenticated owner/generation, original binding, absent identity/Start Fresh markers and all six v2 envelopes. Preserve exact strings, including whitespace and null payloads. Unknown envelope versions fail closed.
2. Commit a `prepared` record with an operation UUID and complete source/payload copy. A failed transaction acknowledges nothing.
3. Write/read back the non-secret `canonical-handoff-v1` witness containing that operation UUID.
4. In a second transaction, recheck source bytes and activate the matching prepared record. Acknowledge activation only after transaction completion.

An interrupted prepared record resumes from its recorded source and operation identity; it is never replaced by a newer implicit import. A committed record wins over a retry. Missing IDB with an existing witness is unavailable, even when every legacy envelope remains intact. An unavailable/blocked database, witness failure, unknown schema, changed owner/generation, source divergence or unresolved identity marker blocks activation or mutation. Retain both branches on conflict; this slice has no branch-selection or merge policy.

The witness is not a backup or a client fence. Selectively deleting both canonical records and their witness can destroy the evidence of migration. Complete origin eviction cannot preserve unsent work. No lossless recovery or browser power-loss guarantee is claimed.

## Transaction and editor contract

Normal Practice admission/save/explicit clear retain the existing identity and Practice locks, but use IDB transactions for canonical validation and persistence. Each captured view carries its expected revision. A competing session or stale revision fails without overwriting the winner. Identity-transition absence checks run inside the acquired identity → Practice → Simulation barrier, before markers or acknowledgement. Legacy generation reconciliation also checks IDB inside that barrier before rewriting any source envelope, even without a visible witness. Initial admission and its snapshot commit together. Session UUID admission fingerprints allow identical active-session retry; tombstones reject replay after clear. Fingerprints do not retain another historical answer copy.

Read-only captured Storage views cannot write or fall back to localStorage. Resume reads canonical bytes and retains existing domain/checkpoint verification. Malformed and unsupported snapshots are preserved and blocked. Asynchronous verification rechecks the canonical revision before returning. Strict domain validation remains in Practice; the learner persistence boundary copies opaque payloads without inventing completion/evidence.

All six original legacy envelopes and binding are checked for visible divergence on canonical operations. Detection uses the browser's available localStorage view; it is not synchronous detection of an old tab's unseen write. The IDB authority is never overwritten by that legacy write. Once divergence becomes visible, the new build fails closed and preserves both versions.

## Deliberately unavailable paths

This first slice supports draft admission, saves, Resume and explicit discard. It is not a complete learner release:

- Nonempty legacy Progress and old multi-key `practice-progress-finish-pending` reconciliation markers remain blocked. Their exact bytes stay canonical and unchanged. Nonempty legacy Progress blocks server import and Finish; an old reconciliation marker additionally blocks Resume. These cases require a later explicit legacy recovery/import implementation. A validated legacy immutable server request with its exact unfinished snapshot and unchanged before-values can replay through the canonical Finish path described below.
- Nonempty legacy Progress import is blocked. Empty Progress uses the existing authenticated baseline-import acknowledgement before server reads or Finish.
- Start Fresh, credential generation changes and Recovery confirmation are blocked before their acknowledgement callbacks. Existing server credentials and namespaces are preserved.
- Simulation is not mounted after the learner gate; its local payload remains canonical. Direct captured-adapter writes are rejected.

Future work must implement legacy import/reconciliation and transactional identity/Simulation lifecycles before removing these blocks. No long-running IDB transaction may contain a network await.

## Practice Finish and Summary slice

The next local slice continues from checkpoint `a1f94dc394414764b39ab9121cc2fbb258e98f34`. It supports canonical Practice Finish and Summary without changing the existing authenticated server action, receipts, episode validation, History, SQL or content.

Under the existing identity-read → Practice-exclusive lock order:

1. Require the captured canonical revision and identity lease to remain current. Validate the exact unfinished snapshot, results and episode facts using existing validators. Unknown future state, competing sessions, malformed requests and old reconciliation markers remain blocked.
2. Commit the immutable server request and the matching session binding in one IDB transaction. Retain its exact serialized bytes and all original before-values. Only transaction completion permits transport; an aborted intent sends nothing.
3. Call the existing authenticated server action outside IDB transactions, with the original request version, session ID, contributions and episode/adaptive facts. Its resolved promise acknowledges the authenticated, idempotent server transaction. The existing server validates canonical facts and learner/generation; replay returns its original receipt result.
4. Pin acknowledgement to the exact revision committed with the intent. In one IDB transaction, recheck that revision, identity lease, session ID, exact outbox and before-values; publish completed Summary, clear unfinished state and outbox, and retire the active session binding together. A failed reconciliation leaves the original intent and unfinished snapshot available.

A network error or lost response reports `outcome-unknown`; acknowledged transport with failed browser reconciliation reports `reconciliation-pending`. Neither exposes completed Summary. Refresh restores the unchanged unfinished snapshot; retry resends the original facts. No outbox is consumed by baseline import, no localStorage writer is used, and another session cannot start or save over a pending request. A stale callback cannot clear evidence, even if a different reader refreshed the captured view during transport. Session admission tombstones remain intact after completion.

For an empty legacy Progress payload, the existing authenticated baseline-import action is still acknowledged before Finish. Nonempty legacy Progress and old multi-key reconciliation markers stay blocked as listed above. Recovery confirmation, Start Fresh, generation changes and Simulation remain unavailable.

### Verification commands and evidence

Use Node 24 and repository pnpm 12.5.1. Direct JS entrypoints were executed with Node 24.22.0 and the existing installed dependencies; no dependency installation was needed.

```sh
pnpm typecheck
pnpm lint
pnpm content:check
pnpm test -- src/modules/practice/ui src/app/identity/learner-identity-gate.test.tsx src/modules/learner/local-ownership.test.ts src/modules/learner/ownership-envelope-v2.test.ts src/modules/practice/server/content-validation.test.ts src/modules/practice/server/browser-problem-metadata.test.ts src/modules/practice/server/content-authoring.test.ts
DATABASE_TEST_URL=postgresql://127.0.0.1:55439/ot_idb_finish pnpm test:integration --testTimeout=20000
pnpm build
pnpm test:metadata
```

Only initialize/migrate a newly created disposable PostgreSQL cluster. The longer integration timeout accommodates migration lock-wait tests; the first run also exposed inherited legacy test fixtures missing the explicit canonical-query mock. Those fixtures now isolate that query and do not claim native IDB coverage.

Native adversarial callbacks are simulated; they exercise actual Chrome IndexedDB and Web Locks:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome node scripts/rehearse-canonical-persistence.mjs
```

For real UI → Next server action → disposable PostgreSQL, start the production build against the same disposable database and run:

```sh
DATABASE_URL=postgresql://127.0.0.1:55439/ot_idb_finish pnpm start --hostname 127.0.0.1 --port 3119
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome CANONICAL_TEST_ORIGIN=http://127.0.0.1:3119 DATABASE_TEST_URL=postgresql://127.0.0.1:55439/ot_idb_finish node scripts/rehearse-canonical-finish.mjs
```

The UI rehearsal uses new synthetic browser identities. It verifies normal Finish, DB commit followed by lost response, refresh/exact retry, two conflicting tabs, intent transaction abort, acknowledgement transaction abort and a delayed stale callback. Each successful lifecycle has exactly one durable receipt and episode, matching completed Summary, cleared canonical intent, and unchanged original legacy envelopes. Failure injection occurs only in the disposable browser. Native results/screenshots remain local in the printed temporary evidence directory. The broader native script separately covers pre-transport aborts, competing callback admission, stale revisions/identity leases, frozen legacy writes and migration regressions.

Native Chrome 156.0.8078.48 passed six real UI scenarios and the adversarial rehearsal, including 150 concurrent admission rounds with no double success. Focused regression suite: 34 files/486 tests. Disposable PostgreSQL suite: 13 files/202 tests, zero skips. These counts overlap content checks and must not be added together. Independent Astra implementation review: zero Critical/Major/Minor findings; review evidence distinguishes native simulated callbacks from live server/DB tests.

No Safari/Firefox/mobile/accessibility certification, browser power-loss durability proof, full-origin eviction recovery, pre-IDB writer fencing or full M2 downgrade/upgrade is claimed. This remains a local persistence slice; the existing legacy handoff and blocked lifecycle gates still prevent release readiness.

## Rehearsal and rollback

Use Node 24 and the repository dependencies, with an already installed native Chrome and Playwright. Nothing is downloaded:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome node scripts/rehearse-canonical-persistence.mjs
```

The script archives exact `6e7376f` into a temporary directory and bundles it alongside current source. It serves only localhost synthetic fixtures. The temporary directory contains results and bundles. The default concurrent-start repetition count is 150; `CANONICAL_RACE_ROUNDS` can reduce it during diagnosis. Injected write/transport failures are labeled; they are not live PostgreSQL/server-action tests.

The script covers native races, stale saves, transaction abort, six-slot byte parity, interrupted migration, refresh, missing/blocked/unavailable IDB, foreign owner/generation, frozen legacy divergence, immutable pending Finish replay and fail-closed unsupported transitions. Unit gate tests mock persistence to isolate learner-gate rendering; they do not claim IDB coverage.

Exact `6e7376f` is not a writable rollback target after handoff. It can acknowledge legacy work without consulting canonical IDB. Keep new canonical data intact and use a corrected protocol-aware A–R build for future M2 rollback. Do not reimport, delete canonical data, remove the witness or rewrite legacy envelopes to accommodate an older build. M2 propagation requires an ancestry-preserving merge after complete lifecycle integration and independent review; keep its existing unfinished merge untouched.

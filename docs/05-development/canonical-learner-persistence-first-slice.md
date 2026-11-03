# Canonical learner persistence — local lifecycle integration

This document preserves the A–R prototype history from exact `6e7376f073ed5bdef3d6879cf167d3ffb1333b47` and the completed canonical lifecycle implementation. The current local M2 integration combines exact `79f4b120bc224ee1d829acc715c7257a7bfff31c` with canonical A–R `92552cf0f561e8c86825a0f47fce64b3ebcc0157` on `feature/m2-idb-scalability-acceptance`. It preserves content, SQL, learning facts and server authorization. Local acceptance and independent review do not authorize Production deployment. See the [M2 acceptance record](m2-integration-scalability-acceptance.md) for current evidence and limits.

## Authority and migration

IndexedDB `olympiad-trainer:learner-canonical-v1` schema 2 contains one transactional active control/binding with retained per-learner namespaces, all six serialized payloads, their original v2 envelopes, the original binding, migration operation identity, session identity, revision and admission fingerprints/tombstones. The original localStorage slots remain unchanged. No canonical write is mirrored to them.

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

## Historical first-slice limitations (superseded)

The following list records checkpoint `a1f94dc` before Finish and lifecycle integration. It is historical, not current behavior; [canonical lifecycle completion](#canonical-lifecycle-completion-current-local-implementation) below supersedes these blocks.

That first slice supported draft admission, saves, Resume and explicit discard. It is not a complete learner release:

- Nonempty legacy Progress and old multi-key `practice-progress-finish-pending` reconciliation markers remain blocked. Their exact bytes stay canonical and unchanged. Nonempty legacy Progress blocks server import and Finish; an old reconciliation marker additionally blocks Resume. These cases require a later explicit legacy recovery/import implementation. A validated legacy immutable server request with its exact unfinished snapshot and unchanged before-values can replay through the canonical Finish path described below.
- Nonempty legacy Progress import is blocked. Empty Progress uses the existing authenticated baseline-import acknowledgement before server reads or Finish.
- Start Fresh, credential generation changes and Recovery confirmation are blocked before their acknowledgement callbacks. Existing server credentials and namespaces are preserved.
- Simulation is not mounted after the learner gate; its local payload remains canonical. Direct captured-adapter writes are rejected.

Legacy import/reconciliation and transactional identity/Simulation were remaining obligations at that checkpoint and are implemented in the current lifecycle section. No IDB transaction may contain a network await.

## Historical Practice Finish and Summary checkpoint

The next local slice continues from checkpoint `a1f94dc394414764b39ab9121cc2fbb258e98f34`. It supports canonical Practice Finish and Summary without changing the existing authenticated server action, receipts, episode validation, History, SQL or content.

Under the existing identity-read → Practice-exclusive lock order:

1. Require the captured canonical revision and identity lease to remain current. Validate the exact unfinished snapshot, results and episode facts using existing validators. Unknown future state, competing sessions, malformed requests and old reconciliation markers remain blocked.
2. Commit the immutable server request and the matching session binding in one IDB transaction. Retain its exact serialized bytes and all original before-values. Only transaction completion permits transport; an aborted intent sends nothing.
3. Call the existing authenticated server action outside IDB transactions, with the original request version, session ID, contributions and episode/adaptive facts. Its resolved promise acknowledges the authenticated, idempotent server transaction. The existing server validates canonical facts and learner/generation; replay returns its original receipt result.
4. Pin acknowledgement to the exact revision committed with the intent. In one IDB transaction, recheck that revision, identity lease, session ID, exact outbox and before-values; publish completed Summary, clear unfinished state and outbox, and retire the active session binding together. A failed reconciliation leaves the original intent and unfinished snapshot available.

A network error or lost response reports `outcome-unknown`; acknowledged transport with failed browser reconciliation reports `reconciliation-pending`. Neither exposes completed Summary. Refresh restores the unchanged unfinished snapshot; retry resends the original facts. No outbox is consumed by baseline import, no localStorage writer is used, and another session cannot start or save over a pending request. A stale callback cannot clear evidence, even if a different reader refreshed the captured view during transport. Session admission tombstones remain intact after completion.

For an empty legacy Progress payload, the existing authenticated baseline-import action is still acknowledged before Finish. Nonempty legacy Progress and old multi-key reconciliation markers stay blocked as listed above. Recovery confirmation, Start Fresh, generation changes and Simulation were still unavailable at that Finish checkpoint; the current lifecycle integration below removes those gates.

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

No Safari/Firefox/mobile/accessibility certification, browser power-loss durability proof, full-origin eviction recovery, pre-IDB writer fencing or full M2 downgrade/upgrade is claimed. Those results described the earlier local Finish checkpoint. The current lifecycle integration removes the lifecycle gates, but independent review and separately authorized M2/Production propagation remain required.

## Rehearsal and rollback

Use Node 24 and the repository dependencies, with an already installed native Chrome and Playwright. Nothing is downloaded:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome node scripts/rehearse-canonical-persistence.mjs
```

The script archives exact `6e7376f` into a temporary directory and bundles it alongside current source. It serves only localhost synthetic fixtures. The temporary directory contains results and bundles. The default concurrent-start repetition count is 150; `CANONICAL_RACE_ROUNDS` can reduce it during diagnosis. Injected write/transport failures are labeled; they are not live PostgreSQL/server-action tests.

The script covers native races, stale saves, transaction abort, six-slot byte parity, interrupted migration, refresh, missing/blocked/unavailable IDB, foreign owner/generation, frozen legacy divergence and immutable pending Finish replay. The additional lifecycle script replaces historical transition-block assertions with authenticated activation and retained-namespace cases. Unit gate tests mock persistence to isolate learner-gate rendering; they do not claim IDB coverage.

Exact `6e7376f` is not a writable rollback target after handoff. It can acknowledge legacy work without consulting canonical IDB. Keep new canonical data intact and use a corrected protocol-aware A–R build for future M2 rollback. Do not reimport, delete canonical data, remove the witness or rewrite legacy envelopes to accommodate an older build. M2 propagation requires an ancestry-preserving merge after complete lifecycle integration and independent review; keep its existing unfinished merge untouched.

## Canonical lifecycle completion (current local implementation)

This section supersedes the earlier deliberately unavailable paths. The implementation is now included in the authorized local M2 integration; its acceptance record and independent review remain separate from Production deployment approval. D1–D5, server authentication/credential protocols, SQL, content and learning facts are unchanged.

The same database name now opens at IndexedDB schema **2**. Its transactional binding contains the active owner, a monotonically changing activation lease, retained learner namespaces, and a pending identity transition when applicable. Each namespace preserves its six payloads, Practice session admission fingerprints/tombstones and revision. A schema-1 first-slice client receives `VersionError` after upgrade. Pre-IDB frozen JavaScript remains unsupported and can still write its legacy branch; the explicit close-old-tabs handoff remains necessary.

The original binding and six original envelopes remain immutable provenance. They continue to refer to the original learner/generation, independently of the current authenticated owner. Generation rotation never rewrites those localStorage bytes. Divergence checks always compare the original owner's physical source keys; a new identity never selects or imports another legacy branch.

Recovery and Start Fresh hold identity → Practice → Simulation barriers. A short transaction durably records kind, operation UUID, source, optional target, phase and expected revision before the existing authenticated callback runs. No network operation runs inside IDB. Activation checks the matching intent and authenticated target, retains the source namespace, and changes the activation lease. Same-learner rotation preserves exact payload bytes; another learner receives its previously retained namespace, or six null payloads. A returned authenticated context never merges source work into a new learner. Captured stale views and callbacks cannot mutate a later activation, including a return to the same learner.

An interrupted Recovery remains blocked while authentication still identifies the source or an unrelated target. An authenticated read of its exact target resumes activation. Explicit Start Fresh may supersede an unresolved Recovery; its durable intent retains the previous Recovery intent until acknowledgement. Missing/invalid authentication still requires explicit confirmation before another creation attempt. A valid authenticated profile is preserved. Lost cookie delivery can leave an inaccessible empty server row, as already allowed by Identity Start Fresh v1; the browser stores no replayable bearer secret.

Canonical baseline import validates supported legacy Finish markers against a private in-memory copy. Before/partial/after combinations are accepted only by the existing strict domain validators and exact before/after comparisons. The existing authenticated baseline action runs before one revision-pinned IDB commit publishes the recovered Summary, retires the legacy session and clears its marker/evidence. A failed action, stale revision or failed acknowledgement commit preserves the original canonical six-slot state for retry. Malformed/unknown markers remain blocked. Immutable server Finish requests are retained byte-for-byte: legacy partial local publication is normalized to the exact request's before-values, and the existing authenticated idempotent Finish retry settles the request. Baseline import never consumes that outbox. No source localStorage envelope is rewritten.

Simulation is mounted after canonical owner preparation. Draft edits serialize short canonical transactions; synchronization waits for their completion before calling the existing server action. The local pending copy survives an unknown server outcome, and existing server-revision/work comparison reconciles reloads. A released editor's epoch fences delayed callbacks. If typing or navigation changes during an acknowledgement commit, synchronization repeatedly merges and persists the latest accepted work with the acknowledged server revision, rechecking ownership after each await; it never publishes an earlier captured draft. Completed UI and saved acknowledgement follow the local transaction, and clearing the Simulation slot is transactional. Its server timing, scoring, assistance constraints and separation from Practice Progress/XP are unchanged.

### Additional local verification

`rehearse-canonical-lifecycle.mjs` uses native Chrome IDB/Web Locks and explicitly synthetic authenticated callbacks. It covers retained namespaces, same-owner generation bytes, durable transition intent, stale leases, unknown Recovery/Start Fresh outcomes, pre-ack transaction abort, queued Simulation drafts, strict legacy multi-key before/partial/after markers, lost baseline response, acknowledgement abort, malformed marker preservation, and schema-1 upgrade/downgrade fencing. It serves UTF-8 bundles; it does not claim live server correctness.

`rehearse-canonical-lifecycle-ui.mjs` uses actual browser requests, existing Next actions/routes and a disposable PostgreSQL database. Recovery requires a real development build (`next dev --webpack`), `http://localhost`, and the existing `RECOVERY_LOCAL_TEST_NETWORK_ADDRESS` seam with synthetic random Recovery secrets. A production bundle correctly inlines production ingress restrictions and cannot stand in for that local Recovery fixture. No production security check is relaxed. Independent rapid Recovery cases explicitly expire only their synthetic learner's confirmation rate bucket between cases; application rate limits remain enabled. The script records mobile screenshots and synthetic identity results locally, never recovery codes. Production build/metadata verification runs separately in normal production mode.

All browser scripts require explicit loopback app/database URLs and existing Chrome/Playwright paths. Use the same Node 24 commands above, plus:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome node scripts/rehearse-canonical-lifecycle.mjs
CANONICAL_TEST_ORIGIN=http://localhost:3121 DATABASE_TEST_URL=postgresql://127.0.0.1:55441/ot_idb_lifecycle PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome node scripts/rehearse-canonical-lifecycle-ui.mjs
```

The original complete-origin eviction, power-loss, Safari/Firefox and frozen-client limitations still apply. M2 needs an ancestry-preserving, separately authorized propagation after the full independent review. A corrected protocol-aware build is the rollback path; never delete the canonical database/witness or rewrite original envelopes to accommodate older clients. Production release/hosting/credentials remain separate human gates.

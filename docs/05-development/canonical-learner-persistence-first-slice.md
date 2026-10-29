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

- Practice Finish and pending Finish replay are blocked before transport. Exact pending request and reconciliation bytes remain canonical and unchanged; no successful acknowledgement, Summary or evidence is invented.
- Nonempty legacy Progress import is blocked. Empty import state is a no-op, allowing existing server reads without a browser import.
- Start Fresh, credential generation changes and Recovery confirmation are blocked before their acknowledgement callbacks. Existing server credentials and namespaces are preserved.
- Simulation is not mounted after the learner gate; its local payload remains canonical. Direct captured-adapter writes are rejected.

Future work must implement durable Finish intent → existing authenticated/idempotent server action → matching transactional reconciliation, and transactional identity/Simulation lifecycles, before removing these blocks. No long-running IDB transaction may contain a network await.

## Rehearsal and rollback

Use Node 24 and the repository dependencies, with an already installed native Chrome and Playwright. Nothing is downloaded:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome node scripts/rehearse-canonical-persistence.mjs
```

The script archives exact `6e7376f` into a temporary directory and bundles it alongside current source. It serves only localhost synthetic fixtures. The temporary directory contains results and bundles. The default concurrent-start repetition count is 150; `CANONICAL_RACE_ROUNDS` can reduce it during diagnosis. Injected write/transport failures are labeled; they are not live PostgreSQL/server-action tests.

The script covers native races, stale saves, transaction abort, six-slot byte parity, interrupted migration, refresh, missing/blocked/unavailable IDB, foreign owner/generation, frozen legacy divergence, preserved pending Finish and fail-closed unsupported transitions. Unit gate tests mock persistence to isolate learner-gate rendering; they do not claim IDB coverage.

Exact `6e7376f` is not a writable rollback target after handoff. It can acknowledge legacy work without consulting canonical IDB. Keep new canonical data intact and use a corrected protocol-aware A–R build for future M2 rollback. Do not reimport, delete canonical data, remove the witness or rewrite legacy envelopes to accommodate an older build. M2 propagation requires an ancestry-preserving merge after complete lifecycle integration and independent review; keep its existing unfinished merge untouched.

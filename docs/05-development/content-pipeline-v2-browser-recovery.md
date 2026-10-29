# Content Pipeline v2 — browser recovery compatibility

The browser Practice reader first applies the unchanged strict validator for registered Packs A–S. A separate structural check recognizes a plausible Pack tuple absent from this build without interpreting its answers, evidence or correctness. It checks the current snapshot shape, stable distinct IDs, result order, exposure and submission structure, and known-problem fields where possible. Malformed or contradictory known data remains on the strict path. A future Pack snapshot is never rendered, submitted, converted into progress, or treated as completed.

Under the existing learner ownership lease and Practice Web Lock, the reader checks the unfinished snapshot, latest Summary, and pending Finish envelopes before recovery or legacy import can write. Unsupported state raises a distinct error; repeated reads, refresh, new-session creation, saves, clear, Finish acknowledgement and import leave the original bytes intact. Practice and Home explain that a newer compatible version is needed to continue. After that version returns, it can read the preserved bytes normally. This M1 reader slice did not change the inner browser storage formats; Ownership Envelope v2 below changes only their outer ownership wrapper.

This guard recognizes future Packs using the present browser schema. It cannot certify future content, a later incompatible storage schema, or an ambiguous early Summary containing only existing problem IDs. The existing server reader slice handles future durable Pack records separately. Migration `0023_pack_id_format.sql` permits bounded future Pack IDs in Finish receipts after `0022`; it does not make an older writer accept a future Pack or prove rollback safety. A future Pack still needs reviewed content, migration release ordering and release-specific rollback verification. This work does not establish Production rollback readiness.

## Ownership Envelope v2: stale-tab fence

The adopted follow-up protocol retains all six physical learner keys and uses
`{version:2, owner, payload:string|null}`. A string is the exact original serialized
payload, including whitespace. Null is a permanent empty slot. Logical removal
writes and reads back a null envelope; it never removes the physical key. Logical
Storage enumeration excludes null payloads. Mathematical evidence, request IDs,
Finish payloads and receipt hashing are unchanged.

Before first activation, promotion acquires the existing identity → Practice →
Simulation exclusive locks with `ifAvailable`. It preflights every owned slot,
accepts v1 string envelopes only for migration, converts them and creates missing
null slots with readback confirmation. Existing v2 bytes are not rewritten by
promotion. Interrupted promotion leaves no usable lease and resumes on retry.
Unknown versions, malformed envelopes, wrong owners/generations, failed writes
and unavailable locks fail closed. A fully promoted same-owner reconciliation
can retain its existing lease without trying to steal a live editor lock.

Generation transitions preserve the v2 protocol, null slots and exact payloads;
interrupted transitions retain the durable identity marker until authenticated
reconciliation succeeds. Start Fresh keeps source namespaces isolated. Existing
legacy originals remain quarantined after binding and are never imported again.
No server credentials or new authority are derived from browser data.

Exact main `5463382b42cef06f3f2e94bcd5af84ca72d3deac` and M1
`2ccc420c4b529a5bd5dc223052e1daa26300f6e7` share ownership blob
`601670dafeaff6fb4fed6861d46173b41df6e1d6`. Their captured adapters validate the
existing envelope before reads, writes and removals. They reject v2 even if an
old tab retains its prior binding lease. All six permanent envelopes are required:
a physically absent slot would allow an old writer to create v1 state. The
frozen test fixtures preserve these exact guards, not a reimplementation.

### Verification commands

Use Node 24 and pnpm 12.5.1:

```sh
pnpm exec vitest run src/modules/learner src/app/identity src/app/restore src/modules/practice/ui src/modules/simulation/ui
pnpm content:check
pnpm typecheck
pnpm lint
pnpm format:check
PLAYWRIGHT_MODULE=/absolute/path/to/installed/playwright CHROME_EXECUTABLE=/absolute/path/to/chrome node scripts/rehearse-ownership-envelope-v2.mjs
```

The browser script requires the exact main, M1, M2 and protocol-aware A–R fallback
(`6e7376f073ed5bdef3d6879cf167d3ffb1333b47`) Git objects (including M2
`15daf851dafab6ffba8ecef93e607598b8d01ffc`) locally. It archives source into a
temporary directory, applies only the current ownership file to the disposable
M2 archive, bundles actual storage/application modules and opens fresh Chrome
contexts on loopback. It installs/downloads nothing and uses no learner data or
database. Results and bundles remain in the printed temporary evidence directory.
Server acknowledgements are simulated: this is native Chrome/localStorage/Web
Locks evidence, not a real mixed-deployment Next server-action or database test.
The full Next UI, physical device/accessibility and Production bindings require
separate release verification.

### Release and rollback contract

1. Review and release the A–R envelope-v2 follow-up from exact M1; no Pack S or SQL
   change belongs in it. PR #107 remains the original M1 slice.
2. Propagate the same implementation to M2 and rerun its A–S, SQL and receipt
   regression matrix. Establish the reviewed envelope-v2 A–R build as fallback
   before exposing S. Preserve M2 migration order 0022 → 0023.
3. Roll back only to that protocol-aware fallback. It preserves unsupported S
   state without rendering/submitting S; returning to compatible M2 resumes it.
   Exact main/M1 cannot use promoted state. Never downconvert envelopes, delete
   null slots, reverse SQL or delete receipts to accommodate those builds.

A new deployment cannot replace JavaScript in an already-open tab. After complete
promotion, the audited old code cannot replace/delete the six protected slots.
Manual stale-tab retirement is not the deletion safeguard, but a live tab holding
a lock may need to close before promotion can proceed. Never steal or bypass the
lock. Already submitted valid A–R server requests may commit; preserve unacknowledged
requests and retain strict server ownership, canonical validation and idempotency.

This cannot undo pre-promotion deletion, browser eviction/user clearing, arbitrary
raw same-origin storage writes, or an already committed server operation. Old
builds retain their generic error UI. Future incompatible inner schemas and early
Summary ambiguity remain subject to M1's limitations above. This protocol is not
Production approval: existing binding/recovery, rights, first-run Pack S eligibility,
real browser/accessibility and release-owner gates remain open.

### Open M2 integration concurrency gate

The native integration rehearsal reproduced an inherited same-owner fresh-session
race: two tabs can both report a successful start with different session IDs.
The integrated build showed 4 occurrences in 40 probe rounds; exact original M2
`15daf851` also reproduced it (1 in 200). These probes establish the failure,
not its frequency or whether the merge changes that frequency. A passing single
rehearsal and zero observed failures in a fallback probe do not prove concurrency
safety. Existing Web Locks alone are insufficient evidence of that guarantee.

The ownership merge preserves the reviewed protocol and content, but full
concurrency acceptance and release remain blocked. A separately scoped fix with
an adversarial regression and independent review is required before clearing
this gate. Do not weaken the rehearsal assertion, infer that future-state
preservation tests resolve this race, or treat this local integration as
Production approval.

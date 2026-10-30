# M2 integration and scalability acceptance

Local author validation, 2026-10-30. Independent QA/review and owner Git/release decisions remain separate. The working merge combines M2 `79f4b120bc224ee1d829acc715c7257a7bfff31c` and canonical A–R `92552cf0f561e8c86825a0f47fce64b3ebcc0157`. No commit, production deployment, remote publication or production database operation is part of this evidence.

## Preserved contracts

The learner catalog remains 63 problems and 19 ordered A–S Packs. Pack S modules, SVGs, rights/provenance and original-content release caveats are unchanged. Content Pipeline v2, independent append-only identities, generated browser allowlist, strict registered server writer, D1–D5, learning facts, SQL migrations and first-run eligibility remain unchanged. Only acceptance harnesses and documentary reconciliation were authored after the conflict-free merge.

The canonical schema-2 lifecycle retains original six-slot migration provenance, transactional admission/Finish, immutable outbox retry, revision/activation fencing, per-owner retained namespaces, Recovery, Start Fresh, strict legacy reconciliation and Simulation. See the [lifecycle contract](canonical-learner-persistence-first-slice.md) and [current rollback boundary](content-pipeline-v2-browser-recovery.md#canonical-m2-integration-supersedes-envelope-only-authority). This supersedes the historical envelope-only concurrency gate; it does not imply release approval.

## Reproducible local harnesses

Use the repository's installed Node 24 dependencies. Nothing is installed or downloaded by these harnesses. Set `PLAYWRIGHT_MODULE` and `CHROME_EXECUTABLE` to existing installations. `DATABASE_TEST_URL` must identify a migrated, disposable loopback PostgreSQL database. Never point these commands at retained learner data.

```sh
node scripts/rehearse-content-scale.mjs
CANONICAL_SCALE=1 node scripts/rehearse-canonical-lifecycle.mjs
node scripts/rehearse-canonical-persistence.mjs
FUTURE_SOURCE_ROOT=/path/to/disposable/66 node scripts/rehearse-canonical-version-matrix.mjs
node scripts/rehearse-persistence-scale.mjs
CANONICAL_TEST_ORIGIN=http://localhost:3127 node scripts/rehearse-pack-catalog-ui.mjs
CATALOG_PACKS=t CANONICAL_TEST_ORIGIN=http://localhost:3128 node scripts/rehearse-pack-catalog-ui.mjs
SCALE_FIXTURE_ROOT=/path/to/disposable/fixtures SCALE_COUNTS=63,1000 node scripts/rehearse-catalog-performance.mjs
```

The content harness copies source into a newly allocated temporary directory, runs the ordinary draft scaffold for the first Pack T task, completes three original synthetic arithmetic modules, registers them and their ordered tuple, independently appends identity expectations and generates metadata. It never edits this repository's catalog or inventory tests. Larger fixtures append disjoint triples; counts mean total problems, including unassigned remainder problems. They are disposable test content without publication authorization. There are no SQL, persistence or Practice implementation changes to add a Pack. The fixture's strict unknown-Pack server probe advances from T to U only in the disposable test copy.

The independent baseline file SHA-256 is `fdb8b4a1484293867cb241a3a4475655519a8f7043a09c297805962df3ba2f90`. All five fixtures preserve the same serialized original 63 definitions hash, `68584b950f2dd17b659183d13e31bf31499abde55d69caafc7e457a5d92111e0`, and exact original 19 identity tuples. Negative fixtures reject duplicate identities, missing references and reordered existing tuples. Metadata excludes private teaching/provenance/assessment sentinels. Existing exact-key-set and generated freshness tests remain in the default/content suite.

## Content scale observations

Node 24.22.0, local macOS arm64. Five warmups and 30 measured repetitions per operation; sorted nearest-rank p95. GC was unavailable, so heap deltas in raw results are observations rather than retained-memory estimates. Concurrent builds/browser runs introduce contention; these are bounded local observations, not production budgets. Synthetic statements are shorter than real olympiad statements.

| Total problems / Packs | Metadata bytes / gzip | All-Pack safe JSON bytes / gzip | Full appended guard validation median / p95 ms | All-Pack projection median ms |
| ---------------------- | --------------------- | ------------------------------- | ---------------------------------------------- | ----------------------------- |
| 63 / 19                | 22,289 / 4,300        | 59,549 / 13,036                 | 0.251 / 0.694                                  | 0.112                         |
| 66 / 20                | 23,066 / 4,417        | 60,672 / 13,190                 | 0.784 / 0.952                                  | 0.111                         |
| 100 / 31               | 32,357 / 5,263        | 73,720 / 14,234                 | 1.607 / 1.968                                  | 0.124                         |
| 500 / 164              | 144,523 / 14,335      | 234,424 / 25,413                | 13.827 / 62.423                                | 0.655                         |
| 1,000 / 331            | 285,273 / 25,419      | 437,031 / 37,793                | 33.228 / 45.132                                | 1.337                         |

Actual `getProblemDefinition`, `packById`, ordered-prefix resolution, validation against both original and appended guards, metadata rendering and `getLearnerSafePackProblems` run in the fixture; raw results retain every operation's median/p95/max. One thousand last-Pack prefix resolutions grow from median 0.858 ms at 19 Packs to 13.389 ms at 331 Packs. The complete catalog is still projected and serialized into selected-Pack pages; no lazy-loading redesign was made.

All five source fixtures built with normal Next type checking. The initial 63/66 attempt exposed missing copied `db/` files and implicit-any parameters in the temporary measurement test; the harness was corrected and both builds reran successfully. Representative webpack build elapsed times under contention were 44.48 s (100), 54.97 s (500), 66.54 s (1,000). The default Turbopack build initially rejected the reused external dependency symlink. Copying the existing installed tree locally resolved that environment issue; integrated and 1,000-problem default builds passed without installation, compiler suppression or product configuration changes.

## Actual production browser route observations

Chrome 156.0.8078.74, 390 × 844 viewport, fixed 4× CPU throttling, loopback network without network throttling. Each fresh synthetic learner first completes one real core episode. For first/last Packs, one discarded warmup and five cold-browser-cache navigations are followed by five warm navigations. Catalogs 63 and 1,000 were measured end to end; 100/500 have actual content/build measurements above. Cold samples use new contexts and cleared browser cache; server/filesystem caches remain warm. Concurrent validation creates timing noise.

| Problems / selected Pack    | HTML bytes / gzip | Cold ready median ms | Warm ready median ms | Cold input automation median ms |
| --------------------------- | ----------------- | -------------------- | -------------------- | ------------------------------- |
| 63 / A                      | 82,081 / 18,095   | 272                  | 153                  | 57                              |
| 63 / S                      | 82,081 / 18,096   | 633                  | 390                  | 25                              |
| 1,000 / A                   | 516,102 / 44,836  | 748                  | 370                  | 67                              |
| 1,000 / last synthetic Pack | 516,134 / 44,841  | 640                  | 251                  | 87                              |

The response contains the complete projected catalog even for the first selected Pack: response growth is about 6.3× here. Cold script transfer grows from 190,857 to 209,527 bytes; warm transfer is cached. Cold reported JS heap medians are about 10.5 MB versus 16.5 MB, with warm samples reaching about 26.6 MB. Every measured navigation verifies the exact selected ordered triple and records no page runtime errors. Raw results retain input timings, heap, transfer and long-task observer arrays; no long-task entries were observed in those bounded arrays. Input automation duration includes the fill/check action and its event dispatch, not proof that the subsequent asynchronous durable write has completed. Native canonical write measurements are reported separately. These local samples do not certify a mobile performance budget or imply linear extrapolation to longer real content.

## Storage and history observations

The canonical measurement uses actual native Chrome admission/clear APIs to retain 1,000 tombstones, then actual identity transitions to retain 100 namespaces with synthetic 10 KB payloads. The active aggregate grows from 1,453 bytes to 107,454 bytes with 1,000 admission tombstones, and 1,235,998 bytes with 100 retained owners. Thirty writes after five warmups gave median/p95 1.1/8.9 ms for 1,000 active-owner tombstones and 4.8/39.6 ms for 100 retained owners. Initial cold/contended samples contained large outliers; raw maxima are preserved. Validation/cloning and writes cover the whole aggregate, so retained-owner and tombstone growth remain explicit limits. No retention policy or persistence redesign was invented.

Disposable PostgreSQL 17 measurements retain 100, 1,000, 10,000 and 100,000 receipts and matching awards for one synthetic learner; episode pruning retains 50 and the actual History-shaped join reads 10. The retained receipt/award counts are not bounded by episode pruning. `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` records plans/indexes and local execution times: History join 0.073 → 0.104 ms, immutable receipt lookup 0.034 → 0.037 ms, all completed-Pack receipts 0.056 → 28.945 ms. SQL pruning observed 2.6–6.6 ms. Eight synthetic learner-row-lock transactions measured serialization separately. These SQL timings exclude Node parsing/domain validation/network/UI; they do not establish end-to-end capacity or production SLOs. The full completed-Pack read remains proportional to lifetime receipts.

## Functional and compatibility evidence

The final default suite passes 1,596 tests; its 203 database-dependent skips are explicit. The dedicated disposable-PostgreSQL suite executes 13 suites / 205 tests with zero skips, including both migration histories, ordered 0021 → 0022 → 0023 application/reruns, existing-row preservation, malformed Pack IDs, ownership, immutable retry, invalid order/prefix and unknown future writer rejection. SQL's structural Pack-ID acceptance does not register a Pack. The future T fixture separately executes 3 integration suites / 100 tests with zero skips, including registered T and unknown U.

Native Chrome rehearsals verify canonical migration, handoff witnesses, retained original bytes, missing/blocked IDB, migration aborts, two-tab admission races, stale revisions, schema-1 upgrade and schema-1 `VersionError` after schema 2. The integrated A–S → canonical A–R → A–S and fixture T → A–S → fixture T module matrix retains exact whole canonical records on unsupported reads/refresh/new-session/clear attempts, calls no verification callback for unknown tasks and resumes the three slots in order on return. Those callbacks are synthetic; they do not claim Next transport coverage. Exact pre-IDB builds remain unsupported after handoff: native frozen `6e7376f` demonstrates visible legacy divergence and fail-closed preservation. Envelope-only `5463382`/`2ccc420` are not writable rollback targets by inspection. Whole-origin eviction, unseen frozen-client writes and power-loss durability are not solved by this protocol.

Actual mobile Chrome → local Next → disposable PostgreSQL checks cover every A–S Pack after the first core episode. Each retains exact unfinished snapshot bytes across refresh, finishes an ordered one-task prefix, preserves original envelopes, and stores exactly one receipt, episode and award. Pack S and independently registered synthetic T additionally inject response loss after the real database commit, preserve the exact immutable pending request across refresh, retry and clear it only after acknowledgement. Progress screenshots remain local. The first-run additional-practice gate was observed to block direct Pack entry for a fresh learner; it was satisfied by an actual core Finish, never bypassed.

The six real Finish scenarios cover normal completion, committed response loss, competing tabs, intent abort, acknowledgement abort and stale callback. Seven real lifecycle scenarios cover Recovery enrollment/Resume, same-owner generation rotation, revoked credentials, Start Fresh activation abort/reload, cross-owner namespace return, lost Simulation response/reload and Simulation completion/atomic clear. Recovery uses the existing development-only ingress seam and random synthetic secrets, without production security changes. An initial cold-compile Recovery locator timeout is retained in the local evidence; the warmed retry passes. Initial catalog-harness locator mistakes are retained separately from final successful product checks.

## Remaining limits and gates

One existing Minor mismatch is reproduced: content authoring accepts general kebab-case Pack IDs such as `other-t`, while SQL 0023 requires bounded `pack-` IDs. All A–S and synthetic fixture IDs comply. No current learner regression or Critical/Major implementation defect was established, so the SQL/domain contract was not changed under this acceptance task. Validation's appended baseline scans and all-Pack projection/serialization, unbounded receipts/awards and whole-aggregate browser writes are measured growth points, not claims of unlimited scalability.

Production bindings/hosting, Recovery environment/ingress and release approval, content rights, first-run eligibility, learner comprehension, accessibility certification, Safari/Firefox, device power-loss and general learner-data deletion remain separate gates. Synthetic fixtures and private browser/database evidence remain local. No fixture content or learner identifiers are added to the production catalog or documentation. Independent review must assess the exact frozen source manifest and raw logs before an integration acceptance decision.

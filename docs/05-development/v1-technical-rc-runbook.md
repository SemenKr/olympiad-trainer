# v1 technical RC rehearsal and release runbook

This is a local technical acceptance procedure, not deployment authorization. The candidate starts at reviewed merge `e22f9e20`; its only application change aligns author validation with SQL 0023: Pack IDs have 6–64 ASCII characters and match `^pack-[a-z0-9]+(-[a-z0-9]+)*$`. Structural validity never registers a Pack. Finish still requires an existing registered Pack, its ordered problem facts and the authenticated learner. No statements, provenance, rights, SQL or learning contracts change.

## Release gates

The bounded protocol-aware upgrade can be accepted after the checks below and independent review. Public release remains **NO-GO / NEEDS DECISION** until the owner accepts the operational close-old-tabs precondition, chooses a supported rollback build with the required content capability, and clears the existing content/rights and production Recovery readiness gates. These are separate decisions; a local PASS does not clear them.

Pre-IDB `6e7376f` JavaScript can still write its localStorage branch after handoff. The real running-build rehearsal reproduces this. Canonical IDB remains unchanged and the current reader blocks when divergence becomes visible. There is no synchronous unseen-write fence, no technical proof that every old tab has retired, and no safe writable rollback to pre-IDB code. Do not represent a deployment, storage event or user confirmation as such proof.

## Before rollout

1. Record exact source revision, working-tree diff hash, build IDs, schema/migration state, browser versions and content identities. Validate all 63 original problems and 19 Packs without modifying their baseline. Retain the database backup/restore procedure and its independently established operational evidence.
2. Run the minimum suite below in disposable environments. Preserve raw failures and successful reruns separately. Separate production-build transport checks from development-only Recovery checks.
3. Confirm learners save and close old trainer tabs before acknowledging handoff. Explain that reopening cached old builds is unsupported. Do not clear browser storage to bypass a blocked handoff.
4. Select a protocol-aware fallback that understands active content. `92552cf` supports the canonical protocol and A–R, but cannot safely finish S/T work. An older reader must preserve unknown future snapshots/outboxes and block. The appropriate recovery is restoring the capable deployment, not deleting or reinterpreting saved work.
5. Verify real trusted HTTPS Recovery ingress, configured secrets, network buckets, enabled/disabled behavior and readiness under the existing [Recovery runbook](recovery-production-runbook.md). Plain HTTP `next start` correctly rejects Recovery credential ingress. Development local seams do not prove production readiness.

## Minimum repeatable acceptance suite

Use Node 24 and the repository lockfile dependencies. Browser tools must be already installed; no new dependency is needed. Supply `PLAYWRIGHT_MODULE`, `CHROME_EXECUTABLE`, `DATABASE_TEST_URL` (disposable loopback database), and `CANONICAL_TEST_ORIGIN` (loopback running build). Never point integration/rehearsal scripts at Production. `db:migrate` reads `DATABASE_MIGRATION_URL` (or `DATABASE_URL`), not `DATABASE_TEST_URL`; set the migration URL explicitly as below.

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm test:metadata
pnpm content:check
DATABASE_MIGRATION_URL=postgresql://127.0.0.1:55448/ot_rc MIGRATION_TARGET=local pnpm db:migrate
pnpm exec vitest run --config vitest.integration.config.mjs --testTimeout=20000
node scripts/rehearse-canonical-finish.mjs
node scripts/rehearse-pack-catalog-ui.mjs
SMOKE_EVIDENCE=/absolute/disposable/evidence node scripts/rehearse-mobile-accessibility.mjs
```

Run `rehearse-canonical-lifecycle-ui.mjs` against a development-only server configured using the existing local Recovery seam and disposable secrets/database. It covers enrollment, same-owner generation rotation, revoked cookies, Start Fresh activation abort/reload, retained cross-owner recovery, and Simulation lost response/reload/finish. Native module-level persistence/lifecycle/version harnesses remain useful for schema fencing, unknown records, aborted IDB writes and blocked/missing IDB; their synthetic callbacks do not replace HTTP checks.

For actual same-origin deployment rollover, archive/build exact `92552cf` and `6e7376f` into disposable directories, build the RC, and supply absolute build roots:

```sh
ROLLOVER_EVIDENCE=/absolute/disposable/evidence \
ROLLOVER_BUILDS='{"ar":"/absolute/ar","rc":"/absolute/rc","legacy":"/absolute/pre-idb","future":"/absolute/content-only-t"}' \
node scripts/rehearse-deployment-rollover.mjs
```

The optional `future` root must contain the explicitly registered synthetic T fixture; omit it when no such fixture was prepared. This harness starts real production Next servers on localhost3151 onward behind localhost3150, retaining the same browser origin while switching the serving deployment. It checks exact Practice bytes across upgrade and supported rollback, a committed/lost Finish response retried after rollback with one server receipt/episode, Simulation draft rollover and server completion, missing-cookie fail-closed behavior, future outbox preservation/recovery, and the unsupported frozen pre-IDB local write. Ports must be unused. All identities and data are synthetic. It stops its own servers in `finally`.

The production Recovery crossover uses the existing `openssl` executable to generate a one-day disposable localhost certificate and requires `LOCAL_TLS_KEY`, `LOCAL_TLS_CERT`, `RECOVERY_CROSSOVER_EVIDENCE` and `RECOVERY_CROSSOVER_BUILDS='{"ar":"/absolute/ar","rc":"/absolute/rc"}'`:

```sh
openssl req -x509 -newkey rsa:2048 -nodes -days 1 -subj /CN=localhost -keyout /absolute/disposable/tls.key -out /absolute/disposable/tls.crt
LOCAL_TLS_KEY=/absolute/disposable/tls.key \
LOCAL_TLS_CERT=/absolute/disposable/tls.crt \
RECOVERY_CROSSOVER_EVIDENCE=/absolute/disposable/evidence \
RECOVERY_CROSSOVER_BUILDS='{"ar":"/absolute/ar","rc":"/absolute/rc"}' \
NODE_ENV=production node scripts/rehearse-recovery-deployment-crossover.mjs
```

The harness runs unchanged built Next production request handlers with the public hostname/port `localhost:443` and internal listeners3161/3162. A loopback TLS proxy on3160 supplies trusted forwarding headers; a task-only CONNECT proxy on3169 routes the browser's authentic `https://localhost` origin to3160 without privileged port binding or rewriting Origin. The browser explicitly accepts the disposable self-signed certificate. Configured ephemeral Recovery secrets and simulated trusted Vercel ingress exercise the unchanged production HTTPS/Host/Origin/network guards; this is not evidence that an actual hosting platform is configured correctly.

Recovery is prepared by the A–R client. One case confirms through the RC endpoint and loses the real committed response; another confirms on A–R, verifies an injected post-commit IDB activation write abort, then reloads RC. Both must reconcile the server generation exactly once while preserving learner, source, payloads and retained namespaces and creating no extra learner.

A real held Finish callback and same-origin Recovery cannot be scheduled in the order “generation rotation and canonical reconciliation, then old callback.” Finish holds the shared identity Web Lock across transport and acknowledgement; Recovery requires the exclusive barrier with `ifAvailable`. The native rehearsal must verify the real second-tab UI rejects before the confirmation request, server generation and canonical pending bytes remain unchanged, and the held shared lock is present. Only after releasing the actual old-build response may Recovery rotate and reconcile. This is evidence of mutual exclusion, not a manufactured stale-generation callback test. The existing revision-injection test remains separate.

An old tab can call a Server Action identifier absent from the serving deployment. The crossover reproduces this after real Recovery confirmation: the transition intent and completed Summary remain preserved, but the old interface cannot finish its follow-up verification. Navigate to Home under the capable deployment to run the learner gate and reconcile the acknowledged generation. Reloading `/restore` alone does not run that gate. Never clear storage or repeat creation to bypass this state. This recoverable interruption is part of the supported local rollover boundary, not seamless old-JavaScript compatibility.

`rehearse-mobile-accessibility.mjs` checks six routes at widths 320/390/1280, a level-one heading, accessible tree availability, labeled keyboard focus, horizontal overflow and runtime errors, and captures screenshots. This is a bounded smoke check, not WCAG certification, screen-reader testing or learner comprehension research.

## Migration, failure and recovery

Apply additive repository migrations before enabling code that requires them. The dedicated integration suite exercises both migration histories, 0021→0022→0023/reruns, retained receipts, malformed IDs, bounded migration lock waits, late transactional failure and rollback. A content-only Pack addition must pass author validation and identity/metadata generation, keep existing definitions stable, and register its ordered tuple explicitly. It does not authorize SQL changes or new content rights.

If a request committed but its response was lost, retain the exact immutable outbox and unfinished snapshot. Retry only through a capable authenticated writer; confirm exactly one receipt/episode/award. If identity activation fails after server acknowledgement, retain the transition intent and source namespaces and reload to reconcile; do not create another learner automatically. If canonical storage is blocked, missing with witness, unknown or divergent, preserve all branches and stop dependent writes. Full origin eviction and physical power-loss durability are not solved by this procedure.

## Rollback and stop conditions

Stop rollout for source divergence, unknown content/schema, unresolved identity transition, failed persistence acknowledgement, unexpected receipt counts, failed migration or Recovery readiness failure. Restore a tested protocol-aware build with sufficient content capability while preserving canonical IDB, handoff witness, legacy provenance and server receipts. Do not downgrade IDB, remove witnesses, reimport legacy branches, rewrite receipts, or run old pre-IDB code as a writable fallback. Restoring a capable build can resume a preserved future outbox; it does not merge divergent branches.

## Evidence and measured limits

The local RC evidence is in `/private/tmp/ot-v1-rc-KNYV9v/evidence`; raw logs and temporary browser result directories are private synthetic acceptance artifacts. The final author report records exact commands, fingerprints, successful runs and material untested cases. Prior unchanged scale evidence is explicitly reused from the [M2 acceptance record](m2-integration-scalability-acceptance.md): 63→1000 catalog/build/browser growth, 1000 canonical admissions/100 retained owners, and 100000 SQL receipts/awards. No new retention policy or arbitrary performance budget is adopted. Whole-aggregate IDB cloning/validation, unbounded retained namespaces/tombstones and receipt/award growth remain measured limits. Re-measure after consequential protocol, payload or catalog changes; rerunning unchanged benchmarks alone does not resolve those design decisions.

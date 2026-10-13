# Adaptive v1 — Stage A release evidence

Prepared 2026-10-12 UTC on `feature/ot-adaptive-v1` at `a2acc2fd6901655f39281b2515eb725f1c8b6add`, PR #98. Scope: release documentation, read-only production inventory, and isolated synthetic Neon rehearsal. No production infrastructure, credentials, compute, traffic or database state changed; no Git publication. Follow the [current release procedure](adaptive-v1-expand-release.md) for separately approved Stage B.

## Evidence reused

Independent implementation/release-tooling review PASS (Critical 0 / Major 0), CI green, PostgreSQL integration 135/135 and `pnpm verify` with 1196 tests plus build are unchanged and were not repeated. Preview runtime persistence isolation is proven: the synthetic learner existed in isolated Preview Neon and not production. The previous Journey 500 came from a probe calling `startServerReview`, not the Journey action; it does not demonstrate an application regression.

Supported browser legacy import → Journey remains unverified: browser initialization previously failed before access, and no further browser/bypass attempts were made. Old Preview helper revocation is unconfirmed; its reported expiry is 2026-10-13T19:12Z, still in the future at this rehearsal. Current Preview helper was revoked previously. Authoritative Dashboard cleanup/expiry evidence and functioning authenticated browser access remain gates.

## Production writer and credential inventory

| Surface                           | Observed dependency / required fence                                                                                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel deployments                | Paginated list: 234 total, 218 READY, 9 ERROR, 7 CANCELED; 98 target Production, 136 other. Immutable environment-key inspection covered newest 100 only; older 134 were listed, not fully credential-mapped. Do not equate target/count with live access.                                                                      |
| Original production credential    | Current production and inspected older deployments retain `DATABASE_URL`, `DATABASE_MIGRATION_URL` and alternative owner database aliases. Current Preview also retains original unused aliases despite using its isolated runtime variable. Retiring only a shared environment variable does not fence these immutable copies. |
| Current project environment scope | `DATABASE_URL`, `DATABASE_MIGRATION_URL` and 15 alternative database aliases are Production-only; `PREVIEW_DATABASE_URL` and `PRODUCTION_DATABASE_HOST` are Preview-only. No values were printed. Scope is fixed, old copies remain.                                                                                            |
| Integration binding               | Existing Neon/Vercel storage binding is known. Scope metadata does not prove synchronization cannot reinject owner credentials. Freeze/control synchronization and verify staged candidate bindings before cutover.                                                                                                             |
| Main runtime pool                 | `practice/server/progress-db.ts`, pool maximum 5, shared runtime URL guard; Practice identity/Finish/import/pruning, Review, Journey/Path, knowledge support, Simulation and Recovery reuse authenticated persistence paths.                                                                                                    |
| Secondary runtime pool            | `identity-rate-limit.ts` scheduled cleanup pool maximum 1, same guarded URL. Cleanup/rate-limit/security writes count for rollback boundaries, even when no learner Finish occurs.                                                                                                                                              |
| Scheduled writer                  | `/api/internal/recovery-cleanup`, GET authenticated by `CRON_SECRET`, `maxDuration=60`; four active daily cron definitions at 00:00, 06:00, 12:00, 18:00 UTC. Preserve cron/Recovery/HMAC settings privately; pause invocation during release.                                                                                  |
| Operator tools / CI               | `scripts/migrate-db.mjs` and `inspect-release-db.mjs` use explicit operator targets. CI uses disposable loopback PostgreSQL; no production migration workflow was found. Inventory any human/external clients separately before release.                                                                                        |

Production identity: Neon `broad-boat-12642182`, branch `br-ancient-meadow-b8wliil9`, endpoint `ep-young-sky-b8iesv38`, database `neondb`. Existing baseline is migrations 0001–0013. The legacy owner `neondb_owner` owns the DB, has CREATEROLE and `neon_superuser` membership. Provider-managed `cloud_admin`/`neon_service` are distinct; do not rotate provider roles. Securely map any additional application login/password holders before approval. Credential values were neither decrypted into reports nor copied to files.

## Actual capabilities and limits

- Vercel Hobby / OWNER; auto-domain assignment is currently enabled. Authenticated CLI inspection found WAF enabled, active version 1 with Recovery credentials ceiling rule `rule_recovery_credentials_ceiling_spB4Yd` (60 requests / 60 seconds, IP key). Earlier connector 404s are obsolete evidence of absence. Maintenance deny/exception behavior is supported in principle but has not been changed or tested in production. Readback and live denial tests are mandatory before retirement/migration.
- Project pause is not an all-deployment writer fence, and unpause enables automatic production domain assignment. Credential retirement plus compute restart provides the durable fence; WAF supplies the maintenance UX and stops new admitted requests.
- Inspected Hobby Function maximum is 300 seconds; use at least 360 seconds plus any larger external-writer bound before restart. Existing cron route bounds its execution to 60 seconds.
- Project Settings → Cron Jobs provides **Disable Cron Jobs** on all plans; pausing schedules does not require a code redeploy. This control was verified against [official documentation](https://vercel.com/docs/cron-jobs/manage-cron-jobs), not exercised on production.
- Production Neon is free_v3 / PostgreSQL 18.6 with 21600-second history. Endpoint reports `pooler_enabled=false`, transaction mode and passwordless API access enabled. That last setting describes trusted platform access, not anonymous application login. Inventory trusted control-plane writers as well as passwords. Disposable tests explicitly enabled the pooler for real pooled credential rejection.
- SQL-created limited roles work without owner membership. Do not assume Neon API-created roles have the same membership. Existing privileged owner connections must be severed by an approved compute restart; ordinary backend-termination privileges are not the release proof.
- Snapshot creation, non-finalized restore inspection and finalization were all exercised successfully on disposable resources. Production capacity, fresh snapshot readiness/retention and final endpoint bindings must still be checked at cutover.

## Disposable rehearsal: observed PASS

Created an EMPTY, synthetic-only project in the owner's personal Neon organization, not a branch/copy of production or Preview:

- Project `snowy-resonance-68564400`, original branch `br-spring-meadow-b7jl4qu9`.
- Original endpoint `ep-super-smoke-b7x14iwh`; explicitly enabled transaction pooling for the test.
- Post-fence snapshot `snap-round-sunset-b7jltta5`, created 2026-10-12T20:58:20Z, expires 2026-10-19T21:00:00Z.
- Restored branch `br-dark-haze-b7hh7w8c`; restore finalized and original endpoint successfully rebound. Diagnostic endpoint `ep-noisy-dawn-b71b02p3` remained on the displaced branch.

The temporary local harness reported 12 successful checkpoints, including readiness milestones:

1. Applied actual repository migrations 0001–0013 and seeded one synthetic learner with valid empty evidence buckets and a provable brothers-ages attempted flag.
2. Created two SQL runtime roles initially NOLOGIN, with application DML/locks and sequence privileges, excluding migration markers. Enabled v1 briefly: SELECT/UPDATE/FOR UPDATE succeeded; CREATE TABLE, CREATE ROLE, SET ROLE owner and migration-marker INSERT all failed with 42501. Disabled it again; rollback role remained disabled.
3. Held an old owner direct transaction with an uncommitted marker and an old pooled connection. Rotated only the disposable owner's password. Fresh direct authentication with the old password failed before restart.
4. Restarted only the disposable compute. Server start time changed, both old handles failed, the uncommitted marker disappeared, prepared transactions were zero, old direct AND pooled passwords failed authentication, and both new disabled roles rejected login.
5. Created the post-fence snapshot with schema 0013 and disabled runtime roles. Ran actual guarded `inspect-release-db before`, migration runner, and `inspect-release-db after` using the explicit nonproduction target: 13 → 14 migrations, one learner preserved, one provable ledger closure backfilled. Explicit ledger grant allowed v1 SELECT/INSERT; role disabled afterward. This is SQL permission evidence, not a browser Finish test.
6. Restored with `finalize:false`. Read-only restored-branch inspection found 13 migrations, one learner, original attempted flag, ledger absent and both runtime roles disabled. Finalized restore; the original endpoint returned the same 0013 state. Old direct/pooled passwords still failed. The rollback role could read the original flag only when deliberately enabled, then was disabled again.

Probe corrections were confined to disposable resources: Neon proxy NOLOGIN rejection can be `08P01: no such user`; it must not be confused with a network failure. A requested suspend-interval override returned 412; the supported default was used. An initial synthetic evidence bucket shape was corrected before migration. These are harness corrections, not application regression evidence.

Cleanup: harness closed all clients and exited; credentials existed only in process memory/no-echo stdin, not files or source. Both disposable endpoints were explicitly disabled after rehearsal; the project, displaced branch and expiring snapshot are retained for inspection, not deleted. Account suspend interval was not configurable, so no automatic-suspend claim is made. No Preview learner or production resource was changed by the rehearsal.

## Remaining release gates

Stage A establishes a practical credential-fencing/recovery procedure; it does not establish production quiescence or authorize Stage B. Required gates are: complete secure credential-role/external-writer mapping; integration/deployment freeze and inactive staged candidate verification; effective maintenance ingress and cron pause; approved credential retirement/drain/restart and fresh direct/pooled rejection; fresh recovery checkpoint; guarded migration/grants; supported authenticated browser smoke and old access cleanup; exact promotion/reopening decision. See the four explicit approval bundles in the release procedure.

Reusing existing implementation checks does not cover production role grants, WAF behavior or origin-dependent smoke. Those checks intentionally occur only during the approved attended release. Production remains NO-GO until these gates and approvals are satisfied.

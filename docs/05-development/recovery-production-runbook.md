# Recovery v1 — production preparation and operations

Task: `OT-LEARNER-RECOVERY-PROD-ACTIVATION-PREP`. Recovery remains disabled.
This runbook supplements the [adopted contract](../04-architecture/learner-identity-recovery-v1.md); it does not change credential authority, retention or learning-data policy.

## Verified preparation baseline (2026-10-08)

- Canonical `main`: `194f0ff56fde5ca5ddf171b1495dd56582ff010a`.
- Original production: `dpl_Ck9nLG5dVnCdABKEDdFQL55xutLK`, READY at that SHA.
- After secret activation: `dpl_3cgyLNXYJoXeW5aKNr7xZU6eRzjZ`, READY, exact same SHA and canonical aliases. CLI inspect omits Git metadata; deployment API independently verifies it.
- Read-only production inspection confirms migration `0013_learner_recovery_credentials.sql`. Pending changes, rate buckets and learners with Recovery codes: all zero.
- Independently generated 32-byte canonical base64url material configured as production-only sensitive `RECOVERY_NETWORK_HMAC_KEY` and `CRON_SECRET`. Values never printed, written to files or included in arguments; provisioning used process memory and stdin. `RECOVERY_ENABLED` remains absent.
- Exactly one live custom Firewall rule: `rule_recovery_credentials_ceiling_spB4Yd`. AND conditions: environment `production`, method `POST`, path exactly `/api/identity/credentials`. IP key, fixed window, 60 requests / 60 seconds, exceeded action `rate_limit` (429). No other custom rules or pending drafts; existing managed protections preserved. No production load test. The connector's firewall endpoint reports 404 even after publication; authenticated CLI status/rules/diff provide the live verification.
- Deployed cleanup schedules: `0 0 * * *`, `0 6 * * *`, `0 12 * * *`, `0 18 * * *`, UTC; all target `/api/internal/recovery-cleanup`. CLI reports enabled with no modified/undeployed jobs.
- Cleanup without/wrong bearer: 401. Vercel cron runner injects the configured bearer; invocation confirmed HTTP 200 in production runtime metadata. No production fixtures created.
- Repeated authenticated cleanup left row counts and in-memory row digests for all eight ordinary production tables unchanged. After mobile smoke, both operational tables and learners with Recovery codes still contain zero rows.

## Validation before publication

Targeted Recovery/security tests: 119/119. Full disposable PostgreSQL suite: 82 files, 1,099 passed, zero skipped. `pnpm verify`: 7/7, including production build. The first full run failed because legacy suites require the fresh database's public schema; after migrating only the disposable database, the rerun passed. Final notice color adjustment passed affected stylelint/format checks and a fresh production build; business-test results remain applicable.

Disabled production Chromium smoke passed Home, Restore, Practice, Progress and Simulation at 390px: HTTP 200, Russian language, one main/primary heading, no overflow or browser console/page errors. Credential POST remains 503. Local notice checks passed all five required statements, section/heading semantics, 16px/26px typography, keyboard return navigation, and 320/390/768px layouts in light/dark themes. Text contrast is 14.56:1 light and 17.45:1 dark. These checks do not replace child/guardian comprehension or full assistive-technology testing. PR/CI/Preview and owner-approved merge are pending.

## Operational inspection policy

**Owner-confirmed blockers (2026-10-08):** manual monitoring coverage is unavailable, and there is no existing approved hosting-log privacy/retention or deletion/backup policy. The manual inspection proposal below is therefore not adopted or staffed. Activation preparation is **NOT READY**. A new owner decision must establish an available monitoring arrangement and approve the missing privacy/deletion/backup policy before enablement; do not automatically purchase monitoring or introduce another service.

Use existing Vercel Logs, Cron Jobs, Observability and Firewall views. No paid plan upgrade, external monitoring service, log drain or telemetry dependency is introduced. The repository owner is the operational maintainer; before enablement the owner must accept this manual coverage and the notice through the reviewed release change.

[Vercel runtime logs](https://vercel.com/docs/logs/runtime) retain one hour on Hobby. [Automated anomaly alerts](https://vercel.com/docs/alerts) require Pro with Observability Plus or Enterprise. Do not describe manual inspection as configured automatic notification. Manual coverage requires a maintainer; inability to cover the inspection schedule blocks enablement until an owner-adopted alternative exists.

| Signal | Inspection / trigger | Response |
| --- | --- | --- |
| Cleanup failure / 503 / incomplete backlog | Cron Jobs → cleanup → execution logs; inspect each run within one hour of execution. Four expected daily invocations. Any 503, platform failure, missing invocation beyond its scheduled hour, or incomplete result requires investigation. | Check deployment READY, DB reachability and cron-secret presence without disclosing values. Run the deployed cron once using `vercel crons run /api/internal/recovery-cleanup`; inspect its HTTP result. For incomplete bounded batches, repeat only after inspecting aggregate backlog; never delete learning records. |
| Recovery endpoint 5xx spike | Logs → Production → route `/api/identity/credentials`; Observability route error counts. Inspect during initial activation session, then each operational check. Investigate 3 unexpected 5xx in 5 minutes or >5% with at least 20 requests. Disabled-state 503 `unavailable` is expected while the gate is off. | Correlate status/time/deployment only. Verify configuration/origin/network prerequisites; inspect database availability. If active Recovery is unsafe, request owner-controlled disablement; preserve generation-aware identity enforcement. Never revert to an old resolver. |
| Unexpected rate limiting / backlog | Firewall → exact rule → aggregate rate-limited counts; route 429/Retry-After totals; daily aggregate expiry inspection in the DB. Investigate >10% 429 at at least 20 requests, repeated learner reports, any expired row older than 18h, or increasing expired backlog across runs. | Separate hosting ceiling from semantic PostgreSQL budgets. Do not raise limits or broaden WAF rules automatically. Check cleanup and inspect counts/oldest expired age only; escalate before the 24h SLO. |

The numeric investigation thresholds organize operations; they are not new security budgets or guaranteed alerts. At low traffic, any repeated unexpected failure is investigated. Keep only timestamp, deployment SHA/ID, route, status, bounded aggregate counts/completion and incident action in durable operational notes. Do not copy raw logs, cookies, headers, request/response bodies, client addresses or learner identifiers into issues.

The hard validity boundary is `expires_at`, independently checked before disclosure/rate limiting and under the learner lock. Cleanup physical deletion remains the adopted **≤24h SLO under normal platform operation**, with four cron schedules plus opportunistic cleanup. A platform outage or backlog is an incident, never a reason to treat expired rows as authority. Verify these adversarial cases only in disposable PostgreSQL; do not create destructive production fixtures.

Read-only expiry inspection (return aggregates only):

```sql
BEGIN READ ONLY;
SELECT 'pending' AS kind, count(*) AS expired,
       max(clock_timestamp() - expires_at) AS oldest_expired_age
FROM learner_credential_changes WHERE expires_at <= clock_timestamp()
UNION ALL
SELECT 'rate', count(*), max(clock_timestamp() - expires_at)
FROM identity_rate_limit_buckets WHERE expires_at <= clock_timestamp();
ROLLBACK;
```

## Privacy and logging boundary

Recovery application code emits no operational console logs and catches cleanup exceptions without logging error objects. Cleanup exposes only bounded counts/completion; credential failures are neutral, non-identifying and no-store. Do not add logging of recovery codes, successors, pending secrets, browser tokens, HMAC/cron material, raw IPs, recovery/pending/network hashes or unnecessary learner UUIDs. Never place secrets in URLs or browser persistence. Inspect logged messages and nested log fields, not only top-level request metadata, after any instrumentation change.

The bounded production runtime-log sample after configuration/cleanup contained no code, bearer material, 64-hex hashes, UUIDs, raw IPv4 or client-IP fields. This verifies sampled exposed runtime records, not all provider-internal network processing or future requests. Vercel performs ingress/IP-based Firewall processing; do not claim that the host never processes IP addresses. Use aggregate Firewall views for routine operations and do not export client-level details. Runtime retention follows the current plan; any plan, drain, tracing, analytics or logging change reopens privacy review. Provider-internal retention and account-wide privacy settings are distinct from application logs and require owner review before declaring that gate closed.

The adopted contract also requires deployment-specific treatment of authenticated deletion requests and backups. This task adds no support-based identity adjudication, deletion API, legal-compliance claim or broader learner privacy UI. If the owner has no approved existing deletion/backup policy, keep that launch requirement explicit; this runbook alone does not approve one.

## Rollout and publication gates

The Russian `/restore` notice explains account/email-free access, bearer-code possession, outside-browser storage with adult help, old-code invalidation after confirmed replacement/recovery, and irreversible loss when both browser access and the valid code are lost. It is informational even while Recovery is unavailable.

Repository publication requires tests, independent security/release review, PR CI and disabled Preview. Merge requires explicit owner approval. After approved merge, verify the resulting canonical main SHA/deployment READY and rerun disabled production smoke; the notice is not production-delivered until then. Public enablement remains a separate explicit human action. Never set `RECOVERY_ENABLED=true` during preparation, and never describe this as a public release.

Draft publication: [PR #85](https://github.com/SemenKr/olympiad-trainer/pull/85). Initial reviewed commit `02ef3696b53cef0268322d3f09a28827a43e9356` passed [CI 37806715558](https://github.com/SemenKr/olympiad-trainer/actions/runs/37806715558) and has READY Preview `dpl_5zwZ9xqQCUCNFk1SJfKx4TfjMm7a`; final documentary status updates require their own CI/Preview confirmation. Independent implementation review: Critical 0 / Major 0 / Minor 0, with the activation-readiness gates above still blocking. This is a draft preparation change, not a public release.

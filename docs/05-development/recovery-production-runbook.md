# Recovery v1 — production preparation and operations

Task record: `OT-LEARNER-RECOVERY-PROD-ACTIVATION-PREP`, supplemented by `OT-LEARNER-RECOVERY-RELEASE-GOVERNANCE`. This runbook records historical preparation evidence and the current production release. It supplements the [adopted contract](../04-architecture/learner-identity-recovery-v1.md); release does not change credential authority, retention or learning-data policy.

## Current production release record

Recovery v1 is released to controlled canonical-host production:

- Deployment: `dpl_67e5NpV6GitmTCehVok1MzzedoLA`, built from exact canonical `main` SHA `b698eee0711c2de19d7fc7a5979115c0ff6d96eb`.
- Production feature gate: `RECOVERY_ENABLED=true`.
- Controlled canonical-host production E2E passed: fresh anonymous initialization, enrollment, replacement, lost-cookie recovery, successor activation, old-browser revocation, and rejection of consumed/old codes.
- Learning/history invariants remained unchanged. Synthetic rollout learner rows were removed; pending credential changes returned to 0.
- No `OTR1` recovery codes were found in sampled runtime logs. This is a bounded sample, not a claim about all provider processing or future logs.
- Final release review: Critical 0 / Major 0 / blockers 0.

The approved monitoring residual-risk policy remains in force: `expires_at` is the hard authorization boundary; physical deletion is a ≤24h SLO under normal platform operation; four daily Vercel cron schedules and opportunistic cleanup remain the mechanism. No continuous monitoring or guaranteed detection is claimed. Revisit monitoring before materially larger operational scale, broad public promotion, paid use, or school deployment. The privacy, deletion and provider-history limits in the owner decision below remain in force.

## Historical verified preparation baseline (2026-10-08)

- Canonical `main`: `194f0ff56fde5ca5ddf171b1495dd56582ff010a`.
- Original production: `dpl_Ck9nLG5dVnCdABKEDdFQL55xutLK`, READY at that SHA.
- After secret activation: `dpl_3cgyLNXYJoXeW5aKNr7xZU6eRzjZ`, READY, exact same SHA and canonical aliases. CLI inspect omits Git metadata; deployment API independently verifies it.
- Read-only production inspection confirms migration `0013_learner_recovery_credentials.sql`. Pending changes, rate buckets and learners with Recovery codes: all zero.
- Independently generated 32-byte canonical base64url material configured as production-only sensitive `RECOVERY_NETWORK_HMAC_KEY` and `CRON_SECRET`. Values never printed, written to files or included in arguments; provisioning used process memory and stdin. `RECOVERY_ENABLED` remains absent.
- Exactly one live custom Firewall rule: `rule_recovery_credentials_ceiling_spB4Yd`. AND conditions: environment `production`, method `POST`, path exactly `/api/identity/credentials`. IP key, fixed window, 60 requests / 60 seconds, exceeded action `rate_limit` (429). No other custom rules or pending drafts; existing managed protections preserved. No production load test. The connector's firewall endpoint reports 404 even after publication; authenticated CLI status/rules/diff provide the live verification.
- Deployed cleanup schedules: `0 0 * * *`, `0 6 * * *`, `0 12 * * *`, `0 18 * * *`, UTC; all target `/api/internal/recovery-cleanup`. CLI reports enabled with no modified/undeployed jobs.
- Cleanup without/wrong bearer: 401. Vercel cron runner injects the configured bearer; invocation confirmed HTTP 200 in production runtime metadata. No production fixtures created.
- Repeated authenticated cleanup left row counts and in-memory row digests for all eight ordinary production tables unchanged. After mobile smoke, both operational tables and learners with Recovery codes still contain zero rows.

## Historical validation before publication

Targeted Recovery/security tests: 119/119. Full disposable PostgreSQL suite: 82 files, 1,099 passed, zero skipped. `pnpm verify`: 7/7, including production build. The first full run failed because legacy suites require the fresh database's public schema; after migrating only the disposable database, the rerun passed. Final notice color adjustment passed affected stylelint/format checks and a fresh production build; business-test results remain applicable.

Disabled production Chromium smoke passed Home, Restore, Practice, Progress and Simulation at 390px: HTTP 200, Russian language, one main/primary heading, no overflow or browser console/page errors. Credential POST remains 503. Local notice checks passed all five required statements, section/heading semantics, 16px/26px typography, keyboard return navigation, and 320/390/768px layouts in light/dark themes. Text contrast is 14.56:1 light and 17.45:1 dark. These checks do not replace child/guardian comprehension or full assistive-technology testing. At this preparation stage, PR/CI/Preview and owner-approved merge were pending.

## Owner decision — Recovery v1 release basis

Task: `OT-LEARNER-RECOVERY-RELEASE-GOVERNANCE`, 2026-10-09. The following is the exact policy approved as the Recovery v1 release basis; its release authority was exercised separately as recorded above. It supersedes the unstaffed manual-monitoring proposal and narrows the earlier general deletion-policy launch prerequisite to the approved Recovery-specific boundary below.

> **Monitoring.** `expires_at` remains the hard validity/authorization boundary. Physical deletion of expired Recovery operational rows from live PostgreSQL remains a ≤24h SLO under normal platform operation, using four daily Vercel cron schedules plus opportunistic cleanup. Vercel Hobby has no adequate automated alerting for this requirement; four-times-daily manual monitoring is not staffed and is not promised. Missed cron runs or platform outages may violate the physical-deletion SLO and may go undetected, but must never extend credential authority. This residual operational risk is accepted for Recovery v1 at current MVP scale. Monitoring must be revisited before materially larger operational scale, broad public promotion, paid use, or school deployment. No Vercel Pro upgrade, external monitoring, GitHub watchdog or new telemetry is introduced.
>
> **Privacy, deletion and backups.** Recovery introduces no contact PII. Application logs must contain no recovery codes (including successors), browser tokens, pending secrets, raw IPs or operational hashes; the existing prohibition on logging HMAC/cron secrets and learner UUIDs remains. Vercel/provider-level processing is distinct from application logging: application restrictions and sampled logs do not establish provider-wide absence or erasure of personal data. Current Hobby runtime-log retention is one hour; this is not a provider-wide retention guarantee. Current Neon production history retention is six hours, with no explicit Neon snapshots configured. Deletion from live PostgreSQL may remain recoverable within that provider restore-history window; neither live deletion nor window expiry is a promise of immediate or complete erasure from all provider systems. The Recovery cleanup SLO applies to live operational rows, not provider history or general learner records. Active credential hashes remain for the lifetime of the learner; consumed pending rows are deleted in the activation transaction and canceled rows immediately. Recovery v1 adds no support-based identity adjudication, unauthenticated deletion or learner-data deletion workflow. Wider learner-data deletion, including authentication and execution across learner-linked tables and backups, is a separate product/privacy milestone; no such capability or general retention policy is invented here. Learner history and identifiers remain pseudonymous sensitive data, not anonymous data. This policy makes no legal, jurisdictional or compliance claim. Changes to provider retention, snapshots, logging or monitoring require renewed review.
>
> **Release authority.** Approval of this policy resolves only these two Recovery governance decisions. Other release gates and explicit owner-controlled enablement remain separate. This policy itself did not enable Recovery; the subsequent controlled production release is recorded above.

The six-hour Neon setting and absence of explicit snapshots are owner-supplied production facts for this task, not a fresh production inspection. [Neon restore history](https://neon.com/blog/announcing-point-in-time-restore) supports restoration within the configured window; [explicit snapshots](https://neon.com/blog/three-ways-to-use-your-snapshots) are a separate mechanism that can preserve history beyond it. No snapshots does not mean no recoverable provider history.

## Operational inspection policy

The owner decision above replaces mandatory four-times-daily manual coverage with explicit residual-risk acceptance. Use existing Vercel Logs, Cron Jobs, Observability and Firewall views when investigating an observed problem or during an attended release check. No recurring inspection schedule, automatic notification or detection/response deadline is promised. The repository owner remains the operational maintainer.

[Vercel runtime logs](https://vercel.com/docs/logs/runtime) retain one hour on Hobby; evidence may be gone before an incident is noticed. [Automated anomaly alerts](https://vercel.com/docs/alerts) require Pro with Observability Plus or Enterprise. The following triggers guide investigation when evidence is available; they do not establish monitoring coverage.

| Signal | Inspection / trigger | Response |
| --- | --- | --- |
| Cleanup failure / 503 / incomplete backlog | Cron Jobs → cleanup → available execution logs. Four daily invocations are scheduled. Investigate an observed 503, platform failure, missing invocation or incomplete result. | Check deployment READY, DB reachability and cron-secret presence without disclosing values. Run the deployed cron once using `vercel crons run /api/internal/recovery-cleanup`; inspect its HTTP result. For incomplete bounded batches, repeat only after inspecting aggregate backlog; never delete learning records. |
| Recovery endpoint 5xx spike | Logs → Production → route `/api/identity/credentials`; Observability route error counts. Inspect during an attended activation session or incident investigation. Investigate 3 unexpected 5xx in 5 minutes or >5% with at least 20 requests. Disabled-state 503 `unavailable` is expected while the gate is off. | Correlate status/time/deployment only. Verify configuration/origin/network prerequisites; inspect database availability. If active Recovery is unsafe, request owner-controlled disablement; preserve generation-aware identity enforcement. Never revert to an old resolver. |
| Unexpected rate limiting / backlog | Firewall → exact rule → aggregate rate-limited counts; route 429/Retry-After totals; aggregate expiry inspection in the DB during an investigation. Investigate >10% 429 at at least 20 requests, repeated learner reports, any expired row older than 18h, or increasing expired backlog across runs. | Separate hosting ceiling from semantic PostgreSQL budgets. Do not raise limits or broaden WAF rules automatically. Check cleanup and inspect counts/oldest expired age only; escalate observed SLO risk or breach; detection before 24h is not guaranteed. |

The numeric investigation thresholds organize operations; they are not new security budgets or guaranteed alerts. At low traffic, any observed repeated unexpected failure is investigated. Keep only timestamp, deployment SHA/ID, route, status, bounded aggregate counts/completion and incident action in durable operational notes. Do not copy raw logs, cookies, headers, request/response bodies, client addresses or learner identifiers into issues.

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

Recovery application code emits no operational console logs and catches cleanup exceptions without logging error objects. Cleanup exposes only bounded counts/completion; credential failures are neutral, non-identifying and no-store. Do not add logging of recovery codes, successors, pending secrets, browser tokens, HMAC/cron material, raw IPs, recovery/pending/network hashes or learner UUIDs. Never place secrets in URLs or browser persistence. Inspect logged messages and nested log fields, not only top-level request metadata, after any instrumentation change.

The bounded production runtime-log sample after configuration/cleanup contained no code, bearer material, 64-hex hashes, UUIDs, raw IPv4 or client-IP fields. This verifies sampled exposed runtime records, not all provider-internal network processing or future requests. Vercel performs ingress/IP-based Firewall processing; do not claim that the host never processes IP addresses. Use aggregate Firewall views for routine operations and do not export client-level details. Runtime retention follows the current plan; any plan, drain, tracing, analytics or logging change reopens privacy review. Provider-internal retention and account-wide privacy settings are distinct from application logs; the owner decision above accepts only the stated bounded policy, not an assurance about all provider processing.

The owner decision above documents Recovery-specific live cleanup and the deployment restore-history boundary. General learner-data deletion remains a separate product/privacy milestone, including how requests are authenticated and executed across learner-linked tables and backups. Recovery code possession grants only the existing pending recovery authority; it does not authorize a support override or deletion. This runbook creates no deletion endpoint or operator procedure.

## Historical rollout and publication gates

During preparation, the Russian `/restore` notice explained account/email-free access, bearer-code possession, outside-browser storage with adult help, old-code invalidation after confirmed replacement/recovery, and irreversible loss when both browser access and the valid code are lost. It is informational even while Recovery is unavailable.

At preparation time, repository publication required tests, independent security/release review, PR CI and disabled Preview; merge required explicit owner approval, followed by deployment verification and disabled-state smoke. Those historical gates were followed by the controlled production release recorded above. Do not treat this historical preparation sequence as ongoing monitoring or as evidence of broader public promotion.

Historical draft publication: [PR #85](https://github.com/SemenKr/olympiad-trainer/pull/85). Initial reviewed commit `02ef3696b53cef0268322d3f09a28827a43e9356` passed [CI 37806715558](https://github.com/SemenKr/olympiad-trainer/actions/runs/37806715558) and has READY Preview `dpl_5zwZ9xqQCUCNFk1SJfKx4TfjMm7a`; final documentary status updates required their own CI/Preview confirmation. Independent implementation review: Critical 0 / Major 0 / Minor 0, with the then-unresolved governance gates above. The later governance review and approved release basis are recorded above. This PR and review are historical preparation evidence, not the production release record.

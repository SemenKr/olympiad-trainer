# Production Phase 2: protected alias cutover

## Scope and workspace

Owner-authorized alias-only operation from accepted RC `81fd89d469f6ec3628ca6b3e96891b453003634c`, using existing candidate `dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB`. No deployment, public opening, cron activation, database change, application-code change or main merge is authorized. All documentation remains uncommitted.

Worktree: `/Users/semenkr/Project/FullStack/olympiad-trainer-production-cutover-81fd89d4`; branch: `ops/production-cutover-81fd89d4`. This task's explicit worktree instruction overrides the generic AGENTS.md prohibition. Only the necessary shared Git branch/worktree registration is added; the protected original worktree, index and existing work are preserved.

The new report is marked intent-to-add so `git diff` shows it; no report content is staged for commit. No application files are changed.

## Before execution: verified gates

Authenticated provider readback at 2026-11-02T13:32:32Z confirms the existing project `prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ`, team `team_7Ch25B92YNT32llUPhWRM6KQ`. Candidate is READY, Production, exact RC SHA and has no assigned aliases.

- Ignored Build Step remains `if [ "${VERCEL_ENV-}" = "preview" ]; then exit 1; else exit 0; fi`.
- `autoAssignCustomDomains: false`; `autoExposeSystemEnvs: true`.
- Member authentication remains `all_except_custom_domains`. This is not a claim that every live hostname has SSO: live public hostnames are protected by deny-all maintenance.
- Cron remains paused with its existing four definitions.
- WAF v3 retains the existing Recovery rate limit and Production deny rule. The deny's only hostname exclusion is `olympiad-trainer-q2kat40u9-semenkrs-projects.vercel.app`. None of the three live aliases is excluded. No WAF, authentication or bypass setting will change.

Database binding evidence: the same immutable candidate passed real Chrome → Next → PostgreSQL in Phase 1. Its verified target remains Neon project `restless-dawn-75515922`, primary/default `br-plain-credit-b88mzczo`, endpoint `ep-green-breeze-b83kwqyf`, database `neondb`. A fresh read-only probe confirms 20 markers and the existing Phase 1 receipt, episode and finished Simulation witnesses. No migration or DATABASE_URL update is repeated. The accepted Phase 1 evidence manifest SHA-256 `e471a5e1aa1834370d67ba32c78d2272e737afd4581c80227cdb861ca0743151` and all 21 files match.

## Non-exposure argument

Both old and accepted deployments target Production in the same project, so the unchanged project WAF continues to deny each live alias before application content is served. Hostnames stay outside the single immutable-candidate exclusion during reassignment. The first two aliases return 403 with `x-vercel-mitigated: deny`; the Git-main alias initially redirects to member authentication. Phase 1 authenticated checks established maintenance denial after SSO as well. The candidate's anonymous URL also redirects to member authentication. Alias assignment changes only its deployment mapping; it neither adds a WAF exclusion nor changes access policy. Each operation must be followed by mapping and denial checks before proceeding.

No learner content may be returned during smoke. A failure must stop subsequent assignments; never remove the fence or restore writable `5463382` to make a check pass. No rights are granted for disputed A–R content.

## Alias execution record

| Existing alias | Before | After | Result |
| --- | --- | --- | --- |
| olympiadtrainer.vercel.app | dpl_76ZmQALKW5Kv5CE8sLKEc8etMpa3 | dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB | Assigned and read back 2026-11-02T13:38:27.155Z |
| olympiad-trainer-sigma.vercel.app | dpl_76ZmQALKW5Kv5CE8sLKEc8etMpa3 | dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB | Assigned and read back 2026-11-02T13:39:53.268Z |
| olympiad-trainer-git-main-semenkrs-projects.vercel.app | dpl_76ZmQALKW5Kv5CE8sLKEc8etMpa3 | dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB | Assigned and read back 2026-11-02T13:40:42.169Z |

Use Vercel's alias-assignment API, equivalent to `POST /v2/deployments/dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB/aliases` with only the exact existing hostname. Do not call project-wide promote or create any deployment. Vercel changes are external and are not represented by the Git diff.

## Verified results and independent review

All three alias-only assignments completed and were read back. QA PASS; independent Astra PASS, with no Critical, Major or Minor findings. No other Vercel mutation was performed. Keep maintenance and cron paused. Live-origin learner UI, canonical IDB handoff and public release remain untested and unauthorized under the current deny policy. Public content/access authorization, any live-host exception, compatible cron mapping/activation, main reconciliation and restoration of automatic-deployment settings require separate owner approval. Never use pre-IDB `5463382` as a writable rollback or restore a pre-acknowledgement snapshot over accepted learner state.


### Actual external changes and protected smoke

The only Vercel mutations were the three named alias assignments above. No `vercel promote`, deployment creation, environment update, firewall/protection update, cron activation or other alias assignment occurred. No Neon mutation occurred. These external routing changes do not appear as application changes in Git.

After-state readback at 2026-11-02T13:43:07.079930+00:00 confirms the selected project controls, complete firewall rules, version 3, authentication and paused cron are identical to before. No automation bypass exists. Per-alias provider GETs at 2026-11-02T13:45:14Z confirm all three mappings to the accepted candidate.

Authenticated protected smoke passed 15/15 checks: three native Chrome root-document requests and twelve same-authentication HTTP GETs across `/practice`, `/progress`, `/restore` and `/simulation`. Every response was 403 with `x-vercel-mitigated: deny`. Application scripts and non-GET live-host requests were blocked locally as an additional precaution. No learner action ran and no learner data was written. Anonymous checks still produce maintenance denial on the first two aliases and SSO redirection on Git-main and the immutable candidate hostname.

Routing is proved by authoritative per-alias mappings to the independently verified exact RC; the maintenance response itself does not identify an application build. Learner UI, live-origin IDB handoff, Finish and Recovery were not exercised behind the deny rule. Their Phase 1 private-candidate evidence is retained, not relabelled as a live-origin test.

### Project pointer and cron boundary

The project-level Production pointer remains `dpl_76ZmQALKW5Kv5CE8sLKEc8etMpa3`, and the paused four-definition cron mapping also still references it. This is an alias-only cutover, not project-wide promotion. Do not use that pointer for writable rollback or reactivate its cron. A subsequent owner-approved compatible promotion must verify the scheduler mapping before activation. Continued maintenance pauses physical cleanup; normal-operation cleanup SLOs are not asserted during this pause. Credential expiry remains a separate hard authorization boundary.

### Git preservation, evidence and conclusion

Original checkout remains clean at `79f4b120bc224ee1d829acc715c7257a7bfff31c` on `feature/content-pipeline-v2-ownership-integration`. Its branch, HEAD, index SHA-256, staged and unstaged binary-diff fingerprints and protected stash list match the before snapshot exactly. Protected index SHA-256: `25420cc8f65176adbbbe53f5e8473caa69612f122d59ee2ed4a906d6b9c7ff20`. No existing work was reset, stashed or overwritten. The ops worktree stays at exact RC with only this intent-to-add Markdown report; no content is staged for commit and no commit exists for this task.

Local sanitized evidence: `/private/tmp/ot-phase2-cutover-81fd/` contains before/after control readbacks, exact alias operation timestamps, final alias GET results, protected smoke results and original-checkout fingerprints. Normal member authentication was used; no bypass/share link or credentials are included in this report.

Astra independently verified the provider mappings, candidate, selected project controls/full firewall and original Git preservation; it inspected the authenticated smoke and reused accepted Phase 1 evidence rather than repeating writes. Critical: 0; Major: 0; Minor: 0. **Phase 2 GO for protected routing under maintenance only. Public opening remains NO-GO without separate owner authorization and a verified content/access policy.**

Remaining gates are public-content/access authorization (including disputed A–R rights), any change permitting live-host application access, canonical-origin handoff and functional smoke, compatible project/cron promotion and activation, main reconciliation and deliberate hold restoration. None is authorized or executed by this task.


## Final Production normalization — preparation only

This section is a new preparation record. The accepted Phase 2 record above describes its historical checkout and provider state; it is not a claim that the current WebStorm checkout is still on that old branch. Current workspace: `/Users/semenkr/Project/FullStack/olympiad-trainer`, branch `docs/git-workspace-policy`, HEAD `81fd89d469f6ec3628ca6b3e96891b453003634c`. Its existing AGENTS.md edit was preserved. The accepted 66-line Phase 2 report was copied byte-for-byte before appending this section; its original SHA-256 is `416ea10c7655ac6d552e85e487bbea8ecd5e2062e787b708a4e88e5dd63179ba`. The ops worktree/report is unchanged. No additional worktree was created.

### Read-only findings and limits

- Authenticated full project API readback still shows old Current Production `dpl_76ZmQALKW5Kv5CE8sLKEc8etMpa3`, Production branch `main`, the original Production build hold, `autoAssignCustomDomains:false`, `autoExposeSystemEnvs:true`, member authentication `all_except_custom_domains`, and disabled cron pointing to the old deployment with its four existing definitions.
- The accepted candidate remains READY/Production/exact RC in the same project. The project domain inventory lists the two existing public-named project domains; Git-main is the third existing alias. The candidate's recorded computed default alias is `olympiad-trainer-semenkrs-projects.vercel.app`; inventory any promotion-related aliases rather than assuming only the three explicit Phase 2 assignments exist.
- `git ls-remote` confirms remote main `5463382b42cef06f3f2e94bcd5af84ca72d3deac` and `release/ot-v1-preview-81fd89d4` at exact RC. Local ancestry verification confirms main is an ancestor of the RC. A focused GitHub connector search found no open PR from that release branch into main. No refs were fetched/rewritten, and no PR was created.
- The accepted RC's `vercel.json` has the four cron definitions and no `ignoreCommand` override. The GitHub workflow contains ordinary PR CI, not a Vercel deployment command. Required CI is not bypassed by holding Vercel builds.
- CLI 65.9.0 supports `promote <deployment>`; its inspected implementation sends an empty body to `POST /v10/projects/{projectId}/promote/{deploymentId}` for an existing Production deployment. It uses a different rebuilding path for Preview deployments, which is prohibited here.

[Official promotion documentation](https://vercel.com/docs/deployments/promoting-a-deployment) says promoting a staged Production deployment marks it Current without rebuilding. [Official cron maintenance documentation](https://vercel.com/docs/cron-jobs/manage-cron-jobs#cron-jobs-maintenance) explicitly says the project-level disabled-cron setting persists across promotions and rollbacks. Keep it disabled and verify readback; no extra cron firewall rule is proposed.

The open [Vercel issue 15095](https://github.com/vercel/vercel/issues/15095) reports promotion resetting `autoAssignCustomDomains` to true server-side. This behavior was not exercised here and is not asserted as proven for this project. No supported preserve-flag is established in the installed CLI, so the sequence treats a reset as possible and includes an explicitly authorized conditional restoration before any Git merge. WAF/access controls remain closed independently of that setting.

Two read-only permission reviews timed out without executing their commands (public OpenAPI download and the initial full-project helper). No provider mutation was attempted or retried. The permitted single project-GET retry succeeded and supplied the fresh fields above. `gh` is not installed; the available GitHub connector supplied the focused PR search. The public OpenAPI schema was not obtained; the plan does not invent request-body options.

### Exact proposed execution sequence — NOT EXECUTED

All writes below require separate owner authorization. Use the same WebStorm checkout. Preserve both dirty files; do not switch branches unsafely, stash, reset or include these documentation changes in the release head. The existing remote release branch is sufficient for a normal PR merge without changing the local dirty branch or pushing another branch.

1. **Admission checks.** Re-read the exact project/team, candidate READY/Production/SHA, all three alias mappings, current WAF, member authentication and disabled cron. Require no other deployment/promotion in progress and no concurrent operator deployment. Stop on unexpected state. Record the complete promotion domain/alias inventory, including any computed default alias. No additional domain may bypass the unchanged maintenance deny. The immutable candidate remains the only maintenance hostname exclusion and stays member-authenticated.
2. **Freeze Vercel Git builds.** With owner approval, strengthen the existing Ignored Build Step to `exit 0` for this controlled normalization window. This prevents a release-PR event from causing another Preview build as well as preventing Production rebuilds. It does not stop existing deployments or ordinary required GitHub CI. Keep `autoAssignCustomDomains:false` and `autoExposeSystemEnvs:true`. Read back the hold before proceeding. Leave the stronger hold until a later explicit decision to restore Preview builds; an ignored/canceled deployment record may still be created, but no additional build/READY deployment is expected.
3. **Make the existing deployment Current.** Invoke promotion exactly once for `dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB`, not Preview, not another deployment and not a new build. Do not run `deploy`, redeploy, migrations or change environment variables. Keep the WAF and authentication unchanged, and cron disabled.
4. **Verify normalization before merging.** Poll promotion status read-only. Require project Current Production to become the accepted candidate, exact SHA unchanged, expected alias mappings and maintenance denial preserved, member authentication unchanged, and `crons.disabledAt` still non-null. Require the scheduler mapping/definitions to identify the compatible candidate before any future activation. If `autoAssignCustomDomains` changed to true, restore only that field to false and verify it; keep the all-environment build hold. This conditional restoration must be covered by the execution authorization. If promotion times out, inspect status and current mappings instead of issuing another POST. If a hold, protection, cron or target check fails, stop with maintenance intact; do not use old writable 546 as a fallback.
5. **Normal release-to-main merge.** Recheck remote main is still exact `5463382...` and release head is exact `81fd89d4...`; stop on drift. Reuse a matching release PR if one now exists; otherwise, with explicit PR authorization, create one from `release/ot-v1-preview-81fd89d4` into `main`. Keep the head pinned to the accepted SHA, allow required review/CI, then merge with a merge commit, not squash or rebase. Do not merge the local docs branch, re-merge Pack S/0022 or separately merge PR105/106/107. No release-branch push or new Vercel deployment is needed. Verify the resulting main commit has the expected old-main and accepted-RC parents and tree `d3b139463cd835d3796f96dcd6659f82bce377d9`. Vercel Current must remain the existing candidate, with no new READY build or alias movement. Keep the local AGENTS.md/report changes uncommitted until separately authorized.
6. **Stop with protection intact.** Public opening, live-host learner UI/IDB handoff, cron activation and restoration of automatic deployment behavior are separate gates. Neither promotion nor the Git merge grants A–R content rights.

Use the verified CLI 65.9.0 with Node 24.21.0. The following request shapes are for a future authorized run only; do not print full project responses or secrets. Every write is followed by a filtered readback of the relevant fields.

```text
PATCH /v9/projects/prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ?teamId=team_7Ch25B92YNT32llUPhWRM6KQ
{"commandForIgnoringBuildStep":"exit 0"}

vercel promote dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB --scope semenkrs-projects --timeout 3m

GET /v9/projects/prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ?teamId=team_7Ch25B92YNT32llUPhWRM6KQ
vercel promote status prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ --scope semenkrs-projects

# Conditional restoration only if promotion changed this hold:
PATCH /v9/projects/prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ?teamId=team_7Ch25B92YNT32llUPhWRM6KQ
{"autoAssignCustomDomains":false}

# Future normal release PR, after checking that one does not already exist:
POST /repos/SemenKr/olympiad-trainer/pulls
{"base":"main","head":"release/ot-v1-preview-81fd89d4","title":"release: integrate reviewed Olympiad Trainer v1.0 RC","body":"Bring main from 5463382 to reviewed RC 81fd89d469f6ec3628ca6b3e96891b453003634c, preserving all 63 problem identities, 19 A–S Packs and migration history. This integrates the reviewed canonical IndexedDB lifecycle and Content Pipeline v2. Validation: accepted RC/Preview QA; Phase 1 native Chrome → Next → PostgreSQL Finish/Recovery/Simulation; Phase 2 protected routing and 15 maintenance denials. Production migrations 0022/0023 are already applied; this merge performs no database migration or deployment. Keep maintenance, access protection, disabled cron and Vercel Git build holds. Public exposure, cron activation and hold removal require separate owner authorization. Local AGENTS.md/report edits are not part of this release head."}

# Only after required checks/review and fresh exact-head/base verification:
PUT /repos/SemenKr/olympiad-trainer/pulls/<release-PR-number>/merge
{"sha":"81fd89d469f6ec3628ca6b3e96891b453003634c","merge_method":"merge"}
```

The promotion-status paths differ between installed CLI source (`/v9/projects/.../promote/aliases`) and the MCP fallback description (`/v1/projects/.../promote/aliases`). Use the pinned CLI status command above rather than assuming either manually constructed route is supported. No endpoint was probed through a mutation.

The proposed PR title/body above are concrete review material; neither has been submitted. Use the existing authenticated connector or GitHub UI; no `gh` installation is required. When using `vercel api` for future authorized PATCH operations, suppress the response (`--silent`) and separately select only non-secret readback fields.

### Minimal compatible cron activation later — NOT EXECUTED

1. Obtain separate approval for enabling the existing scheduler and its ordinary bounded operational cleanup. Confirm Current Production, `crons.deploymentId` and all four definition hosts point to the accepted candidate, path `/api/internal/recovery-cleanup`, schedules `0 0 * * *`, `0 6 * * *`, `0 12 * * *`, `0 18 * * *`. Verify the same database/schema and existing cron-secret presence without disclosing or replacing it. Keep paused if anything still points at old 546.
2. Verify the actual scheduler host is reachable through the maintained access controls. The recorded source configuration uses the immutable deployment hostname; require the compatible immutable candidate host, already the single maintenance exception. Do not add a broad WAF bypass or open learner routes. If actual delivery requires an unapproved exception, stop for that decision.
3. With approval, send only `PATCH /v1/projects/prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ/crons?teamId=team_7Ch25B92YNT32llUPhWRM6KQ` with `{"enabled":true}`. Read back `disabledAt:null`, unchanged four definitions and the compatible target.
4. Observe one bounded authenticated cleanup invocation on that candidate and confirm its result/backlog completion. A platform-triggered manual run may be used under that approval; do not expose the bearer or manufacture Production fixtures. A manual PASS is not proof of scheduled delivery: observe a subsequent scheduled invocation separately. If the target, authentication or execution is wrong, restore `{"enabled":false}` on the same scheduler and stop. Do not delete learner records or roll back the application/database to old state.

Cron can be normalized and later enabled while learner content remains closed; public exposure is not a prerequisite. Continued pause degrades the physical-cleanup SLO, while credential expiry remains a hard authorization boundary. Do not claim normal-operation cleanup guarantees while it stays paused.

### Focused normalization review and current disposition

Focused Astra verdict: **PASS — preparation only**, with 0 Critical, 0 Major and 0 Minor findings. The sequence, accepted merge tree, installed CLI handling and [official cron PATCH client](https://raw.githubusercontent.com/vercel/terraform-provider-vercel/main/client/project_crons.go) were independently verified. Review scope was only this normalization sequence; Phase 2 and AGENTS.md were not re-audited. The reviewed report SHA-256 before adding this verdict was `fffd41c080b98eefa342a25eaca83717da5d94f3599c04dfdd82c281b4231218`; proposed execution steps are unchanged. Live state must be checked again at execution. No normalization write, promotion, merge, commit, push, cron activation or public opening has been executed. Only AGENTS.md and this report differ in the WebStorm checkout.


## Production normalization — promotion attempt (2026-11-03)

This is the actual result of the subsequent owner-authorized Promotion-only task. The preparation section above is historical; no main merge, public opening or cron activation was authorized. The existing WebStorm directory and `docs/git-workspace-policy` branch were retained, with both uncommitted changes preserved.

**Promotion NO-GO: successful normalization is not verified. Writes stopped after one rejected promotion request.**

| Authorized operation | Actual result |
| --- | --- |
| Verify candidate and controls | READY/Production/exact81fd; all three live aliases already on accepted candidate; maintenance WAF v3/member authentication intact; cron disabled; no BUILDING, INITIALIZING or QUEUED deployments |
| Set build hold | PASS: only Ignored Build Step changed from the original conditional to `exit 0`; effective full API readback at 2026-11-03T06:39:36Z confirms it; no other selected project/cron/firewall field changed |
| Check source overrides | HEAD81fd and remote-main546 tracked Vercel configuration is only vercel.json, with no ignoreCommand override; no application config edit or build occurred |
| Promote existing candidate once | One POST to `/v10/projects/prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ/promote/dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB`, body `{}`; Vercel rejected it with HTTP409 conflict |
| Verify Current Production | BLOCKED: API says the candidate is already Current, but fresh full/no-cache project GET still returns old `targets.production.id`; cron also still references old deployment |
| Check routing/deployment effects | All 104 project alias mappings unchanged; three live aliases still accepted candidate; no new deployments observed during the operation |
| Restore auto-assignment if necessary | Not needed: autoAssignCustomDomains remained false; no restoration PATCH was issued |

Vercel's exact response: “The provided deploymentId (dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB) is already the current production deployment.” Request ID: `iad1:cdg1:iad1:sfo1::m2tb5-1793688056623-0f0a0b5d404b`. No second POST, force, rollback, redeploy or alternative mutation was attempted. The pinned CLI read-only `promote status` reports “No deployment promotion in progress”.

Fresh project readback at 2026-11-03T06:42:11.920567+00:00 still reports `targets.production.id=dpl_76ZmQALKW5Kv5CE8sLKEc8etMpa3`. Cron remains disabled with the same four old-deployment definitions and disabledAt1793612853507. The held and post-request selected project state and full WAF rules are identical. A further no-cache GET confirmed the old production target and no last alias request. The disagreement is unresolved; neither the409 message alone nor the old metadata alone is treated as a successful normalization.

The existing default alias `olympiad-trainer-semenkrs-projects.vercel.app` remains on its prior `dpl_GA9ytxXXRQ3Pdzq2MgWYDkvXE7Ya`, as before. All three explicit live aliases remain on `dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB`. No unexpected routing change or new alias was observed.

Current safe state: Ignored Build Step `exit 0`; autoAssignCustomDomains:false; autoExposeSystemEnvs:true; unchanged maintenance WAF v3; unchanged member authentication; no automation bypass/share link; cron disabled. No Neon operation, synthetic learner write, application-code change, deployment creation, main merge, commit, push or PR operation occurred. The only completed provider mutation was the authorized build-hold update.

Evidence is local at `/private/tmp/ot-production-promotion-81fd-20261103/`: workspace/report-before fingerprints; before/held/after-request settings;104-alias before/after inventory; one-request409 response; no-cache current-field diagnosis; access checks. No credentials or full project JSON are recorded in this report.

The smallest next safe action is read-only provider/dashboard diagnosis of the Current-deployment/cron metadata discrepancy, using the exact request ID. Do not silently retry promotion or use rollback/target reassignment as a workaround. Any further normalization mutation needs separate owner authorization after the discrepancy is understood. Keep maintenance, `exit 0` and disabled cron intact; never restore writable546. Main merge and build restoration remain separate follow-ups.

Focused independent Astra verdict: **Promotion NO-GO / normalization NEEDS CHANGES; safe-stop handling PASS**. Critical: 0; Major: 1 provider-state verification blocker; Minor: 0. Independent fresh raw project/WAF GETs confirm the old Production/paused-cron target and preserved holds; independent alias GETs confirm the accepted candidate. This is an external state discrepancy, not a demonstrated application-code defect. Review SHA-256 before adding this verdict: `bf53f4e4d4be6b98c830412fd951c7484a9f9696611e3dd66121c8575310796e`. Inventories/access checks and one-attempt history were inspected as evidence; no writes were repeated. No further provider operation was performed after the stopped request.


## Read-only Current/cron diagnosis and Git workspace resolution (2026-11-03)

This section records the later read-only investigation and supersedes the earlier blanket statement that dashboard Current could not be verified. It does not erase the historical promotion error or authorize another operation.

### Git resolution

The existing WebStorm repository remains `/Users/semenkr/Project/FullStack/olympiad-trainer`, at exact accepted HEAD `81fd89d469f6ec3628ca6b3e96891b453003634c`. With owner authorization and Luna's read-only audit, the current local branch was renamed from `docs/git-workspace-policy` to `ops/production-normalization-81fd89d4`. The target name was absent. HEAD, both dirty file hashes, unstaged binary diff and staged diff were verified identical immediately before/after rename. This was a rename, not a checkout, reset, stash or history rewrite.

The two existing Local Changes remain AGENTS.md and this report. AGENTS.md's workspace policy is unchanged and consistent with using the existing directory. The report's intent-to-add entry predates this task; no staging was performed and no content is staged for commit. Prior report content was preserved before appending this record. No application code, commit, push, main merge or PR changed.

There are 53 retained local branches and two existing worktrees. The other worktree is `/Users/semenkr/Project/FullStack/olympiad-trainer-production-cutover-81fd89d4` on `ops/production-cutover-81fd89d4`, also at accepted RC, with its original uncommitted report. Historical Content Pipeline, ownership and release-development branches were left untouched, including `feature/content-pipeline-v2-ownership-integration` at `79f4b120`. No cleanup is required for this task. Do not remove the old ops worktree or historical refs without separate approval and preservation of its dirty report.

### Verified provider/dashboard observations

| Observation | Read-only result |
| --- | --- |
| Authenticated project overview | Production Deployment card links to the accepted candidate |
| Authenticated accepted-deployment inspector | Status Ready; Environment Production; Current badge; observed 2026-11-03T07:18:15Z |
| Direct alias GETs | All three named live aliases map to `dpl_BZAVdtDFr8ytYsCFiMHqfPfhvXiB` |
| Full candidate API | Exact RC, READY, target production, readySubstate STAGED |
| Full old deployment API | `dpl_76...`, readySubstate PROMOTED |
| Full project API | targets.production still old `dpl_76...`; no last alias request |
| Project cron | Still disabled and references old deployment with its four existing definitions |
| Holds/protection | exit0; autoAssign false; autoExpose true; member protection all_except_custom_domains; unchanged accepted maintenance posture |

Dashboard inspection used the existing authenticated browser session and blocked all non-GET provider requests plus learner deployment and Neon hosts. No application was hydrated, no controls were clicked and no learner operation ran. No new deployment, promotion retry, Neon operation, cron activation, maintenance removal, public opening or share link occurred. The earlier single POST409 evidence remains unchanged; no second promotion request was sent.

### Material conclusion and review

The accepted RC is displayed as **Production / Current** in Vercel's dashboard, and all three named live aliases resolve to it. **Continued protected routing under maintenance is GO. No repeat promotion is warranted to establish these observed results.**

Provider views remain inconsistent: candidate API reports STAGED, while project Production target and disabled cron mapping reference the old deployment. Their semantics are unresolved. These fields must not be called confirmed stale or historical data without provider clarification. **Full normalization and cron activation remain NO-GO.** The dashboard badge does not prove the disabled scheduler would target compatible code when enabled.

Focused Astra review: PASS for this bounded diagnosis; Critical 0, Major 1 unresolved provider/cron acceptance blocker, Minor 0. Astra reviewed supplied sanitized evidence rather than repeating the browser/provider checks. Luna audited Git only. Neither review authorizes a provider write.

**One recommended next step:** obtain read-only Vercel provider clarification using request ID `iad1:cdg1:iad1:sfo1::m2tb5-1793688056623-0f0a0b5d404b`, the Current dashboard observation and the conflicting project/deployment/cron API results. No external support message was sent. Do not retry promotion, force rollback, enable cron or open content to resolve a label. Keep current holds; any subsequent mutation requires separate authorization.

Sanitized diagnosis evidence and Git rename fingerprints are local at `/private/tmp/ot-normalization-diagnosis-20261103/`. No credentials are included in this report. The existing ops worktree and protected stash were preserved.

## Git release preparation — owner review (2026-11-03)

The current owner instruction supersedes the earlier proposal to use the separate release branch and exclude these documentation changes. Prepare one PR from `ops/production-normalization-81fd89d4` into `main`, using a normal merge commit to preserve the accepted RC ancestry. No separate Pack S or intermediate slice merge is required.

Read-only remote verification confirms `main` at `5463382b42cef06f3f2e94bcd5af84ca72d3deac`, an ancestor of current HEAD `81fd89d469f6ec3628ca6b3e96891b453003634c`. The proposed local documentation commit contains only `AGENTS.md` and this report. The resulting PR includes the accepted RC plus these two documentation changes; no new application changes are proposed.

Fresh authenticated project GET confirms Ignored Build Step `exit 0`; `vercel.json` contains no override. Preserve this hold through the separately authorized branch publication and main merge. Ignored deployment records may still appear; this is not a guarantee that provider webhook processing creates no records.

The configured PR workflow is `CI / quality`, using Node 24, pnpm 12.5.1 and disposable PostgreSQL 18. It runs formatting, ESLint, Stylelint, content validation, typecheck, database migrations, unit tests, PostgreSQL integration tests, production build and route metadata checks. These checks must pass on the eventual PR; no new PR CI result is claimed here. Branch-protection enforcement was not verified by this preparation.

Proposed documentation commit: `docs: record v1 release operations and workspace policy`. Proposed PR title: `release: integrate reviewed Olympiad Trainer v1.0`. Owner review precedes staging, committing, pushing and PR creation. Main merge remains separately authorized. Existing maintenance, access protection and disabled cron remain unchanged; unresolved provider/cron metadata and public-content authorization remain operational gates. This Git release does not authorize public opening or a writable pre-IDB rollback.

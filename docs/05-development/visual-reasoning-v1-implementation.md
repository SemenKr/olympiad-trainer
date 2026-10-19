# Visual Reasoning v1 — local Pack S implementation

Original local implementation scope (18–19 October 2026): user-authorized technical implementation on `feature/visual-reasoning-v1`, base `5463382`. At that implementation stage, no commit, push, PR, merge, remote/database deployment or Production change was authorized or performed; later publication and owner decisions are recorded below. The [approved technical direction](../04-architecture/original-content-visual-slice-v1.md) and [reviewed problem dossier](../02-research/visual-reasoning-v1.md) define the scope.

## Result and compatibility

Three original problems with answers 8, 27 and 9 form ordinary Pack S, `Рисунки и рассуждения`. Statements, text equivalents, progressive hints and both solution approaches are taken from the reviewed dossier; public SVG files are byte-identical to the prototypes. Visible statements include the full text equivalents for media failure. Existing Practice, media dialog and response/reveal behavior are reused.

Original problem/media provenance is explicit and rejects mixed official metadata; sourced validation retains its existing rules. Private evidence points to the research dossier. `/sources` distinguishes original tasks and preserves all 60 sourced entries. Three snapshot metadata entries and three identity entries/one Pack tuple are appended. Migration 0022 only widens the receipt Pack ID constraint to S; earlier SQL is unchanged. No Learning Path, Simulation, adaptive, checkpoint, scoring or progress rules change.

Required consumer adjustments: the chooser appends S as an additional optional card, preserving all 18 editorial cards and their ordering; Learning Path total is derived from those 18 entries rather than the complete Pack registry. Thus S does not become step 19 or distort path completion. Snapshot metadata adds the three new IDs/support descriptors so Resume recognizes them.

Narrow viewport verification also found a 3px overflow from the shared Practice navigation at a 320px desktop viewport with a 15px scrollbar. Navigation now wraps when space is insufficient; actions and their behavior are unchanged. The real mobile 320px viewport already fit, but the wrapping fix also preserves access with non-overlay desktop scrollbars.

## Validation ledger

Local checks completed on 18–19 October 2026. PostgreSQL tests use a fresh task-owned disposable cluster bound to `127.0.0.1:55435`, never environment-file or external database targets. Test schema creation/migration is authorized verification, not deployment.

| Command / evidence | Result and scope |
| --- | --- |
| `pnpm content:validate` | PASS, 10 tests, all 63 definitions / 19 Packs checked against the append-only guard. |
| `pnpm verify` (one full run with disposable `DATABASE_TEST_URL`) | Initially 8/9 checks passed; unit/integration test command ran 1,653 tests, with 1,644 passing and nine failures in six files. No skips. Failures exposed stale counts and the optional-Pack/path-total coupling; fixes and affected reruns below supersede those failures. The initial all-green result is not claimed. |
| Affected six-file Vitest rerun | PASS, 68/68: Home count, chooser availability/stability, adopted path projection, path UI, Progress UI and content inventory. All nine earlier failures resolved. |
| Content/media/attribution/snapshot targeted tests | Eight suites initially passed 98 tests; media suite then passed 7/7 after changing its test environment to the existing manual-JSDOM pattern. Original server answers 8/27/9, invalid/incorrect responses, reveal boundaries, exact SVG equality and original provenance negative cases are covered. |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check` | PASS after the consumer fixes. |
| `pnpm stylelint` | PASS in full verification; affected `task-shell.module.scss` also passes after navigation wrapping. |
| `pnpm build` | PASS in full verification and after the final UI/CSS changes; final browser uses that production build locally. |
| `pnpm test:metadata`, `git diff --check` | PASS; whitespace rechecked after implementation. |
| `node docs/02-research/visual-reasoning-v1/verify.mjs` | PASS; independent cell/polygon/route audit, static SVG XML/content restrictions and local links. |
| `task-shell.test.tsx` | PASS, 1/1 after navigation wrapping. |

Explicit final integration command: `pnpm exec vitest run --config vitest.integration.config.mjs src/modules/practice/server/migration-runner.integration.test.ts src/modules/practice/server/learner-progress-persistence.integration.test.ts src/modules/practice/server/adaptive-migration.integration.test.ts` with the disposable `DATABASE_TEST_URL`: **PASS, 3 suites / 76 tests / zero skips**. Covers both supported 0013/0014 histories, upgrades from released 0021 to 0022, A–R/NULL receipt preservation, rejection of unregistered T/wrong modes, replay/idempotence, History pruning, progress and adaptive compatibility. Full verification was not repeated merely to hide the original failed run; affected checks were rerun instead. No dependency was added.

A direct comparison against HEAD confirms all 60 sourced definitions' original content/provenance are unchanged, and the first 60 problem identity entries plus 18 Pack tuples are deeply equal to the original guard. No previous migration file is modified. The two unrelated novice-entry research files retain their original SHA256 hashes.

Browser evidence (headless installed Chrome, final local production build, fresh temporary profile and disposable learner):

- Existing first-training prerequisite was enforced; the test completed a real core session before additional Practice. The chooser exposes 19 cards with S marked additional, preserving the previous editorial order.
- All three actual SVGs loaded with preserved aspect ratio at 320, 375 and 1440px. Full alt conditions exist in the visible statement; 44px-or-larger enlarge controls, named dialog/image accessibility-tree nodes, Enter opening, Escape closing and focus return were exercised. Author visually inspected all three 320px dialog screenshots. Small previews rely on enlargement and the full text equivalent; no mathematical content depends on colour.
- First item: invalid fractional input, wrong answer, all three hints with intervening attempts, protected solution, then correct answer. Reload and Save → Home → Resume restored exposed help. The second and third answers were accepted as 27 and 9.
- Simulated third-image request failure disabled enlargement and preserved the exact conditions; reload after removing the request block recovered. Finish persisted a Summary distinguishing full-solution exposure from the two independent answers. Progress/History showed the three task outcomes and no new capability evidence; Path remained 0/18 after S.
- Existing Pack R: correct answer, Save → Resume restored the answer, early Finish persisted and Path became 1/18. No snapshot format or existing Pack tuple changed.
- `/sources` renders 63 rows: 60 original-source links and three original-project entries without fake official facts. No application runtime exception occurred during the completed browser journey. Temporary harness fixes (synthetic Enter event and waiting through a missing document body on reload) were test-driver issues, not app changes.
- A stricter check found 3px header overflow at 320px with a non-overlay desktop scrollbar. After the wrapping fix: desktop `clientWidth = scrollWidth = 305`, real mobile `clientWidth = scrollWidth = 320`, both with the dialog open and closed. Real NVDA/VoiceOver use, child observations and cross-browser/device validation were not performed; these limits are not claimed cleared by the accessibility-tree checks.

Local logs: system Temp `visual-pack-s-verify.log`, `visual-pack-s-build-final.log`, `visual-pack-s-browser-flow.log`, `visual-pack-s-browser-remaining.log`, `visual-pack-s-integration-final.log`. Screenshots: `visual-pack-s-original-*-320.png`, `visual-pack-s-original-*-dialog-320.png`, plus 375/1440 variants, Summary and Progress. Browser harnesses are temporary local test tools, not application code or a new dependency.

## Independent implementation review

Separate read-only implementation review by `visual_review`: **PASS — Critical 0 / Major 0 / Minor 0**. Reviewer inspected actual tracked/untracked files against manifest SHA256 `5BC1CFFA3F550477B56966DBD3FA003DEAC5FA30BD481208C36811EAAEFDCB51`; all 47/47 file fingerprints matched before and after review. The research-only PASS was not reused as implementation approval. Automatic correction cycles used: 0/2.

Reviewer independently compared the old catalog content/provenance and 60/18 identity baseline, verified answers 8/27/9 and executed the inspected geometry verifier, reviewed the additive provenance/projection/snapshot/chooser changes, receipt-only 0022 and regression tests, inspected recorded integration/build/browser evidence and actual dialog screenshots, and checked `git diff --check`. No review mutations occurred. Database, unit and browser journeys were inspected through code/logs rather than independently repeated; final post-fix overflow measurements remain author evidence. These are non-blocking limits for local technical acceptance; actual NVDA/VoiceOver, child observation and broader device/browser validation remain open.

Status: **PASS for local implementation; release gates remain open**. No Git publication, deployment or Production authorization is implied. Only this review record was updated after the reviewed files were frozen; the implementation itself is unchanged from the reviewed manifest.

## Release gates

The [2026-10-19 owner decision](../02-research/visual-reasoning-v1.md#owner-public-publication-decision--2026-10-19), recorded in PR #105 and confirmed for this documentation reconciliation, permits a **limited experimental public release** of the three original Pack S items without independent named external mathematics or Grade 5 educator sign-off, with residual risk accepted. This is an exception to those two prerequisites, not completed or passed reviews. The checklist remains pending and no pedagogical certification, validated outcomes or general audience promotion is claimed.

- **External human content reviews — exception recorded, not passed:** the exact statements, diagrams, answers, arguments, language and prerequisites have no recorded independent named mathematics/Grade 5 educator sign-off. That absence does not block only this owner-approved limited experiment; the generic pipeline and other content retain their requirements. AI evidence is not human approval.
- **Technical/security and UI/accessibility — still required:** independent technical review, exact-content consistency and actual candidate/device accessibility smoke remain release gates. The first session with one Grade 5 learner must be supervised by the owner and observations recorded under the existing privacy/consent/stop protocol. The private pilot retains its separately recorded owner-content-review and access prerequisites; no session is claimed completed.
- **Owner distribution/credit gate cleared within scope, 2026-10-19:** permission covers `original-two-frames`, `original-notched-sheet` and `original-path-via-k`, their text, SVGs, hints and explanations in Olympiad Trainer and its GitHub repository, with public Codex credit approved. No open license or independent originality finding is asserted; all 60 VSOSh-derived problems retain unresolved rights status.
- **Production readiness — still required:** verify effective runtime/database target, fresh recovery point, compatible rollback and controlled access/aliases; migration 0022 must precede deployed Pack S exposure. No receipt deletion, down-migration or restore over subsequently acknowledged writes is permitted by this task.

The current instruction authorizes reviewed documentation publication and marking PR #105 ready only after validation, independent review and current CI/Preview. It authorizes no merge, deployment, Production DB action or change to the separate diagnostic PR. **Operational release remains NO-GO** until the technical gates below pass; owner acceptance does not mark absent human reviews passed.

## Private pilot access assessment

Initial private-pilot source/config assessment at `b4f9ec3ea028a4b9dfaf41a53f9bfdbebaac1a84`; no server/browser request, database query/mutation, environment-secret inspection or live preview/protection check was performed in that assessment. Subsequent targeted Production/PR read-only evidence is recorded in the public release readiness section below; the proposed pilot target remains unverified. The [owner decision and parent checklist](../02-research/visual-reasoning-v1.md#private-supervised-pilot-decision--2026-10-19) permit a private pilot only after its checks pass. **Current readiness: NOT READY — do not expose the app to the learner.**

| Access option | Assessment / required evidence |
| --- | --- |
| Loopback-only local app and disposable local PostgreSQL | Preferred candidate: one adult-controlled device, explicit loopback binding, no tunnel/LAN exposure, a dedicated browser profile and no production learner data/secrets. This is a recommendation, not an implemented or launch-approved setup. Resolve the Pack S access blockers below first. |
| Isolated hosted preview | Higher setup/privacy burden: prove restricted access for all relevant routes/assets, a separate empty database, matching build/schema and narrowly controlled credentials. A Draft PR, obscure URL or `noindex` is not access control. Live settings are unverified; do not reuse an existing preview merely because CI succeeded. No deployment is authorized here. |

Source-grounded launch checks:

| Area | Evidence and present blocker / prerequisite |
| --- | --- |
| **Pack S scope and entry — blocked** | The existing [Pack route](../../src/app/practice/pack/page.tsx) accepts `/practice/pack?pack=pack-s`, but supplies core/transfer tasks and [all Packs](../../src/modules/practice/server/problem-catalog.ts) to the client. The [Practice session](../../src/modules/practice/ui/practice-session.tsx) rejects a fresh Pack start without practice history or verified completed results and links to the first core training. That core uses VSOSh adaptations. The chooser also lists A–S. A direct link or hiding navigation does not make this a Pack-S-only delivery boundary. Do not have the child complete those tasks, forge completion, edit local storage, bypass guards or treat adult setup as the child's work. Resolve a bounded pilot access/delivery plan under separate authorization before preparing the app; this task changes no entry behavior. |
| **Database 0022 — unverified, blocks app pilot** | [0022](../../db/migrations/0022_original_visual_pack_receipts.sql) only widens `practice_finish_receipts_pack_id_check` to include `pack-s`; it preserves NULL/A–R. It does not create an isolated instance or provide access protection. Verify the chosen disposable database's full supported migration history/current plan and effective constraint, then adult-test Pack S Finish/replay, Summary and Resume before child use. Earlier disposable integration results are historical evidence, not proof of this target's state. Any future setup/migration needs separate authorization; none is run here. |
| **Database targeting — unverified** | [Runtime targeting](../../src/modules/practice/server/database-environment.mjs) uses `DATABASE_URL` outside Preview without enforcing loopback; [migration targeting](../../scripts/migration-target.mjs) does enforce loopback in local mode. Runtime, migration and test connections must identify the same disposable target, with no inherited production fallback. Preview runtime and migration selectors require distinct production/preview endpoints; verify both separately. Do not print URLs/credentials. No environment or database state is verified here. |
| **Authentication and private access — unverified** | [Learner identity](../../src/modules/practice/server/learner-identity.ts) creates a browser bearer cookie (HttpOnly, SameSite=Lax, Secure in production), hashes the server token and checks ownership/expiry via [learner auth](../../src/modules/practice/server/learner-auth.ts). This identifies a learner; it is not a parent allowlist or preview-access barrier. [Identity initialization](../../src/app/identity/learner-identity-gate.tsx) itself writes the DB and requires local storage/Web Locks. `/sources` bypasses that gate and SVGs are static assets. Prove actual browser cookie/identity/storage operation and external isolation in an adult rehearsal; do not disable auth or reuse a production identity. Secure-cookie behavior for the selected local scheme/browser must be checked, not assumed. |
| **Privacy — unverified** | Use a fresh study-only profile and empty isolated DB, no real names/accounts or production history. The app persists anonymous learner/progress/receipt data; it is not a no-data session. Record parent permission, child assent, written-only study notes, access owner and disposal date under the existing [privacy protocol](../02-research/learner-validation-v0.md#privacy-and-data-handling). No recordings or credential/UUID exports. Verify local storage, logs, network destinations and cleanup boundaries before use. A hosted preview can process provider/network metadata; do not promise full deletion from provider backups or zero IP processing. No such live checks or cleanup were performed here. |
| **Accessibility and target-device flow — unverified** | Reuse the recorded 320/375/1440px, enlarge, focus-return and image-failure evidence as historical guidance. Rehearse the exact pilot revision/device: all three diagrams and full text equivalents, needed keyboard/touch/assistive technology, retry/hint/solution distinctions, stop, Resume and Finish. Child-specific access barriers block this pilot; a bounded rehearsal is not general accessibility certification. No new browser/learner observation has occurred. |
| **Owner content review and AI evidence — conditional** | Owner must record pilot-only review of exact content revision `b4f9ec3` before use. Existing AI math verification and independent review of the pedagogical corrections are applicable unchanged-content evidence, not a completed owner review or named human mathematics/educator sign-off. The earlier wording follow-up used Node22 with pnpm ENOEXEC; the supported Node24/pnpm12.5.1 verification for this docs resume is recorded separately below. It does not establish actual pilot database/browser/device readiness. |

Next action: owner reviews the exact three-item revision and records the pilot-only content decision, then selects/authorizes a bounded Pack-S-only local access preparation that resolves the history and full-catalog delivery blockers. No app launch, child exposure, migration or preview setup follows automatically. Once that separately authorized work and all target checks pass, the parent may run the existing observation procedure for one willing learner. Public operational gates and all 60 VSOSh rights remain unresolved; Pack S public-publication permission is separately recorded as granted.

## Pack S public release readiness — 2026-10-19

**Limited experimental publication authority: GO. Operational release: NO-GO.** The [owner exception](../02-research/visual-reasoning-v1.md#owner-public-publication-decision--2026-10-19) accepts residual risk from absent external mathematics/Grade 5 educator sign-off for only these three original items. Those reviews are not recorded as performed or passed. The first Grade 5 learner session must be owner-supervised with observations recorded. Technical/security, exact-content, UI/accessibility, schema, Production binding, recovery and compatible rollback requirements are unchanged. No learning outcomes or human certification are established by this decision.

The six preserved documentation edits were restored from stash `8632b63bd5860053f1eef12b9e74607501055fe0` without applying/dropping it; their saved-byte fingerprint is `e1720c9a2f03aa65091191393772634cc1731cd44ad125febca83e49dc773559`. This reconciliation updates the owner exception and superseded target claims. Content baseline is `b4f9ec3ea028a4b9dfaf41a53f9bfdbebaac1a84`; candidate mathematics, SVGs, IDs, Pack order/behavior, migration 0022, provenance/rights and learning semantics remain unchanged. Earlier mathematical/content/browser evidence is reused only within its scope; no new learner, mathematics, broad privacy/accessibility or database audit is claimed.

### Documentation reconciliation validation — Node 24

This six-doc-only resume used Node **24.22.0** and pinned pnpm **12.5.1** in an exact source copy without local environment files. Content validation, typecheck, lint, stylelint, formatting, Production build and metadata verification passed; actual working-tree whitespace checks also passed. The initial default-concurrency test run had one UI timeout and two worker-start timeouts. An unchanged full-suite rerun with `--maxWorkers=2`, without increasing timeouts or excluding tests, passed **1,493 tests**, with **164 skipped** across **98 files** (87 passed, 11 skipped). Disposable-database integration was not run locally in this resume; current PR CI must verify it. The initial timeout run is not claimed all-green.

Scope checks confirm exactly these six docs changed, the three candidate definitions and original dated distribution/credit record are byte-identical to the content baseline, and all code/SVG/identity/Pack/migration/provenance paths are untouched. The preserved stash bytes are unchanged. Documentation links/fragments are checked separately. Current independent review and published-revision CI/Preview remain publication conditions; no result here certifies pedagogy, accessibility or deployed readiness.

### Reused release evidence — targets distinguished

- Intake [PR #105](https://github.com/SemenKr/olympiad-trainer/pull/105) was Draft at `b4f9ec3ea028a4b9dfaf41a53f9bfdbebaac1a84`; its prior [CI run 128](https://github.com/SemenKr/olympiad-trainer/actions/runs/39221994187) and Vercel check succeeded. The current instruction permits publication of only the independently reviewed docs and marking the PR ready after fresh CI/Preview. Ready-for-review is not permission to merge or deploy.
- Previously verified canonical `olympiad-trainer-sigma.vercel.app` points to READY Production deployment `dpl_76ZmQALKW5Kv5CE8sLKEc8etMpa3`, `main` SHA `5463382b42cef06f3f2e94bcd5af84ca72d3deac`, project `prj_KNMfv2dgJEEH3kwecx9DR4rOpDFQ`. Canonical/project metadata and a green Preview are not evidence of the effective runtime DATABASE_URL binding. No fresh Production request or configuration change is part of this docs task.
- **Superseded Production label:** the earlier 2026-10-19 read-only audit inspected `broad-boat-12642182` / `br-ancient-meadow-b8wliil9` / `ep-young-sky-b8iesv38` / `neondb`. Its 16 markers and A–L/NULL receipts describe that target; it was not established as the effective Vercel Production database. Do not use that observation to prescribe Production migrations 0020/0021.
- A subsequent direct read-only inspection recorded at **2026-10-19 09:54:04 UTC** identified `restless-dawn-75515922` / `br-damp-flower-b8qltys9` / `ep-green-breeze-b83kwqyf` / `neondb`, host `ep-green-breeze-b83kwqyf.c-14.us-east-1.aws.neon.tech`. It found **18 markers**: 0001–0013 plus 0016, 0018, 0019, 0020 and 0021; only **0022 was absent**, with A–R/NULL receipt validation, six legacy flags and the ledger retained. These are reused target-specific facts, not a fresh inspection or proof that Vercel uses it.
- **Effective Production binding remains unverified.** No deployed runtime attestation was obtained. A prepared diagnostic and its CI/Preview do not clear this gate, and this task neither changes nor executes that separate PR. Resolve the binding using a separately authorized, operable verification method before migration or release.
- The earlier 21,600-second history readback was target-specific and is not a fresh verified Production release recovery point. No release snapshot/recovery branch, retention/restore evidence, runtime effective grants or current maintenance/rollback readiness is established by this documentation.

### Operational gates and ordered next actions

Reuse the recovery/transaction/no-data-loss controls in the [current expand–migrate–contract runbook](adaptive-v1-expand-release.md) and privacy/logging boundaries in the [Recovery runbook](recovery-production-runbook.md#privacy-and-logging-boundary). Their historical 0013 baseline and the [superseded 0014 cutover](adaptive-v1-production-release.md) are not Pack S instructions. No new audit, control-plane mutation, migration, recovery creation or deployment is authorized here.

| Gate | Current status and next action |
| --- | --- |
| **Publication authority / rights** | **GO only for the three original Pack S items** within recorded distribution/credit scope and the limited experiment. All 60 VSOSh adaptation rights remain unresolved; no new or expanded reproduction/adaptation basis is inferred. Do not label the catalog rights-cleared or invent a content license. |
| **External mathematics / Grade 5 educator sign-off** | **Owner exception recorded; reviews not passed.** Their absence is accepted only for this limited experimental release. Keep the educator checklist pending and AI evidence distinct. No general audience promotion, pedagogical certification or validated outcomes. First Grade 5 session: owner supervision and recorded observations. |
| **Reviewed revision / CI / PR readiness** | The restored six-doc packet must pass Node24 verification and independent read-only review; only then publish it and verify current CI/Preview before marking PR #105 ready as instructed. This is a documentation/code-review handoff, not operational release GO. No merge or Production action follows automatically. |
| **Effective Production target / access** | **NO-GO:** securely prove actual Production runtime and direct migration host/database/branch identity, runtime role/effective grants and authenticated smoke access. Candidate-only provisioning, all canonical/generated aliases and tested restoration/removal controls must be operable; rollback preview alone can omit a generated alias. Preserve Recovery settings, rate limiting and deployment protection. No DATABASE_URL change or bypass is permitted here. |
| **Fresh recovery point** | **NO-GO:** under separate authorization obtain and verify a fresh whole-database snapshot or non-expiring, cleanup-exempt, compute-free recovery branch from the verified Production branch. Record source/ID/time/LSN and retention/readiness privately; use the existing runbook's disposable verification branch/compute without moving the live endpoint. Set `RELEASE_RECOVERY_POINT_ID` only from actual verified evidence; history retention or an ID alone is insufficient. |
| **Migration 0022 before exposure** | **NO-GO:** first confirm the effective target and fresh marker/constraint state. If it matches the recorded 18-marker A–R baseline, **0022 alone is pending**. If anything differs, stop and reconcile; do not apply 0020/0021 from the superseded wrong-target audit. Under separate mutation authorization use the unchanged runner, Production identity/recovery gates and existing transaction/advisory-lock bounds (lock 5s, statement 120s). Read back migration 0022 and validated A–S/NULL receipt compatibility with existing data and expanded shape preserved. No 0014/0017, backfill or destructive down-migration is introduced. |
| **Runtime and rollback compatibility** | **NO-GO until verified:** widening the constraint preserves old receipts but introduces S identities unknown to pre-S code. Use existing integration evidence, then separately authorized candidate smoke for Finish/replay, Resume, Summary and old Packs. Prove compatible rollback can decode S pending state or prepare fix-forward; old main READY does not prove compatibility. Never delete S receipts or restore a whole DB over acknowledged learner/Recovery/background writes. |
| **UI / accessibility / privacy / learner observation** | **NO-GO for operational completion:** actual candidate/origin/device smoke must verify cookies/storage/auth, diagrams/full text equivalents/enlargement/focus/image failure, keyboard/touch and required assistive technology, plus help/retry/stop and protected reveal. Historical checks are bounded evidence; real screen-reader/child observation is not claimed. The external educator exception does not waive these checks. For the first Grade 5 session use owner supervision, guardian permission/child assent and the existing written-note/retention/stop protocol; observation cannot establish validated outcomes from one learner. |

**Next sequence:** complete docs verification and independent review, publish only the reviewed packet, verify CI/Preview and mark PR #105 ready for review under the current instruction. Keep operational release blocked on verified binding/access, recovery, exact schema/0022, compatible rollback and actual UI/accessibility smoke. The two external human sign-offs are waived only for the recorded limited experiment, not marked passed. Once technical gates can be satisfied, obtain separate bounded operations authorization for recovery verification, migration/readback and guarded runtime smoke/release. Do not merge, deploy, change Production DB or act on the separate diagnostic PR in this task. Private Pack-S-only access blockers remain unchanged; all 60 VSOSh rights remain unresolved.

## Owner decision follow-up — 2026-10-19

Recorded the explicit owner decision against PR #105 head `eab8c6fdaf0af297d6685932040a666415f3f6cf` in the existing dossier, with exact IDs, scope, limitations and a pending Grade 5 educator checklist. Updated documentation, the six original problem/media rights notes and `/sources` wording, plus focused regressions. The earlier independent review applies to its recorded implementation fingerprint, not this follow-up diff. No mathematics, SVGs, IDs, Pack definitions, migrations or learning behavior changed.

Follow-up verification used installed tool entrypoints directly under Node **22.21.1**: four focused suites (**44/44 tests passed**), TypeScript (`--noEmit`), ESLint on the four affected TypeScript/TSX files, Prettier on those files, the dossier geometry/static-asset verifier and `git diff --check`. A baseline comparison confirms catalog differences are exactly six rights-note replacements, candidate mathematics is unchanged, and SVGs/identities/Packs/migrations are untouched. `pnpm` could not start because its configured 12.5.1 native executable is a placeholder (`ENOEXEC`); the project requires Node 24. No dependency/toolchain changes, full `pnpm verify`, production build, database migration, browser or learner session were performed for this wording-only follow-up. Human and deployment gates above remain open.

## Exact task file inventory

The list includes the eight research artifacts already present at implementation intake; the main dossier and architecture proposal were updated to record the new technical authority. The two unrelated novice-entry files are excluded. No staging or publication was performed.

```text
db/migration-plan.json
db/migrations/0022_original_visual_pack_receipts.sql
docs/02-research/visual-reasoning-v1.md
docs/02-research/visual-reasoning-v1/notched-sheet.svg
docs/02-research/visual-reasoning-v1/path-via-k.svg
docs/02-research/visual-reasoning-v1/two-frames.svg
docs/02-research/visual-reasoning-v1/verification.md
docs/02-research/visual-reasoning-v1/verify.mjs
docs/03-ux/practice-shell-media-v1.md
docs/04-architecture/learning-path-v1.md
docs/04-architecture/original-content-visual-slice-v1.md
docs/04-architecture/problem-content.md
docs/05-development/content-pipeline-v1.md
docs/05-development/content-sources-attribution-v1.md
docs/05-development/visual-reasoning-v1-implementation.md
docs/README.md
public/problem-media/original-notched-sheet.svg
public/problem-media/original-path-via-k.svg
public/problem-media/original-two-frames.svg
src/app/home-practice-action.test.tsx
src/app/practice/choose/page.test.tsx
src/app/practice/choose/page.tsx
src/app/sources/page.test.tsx
src/app/sources/page.tsx
src/modules/practice/application/completed-practice-episode.test.ts
src/modules/practice/application/completed-practice-episode.ts
src/modules/practice/application/learning-path.test.ts
src/modules/practice/application/learning-path.ts
src/modules/practice/server/content-expansion-batch-2.test.ts
src/modules/practice/server/content-identities.json
src/modules/practice/server/content-scale-v2-batch-2.test.ts
src/modules/practice/server/content-validation.test.ts
src/modules/practice/server/content-validation.ts
src/modules/practice/server/learner-progress-persistence.integration.test.ts
src/modules/practice/server/migration-runner.integration.test.ts
src/modules/practice/server/original-content-provenance.ts
src/modules/practice/server/original-visual-content.test.ts
src/modules/practice/server/problem-catalog.test.ts
src/modules/practice/server/problem-catalog.ts
src/modules/practice/server/problem-media.test.ts
src/modules/practice/server/problem-media.ts
src/modules/practice/server/public-problem-sources.test.ts
src/modules/practice/server/public-problem-sources.ts
src/modules/practice/ui/pack-practice-storage.test.ts
src/modules/practice/ui/practice-session-storage.ts
src/modules/practice/ui/problem-media.test.tsx
src/modules/practice/ui/task-shell.module.scss
```

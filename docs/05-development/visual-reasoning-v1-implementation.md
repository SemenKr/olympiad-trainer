# Visual Reasoning v1 — local Pack S implementation

User-authorized technical implementation on `feature/visual-reasoning-v1`, base `5463382`. No commit, push, PR, merge, remote/database deployment or Production change is authorized or performed. The [approved technical direction](../04-architecture/original-content-visual-slice-v1.md) and [reviewed problem dossier](../02-research/visual-reasoning-v1.md) define the scope.

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

- Named human mathematics reviewer approves the exact statements, diagrams, answers, complete arguments, edge cases and alternative valid approaches.
- Grade 5 educator confirms prerequisites, Russian language and age suitability; technical accessibility checks do not substitute for learner observation.
- Owner confirms authorship credit, rights basis and intended distribution for both text and SVGs. Codex assistance is disclosed; no clearance or license is invented.
- Separate authorization for Git publication and deployment; migration 0022 must precede exposure of Pack S on any deployed database. No historic receipt deletion/down-migration is proposed.

These gates remain open even if all automated checks and independent technical review pass.

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

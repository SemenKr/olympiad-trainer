# Pack U — local candidate acceptance

Task ID not supplied; coordinated local task `original-pack-u`, 2026-11-06. Branch `feat/original-pack-u`, base `9176ba1349565f7aa10b2c8554923f85bba22cac`. Implements the [original Pack U dossier](../02-research/original-pack-u.md). Owner approved public distribution of all three original Pack U problems, including statements, hints, solutions and related materials, within Olympiad Trainer and its public GitHub repository. No open license, independent originality certification or human educator sign-off is implied. Application release/public exposure remains separately gated; Production Original-only Beta allowlist remains S/T only. Current task authorizes commit, push and PR only; merge and provider operations remain unauthorized.

## Implementation and compatibility

The three final drafts were created with `content:new`, completed with the scoped Astra mathematical proposal, then explicitly registered as `pack-u` in this order: `original-box-totals`, `original-fourteen-cards`, `original-bead-badges`. Browser metadata was generated; the independent identity guard was manually appended. A baseline comparison confirms all66previous problem identities and20ordered Pack tuples are byte-value identical. No existing problem module, persistent record, schema/migration, answer format or learning semantics changes.

Unknown future-Pack reader/History/recommendation fixtures now use unused `pack-v`; their previous assertions remain intact. U tests independently enumerate all bounded box counts, all strictly increasing card triples, and all bounded bead allocation pairs, including alternative grouping counts and both maximum constructions. Numerical assessment does not grade a learner proof. Production tests explicitly deny U projection/assessment/Finish, and the existing all-disallowed-ID test also covers its hint/solution denial. No production allowlist code changed. The Home catalog count wording was made neutral for the new count21; chooser/source inventory tests retain exact counts and ordered card identity assertions.

## Actual local validation

Node24.21.0, pnpm12.5.1, Vitest5.0.1. Existing Node24 binary and pnpm's JS launcher were used because the default macOS pnpm auto-switch launcher returns ENOEXEC. No dependency was installed or changed.

| Command/scope                                      | Result                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `content:generate`                                 | PASS; only the3new safe metadata records appended                                            |
| `content:check`                                    | PASS;7files /72tests                                                                         |
| `typecheck`                                        | PASS                                                                                         |
| Focused U/beta/tuple/History/recommendation checks | PASS;5files /105tests                                                                        |
| `test src --exclude '**/*.integration.test.ts'`    | PASS;93files /1715tests, including Practice/Finish/History/Resume storage and UI regressions |
| `test:integration`                                 | PASS;13suites /211tests, zero skips                                                          |
| `lint`, `format:check`, `git diff --check`         | PASS                                                                                         |
| Independent baseline identity comparison           | PASS;66old problem identities and20Pack tuples preserved                                     |

PostgreSQL17.11 was freshly initialized in `/private/tmp/ot-pack-u-pg.qnX7qZ`, loopback port55449, database/user `pack_u_test`. Only unchanged repository migrations were applied to this disposable database; schema-isolated tests exercised both migration histories and future-Pack compatibility. The explicit U completion case verifies receipt idempotency, History pruning and unchanged learning evidence, while existing every-Pack early Finish tests now include U. PostgreSQL18 is unavailable locally; no PG18 run is claimed. The instance was stopped after checks. No Neon, Vercel, shared database or real learner data was used.

Initial source checks found six expected stale catalog count assertions; these were updated to69problems/21Packs, and all source tests then passed. The first integration attempt used an empty public schema; after applying unchanged migrations to the disposable database, the full suite passed. These are initial implementation/validation corrections, before independent review (cycle0).

No new native-browser production-build rehearsal, hosted smoke, rollback or public application exposure is claimed. Existing storage/action/UI tests and real disposable PostgreSQL verification support this candidate. Human mathematical and educational review and separate release checks remain open; owner approval for repository and product distribution is recorded in the dossier.

## Independent review

Separate read-only Astra review on original implementation commit `5f9ea52de0d7e04a4d886bcd34b093415d4d9b0d`: **PASS**, Critical 0 / Major 0 / Minor 0. The reviewer inspected all 24 files and independently checked answers 11/8/9, exhaustive cases, bounds, maximum constructions, corpus overlap, beta security and persistence compatibility. AI review is not independent human mathematical, educational or originality certification. Re-review of correction commit `04e89c2be8b8f363ab19aba3300f09782df127b7`: **PASS**, Critical 0 / Major 0 / Minor 0; all seven changed files were inspected, with no change to problem semantics or compatibility behavior. The reviewer independently confirmed the owner approval wording and limits, updated assertion and aligned documentation. Owner approval for repository and product distribution is recorded in the dossier; human mathematical/educational review and separate release checks remain pending.

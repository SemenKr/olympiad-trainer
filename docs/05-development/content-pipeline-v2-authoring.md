# Content Pipeline v2 — authoring

The server-only `problem-catalog.ts` remains authoritative. Pack U brings the catalog to 69 problems and 21 Pack A–U tuples, preserving all 66 existing problem identities and A–T tuples. On 2026-11-06, the owner approved public distribution of all three original Pack U problems, including statements, hints, solutions and related materials, within Olympiad Trainer and its public GitHub repository. This grants no open license and implies no independent originality certification, human educator sign-off or Production release approval. Pack U remains excluded from the Production Original-only Beta, which admits S/T only. Pack T public distribution is separately owner-authorized for Olympiad Trainer and its public GitHub repository on 2026-11-03. The original Pack S and T definitions use separate modules; the older definitions stay in the catalog. New definitions use one small TypeScript module per problem and an explicit import in `new-problem-modules.ts`.

## Create and review a problem

1. From a dedicated feature branch, run `pnpm content:new <lowercase-kebab-case-id>`. The command rejects malformed and known IDs and creates `server/problems/<id>.ts`. It contains only an ID, grade, subject and empty title/statement. It has no answer or source data and is not imported by the catalog, so it cannot appear in learner content. Do not import the draft.
2. Confirm source and usage rights. Complete the mathematics and references with human review under the [v1 authoring rules](content-pipeline-v1.md). Complete that same module and export an object with `satisfies ProblemDefinition` from `../problem-catalog`. Include assessment, three ordered hints and solution. A sourced VSOSh task needs original and official-solution references; original project content needs explicit authorship, rights note, private dossier path and an `original-explanation` solution. The training interpretation is separate from source facts. An incomplete module should fail typecheck or content validation.
3. Import that module in `server/new-problem-modules.ts` and append it once to `NEW_PROBLEM_DEFINITIONS`. This is the only problem registration step. Do not add browser metadata manually. Registration alone makes the definition addressable through the server catalog, so only register a reviewed task when an approved entry point is ready. For ordinary Practice, append a reviewed Pack tuple with exactly three distinct problem IDs and a learner-safe name to `application/completed-practice-episode.ts`; update the independent identity guard and exact Pack tests. If the task belongs to another approved entry point, wire that entry point explicitly. Do not silently modify an existing Pack tuple.
4. Run `pnpm content:generate`, then `pnpm content:check`, `pnpm typecheck`, and applicable repository checks. `content:generate` writes `ui/browser-problem-metadata.generated.ts` from the catalog. `content:check` validates definitions and the independent `content-identities.json` guard, checks exact generated-file freshness, and runs authoring plus Resume/History storage regressions. Review the generated diff. It includes only IDs, title, ordered hint IDs, solution ID and visible option IDs; it must not include answers, hint or solution text, checkpoint correctness or provenance.
5. Have an independent reviewer inspect the exact diff and a human verify mathematical correctness, source correspondence, adaptation and rights. Only then expose the entry point. Append reviewed identities to `content-identities.json` manually as an independent append-only guard; never generate or rewrite the baseline to make validation pass. Existing identities and ordered Pack tuples remain immutable without a separately adopted compatibility plan.

## Add a Pack after migration 0023

Migration order is `0021_content_expansion_batch_2_pack_receipts.sql` → `0022_original_visual_pack_receipts.sql` → `0023_pack_id_format.sql`. Migration `0023` replaces the receipt ID enumeration with a bounded lowercase `pack-` kebab-case format (6–64 characters). It does not register a Pack: the server Finish writer still requires the reviewed tuple, its ordered completed prefix, canonical facts and learner ownership. Once `0023` is applied, an additional well-formed Pack needs no per-Pack SQL migration. The format migration must precede any application version that can write that Pack's Finish receipt. Never edit applied migrations or auto-regenerate `content-identities.json`.

Before exposing a Pack, review its content and rights, the immutable tuple, browser metadata privacy, server reader/writer behavior, old-build browser preservation and release-specific rollback. Run `pnpm content:generate`, `pnpm content:check`, `pnpm typecheck` and focused Pack, Finish, History, Resume and Progress tests; use disposable PostgreSQL for integration tests. A structurally valid future receipt can be stored by SQL but an older server cannot verify or write it. The [browser recovery compatibility slice](content-pipeline-v2-browser-recovery.md) protects plausible future Pack browser state during an application downgrade; it does not establish full Production rollback readiness. The fixture tests create drafts in temporary directories and compose a new definition in memory; they do not register a learner problem. No Production or Neon action is part of these commands.

The earlier authoring acceptance exercise used a disposable Pack T with three synthetic original problems. One was created by `pnpm content:new` and completed in place; the others supplied the two additional distinct Pack slots. The fixture explicitly registered all three definitions and the Pack tuple, generated 66 browser metadata entries, and manually appended the three problem identities and one Pack identity while preserving the approved 63/19 prefix. None of that fixture content is retained. The real original Pack T candidate uses different IDs and the complete workflow below. Inventory tests intentionally pin the total and must be updated when a Pack is added; unknown-future fixtures must remain unregistered (the current tests use V). The 21 ordinary Packs contain 63 distinct problems with no reuse between Packs; six catalog problems are outside those Packs. Reusing a problem in a new Pack would change that inventory pattern and needs separate learning-semantic review. `content:check` checks the authoring and storage subset; run the broader Practice tests and disposable PostgreSQL integration tests for a new Pack.

## Real original Pack T — local candidate

See the [authoring dossier](../02-research/original-pack-t.md) and [verification/friction record](original-pack-t-acceptance.md). All three drafts were created in their final directories:

```sh
pnpm content:new original-linked-code
pnpm content:new original-signal-flags
pnpm content:new original-two-color-pairs
# Complete each module, review its content/provenance, explicitly register the
# definitions and Pack tuple, and manually append the independent identities.
pnpm content:generate
pnpm content:check
pnpm typecheck
# Use only a migrated disposable DATABASE_TEST_URL for database verification.
pnpm test src
pnpm test:integration
pnpm lint
pnpm format:check
pnpm build
pnpm test:metadata
```

No migration or handwritten browser metadata is needed. The existing chooser includes registered Packs automatically, after the existing first-core-training gate. Local registration is for review/testing only: do not deploy this branch or assume an `original` provenance tag grants publication approval. An original-only public beta needs a separately approved server-side exposure policy; hiding links cannot enforce it.

For release integration, the Content Pipeline v2 integration branch already contains Pack S from PR #105. Choose one reviewed integration change to land; do not merge PR #105 and then land the same Pack S files again from the v2 branch. Keep PR #106's Production binding diagnostic separate. Apply `0022` before `0023`, and apply both before a server version that writes future Pack receipts. A Production migration, merge, deployment and rollback plan each require their own release decision; a local Pack T exercise does not clear those gates.

## Original Pack U — local candidate

See the [math/rights dossier](../02-research/original-pack-u.md) and [acceptance record](original-pack-u-acceptance.md). Three drafts were created with `content:new`, completed in place, registered explicitly and appended to the independent identity guard. Numerical answers are11,8,9; explanation quality is not automatically graded. Existing A–T identities and tuples remain unchanged; future-Pack tests use unregistered V. Production Original-only Beta continues to admit S/T only. Owner approval covers Pack U distribution in the named product and repository; Production release and public application exposure require separate approval and verification.

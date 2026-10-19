# Original content + visual slice v1 — contract proposal

Status: **TECHNICAL DIRECTION ADOPTED for local implementation** by the explicit “Implement Pack S” user instruction, 18 October 2026. Base: `5463382`. Human mathematics and age-suitability approvals remain **release gates**, not prerequisites to this authorized local integration. The owner approved Pack S distribution and public Codex credit on 2026-10-19; see the [dated dossier decision](../02-research/visual-reasoning-v1.md#owner-distribution-and-credit-decision--2026-10-19) for exact IDs, revision, scope and limitations. No Git publication or deployment action is authorized by this local update. The proposal below records the adopted scope; implementation evidence and exact changes are in the [implementation record](../05-development/visual-reasoning-v1-implementation.md). See the [three original candidates and learner criteria](../02-research/visual-reasoning-v1.md), [problem boundary](problem-content.md), [Content Pipeline](../05-development/content-pipeline-v1.md), [media UX](../03-ux/practice-shell-media-v1.md) and [attribution contract](../05-development/content-sources-attribution-v1.md).

## Observed restrictions and smallest recommended change

`server/problem-catalog.ts` defines `ProblemProvenance` as VSOSh/Moscow/Grade 5 mathematics with a restricted academic-year union, stage, archive, positive task/optional variant and I/IS PDF references. `content-validation.ts` checks those facts and both PDF references. Making these fields optional globally or putting fictitious VSOSh facts on an original item would violate the boundary.

Use an additive, explicitly checked original branch, preserving every existing definition byte-for-byte. Rename the existing type to `VsoShProblemProvenance` without changing its fields, then define the union below (illustrative TypeScript, not implemented):

```ts
type OriginalProblemProvenance = Readonly<{
  kind: "original";
  subject: "mathematics";
  grade: 5;
  authorship: string;
  rightsNote: string;
  dossierPath: string;
}>;
type ProblemProvenance =
  | (VsoShProblemProvenance & Readonly<{ kind?: "vsosh" }>)
  | OriginalProblemProvenance;
```

Dispatch only `kind === "original"` to the new checks; only absent/`"vsosh"` to the unchanged source checks, and reject any other kind. An absent kind is the explicit backwards-compatible legacy VSOSh form; it must never fall through as original. No broad `Partial`, nullable official metadata, generic URL escape hatch or fake academic year. Original branch disallows all VSOSh-only fields in TypeScript and rejects their presence in validator fixtures as well: olympiad, academicYear, stage, region, sourceArchive, problemNumber, variant, originalSource, officialSolution. `subject`/`grade` must still match the problem. Nonempty authorship/rightsNote must describe actual project/AI assistance and an owner-confirmed basis, not imply an official source. `dossierPath` must be a safe repository-relative `docs/02-research/*.md` path, no traversal, remote URL or fragment; authoring validation checks its existence without publishing it. Do not put the server key/solution in public provenance.

These strings record evidence; they do not constitute approval flags. No approval subsystem, CMS or generic content importer is needed. Human revision-specific sign-off stays in the dossier under the pipeline. All three candidates still require human mathematics and educator approval before release. Provenance now records the 2026-10-19 owner permission for Pack S text, SVGs, hints and explanations in Olympiad Trainer and its GitHub repository, with approved Codex credit. This permission is not an open license or independent originality verification and does not clear the 60 sourced problems. For the original branch, there is no I/IS or official solution; the protected project explanation is its own training solution.

`TrainingSolutionDefinition.kind` currently permits only `"training-adaptation"`, enforced by validation. To avoid labelling an original explanation an adaptation of an official key, add `"original-explanation"` and require it for original provenance; keep `"training-adaptation"` required for legacy/explicit VSOSh. This server-only tag is omitted by existing reveal projections; hint, solution and assessment IDs/contracts do not change.

## Media reuse and one additional provenance branch

Reuse `LearnerSafeProblemMedia` **unchanged**: `diagram`, local `/problem-media/...svg`, positive intrinsic width/height, title/caption/alt and `enlarge: true`. Reuse the current image loading/error behavior and named enlarge dialog. These SVG prototypes are in research, not `public/`; future approved assets copy only the statement figure, never the dossier or verification scripts. SVG title/description contain only condition facts. Static trusted SVGs contain no script, remote resources, animation, foreignObject, answer key or hidden solution layers.

`server/problem-media.ts` currently requires `{ sourceUrl, rightsNote }` and optional page/crop; its projection executes `new URL(sourceUrl)`. The original prototypes have no genuine HTTPS source URL, so problem provenance alone is insufficient. Add an additive media provenance union: existing sourced branch with `kind?: "sourced"` and unchanged sourceUrl/page/crop validation, or `{ kind: "original"; authorship: string; rightsNote: string; dossierPath: string }`. Require matching original problem provenance for this slice, same validated dossier path and authorship; reject sourceUrl/page/crop on original media, reject original provenance for `pdf-excerpt`, reject unknown kinds. Preserve all existing sourced-media checks, including positive PDF page and crop. An official-derived figure must remain sourced even if redrawn. Do not fabricate a repository HTTPS URL to satisfy the old parser.

The text equivalent is both `alt` and explicit visible statement facts. This deliberately handles the existing failure state, which hides the image/alt but retains caption: no new long-description field or UI component is necessary. Review verbosity on screen readers with the real content. Enlarge is useful, but the figure cannot rely on label reading at a small preview size alone. Prototype dimensions: 560×420, 560×440, 560×440. Future src paths: `/problem-media/original-two-frames.svg`, `/problem-media/original-notched-sheet.svg`, `/problem-media/original-path-via-k.svg`.

## Attribution consumer must change in the same slice

`public-problem-sources.ts` currently dereferences `originalSource.url` for every registered definition; simply widening the type breaks `/sources`. Return an explicit learner-safe discriminated union for sourced versus original entries. Preserve all existing public sourced facts and PDF links. For original entries expose only `kind: "original"`, problemId, title and owner-approved public authorship credit (no internal dossier path, rights-review notes, solution references, expected answer, hints, checkpoints or provenance spread). The `/sources` page renders an original-project-content label and credit without year/stage/region/task/PDF placeholders. Adjust its introductory/count wording so it does not call original candidates archived VSOSh tasks or apply source-rightsholder statements to original figures. Preserve current unresolved rights status for all sourced material. No external links or rights findings need investigation for this local contract proposal.

## Pack, receipt and identity compatibility

Recommend one new ordinary `pack-s`, learner name `Рисунки и рассуждения`, ordered tuple:

1. `original-two-frames`
2. `original-notched-sheet`
3. `original-path-via-k`

Confirm `pack-s` is still unallocated at implementation time. Register once in `PRACTICE_PROBLEM_DEFINITIONS` and append once to `PRACTICE_PACKS`. Three new nonnegative-integer answers; three hints each with stable suffixes `-hint-focus`, `-hint-strategy`, `-hint-next-step`; each solution ID `<problem-id>-full-solution`; no options/checkpoint. Append reviewed identity entries manually to `content-identities.json`; retain every old entry and A–R tuple. Never regenerate the guard to silence validation. Existing 60 problem IDs and 18 Packs remain identical; new total is 63 and 19 only after approval. Preserve all existing response kinds, option IDs/order, hint IDs/order, solution/checkpoint IDs and existing answer/adaptation behavior.

No content/media table or browser-storage schema migration is needed. Browser Pack identity is the exact ordered tuple; existing validation derives accepted tuples from the registry. Current `0021_content_expansion_batch_2_pack_receipts.sql` permits `pack-a` through `pack-r` in `practice_finish_receipts_pack_id_check`. A new Pack requires **one forward SQL migration** (use next free number, currently `0022_original_visual_pack_receipts.sql`) widening only this constraint to include `pack-s` and retaining NULL and A–R. Register it after 0021 in the shared `base` list in `db/migration-plan.json`; do not edit earlier migrations or rewrite receipts. Deploy/apply it before exposing S for durable Finish. Verify both supported adaptive migration histories plus upgrade from released 0021, receipt replay/idempotence and old Pack completion. No migration is run by this task. Constraint rollback must not strand existing S receipts; do not promise a down migration that deletes learner data.

Leave `application/learning-path.ts`, adaptive candidate registries/capability mappings, checkpoints, Knowledge Support and Simulation selections unchanged. Pack completion retains the existing no-capability-evidence rule. A new original problem is not automatically an official simulation item, adaptive carrier, transfer probe or prerequisite. Preserve old progress, XP, support-exposure and adaptation semantics; do not backfill/reclassify historic episodes.

## Exact next implementation scope after human adoption

Implementation consumer findings: `ui/practice-session-storage.ts` needs three additive learner-safe metadata entries for Resume. The chooser previously iterated only `LEARNING_PATH_V1`, and the path total used all registered Packs. To preserve the adopted 18-step path while making S selectable, the local implementation appends non-path cards in the chooser and derives the path total from its own entries. It does not append S to the editorial sequence or alter next-step selection. These are required compatibility fixes within the authorized Pack integration, refining the earlier recommendation to leave the path file entirely untouched.

One coherent slice: the two server provenance branches and validation, solution tag, safe attribution rendering, three approved definitions/static assets, one appended ordinary Pack, appended identity guard entries, one receipt constraint migration/plan entry, focused tests and corresponding amendments to the pipeline/problem/media/attribution docs. No dependencies, new response mode, taxonomy, curriculum engine, worked-example runtime, additional Pack, adaptive selection change, proof scoring or catalog cleanup.

Expected edited paths (existing conventions; names confirmed at implementation): `src/modules/practice/server/{problem-catalog,problem-media,content-validation,public-problem-sources}.ts`; `src/app/sources/page.tsx`; `src/modules/practice/application/completed-practice-episode.ts`; `src/modules/practice/server/content-identities.json`; three `public/problem-media/original-*.svg`; one `db/migrations/0022_*.sql` plus `db/migration-plan.json`; relevant existing test files and four contract documents linked above. Extra consumer changes require demonstrated compile/test need inside the same behavior, not a speculative refactor. Root remains responsible for unrelated-work protection and independent read-only review.

Focused validation plan:

| Risk | Checks required in implementation |
| --- | --- |
| Provenance loophole | Positive fixtures for legacy/explicit VSOSh and original; reject unknown kinds, missing original evidence, fake/mixed official fields, traversal/missing dossier, mismatched grade/subject and incorrect solution tag. Existing malformed VSOSh I/IS, positive pages/task checks still fail exactly as before. |
| Media and protected boundaries | Existing sourced/PDF checks remain; original image succeeds only with valid authorship/dossier and compatible kind; mixed metadata rejected. Assert exact learner-safe projection; no keys, unopened help or private provenance. Assert local path, dimensions and condition-only title/caption/alt; inspect SVG contents and rendering. |
| Attribution | All 60 existing sourced entries keep their facts/links; three original entries render without official metadata/PDF. Safe explicit keys exclude dossier/rights notes/answers/help. Preserve identity-independent `/sources` access and sourced rights wording. |
| Three authored items | Content validator; exact answers 8, 27, 9; three ordered hints and protected solution resolution per ID; independent grid membership, polygon area and exhaustive path checks. Review full reasoning and alternative valid approaches manually. |
| Saved identity | Compare all original 60 definitions' identity entries and 18 tuples byte-for-byte with prior baseline; append only. Old snapshots restore; new exact tuple restores; wrong-order/partial/unknown tuple rejected. |
| Durable completion | New S receipt accepted only after migration, A–R/NULL preserved; both adaptive histories and released-0021 upgrade; replay creates no duplicate facts/XP; Finish → Summary/History/Progress and resume retain existing behavior. |
| Learning boundaries | New IDs absent from unchanged adaptive/Simulation/checkpoint registries; ordinary Pack emits no new capability evidence; help/retry/exposure semantics unchanged. |
| Learner presentation | Real three SVGs at 320/375px and desktop, screen reader conditions, media failure with sufficient visible text, load/cached load, enlarge/Escape/close/focus. Test at least one actual end-to-end new Pack session and an old Pack restore/Finish. |

Run `pnpm content:validate`, affected Vitest/integration suites, then `pnpm verify` once near acceptance. Use existing migration-test setup; report unavailable DB/browser checks as gaps, never pass by assumption. These are future checks, not executed runtime evidence for this research task. Current verification is bounded to research artifacts and independent read-only review.

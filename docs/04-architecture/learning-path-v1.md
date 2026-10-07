# Learning Path v1 — Guided Grade 5 Practice

Status: Adopted contract; merged into `main` in PR #72 (`979887b`). Deployment status is environment-specific.

## Meaning and editorial sequence

Learning Path is optional navigation through existing ordinary three-problem Packs. The adopted editorial order is **A → J → H → L → D → G → E → I → C → B → F → K**. It is not a curriculum, prerequisite graph, difficulty progression or mastery model. All Packs remain selectable and repeatable. Descriptions are our orientation copy, not official VSOSh metadata.

`LEARNING_PATH_V1` references stable Pack IDs; names and exact task tuples come from `PRACTICE_PACKS`. J/K/L display names are `Считаем и сравниваем`, `Выводы и доказательства`, `Порядок и варианты`, without technical prefixes. Existing Pack IDs, routes and tuples remain unchanged.

The deterministic projection chooses the earliest entry without a recorded completion. It deduplicates Pack IDs and derives the recorded count and all-recorded state; no cursor, percentage, progression table or recommendation score is stored. Journey XP/levels/badges remain separate projections of participation.

## Durable source of truth

A completion marker means only a **successfully persisted Pack Finish**, including early Finish, skipped tasks, incorrect-only work or solution exposure. It does not mean all tasks were solved, independently solved, or a topic mastered.

Migration `0011_learning_path_pack_receipts.sql` adds nullable `pack_id` to `practice_finish_receipts`. The server derives it from a validated nonempty ordered prefix of the registered tuple (one to three opened tasks) after validating the completed episode, only for `mode: pack`. Clients cannot submit a Pack identity or learner ID. SQL constrains non-null IDs to the twelve registered Packs and requires non-null `episode_mode = pack`; other and legacy modes keep null.

The marker is inserted in the existing learner-row-locked Finish transaction alongside history, evidence, XP and the receipt. No partial marker survives rollback. The immutable contribution hash and retry request stay unchanged. Identical retries return the stored result; changed payloads conflict. Retry never annotates a pre-v1 receipt or recreates pruned history.

Reads use learner-scoped Finish receipts, validate Pack IDs/modes and deduplicate identities. They do not derive markers from Recent History, XP, answers, capability evidence or browser-local Summary. Pruning completed episodes cannot remove a receipt marker.

**No backfill.** Existing receipts retain null `pack_id`, including on matching retries. Such history is unknown for Path purposes, not proof that a learner never practised. No old episode, answer or completion is reconstructed. Local Practice drafts and latest Summary keep their existing format. The Summary renderer identifies ordinary Pack summaries from their validated nonempty ordered registered prefix, while Review remains explicit; only Pack mode with a matching durable marker offers guided continuation.

## Navigation and learning boundaries

Home precedence: unfinished Practice (Resume/recovery/explicit Finish) → existing adaptive recommendation → fresh core Practice → guided Pack for returning learners. When every Pack is recorded, offer free choice/repeat. This explicitly supersedes `HOME-FALLBACK-v1` for returning learners.

Summary only offers a Path continuation for Pack mode with known durable completion. Core, transfer, exploration and Review summaries retain Home as their primary destination. A Path read failure falls back to Home without manufacturing completion or a next step.

Progress displays evidence, Path and Journey separately. Existing capability interpretations, adaptive priorities, Review, XP earning and Simulation contracts remain unchanged. Pack participation creates no capability or adaptive contribution. Browser-attested Practice facts remain browser-attested; this feature does not establish server-authoritative mathematical assessment.

## Migration and verification

Run `pnpm db:migrate` against each deployment environment before serving this revision. The explicit runner registers 0011 and wraps migrations transactionally; no migration executes per request. Existing rows remain null. Do not run integration tests against production: use a separately migrated `DATABASE_TEST_URL`.

Targeted coverage includes editorial ordering, duplicates/out-of-order finishes, Home precedence, Pack-only Summary, null receipt reads, boundary validation, guide retry and evidence separation. PostgreSQL integration cases cover Pack retry/conflict, pruning survival, old-null retry, SQL mode constraints and concurrent/repeated Finish. Those cases establish database behavior only when actually executed with the test database; skipped cases are a verification gap.

No accounts, parent view, new tasks/support topics, CMS, dependencies, curriculum locks, mastery/difficulty claims, new rewards or Simulation changes.

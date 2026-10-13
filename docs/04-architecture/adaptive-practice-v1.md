# Adaptive Practice v1 — Explainable Next Useful Work

## Adopted scope

One deterministic next-problem recommendation is derived from durable, validated Practice evidence. Manual Pack choice and Learning Path remain available. This contract supersedes the selection, exposure guards, Pack-history eligibility and receipt rules in [adaptive v0](adaptive-practice-v0.md); existing Practice modes, content and transitions remain in use.

Observed facts, interpretation and mastery remain distinct. Checkpoint choices support only bounded argument **recognition**, not independent proof construction or mastery. Unknown evidence is not weakness. There is no numeric recommendation/mastery score, difficulty scale, prerequisite graph, elapsed-time forgetting claim or ML/LLM selection.

## Bounded registry and evidence

`ADAPTIVE_RULES` in `domain/adaptive-recommendation.ts` is the ordered three-target registry. Its literal target and purpose types are the domain vocabulary for this slice.

| Order within a category | Source                  | Target                      | Capability                           | Purpose                      |
| ----------------------- | ----------------------- | --------------------------- | ------------------------------------ | ---------------------------- |
| 1                       | `table-impossible-sums` | `brothers-ages-products`    | `impossibility-argument-recognition` | `test-transfer`              |
| 2                       | `guaranteed-sock-pair`  | `parrots-guaranteed-colors` | `guarantee-argument-recognition`     | `test-transfer`              |
| 3                       | —                       | `pages-without-digit-one`   | `complete-enumeration-recognition`   | `explore-unknown-capability` |

These are existing, separately checkable recognition carriers with existing hints, protected solutions and checkpoints. The remaining content has no adopted adaptive mapping; Pack answers alone cannot establish these capabilities. Broader remediation, reinforcement, independent construction and forgetting purposes are unsupported and excluded.

For a transfer, the latest retained, canonically reverified checkpoint observation **for its source** must be correct. A later incorrect source observation suppresses that transfer until a newer correct source observation. Main-answer correctness alone is insufficient. Sequences order facts inside their capability bucket; independent buckets are never chronologically compared.

Select eligible transfers whose latest source checkpoint followed hint exposure first, then eligible unhinted transfers. Within either category, table → brothers precedes sock → parrots. Hint priority is an explicit categorical product policy, not evidence of weakness or a calibrated measure of learning benefit.

Only when no transfer qualifies may pages be offered. It requires a durable non-Review Practice Finish receipt (including Pack and legacy null-mode receipts), no retained enumeration checkpoint observations of either outcome, and an open pages target. Incorrect-only enumeration evidence is known evidence, not unknown. Imported facts or a local Summary alone do not satisfy the durable-Finish prerequisite.

## Target closure and legacy compatibility

A target is closed exactly when its learner-scoped row exists in `practice_adaptive_target_usage`. This four-column ledger stores `learner_id`, `problem_id`, nullable `source_session_id`, and `recorded_at`. The primary key is learner/target; a bounded check admits only the three registered targets. The nullable composite FK references that learner's Finish receipt, with RESTRICT deletion/update. A unique learner/source-session index prevents one session supplying two target identities. No FK references prunable history. The learner FK is also RESTRICT.

A row records known prior target use or Finish, not necessarily an attempt, completed episode, successful answer, interpretation or mastery. New adaptive Finish inserts it atomically with the receipt, including skip and hint-only Finish. Existing rows never change during runtime. Computing or opening a recommendation does not close a target. `recorded_at` is the recording time, never an inferred first encounter.

Migration `0014_adaptive_target_usage.sql` unions only provable legacy facts: either old target-specific flag; validated, canonically assessed target checkpoints of either outcome; and structurally validated adaptive completed episodes joined to receipts by **both learner and session**. Receipt mode must match or be legacy null. Episode validation includes exact keys/version, one registered target, correct mode, count/outcome consistency, hint prefixes, skip/solution constraints and checkpoint identity/shape. Malformed, contradictory, unmatched or already-pruned episodes supply no candidate. Invalid live evidence aborts migration rather than being silently discarded.

Backfill groups learner/target candidates, choosing the earliest supporting receipt by created_at/session_id when one exists; otherwise source_session_id stays null. All migration rows use the transaction timestamp. Bidirectional coverage assertions precede any flag removal. Their only required runtime effects—closure and returning-user detection—are preserved by the ledger; the obsolete attempted/exposure marker distinction is intentionally not archived. Existing evidence, receipts, hashes and completed history are unchanged. The migration's SQL validators freeze the supported evidence and canonical checkpoint contracts; integration fixtures protect their equivalence. No application/client code imports migration SQL.

The original 0014 remains immutable where applied. For production at 0013, additive 0015 repeats its factual backfill while retaining the six flags, and 0016 installs temporary old-writer capture triggers. The runner executes both on one connection and transaction under learner/episode write locks; its bookkeeping commits with them. An existing 0014 environment receives only 0016. Later, separately gated 0017 removes capture triggers and flags after old-writer retirement. A protocol-compatible v1 rollback build keeps v2 Finish decoding and ledger writes while suppressing adaptive entry. No applied migration is rewritten.

A null-mode receipt alone never identifies a target. Unresolved history does not block all recommendations and has no per-target unresolved state. A previously seen target without surviving identifying facts may be offered again; the UI never says it was never seen. Identical Finish retries do not annotate missing usage rows or recreate pruned history.

## Learner projection and flow

The learner-safe recommendation DTO contains only `status: recommendation`, `problemId` and a factual Russian `reason`. The shared presentation maps the registered ID to its title and existing route. It exposes no source evidence slots, sequences, option IDs, protected answers, strategies or score. Transfer wording describes the saved correct explanation choice and whether hints preceded it. Exploration says this progress section has no saved reasoning checks, not that the learner lacks the ability or has never seen the task. Both surfaces state that a suggestion is not an assessment of knowledge.

The pure domain result distinguishes `no-eligible-target` and `all-targets-closed`; neither means mastery or overall completion. The learner projection returns only `status: none` for both. The pure input contains latest per-source checkpoint outcome/hint presence, enumeration-observation presence, durable Practice-Finish presence and closed target IDs; it has no persistence/framework dependency.

Home precedence: verified unfinished snapshot / pending Finish → adaptive recommendation → fresh core Practice → next Learning Path Pack for a returning learner → manual choice/repeat. A verified local Summary can establish returning status, but cannot create an adaptive recommendation.

Progress shows evidence first, then the same next-work precedence and shared recommendation card. `application/next-practice-work.ts` owns the common decision, including a retryable Path-read error rather than interpreting failure as exhaustion. Learning Path and manual choice remain available; Review is a separate secondary action. Review, Simulation and Journey do not contribute adaptive evidence or target markers. Pack Finish can supply participation history only, without creating capability facts. Path completion rules and XP earning remain unchanged.

The existing transfer route (with the pages exploration mode where applicable) re-reads server availability immediately before creating a new local snapshot. If the selected target changed, no session is created; a focused “Предложение изменилось” state offers retry and navigation. An existing validated unfinished snapshot resumes first even if current eligibility differs. This is an entry-time check, not a database reservation against every later cross-device change.

Invalid evidence or read failure produces a retryable error, not an empty recommendation. No recommendation is persisted merely because it was computed. Identical durable state yields the same recommendation on Home, Progress and entry revalidation.

## Persistence, boundaries and files

The learner-row-locked Finish transaction checks authentication/generation/expiry and immutable receipt replay before mutable Review source state. Identical retries return the original award without writes; changed hashes conflict. New writes append eligible evidence, retain completed history and Journey rules, create the receipt and insert ledger closure. Pruning cannot delete closure; failure anywhere rolls everything back. Concurrent finishes of the same target may each commit their receipt, while only one closure row exists. Already-started work is not rejected because another device closed its target.

New local Finish requests carry version 2 and derive target identity from validated completed episode facts; they omit redundant adaptive flags. Their hash includes the version, ordered contributions, episode mode and facts. Historical unversioned requests retain their exact decoder and hash recipe, including the brothers-specific two-field shape and pages' old attempted marker semantics. Both first submissions and retries remain accepted. Existing pending bytes are never rewritten. Legacy browser-only Finish recovery/import order, local Summary, snapshots, owner envelopes, generation/recovery and Web Locks remain intact.

Legacy import atomically inserts sessionless closure for validated target checkpoints but never creates a Finish receipt. Ledger existence establishes returning-user status, not the durable Practice-Finish prerequisite. Pack Finish supplies that prerequisite but no capability evidence. Review, Simulation and Journey do not supply adaptive evidence/closure.

**Production release gate:** drain/block old application reads/writes before backfill and flag removal, then activate the new application. The migration advisory lock coordinates migration runners only. Old/new servers cannot coexist against the contracted schema, and rolling application code back alone is unsafe. Preserve browser work through reload; new servers must accept historical pending requests. Production mutation/cutover is outside this implementation task.

The environment-bound Preview database guard and attended production sequence are specified in the [Adaptive v1 expand release procedure](../05-development/adaptive-v1-expand-release.md). A Preview build without its isolated database fails before deployment.

Implementation ownership:

- `domain/adaptive-recommendation.ts`: registry, pure input/output and categorical selection.
- `application/adaptive-recommendation.ts`: evidence adapter and learner-safe projection/presentation.
- `application/next-practice-work.ts`: shared Home/Progress precedence.
- `server/learner-progress-persistence.ts`, `progress-schema.ts`: validated learner-scoped reads, atomic import/Finish writes and receipt-first replay.
- `db/migrations/0014_adaptive_target_usage.sql` (existing contracted history), `0015`–`0017` and `scripts/migrate-db.mjs`: additive backfill, temporary capture, later contract and runner guards.
- `ui/practice-session-storage.ts`: versioned new requests, unchanged historical decoders/payloads.
- `ui/adaptive-recommendation.tsx`, `ui/progress-next-useful-work.tsx`, Home/Progress: common action and explanation.
- `ui/practice-session.tsx`: existing-snapshot precedence, pre-creation revalidation and canceled/stale-entry handling.

## Verification and remaining gaps

| Contract                                                                                       | Verification                                                              |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Source eligibility, hinted/unhinted priority, stable ties, unknown ≠ incorrect, closed targets | Domain matrix and existing adaptive/evidence tests                        |
| Skip/hint-only closure, pruning survival, identical retry / changed-payload conflict           | Disposable PostgreSQL integration                                         |
| Exact legacy backfill, malformed/unmatched null compatibility, SQL constraints                 | Isolated pre-0014 schema migrated in integration tests                    |
| Shared Home/Progress explanations, Resume and Path fallback, safe DTO                          | UI/projection tests                                                       |
| Changed recommendation cannot create a snapshot                                                | Deferred entry-read tests for all three targets                           |
| Finish, Path, Recovery, Review, Simulation and protected content regressions                   | Existing full suites, strict PostgreSQL integration selection             |
| Framework/style/type/metadata compatibility                                                    | `pnpm verify` (includes production build and metadata checks), diff check |

This is safe as a bounded deterministic product slice, not a validated pedagogical recommender. Hint-priority usefulness still needs learner research. Existing evidence is browser-attested with canonical checkpoint reverification, not server-authoritative independent assessment. Pruned unresolved legacy history cannot be reconstructed. Unfinished drafts and latest Summary retain their existing device-local Recovery limitations. No new content, grade, Foundations, parent accounts, CMS or new routes/modes are introduced.

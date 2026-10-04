# Review / Reconfirmation v0

## Adopted behavior

Reconfirmation means only a later separately recorded attempt at the same carrier with explicit provenance to an earlier episode. The v0 carrier is `coinciding-seats` (Совпадающие места). An eligible source is a durable completed `core` episode where this carrier was eventually correct and its full solution was not exposed. Hints remain support facts; they do not disqualify the source.

Each source has at most one Review. The server selects the newest eligible unreviewed source by `completed_at DESC, session_id DESC`; the client cannot select or submit `reviewSourceSessionId`. Review is a fresh one-problem attempt with mode `review`. A skipped Review consumes the opportunity when its normal explicit Finish completes. Incorrect answers do not erase earlier facts or create weakness evidence. A solution-exposed attempt is described as having opened the full solution, never as unsupported work.

Review produces no capability evidence, adaptive facts, checkpoint contribution, mastery, transfer or forgetting claim. It does not change adaptive recommendation eligibility or precedence. It appears in broad Practice history and earns the standard engagement-only Journey award (10 XP for a problem with a valid submission; a Skip-only attempt earns zero). There are no correctness bonuses.

Home keeps Resume and adaptive primary actions and exposes Review as a secondary entry when no local session is active. Progress exposes a separate Review entry. Practice, pause/resume, Skip, explicit Finish, failure/retry and latest Summary reuse the existing machinery. The new route is `/practice/review`; existing unfinished sessions still take precedence on this route. No available source produces an explicit empty state; Practice import/database errors use the existing retry state. A secondary availability-read failure on Home or Progress shows its own retryable Review section while preserving the primary action, capability sections, Journey and history.

## Persistence and integrity

Migration `0009_practice_review.sql` adds the mode and nullable server-owned `review_source_session_id` to completed episodes. Non-Review episodes have null provenance; Review requires non-null provenance. A separate `practice_review_assignments` record binds the server-issued attempt ID to an owned source. Its learner/source unique constraint and the completed-episode partial unique index enforce one Review per source. The composite source foreign key preserves ownership and prevents dangling reservations.

Start locks the learner row before selecting and reserving the source. Concurrent starts reuse the same unfinished reservation. If browser storage is lost, the reservation returns the same attempt ID; no new source is consumed. Start does not persist drafts or expose answers. At Finish, the same learner lock serializes the assignment/source eligibility check, episode/provenance, Journey award and immutable receipt. A reserved session cannot be finished as another mode or without episode metadata. Unreserved or foreign sessions cannot be finished as Review. Client-supplied provenance and Review evidence/adaptive/checkpoint payloads are rejected. Identical Finish retries reuse the existing award; changed facts conflict.

Sources remain eligible only on the established durable completed-episode facts. Main-answer outcomes and support exposure are still client-attested under the existing Practice v1 trust boundary; Review does not add server attestation of mathematical correctness.

## Retention and compatibility

Visible history stays the newest 10 episodes. Existing pruning keeps the newest 50 completed episodes, with a necessary exception: eligible core Review sources and referenced sources survive pruning. Stored rows can therefore exceed 50. Reservations survive completed Review history pruning so an old source cannot become available again. No old local Summaries are imported or backfilled.

Browser latest Summary adds an optional `mode: review` marker for Review records. Old array records and session/results records remain readable. It preserves the marker through immutable pending Finish and retry; Summary presents separate Review wording while reusing factual support/outcome labels and Journey results.

## Validation

Domain, server-boundary, browser-storage and component regressions cover source eligibility, server-owned selection/provenance, mode/evidence tampering, pause/retry/Skip/Summary and Home/Progress presentation. The PostgreSQL integration cases require a separately migrated `DATABASE_TEST_URL`; never run them against a shared runtime database. They cover real concurrent starts/Finish, deterministic source tie-breaking, source ownership, sequential opportunities, adaptive/evidence stability, Journey idempotency and source retention.

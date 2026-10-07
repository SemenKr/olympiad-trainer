# Durable Practice History v0

## Status

Adopted contract.

## Purpose and boundary

Durable Practice History v0 adds a bounded server-side projection of completed Practice episodes. It does not replace the browser-local unfinished episode or the browser-local latest completed Summary, and it does not define learner progress, mastery or recommendations.

## Finish contract

- Each successful Finish creates exactly one completed-episode projection for that episode. Early core/Pack Finish records the nonempty ordered prefix of opened tasks only; it does not fabricate facts for unopened tasks. Active and no-next snapshots retain their full registered task tuple. Review source eligibility retains its existing full-core boundary; accepting early Finish does not create a new Review opportunity.
- `practice_finish_receipts` remains the idempotency source. Retrying a Finish returns the same completed result and does not create another episode; the server-assigned `completed_at` is stable on retry.
- The episode projection, its evidence, adaptive facts and Finish receipt are written atomically in one database transaction. A failed transaction leaves none of those Finish writes committed.
- `completed_at` is assigned by the server.
- Retain the newest 50 completed episodes. [Review / Reconfirmation v0](review-reconfirmation-v0.md) preserves eligible core sources and referenced sources beyond that bound to keep provenance and resumable reservations valid; stored rows can exceed 50. History reads still return the newest 10.
- Do not backfill historical completed episodes.

## Data boundary

The projection stores completed-episode summary facts only. It contains no answers, drafts or other protected content. It does not derive or persist mastery, progress, recommendation or history-inference state. Existing verified evidence and adaptive facts retain their own meanings and sources; an episode projection is not a new interpretation of them.

The browser-local latest Summary remains unchanged and continues to serve the existing local completion flow. Durable history is an additional bounded record of successful Finish operations, not a migration of that Summary.

## Explicit exclusions

Version 0 does not import earlier local Summaries, reconstruct previous episodes, or infer prior history. It does not calculate learner mastery or progress, select recommendations, or infer additional facts from the episode list.

## Learning Path v1 extension

[Learning Path v1](learning-path-v1.md) reads nullable server-derived Pack IDs on immutable Finish receipts, independently of this pruned history. No history or receipt backfill occurs. Pre-v1 null IDs stay unknown even on retry; pruning episodes cannot remove a recorded Pack marker.

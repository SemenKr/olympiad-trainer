# Practice Journey v0

## Product contract

Practice Journey records participation in explicitly finished Practice
sessions. It is separate from capability evidence, `adaptiveFacts`, adaptive
precedence and Durable Practice History. XP never describes mastery or skill.
No XP appears in an active problem. [Review / Reconfirmation v0](review-reconfirmation-v0.md) uses these same engagement-only rules; its mode and provenance do not change the award.

Each problem in a successfully finished session earns at most 10 XP when it has
at least one valid submission or the learner opened its full solution. Hints,
checkpoint answers and Knowledge Support do not change that amount. Skipping
does not subtract XP. A skipped problem with no valid submission and no opened
solution earns zero. There are no correctness bonuses or penalties.

Milestones are derived from cumulative XP at 10 (`Первый шаг`), 50 (`50 XP
практики`) and 100 (`100 XP практики`). XP continues after 100; v0 has no later
milestone.

## Persistence and Finish

The existing explicit Finish validates the completed episode, locks the learner
and writes its immutable Finish receipt in one transaction. The same transaction
inserts one `practice_journey_awards` row keyed by learner and session. The
award is calculated from the validated episode facts, and the row stores the
earned amount, the cumulative total at Finish and any newly crossed milestone.
An identical receipt retry returns that same row, so it cannot award XP twice.
Failed transactions commit neither receipt nor reward. Sessions without a
completed episode receive no Journey award.

The award table is independent of completed-episode retention. Its rows are not
pruned when Durable Practice History drops older episodes. Current Home and
Progress totals sum the award ledger; Summary reads the immutable per-session
reward snapshot. No XP is written to capability buckets or adaptive learner
columns, and Journey reads do not participate in adaptive selection.

New server-backed latest local Summary records store the completed session ID
alongside their task results. Capability verification and Journey lookup use that
same record; the URL session query cannot select a different reward. Home links
carry the persisted completed session ID. Legacy array-only Summary records remain
readable without attaching a Journey reward, including during pending Finish
recovery.

Migration: `db/migrations/0008_practice_journey.sql`.

# Olympiad Simulation v0

Task `OLYMPIAD-SIMULATION-V0` adopts one fixed Grade 5 mathematics variant: four existing problems, 45 minutes, free-form work and no automatic scoring. It is a preparation exercise assembled from our existing adaptations, not an official competition paper or an official assessment. The explicit v0 contract narrows the general simulation guidance: there is no official scoring implementation in this version.

## Fixed selection

| Order | Existing problem | Reason for inclusion |
| --- | --- | --- |
| 1 | `exact-coin-payments` — «Пирожок без сдачи» | Small exhaustive count with an explanation of completeness. |
| 2 | `knights-all-or-none` — «Рыцари и лжецы» | Logical case analysis, including all possible answers. Existing option labels remain part of the statement; work is still free-form. |
| 3 | `truck-car-same-arrival` — «Одновременно в город» | Relating two motions over a shared interval rather than substituting into a supplied formula. |
| 4 | `largest-valid-eight-digit` — «Самое большое число» | Constructing a maximal number subject to overlapping digit constraints and justifying maximality. |

All four are already in the 42-problem catalog, are Grade 5, need no source image and have existing protected training reference solutions. Statements, option labels, solutions and source provenance are reused without alteration. These selection descriptions are our rationale, not an official taxonomy or a difficulty inferred from source numbering. The mixture deliberately includes a compact counting problem and a more involved construction; 45 minutes is the adopted product limit, not a claim about an official tour.

## Separate flow and persistence

`/simulation` starts explicitly, provides all four tasks from the outset, a visible countdown and a text draft per task. Early Finish has a cancelable confirmation; after Finish the four submitted drafts are immutable and shown alongside reference explanations. Empty drafts are valid submissions. The v0 stores one attempt per anonymous learner and resumes that same attempt, including its completed work; repeat variants, resets and an attempt archive are outside this slice.

Simulation reuses the existing server-only problem catalog, anonymous HttpOnly learner cookie and PostgreSQL pool. A separate `simulation_attempts` table stores only the attempt UUID, server timestamps, revision, four drafts, selected task and finish reason, keyed by learner. Every action resolves identity from the cookie. The existing learner-row transaction lock serializes Start, Save, Finish and timeout materialization, including simultaneous initial Starts. Client revisions reject stale conflicting writes; exact save retries after lost responses are idempotent. Start retries resume rather than resetting the deadline. Input boundaries enforce a UUID, nonnegative revision, four text drafts (12,000 characters each) and a task index from 0 to 3.

There is no Practice Finish call, Practice receipt/episode, capability observation, adaptive fact, Review source, XP award, assessment, AI judge or recommendation in this flow. Practice mode unions remain unchanged. Identity creation may initialize the same empty learner record used throughout the app; Simulation does not contribute to its learning snapshots.

The active page serializes requests, saves changes after a short debounce and writes a bounded browser-local pending copy before acknowledging edits. A held Web Lock allows one editor tab per browser. The mirror includes the exact in-flight save, so reload can distinguish a lost save response from conflicting server work while retaining newer typing. Conflicts or corrupt local copies stop restore rather than silently choosing/overwriting work; a local-copy download is available for recovery. Local storage/Web Locks failures and server failures are visible. The browser requires working local storage and Web Locks, as the existing Practice storage flow does. Cookie loss or a different browser identity prevents recovery of that server attempt.

## Protected assistance boundary

Active-page props include only problem IDs, titles, statements and existing option labels. They never include hints, reference text, expected answers, checkpoints, Knowledge Support or adaptive assistance. The reference action accepts an attempt UUID, resolves cookie ownership and checks the persisted Finish state before reading server-only solutions. A client-side finished flag cannot unlock them. Active attempts also block existing Practice hint, solution, answer-check and checkpoint actions for these four problems; Knowledge Support actions are blocked during the active attempt. Unrelated ordinary Practice problems retain their existing behavior.

The countdown is for honest preparation, not anti-cheating. These problems are already available in Practice and their source material is public; previously viewed content, other identities/devices and external help cannot be revoked or detected. This version does not claim to certify unsupported mathematical performance.

## Timer and network limitations

The server sets an absolute 45-minute deadline at Start. The client derives remaining time from the latest server time and a monotonic browser clock, checks every second, refreshes at most every 15 seconds and on visibility changes. It neither pauses on leaving the page nor trusts a caller-supplied elapsed time. Local system-clock changes do not move the stored deadline. The client countdown can lag by network latency or browser suspension; the server deadline controls acceptance. Server clocks must be reasonably synchronized across instances.

At or after the deadline every server Read/Save/Finish treats the attempt as finished at that deadline, accepts no new draft edits and returns the frozen server work. There is no background scheduler: with every tab closed the expiry is materialized on the next server operation. The logical deadline still applies while no request runs. Online pages trigger Finish on timeout without confirmation. Server outages may delay the visible acknowledgement and reference retrieval.

Only work received by the server before the deadline is submitted on timeout. Unsaved offline edits cannot be attested as written before it. They remain downloadable as a local copy and are explicitly distinguished from submitted work; they cannot replace the finished submission. Normal reload preserves pending local drafts, selection and the original deadline. A permanently lost cookie, cleared storage or edits on another device are not guaranteed to recover unsent text.

## Deployment and verification

Run the existing explicit `pnpm db:migrate` deployment step, now including `0010_simulation.sql`, before serving this version. Migration execution is not part of request handling. No production database migration is performed by this coding task.

Targeted tests cover state transitions, exact deadline behavior, input validation, lost-response recovery, assistance/reference authorization, isolated persistence writes and student interactions (navigation, reload, confirmation/cancel, timeout, retry and second-tab access). A PostgreSQL integration test uses `DATABASE_TEST_URL` and a temporary isolated schema; absent that dedicated URL it is skipped. Application verification and visual checks are reported with their actual environment limits in the task result.

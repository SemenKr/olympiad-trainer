# Variable Practice length foundation

Phase A keeps new ordinary starts and the public entry experience at three problems. Practice can resume a validated saved ordinary plan of 3, 5 or 10. Pack entry retains its existing conflict screen and offers continuation of unfinished ordinary work. The shared core registry holds one versioned sequence, with shorter plans taking exact prefixes. The Grade 5 subject review independently checked the ten answers, assessments, hints and progression. It did not measure learner pacing.

The browser stores the full immutable plan and exact position. Finish submits the plan plus facts for the opened prefix, using episode facts v2 within the existing versioned request. The owner-locked transaction validates and hashes the complete episode and writes the award, receipt and history together. The old facts and hashes are retained. The original two-problem draft can finish two; already-expanded three-problem drafts retain three. Remote Recovery returns completed facts and XP. Drafts and unacknowledged requests live in the originating browser.

Review requires the full selected plan and the original qualifying first problem. Historical eligibility still requires the original three. Fixed packs and single-problem modes keep their existing facts. The XP formula remains 10 per problem with a valid attempt or viewed solution. Migration 0024 expands the existing check to 100.

## Release and rollback

1. Apply migration 0024 before promoting Phase A. It only widens the existing XP check, so the current deployment can continue writing while the new candidate is staged. Verify the migration marker and the 100 XP limit. Keep the expansion in place during rollback.
2. Prepare a protected, ready fallback from `c8a1de97d1fbabc44993069e60dfebf18d53ebff` before opening Phase A. This commit already uses IndexedDB v3, keeps new starts at three, and can read and replay all three versioned lengths. It is an emergency fallback for persistence continuity. Its Summary retains the known misleading wording for an independently solved early prefix. Return to the corrected build as soon as the incident permits.
3. If rollback is necessary, move routing to that compatible artifact and reload the app on the same origin. Preserve the IndexedDB database, its ownership marker, pending requests and the expanded PostgreSQL database. Do not route returning browsers to `f2b90a6`. The pre-A client requests IndexedDB v2 and cannot reopen a database upgraded to v3.
4. Keep the corrected Phase A artifact as the fallback for a separately approved selector release. A fault shared by both v3 builds needs a forward fix that retains v3 and both Finish formats.

### Isolated rehearsal

A same-origin Chrome rehearsal loaded the pre-A client, the corrected Phase A client and the exact `c8a1de9` fallback from separate source bundles. For 3, 5 and 10 tasks, it interrupted Finish after capturing the request, changed builds, compared the pending local slots byte for byte, replayed the identical payload on the fallback, and returned to the corrected build to read the same completed Summary and plan. The browser fixture simulated the server acknowledgement. Separately, isolated PostgreSQL tests checked idempotent receipts, History and XP through 100. Both Phase A revisions use identical migrations, Finish hashing and persisted episode readers.

The real Chrome, Next.js and disposable PostgreSQL Recovery rehearsal on `c8a1de9` used a seeded ten-problem draft. The final answer and Finish ran through the app, the server recorded one 100 XP award, and Recovery in a fresh browser returned the same owner and episode history without a second award. The Summary correction adds a reader projection and preserves the write format. Hosted fallback readiness and the Production migration require separate authorization.

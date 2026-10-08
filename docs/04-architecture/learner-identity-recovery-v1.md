# Learner Identity & Recovery v1

Task: `OT-LEARNER-IDENTITY-ARCH-01`. Status: **Adopted — 2026-10-07. Architecture decisions D1–D5 were explicitly accepted from proposal revision `ead0980b83751b124181bda0bd09f45640c9f7dc`. Recovery is not yet implemented or shipped.**

This is the adopted product and architecture contract for the bounded v1 recovery direction. It authorizes implementation only through separately scoped reviewed slices; production migration, feature enablement and release remain separate gates. Existing adopted learning/domain contracts remain authoritative and unchanged unless this contract explicitly defines an identity boundary.

## 1. Problem and evidence

A learner can accumulate server history and lose access when their browser cookie is cleared, expires, or their device is replaced. The problem is continuity of access to the same learner, not identifying a child by legal name. Recovery must be arranged **before** the only credential is lost.

Repository evidence inspected at `df1ff615a762be5f9be9058b3c426da4799baa5c`:

- [Current persistence contract](server-backed-learner-persistence.md) and [identity resolver](../../src/modules/practice/server/learner-identity.ts): a random 256-bit bearer token in a two-year HttpOnly, SameSite=Lax cookie, Secure in production; SHA-256 token hash resolves a stable learner UUID. The browser supplies no authoritative learner ID.
- [Persistence](../../src/modules/practice/server/learner-progress-persistence.ts) currently creates a learner for an unknown token hash. [Schema](../../src/modules/practice/server/progress-schema.ts) stores one unique anonymous token hash on each learner. This behavior must change before revocation can be meaningful.
- [Durable history](durable-practice-history-v0.md) is separate from unfinished Practice and latest Summary, which are browser-local. [Legacy import](../../src/modules/practice/ui/server-progress-import.ts) and pending Finish recovery currently use origin-wide storage and Web Locks, not an authenticated learner namespace.
- [Simulation](olympiad-simulation-v0.md) stores the attempt on the server, but unsent text also has a local recovery copy. Every action resolves cookie ownership; recovery cannot reset the deadline or unlock solutions.
- [Learner validation](../02-research/learner-validation-v0.md#remote-parent-observed-sessions) explicitly requires the same browser profile on return visits and separate profiles for different children. Its [privacy section](../02-research/learner-validation-v0.md#privacy-and-data-handling) minimizes identifying data in research. It is not a production identity/consent policy.

This establishes a technical access-loss risk and an operational restriction. It does **not** establish a measured incidence of loss, demand for simultaneous devices, or that children can reliably save recovery codes. Those remain validation questions. The [project vision](../00-project/project-vision.md) leaves a parent profile as an unadopted future direction.

## 2. Realistic minimal alternatives

| Option                                          | What it solves                                                        | Costs and limitations                                                                                                                                                       | Recommendation                                            |
| ----------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Optional offline recovery code                  | Cookie/device loss after enrollment, without contact details          | The code is a powerful secret; no help if all credentials disappear; saving/replacing it takes care                                                                         | Prefer for v1, with one-time use and explicit replacement |
| Guardian email + one-time link                  | Recovery through a guardian's mailbox; less dependence on saved paper | Verified contact PII, mail delivery/provider, abuse controls, relationship/consent and mailbox-compromise policy; still needs browser-local isolation                       | Defer unless learner research rejects code custody        |
| Passkey with a synchronized credential provider | Convenient device authentication where supported                      | Provider/device setup and child/guardian custody vary; recovery when that credential is lost still needs a policy; enrollment and credential management exceed this problem | Defer; not a sufficient universal recovery fallback       |

Keeping the current browser-only identity is the baseline: zero new mechanism but does not solve the stated loss. Email/password and social login add account lifecycle/provider obligations without a demonstrated requirement. An account platform is not needed to retain the existing learner UUID.

## 3. Adopted v1 and decisions

Use optional offline recovery, anonymous by default, with one live browser credential per learner. Recovery transfers access and revokes the previous browser credential. A browser profile still represents one learner; this is not a household profile switcher.

**Adopted decisions D1–D5:**

| Decision                           | Recommended choice                                                                                                                                           | Alternative and consequence                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| D1: Recovery authority and custody | Possession of a saved recovery code authorizes full access to that learner; guardian may keep it offline, with no verified guardian role                     | Guardian-linked identity requires contact collection, relationship rules and separate approval                |
| D2: Browser access after recovery  | One active browser credential; every recovery revokes the old one                                                                                            | Multiple active devices require session records, revocation UX and more concurrency policy                    |
| D3: Loss and compromise            | No manual identity claims or recovery without a valid cookie/code; no automatic merge                                                                        | Support-assisted recovery needs independently established proof, data handling and staffing, currently absent |
| D4: Credential lifetime            | One-time code, no calendar expiry while unused; replacement requires saving the next code before activation                                                  | Expiring codes reduce exposure but strand learners who reasonably kept an old paper copy                      |
| D5: Local work and privacy         | Quarantine ambiguous local work; no automatic import into a recovered identity; no new contact PII; approve the bounded security-data retention in section 8 | Permissive reassignment risks another child's facts; broader retention requires its own justification         |

These choices were explicitly adopted by the product owner from proposal revision `ead0980b83751b124181bda0bd09f45640c9f7dc` on 2026-10-07. Later changes to D1–D5 require a new explicit product decision and contract revision.

## 4. Identity and recovery domain model

- **Learner:** existing stable UUID and its existing learning records; no name, date of birth, email, guardian ID or inferred family relationship.
- **Browser credential:** existing random token hash, plus a server expiry and monotonically increasing credential generation. It authenticates one browser profile. A learner UUID, session UUID or local owner marker never authenticates.
- **Recovery credential:** one active random secret per enrolled learner. Proposed format: version prefix plus 32 random bytes encoded as base64url (43 characters), with a fixed copy/paste representation. Validate canonical encoding and exact length; never use a short PIN, learner-selected password or answer to a personal question. Store only a domain-separated SHA-256 hash. High entropy, not password stretching, protects this generated secret.
- **Pending credential change:** a short-lived, narrowly authorized enrollment/replacement/recovery operation. It holds only hashes and expected credential generation. It grants no history access or learning writes. Only confirmation activates its successor code.
- **Local owner binding:** an opaque, non-secret server-issued learner context plus credential generation, attached to browser snapshots, pending writes and in-memory requests. It prevents accidental cross-identity reuse; server authentication still determines ownership.

A guardian is an optional human custodian, not a domain entity. A child can start anonymously and solve independently. The child or guardian must save the code somewhere outside that browser, keep it private and save its replacement after recovery. The product cannot verify parenthood, age, custody or consent from code possession. Multiple children under a guardian, child lists and delegated access are out of v1; separate browser profiles and separately stored codes remain necessary.

## 5. Lifecycle and transitions

### Ordinary use

An absent cookie on a genuinely fresh browser can create an anonymous learner through an explicit initialization boundary. Ordinary learning mutations cannot implicitly create a learner after authentication fails. Unknown, expired or revoked tokens return an identity-unavailable result, with Restore or explicit Start fresh; they never call the current create-on-unknown path. Missing cookie plus existing local work also stops import/Finish until identity is resolved.

Successful authentication returns the current non-secret owner context and generation. Normal requests carry their expected context; the server verifies it against the cookie before reading learner data or writing. A stale tab must reload instead of writing to the learner now represented by the shared cookie.

### Enable or replace recovery while authenticated

1. Require current browser authentication, same-origin request protection and explicit action. Hold identity-changing UI outside an active editor; settle or preserve pending writes as described below.
2. Server generates a successor recovery code and a separate 256-bit pending-operation secret. Store only hashes, expected generation, operation kind and ten-minute expiry. Deliver code once over TLS with no-store; pending authorization is a separate short-lived HttpOnly cookie, with the same production security flags. No secret in a URL or localStorage.
3. Ask the user to save the code outside this browser and re-enter it to confirm. The server checks the successor hash and pending authorization. Copying alone is not confirmation. Until then, the old recovery code remains valid, or enrollment remains disabled.
4. In one learner-row transaction, recheck authentication, generation and expiry, activate the successor hash, increment the generation and consume the pending row. Enrollment/replacement retains the current browser token; other pending operations become stale. Refresh local generation only for the same verified learner.
5. Show enabled status after a fresh authenticated read. Cancellation, expiration or a lost display response leaves the prior credential unchanged. Start a new pending operation if the displayed code is unavailable; do not retrieve its plaintext from the database.

A valid browser can replace a lost recovery code. This is a deliberate bearer-authentication limitation: someone controlling that browser can do so too. There is no stronger identity proof in v1.

### Recover with a code

1. From Restore, submit the current code by POST. Apply rate limits and origin checks before processing. A valid code authorizes only a pending recovery operation, not a history preview. The current browser identity remains unchanged. Invalid, used and revoked codes receive the same neutral response.
2. Generate/display a successor code as above; user saves and re-enters it. The target learner is determined only by the submitted code hash. Never accept a target learner ID from the form. Warn before confirmation that current browser access will be replaced, other browser access revoked, and histories will not merge.
3. Under the target learner lock, recheck the old code hash, expected generation, pending secret, confirmation and expiry. Atomically replace the recovery hash, replace the browser token hash with a freshly generated 256-bit token, set its server expiry, increment generation and consume the pending operation. No learning table is altered. Set the new HttpOnly browser cookie only after commit.
4. Perform an authenticated read with the new cookie. Only this read plus safe local-context reconciliation unlocks the destination. Land on Progress with a link to Home and, if present, the server-owned Simulation attempt. Do not fabricate latest Summary or unfinished Practice from history.

This is a state transition from `anonymous/no recovery` to `anonymous/recovery enabled`; then zero or more `pending change → confirmed replacement` transitions. Expiry/cancel returns to the previous stable state. There is no verified-person or guardian-account state.

### Duplicate, concurrent and uncertain outcomes

- Two confirmations for the same pending operation: only the first transaction can consume it; the second makes no mutation. If the browser already has the successful new cookie, reconcile through an authenticated status read. Otherwise use the already-saved successor code; do not promise to replay a lost plaintext cookie response.
- Competing recovery operations: expected generation and active-code hash are checked under the same lock, so only one can win. Losing operations disclose no history and cannot replace the winner. A copied old code stops working at the successful confirmation.
- Commit succeeds but Set-Cookie is lost: the old code is consumed and the successor, saved before confirmation, is the recovery path. Its next recovery requires another saved successor. Explain this outcome without claiming the old code is still valid.
- Cancel before confirmation does not revoke credentials or change identity. After a committed confirmation there is no rollback button; a stale response cannot undo it.
- Old in-flight learning requests must recheck token hash/generation **inside their ownership transaction**, serialized with recovery. Work committed before recovery belongs to the old authenticated learner; requests ordered after revocation fail. Merely resolving the UUID before acquiring the lock is insufficient.

## 6. Persistence and schema proposal

Use existing PostgreSQL and transaction conventions; no new service, auth provider or dependency is selected. Names below are proposed, not migrations.

| Change                        | Fields and constraints                                                                                                                                                                                       | Purpose                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Extend `learners`             | Existing unique `anonymous_token_hash`; `credential_generation bigint NOT NULL DEFAULT 0`; nullable unique `recovery_code_hash`; nullable `recovery_enabled_at`; `browser_credential_expires_at timestamptz` | Retain learner UUID and one active browser/recovery credential; enforce server expiry, revoke by replacement       |
| `learner_credential_changes`  | Random UUID primary key; learner FK; unique `pending_secret_hash`; `kind` constrained to enrollment/replacement/recovery; `expected_generation`; `successor_code_hash`; `expires_at`; `created_at`           | Ten-minute pending authorization; no plaintext code or browser token; confirmation consumes row under learner lock |
| `identity_rate_limit_buckets` | Bounded bucket key (short-lived keyed hash of trusted client network address or submitted-code hash), window start, counter, expiry; unique key/window                                                       | Atomic limits shared across server instances, not in-memory-only protection                                        |

Recovery confirmation creates a fresh browser token in server memory; only its hash is committed. Losing that response is handled with the saved successor, not plaintext credential storage or a replay endpoint. Hash collisions are rejected by uniqueness constraints; regenerate before display. All times use server time. Expired pending rows are invalid immediately even before cleanup. Bound pending operations to three per learner; a fourth is rejected until cancellation/expiry. Confirmation invalidates all other pending operations for that learner by generation; delete them in the same transaction.

Proposed initial abuse budget: 10 recovery starts per trusted network bucket per 15 minutes, 5 per submitted-code hash per 15 minutes, 5 authenticated enrollment/replacement starts per learner per 15 minutes. Apply equivalent limits to confirmation attempts; failed confirmations do not consume a valid code. Use atomic PostgreSQL updates with bounded cleanup, and an operational global request ceiling at the existing hosting boundary. Do not lock a learner's normal Practice access because of recovery failures. School/shared networks may hit a limit: show retry time, preserve local work, and do not silently bypass it. Thresholds are initial implementation values to verify under load, not claims of measured adequacy. If current hosting controls cannot bound distributed flood cost, that is a launch blocker requiring a separate infrastructure decision.

The final schema must constrain paired recovery fields, positive lifetimes and nonnegative generation, index credential hashes and expiry cleanup, and prevent client-writable ownership. Pending rows and rate-limit rows are operational state, never evidence or analytics.

## 7. Ownership and security invariants

1. Cookie or recovery-secret possession is the sole authority. No ownership by IP, device fingerprint, school, name, previous answers, session IDs or a support assertion. Recovery possession authorizes all records of exactly one learner, including Simulation drafts; it is not read-only access.
2. Recovery never copies, merges, reparents or backfills learning rows. Existing evidence validation, receipts, Review provenance, Journey awards, Pack markers, Knowledge Support records and Simulation isolation remain unchanged.
3. Apply context/generation checks to **all** learner-scoped server reads and mutations, including protected content and Simulation assistance guards, not only the recovery endpoints. A recovered learner's active Simulation still blocks the same assistance; deadlines/revisions and finished-state checks are unchanged.
4. No raw credentials in logs, URLs, analytics, browser persistence, error reports or shared caches. Credential responses use no-store; UI clears displayed secret on exit and never redisplays an active code. Disable request-body logging for these endpoints and verify hosting/error tooling behavior. TLS and the existing HttpOnly/Secure/SameSite protections remain required.
5. Every credential mutation requires same-origin/CSRF protection independently of SameSite; no mutation by GET. Reject cross-origin requests and untrusted return URLs. Pending recovery cookies cannot authorize learning APIs. Validate inputs and bound body sizes before database work.
6. Enforce expiry, rate limits, transaction ownership and generation on the server. Do not rely on a disabled button, storage marker, Web Lock or client clock as authorization. Fail closed on unavailable database/limiter; show retry without discarding work.
7. Recovery code replacement revokes the old code immediately. Browser-token replacement revokes the old browser immediately for new operations; revoked-token resolution must not create a new learner. A cookie setter racing with revocation may leave a stale cookie, but it cannot restore server authorization.

Security basis: [OWASP recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) supports random, securely stored, single-use credentials, non-enumerating failures and throttling; [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) supports server-side invalidation and cookie protection. This offline, no-contact proposal is not a claim of full password-reset or identity-assurance compliance. Its no-expiry offline credential and no-support-recovery policy are explicit product choices requiring adoption.

Threat limits: stolen code, compromised browser, malicious extension, XSS, database/operator compromise or coerced sharing can expose a child's history. Rotation limits subsequent replay but cannot retract previously read data. A thief who wins recovery can save their own successor and exclude the learner. There is no independent notification channel, proof of rightful custody or reliable dispute resolution. No claim of preventing a child from obtaining assistance through a separate anonymous profile; existing Simulation is practice, not proctored identity verification.

## 8. Privacy and PII

Default use collects no new names, emails, phone numbers, birth dates or guardian relationships. Recovery enrollment is optional; refusing it never blocks learning. However, stable learner history, Simulation free text, cookie identifiers and credential metadata are **pseudonymous sensitive user data**, not a claim of irreversible anonymization. Text may contain identifying details even when forms do not ask for them.

Proposed retention: active credential hashes for as long as the learner exists; consumed pending rows deleted in the activation transaction; canceled rows deleted immediately; expired pending rows and rate-limit buckets deleted within 24 hours. Rate-limit network identifiers use a server-only keyed hash with daily key rotation and a bounded overlap for active windows; do not persist raw IPs in this application table. Hosting network logs need separate inspection and a documented retention setting before launch. Do not introduce analytics or a persistent device registry.

This proposal does not extend existing learning-data retention or silently adopt a deletion policy. Before release, the product owner must approve a child-readable recovery notice and deployment-specific privacy/retention handling, including existing hosting logs and how a deletion request is authenticated and executed across learner-linked tables/backups. If that policy is absent, record it as a launch gate; do not invent statutory compliance, a jurisdiction or a new self-service deletion feature here. Research guardian permission is not production identity verification or blanket consent for new data collection.

## 9. Existing learners, linking and local migration

### Server compatibility

Keep every existing learner UUID and every FK. Existing cookie hashes remain usable; `recovery_code_hash` starts null for all rows. No automatic recovery credential generation, history export or PII backfill. Enrollment attaches a credential to the currently authenticated row; it does not create a second learner. Rows already orphaned before enrollment cannot be located or claimed through answers or names.

Add schema first. For existing credentials, initialize server expiry to rollout time plus the existing two-year lifetime; the browser's existing cookie expiry remains unchanged. For new/renewed browser credentials, server and cookie expiry are both two years from issue. Roll out generation-aware readers/writers and explicit initialization before enabling recovery. Old open tabs without context must reload; their payloads must not be accepted by compatibility bypass after recovery is enabled. Deployments that still create-on-unknown or ignore generation cannot coexist with enabled recovery. Rollback after activation must keep revocation/context enforcement or disable credential changes while retaining the new resolver; never revert to the old resolver as an emergency shortcut.

### Browser compatibility and switch barrier

Inventory and migrate unfinished Practice, latest Summary, legacy Progress bytes, both legacy/current pending Finish markers, Simulation pending copies, cached Progress/recommendations and in-memory import promises. Preserve their exact payload semantics. Add owner context to the storage envelope, not to mathematical evidence.

Before switching identity, acquire a common identity-change barrier plus existing editor/mutation locks in a fixed order (identity, Practice, Simulation); normal editor/import/write paths participate in that order. If another tab holds an editor, ask to close/finish that tab; never steal its lock or silently erase its work. Write and verify a local switch marker before the server confirmation. Stop outgoing writes, preserve source data in its original owner namespace, clear only derived caches and suppress imports. After acknowledgement, fetch the authenticated context, reconcile the marker, and reload into the matching namespace. Release locks only after reconciliation; stale async responses must check their captured generation before storage/UI writes.

For cookie loss or reload with an unresolved marker, perform a no-side-effect identity-status read first. Never let a Progress loader or Finish retry initialize/import implicitly. The marker contains non-secret expected source context and operation identifier, not credentials. If the authenticated context is still the source, retain its namespace and show recovery retry; if it is the verified target, activate only that namespace; otherwise remain blocked with Restore/Start fresh choices. Failure to save/read back the marker or namespace prevents confirmation. Storage unavailable after server commit leaves the UI blocked until safe reconciliation; the successor code still restores server access.

Legacy unbound local data can be bound once only while a **pre-existing valid cookie** is authenticated and before any recovery/switch: preserve the existing original same-profile assumption, including current legacy import validation and acknowledgement order. Missing/unknown cookie, an existing switch marker or recovery into another learner makes that association ambiguous. Keep those bytes quarantined and do not auto-import, replay Finish, display Summary or append Simulation drafts to the recovered identity. A local marker is not proof sufficient to migrate unbound data after cookie loss. Do not delete quarantined bytes as part of Restore; existing Simulation local-copy download remains available without submitting it. Practice export/manual reassignment is outside v1.

Bound data for the **same** verified learner may resume after recovery, updating credential generation under the barrier and retaining exact pending request IDs/hashes. Different-owner data stays isolated. Switching away from a valid current learner requires an explicit warning if its server history has no recovery code, with an option to cancel and enable recovery first. Never claim that merely retaining its local namespace preserves access to its server history.

### Local ownership foundation (slice 3)

The browser boundary reads authenticated public `{ learnerId, generation }` metadata before mounting learner views. Generation is serialized as a decimal string to preserve PostgreSQL bigint precision. This metadata is not a credential. Progress/import/Finish, Review, Knowledge Support and Simulation actions compare expected context with the HttpOnly credential; persistence still rechecks credential authority inside its existing transactions.

The local inventory is:

| Existing key suffix                | Payload retained                                         |
| ---------------------------------- | -------------------------------------------------------- |
| `practice-session`                 | Unfinished Practice, including no-next state             |
| `practice-latest-completed`        | Latest Summary                                           |
| `progress-evidence-v0`             | Legacy local evidence awaiting acknowledged import       |
| `practice-progress-finish-pending` | Legacy/current local Finish commit/reconciliation marker |
| `practice-server-finish-request`   | Immutable pending server Finish request                  |
| `simulation-pending-v0`            | Simulation work and pending save recovery copy           |

All original keys use the `olympiad-trainer:` prefix. Owner-scoped keys use `olympiad-trainer:learner:<learnerId>:<suffix>` and a version-1 envelope containing owner metadata and the exact original serialized payload string. Storage consumers see the original payload through a captured owner-scoped Storage adapter. No ownership fields enter mathematical facts, request IDs or learning receipts. Legacy originals remain preserved and ignored after a successful one-time binding; they are not another import source. Partial migration failure preserves originals and blocks the learner boundary.

`local-owner-v1` records the active authenticated context and original legacy association; `identity-switch-v1` records a non-secret operation ID, source and intended target. The shared identity lock uses the existing `identity-initialization` name. Practice mutations/imports acquire a shared identity lock before `practice-session-mutation`; the Simulation editor holds shared identity before `simulation-editor`. A transition acquires those three locks exclusively in that order with `ifAvailable`, writes/read-backs its durable marker and only then permits a supplied acknowledgement. Held editors are never stolen. No recovery acknowledgement endpoint exists in this slice; tests simulate it.

An unresolved marker requires a fresh authenticated read. Verified target reconciliation activates its namespace; source or unrelated context stays blocked with the existing retry/error surface. Same-learner generation updates retain exact payloads and pending request identity. Captured adapters reject old leases after generation/context change, and derived Progress/Support responses verify their lease before returning. Storage events invalidate mounted views; their in-memory state is discarded, while source bytes remain. Simulation also checks the captured lease before applying asynchronous server responses. There is no shared persistent recommendation cache or import promise to transfer; the existing Simulation editor-lifetime promise coordinates lock disposal only.

This foundation adds no database migration and does not expose Restore, Start fresh, enrollment, credential replacement or recovery UI. Recovery remains disabled. Old deployments/open tabs that do not participate in ownership enforcement must be excluded before recovery is eventually enabled, as required above.

### Credential lifecycle foundation (OT-LEARNER-RECOVERY-CREDENTIALS-01)

The server foundation implements pending enrollment, replacement and recovery in `src/modules/learner/server/recovery-credentials.ts`. Migration `0013_learner_recovery_credentials.sql` extends the existing learner with paired recovery fields and adds hash-only pending changes and PostgreSQL rate buckets. It does not alter learning records. Recovery codes have the canonical form `OTR1-` followed by 43 base64url characters encoding 32 random bytes (48 characters total); whitespace, padding, alternate versions and noncanonical trailing bits are rejected. Active codes have no calendar expiry. Pending authorization uses a separate 32-byte secret, ten-minute server expiry and a maximum of three unexpired changes per learner.

Ordinary learner queries deliberately retain the 0012 Drizzle mapping. A recovery-only credential projection in `recovery-schema.ts` maps the additive fields on the same learner row; recovery operations hold the shared learner lock before using it. This allows the disabled feature to deploy without applying 0013 to production. The unmigrated-0012 regression exercises actual anonymous initialization, Practice, Progress, Journey, Review and Simulation.

The bounded POST surface is `/api/identity/credentials`, with JSON actions `enrollment`, `replacement`, `recovery`, `context-authenticated`, `context-recovery`, `confirm-authenticated`, `confirm-recovery` and `cancel`. Only `code` is accepted alongside `action` when required; learner IDs are never accepted. Bodies are bounded to 1024 bytes, and an explicit Origin/Host check plus a local host allowlist rejects untrusted requests. Every response is `no-store`. Start returns the successor plaintext once and an operation UUID; the pending secret is only delivered in an HttpOnly, SameSite=Strict, path-scoped cookie with a ten-minute lifetime. Successful confirmation/cancellation clears it. Ordinary learning APIs continue to accept only the existing learner browser cookie.

Enrollment/replacement confirmation also requires browser authentication. Recovery confirmation uses only pending authorization and successor re-entry, with active old-code authority checked under the learner lock. Both recheck server time and expected generation after locking, increment generation once and delete all competing operations. Enrollment/replacement retain the browser token and first enabled timestamp; recovery replaces the token with the existing 43-character 256-bit browser format and renews its two-year expiry. Only after commit may the route set that cookie. Duplicate or stale confirmations fail neutrally, with no token replay. After a lost committed response the saved successor code is the next recovery path.

The context actions require pending authorization and successor re-entry and return only the intended owner/generation plus operation UUID. They grant no history/learning access and make no stable credential mutation. Later Recovery UX must use this context with `transitionLocalIdentity`, invoke confirmation inside its barrier, then perform an authenticated identity-status read to reconcile. These server files do not manipulate localStorage, leases, namespaces or switch markers. No Recovery UX is shipped.

**Recovery remains disabled in production and Vercel Preview.** The route hard rejects these environments before cookies/database work. Public recovery start/context/confirmation also fail closed without a trusted network bucket, including locally. PostgreSQL fixed fifteen-minute windows atomically enforce five starts per learner or submitted-code hash and five confirmation/context attempts per pending secret and learner; configured network callers would receive a ten-attempt budget. Counter saturation and bounded expiry cleanup are implemented. Recovery limits never gate ordinary learning.

**NEEDS DECISION before public recovery:** a dedicated server-only network key and trusted hosting address source, daily keyed hashing with active-window overlap, hosting flood ceiling and network-log retention. No forwarding headers or unrelated secrets are used as substitutes. Bounded opportunistic cleanup deletes expired operational rows in batches of 100; ensuring deletion within 24 hours when no requests arrive requires an adopted scheduled cleanup mechanism. No new production configuration or scheduled infrastructure is provisioned by this slice. These are release gates; the missing network provider is an explicit fail-closed stub, not a working abuse-control claim. Production migration, feature enablement, child-readable notice and Recovery UX remain separately authorized work.

## 10. Failure and recovery cases

| Scenario                                           | Required result                                                                                                                                                   |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Same browser, valid cookie                         | Ordinary anonymous experience and Resume unchanged; optional enrollment                                                                                           |
| Cookie cleared, code saved                         | Restore the same server learner; bound same-owner local work can reconcile; ambiguous legacy data remains quarantined                                             |
| All site storage cleared                           | Code restores server facts, history within existing retention, awards and Simulation server state; unfinished Practice/latest Summary/unsent text are unavailable |
| New browser or device                              | Same as recovery; old browser revoked; no promise of synchronized local drafts                                                                                    |
| Destination already has another learner            | Explicit replace-access warning; no merge; preserve its local namespace and offer enrollment before leaving                                                       |
| Lost code, valid cookie                            | Explicit replacement creates a new saved code and invalidates the previous one                                                                                    |
| Lost cookie and lost/never-enabled code            | Old server history inaccessible; explain honestly and offer explicit new anonymous start; no support override                                                     |
| Invalid/used/revoked code                          | Neutral failure; no history preview, no identity mutation, bounded retry                                                                                          |
| Interrupted pending setup                          | Old credentials remain valid until confirmation; restart after ten-minute expiry                                                                                  |
| Confirmation response lost                         | Authenticated reconciliation if cookie arrived; otherwise restore with saved successor                                                                            |
| Replayed or concurrent confirmation                | One winner, no duplicate credentials/history writes; stale operation cannot overwrite winner                                                                      |
| Revoked old tab, pending Finish or Simulation save | Server rejects after revocation; preserve payload, stop autosave, request Restore/reload; no implicit new learner                                                 |
| Corrupt storage, lock unavailable, database outage | Visible recoverable error; no unsafe import or successful-completion message                                                                                      |
| Suspected stolen code                              | Current valid browser can replace it before thief succeeds; after takeover v1 cannot adjudicate ownership                                                         |

## 11. UX entry, exit and responsibilities

Later implementation needs a quiet secondary “Сохранить доступ” entry on Home and Progress, and “Восстановить доступ” reachable before anonymous initialization/import as well as from identity-error states. No forced registration, reward for enrollment, frightening loss prompt or change to Resume precedence. Do not interrupt Practice or Simulation to enroll.

Provide: short explanation of server versus local recovery; optional suggestion to ask a trusted adult to keep the code; readable selectable code, explicit copy control and manual-copy fallback; save/re-entry confirmation; replace-access warning; cancel/back; enabled status and Replace code. Do not promise a guardian relationship or email assistance. Secrets should not be read aloud automatically by a live region; the learner can explicitly reveal/read them. Use labeled inputs, understandable errors, visible focus, keyboard operation, 320px layout and focus movement after confirmation/error. Copy failure must not announce success.

Recovery entry can be canceled without changing the browser learner. Completed recovery exits to verified Progress/Home navigation, with access to the existing Simulation resume route when appropriate. Same-owner unfinished Practice retains Home Resume priority after reconciliation. A new device does not show invented Summary/Resume. Exact screen copy and layout need a later UX implementation task; no Figma change is proposed here.

## 12. Implementation slices in dependency order

1. **Validate release gates:** D1–D5 are adopted. Before user-facing recovery is enabled, validate child/guardian comprehension of the save/replace flow and approve the notice/retention policy and hosting abuse controls. These gates do not block server-side identity-boundary work while recovery remains disabled.
2. **Identity boundary:** additive schema, explicit initialization/status/resolution, server expiry and generation checks across learner-scoped reads/writes; transaction-level revocation tests. Recovery stays disabled.
3. **Local ownership migration:** owner envelopes and switch barrier across Practice, legacy import, Summary and Simulation; stale-tab/reload/uncertain-outcome tests. Preserve payload semantics and existing locks.
4. **Credential lifecycle:** pending enrollment/replacement/recovery, secure delivery, confirmation, atomic consume/rotate, limiter and cleanup using existing PostgreSQL. Test concurrent winners and response loss with no learning changes.
5. **Bounded UX:** Home/Progress entries, saved-code confirmation, warnings, identity errors and reconciliation; accessibility/browser verification. No guardian dashboard or profile chooser.
6. **Release readiness:** old/new deployment compatibility, redaction/log-retention audit, isolated migration/rollback rehearsal, abuse/load checks, independent security/product review and controlled enablement. Production migration is separately authorized.

Each slice is dependency work for one recovery feature; partial releases must keep recovery disabled until all ownership paths and migration protections are in place.

## 13. Explicit exclusions

OAuth, social login, email/password infrastructure, guardian accounts/relationship verification, multiple-child management, simultaneous active devices, school tenancy, subscriptions, analytics, rankings, mastery/recommendation changes, merging learners, transferring history between children, cloud Practice drafts/Summary, restoration of unsent lost text, support-based identity adjudication, production database changes in this task, new dependencies and speculative identity service abstractions.

## 14. Acceptance criteria for later implementation

- Anonymous first use remains available without PII/enrollment; existing valid cookies retain the exact learner UUID and records. Existing learning regression suites continue to pass.
- Enrollment/replacement takes effect only after saved-code confirmation. Cancel, expiry, reload and lost display response leave prior access intact. No plaintext credential is persisted server-side or in browser storage.
- Cleared-cookie, cleared-storage, new-browser and new-device recovery reach the original server learner and revoke the previous browser. Verify the exact server/local recovery limits in section 10 and explanatory UI.
- Duplicate, replayed, concurrent and response-lost confirmations satisfy section 5. No stale generation can consume another successor, reauthorize an old token or duplicate a Finish/award.
- Cookie resolution before a blocked transaction cannot bypass revocation. Test all learner-scoped action families, protected content and active-Simulation assistance guards with foreign/stale context.
- Existing bound pending Finish retains request identity and idempotency after same-owner recovery. Foreign/ambiguous local Practice, Summary, legacy import and Simulation data never cross identities; no silent overwrite or discard. Test two tabs, held locks, storage failure, switch reload and late responses.
- Simulation retains deadline, server revision, submitted drafts and solution protection; recovery contributes no Practice/Review/Journey facts. No learner history is merged or backfilled.
- Lost-code replacement and total credential loss behave as documented; no unauthenticated support/ID-based override. Existing orphan rows remain unclaimable.
- Rate limits work across instances, reject oversized/invalid inputs, expire/clean up within specified bounds, and do not lock ordinary learning. Cross-origin credential requests fail. Logs/caches contain no secrets; privacy notice and deployment retention are approved.
- Browser verification covers keyboard-only and 320px/1280px flows, focus/errors/status, copy failure and secret exposure. Validate the child/guardian custody explanation with observed users before claiming usability.
- Migration and rollback rehearsals prove existing-cookie compatibility and enforcement during deployment transitions. Relevant unit/integration/browser checks and independent architecture/security/product review pass with no unresolved Critical/Major findings.

These are the adopted implementation acceptance criteria for the bounded v1 direction. This architecture task performed consistency review only; none of the recovery behaviors are claimed to exist or to have passed runtime/security testing until their implementation slices are completed and released.

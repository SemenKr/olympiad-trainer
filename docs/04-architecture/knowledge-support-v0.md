# Knowledge Support v0

Implemented bounded slice: carrier `five-piles-stones`, internal topic
`multiplicative-additive-comparisons`, learner label `«В … раз» и «на …»`.
These are our training semantics, not official source metadata.

## Practice boundary

An incorrect valid Practice submission or an exposed focus hint can only enable
the neutral optional diagnostic invitation. Eligibility also requires the active
carrier, no correct submission, no solution exposure, and no completed diagnostic
for this learner/session/topic. No Practice behavior diagnoses a knowledge gap.
The diagnostic opens only by explicit learner action. Only its server-assessed
incorrect outcome offers the mini-lesson; a correct result returns to Practice.
The fresh micro-check follows an explicitly opened lesson and describes only the
result of that one example. Neither result asserts mastery or overall weakness.

The support surface hides the Practice DOM while its episode component remains
mounted. Support does not call Practice answer, hint, checkpoint, navigation or
Finish transitions. It waits for outstanding local Practice writes and requires
their successful completion before opening. It keeps session, problem/index,
raw/selected answer, submissions, hint exposures,
solution exposure and checkpoint observation intact. Support state is transient:
reload restores the already persisted original Practice episode. A completed
diagnostic suppresses further invitations even after reload; lesson resume is not
provided. No new route, generic curriculum, lesson registry or knowledge graph.

## Server and persistence boundary

The existing anonymous learner cookie resolves learner identity; callers cannot
supply learner IDs. Server actions validate session UUIDs, option IDs and the
client-attested local Practice eligibility facts. Offer availability is checked on
the server using the carrier catalog’s numeric assessment and canonical learner-safe
focus-hint identity/level; serialized submission outcomes cannot override assessment.
As with existing Practice
persistence, this does not independently attest the browser's unfinished episode.
The protected diagnostic and micro-check answer keys remain server-only and both
assessments are deterministic. Prompts and options are learner-safe client content.
The answer-bearing lesson and micro-check explanation live in a server-only module:
lesson opening returns its text only after the saved incorrect diagnostic is checked;
micro-check submission returns feedback only after assessment and persistence.
Ordinary observation reads return no lesson or solution text. No AI explanation
or client-supplied outcome.

`knowledge_support_attempts` stores only learner/session/carrier/topic identifiers,
diagnostic selected option/outcome, lesson-opened boolean, nullable micro-check
selected option/outcome, and server timestamps for each observed step. The primary
key is `(learner_id, practice_session_id, topic_id)`. SQL checks bound carrier/topic,
validate options/outcomes and enforce the step ordering and timestamp nullability.
There is one diagnostic and at most one micro-check per key.

Writes lock the learner row inside the existing PostgreSQL transaction mechanism
to serialize first inserts, step updates and concurrent retries. Identical retries
return stored observations without changing timestamps. A conflicting diagnostic
or micro-check replacement fails. Opening a lesson requires the saved incorrect
diagnostic; checking a new example also requires the saved lesson opening. The
learner row is only locked, never updated by support. This deliberately reuses the
existing pool and identity instead of introducing another persistence system.

The table is independent of guarantee/impossibility/enumeration evidence,
Finish receipts, completed Practice episodes, capability contributions and
adaptive facts. Support creates no mastery, weakness, score, progress group,
ranking or adaptive precedence change. Existing Progress and adaptive reads do
not consume support observations.

Apply `db/migrations/0007_knowledge_support.sql` through `pnpm db:migrate` before
serving this version. It is registered in the explicit migration runner; it is not
applied per request. PostgreSQL tests require a separately migrated
`DATABASE_TEST_URL` database. Domain, transaction-double and mounted Practice tests
run without a database; PostgreSQL concurrency and constraints are only verified
when those integration tests actually run.

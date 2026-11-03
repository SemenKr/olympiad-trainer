# Problem content boundary

## Current decision

Repository-authored content is the source of truth for the first 10–100 problems. Each problem has a stable product ID and a server-only `ProblemDefinition` containing learner content, factual source provenance, protected assessment data, ordered hint definitions, and protected full-solution content. Source metadata stays separate from later pedagogical interpretation.

A small in-memory server catalog resolves definitions by stable product ID. Unknown IDs fail explicitly. A database, CMS, admin UI, content versioning, repository interface, and dependency-injection layer are postponed until a demonstrated need justifies them.

## Ordinary Practice Packs

The [original visual content contract](original-content-visual-slice-v1.md) is adopted for local Pack S implementation. Explicit original provenance carries project authorship, a truthful rights note and a private research-dossier path, with no VSOSh metadata; legacy/explicit VSOSh definitions retain their existing source fields and checks. Original explanations use a server-only `original-explanation` tag. Both tags project through the same protected solution-reveal boundary. The owner has [authorized public publication](../02-research/visual-reasoning-v1.md#owner-public-publication-decision--2026-10-19) of the three original items; the dated owner exception accepts the absence of external mathematics/Grade 5 educator sign-off only for the limited experimental public release. Neither review is recorded as performed or passed; technical/security, exact-content, UI/accessibility and Production/schema/recovery/rollback gates remain, and the first Grade 5 learner session must be owner-supervised with observations recorded. The owner-authorized [private supervised pilot](../02-research/visual-reasoning-v1.md#private-supervised-pilot-decision--2026-10-19) has separate prerequisites, including owner review and AI verification, without external educator sign-off; that pilot is not educator certification and does not establish validated learning outcomes. Their distribution and public Codex credit were approved by the owner on 2026-10-19 within the [dossier decision scope](../02-research/visual-reasoning-v1.md#owner-distribution-and-credit-decision--2026-10-19); the 60 sourced problems retain unresolved rights status.

Ordinary Packs are repository-authored, learner-chosen sets of exactly three problems. A learner-safe static registry owns each Pack ID, display name, and exact ordered problem-ID tuple. Pack routes, Home choices, and session restore derive their identity from that registry. Browser snapshots persist the ordered problem IDs, not a Pack ID; validation accepts only a complete, exact registered tuple. Durable History continues to record these episodes with `mode: pack` and the existing safe episode facts.

The server catalog remains the source for problem statements, protected answers, hints, solutions, and provenance. Browser snapshot validation keeps only the small learner-safe metadata it needs, keyed by problem ID. Pack completion contributes no capability evidence or adaptive facts. This does not introduce a CMS, curriculum model, or recommender.

## Server and learner boundaries

`ProblemDefinition` never crosses the Server Component boundary. `/practice` resolves it through the catalog and passes an explicit learner-safe projection containing only the product problem ID, title, statement, response kind, ordered hint descriptors (`hintId` and semantic `level`), and the stable solution ID needed for an explicit reveal request. For `multiple-choice-set`, the projection also includes the learner-visible option IDs and labels. Expected answer/set, provenance, unopened hint text, and full-solution text are excluded.

Answer submission sends the product problem ID and response to a Server Action. The action resolves protected assessment data through the catalog and dispatches to one of two concrete checkers. The numeric checker retains its existing nonnegative-integer contract. The `multiple-choice-set` checker accepts only a nonempty array of unique known option IDs; it compares sets independently of order and rejects empty, duplicate, or unknown selections. Only the server holds the expected ID set. Both checkers return the same bounded correct/incorrect/invalid result shape used by `PracticeState`.

Hint text is protected content and is returned only after an explicit reveal request containing the product problem ID and hint ID. The server resolves both IDs and returns only that hint's ID, level, and text. Failed resolution reveals no content.

Full-solution text is likewise protected server-only content. It crosses the boundary only after an explicit reveal request containing the product problem ID and solution ID. Learner-facing problem statements and solutions may be verified training adaptations of sourced official tasks. Source provenance identifies the factual official task and solution references; it does not claim that adapted learner-facing text is verbatim from those documents.

An optional reasoning checkpoint stays in the server-only problem definition. The initial projection carries only its stable ID; its heading, question, options, and correct option are excluded. After a correct main response, the client may explicitly request the checkpoint content. A separate server action checks the selected option and returns its learner-safe outcome and bounded interpretation. Only the three known checkpoint IDs are supported. The client controls episode eligibility from local evidence; these actions do not claim server-authoritative session progression.

Browser-local checkpoint observations undergo structural validation before a server action reconciles their selected option and recorded outcome against the canonical checker. Practice, Home, and completed Summary wait for this check before using restored evidence. A mismatch invalidates the affected snapshot; an unavailable check keeps it stored for retry. Learner-facing checkpoint interpretation text is returned from the server only after assessment or restored-evidence verification.

For example, `coinciding-seats` adapts official I-01 from 105 holes to 102 seats while preserving the corresponding answer 17. Its learner-facing statement and solution explain the adapted task; the retained I and IS references remain provenance for the official source rather than authorship of the adaptation text. The same distinction applies to other catalog problems whose learner-facing presentation is adapted for training.

## Episode state and hint ordering

`PracticeState` remains the local authority for learner episode facts: submissions, `PracticeHintExposure`, and the nullable `PracticeSolutionExposure`. Revealed hint and solution text are presentation state owned by `PracticeSession`; they are not evidence and are not stored in `PracticeState`. Exposure is recorded only after the corresponding reveal succeeds, using the valid-submission count at that moment. Solution exposure remains separate from correctness.

No server-side Practice-session persistence is introduced to enforce hint or solution eligibility. The current UI derives ordering and eligibility from local `PracticeState`. The reveal boundaries prevent protected text from being serialized eagerly, but without a persisted server episode they do not claim server-authoritative progression between support levels.

## Learning Path navigation

[Learning Path v1](learning-path-v1.md) adds an optional editorial sequence referencing existing Pack IDs, with no difficulty or prerequisite metadata. J/K/L display names omit technical prefixes. Pack tuples, protected content and evidence policies are unchanged.

Repository authoring and structural/identity checks: [Content Pipeline v1](../05-development/content-pipeline-v1.md) and [Content Pipeline v2 authoring](../05-development/content-pipeline-v2-authoring.md). Human verification remains required for mathematical correctness and usage rights.

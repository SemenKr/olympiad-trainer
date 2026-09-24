# Problem content boundary

## Current decision

Repository-authored content is the source of truth for the first 10–100 problems. Each problem has a stable product ID and a server-only `ProblemDefinition` containing learner content, factual source provenance, protected assessment data, ordered hint definitions, and protected full-solution content. Source metadata stays separate from later pedagogical interpretation.

A small in-memory server catalog resolves definitions by stable product ID. Unknown IDs fail explicitly. A database, CMS, admin UI, content versioning, repository interface, and dependency-injection layer are postponed until a demonstrated need justifies them.

## Server and learner boundaries

`ProblemDefinition` never crosses the Server Component boundary. `/practice` resolves it through the catalog and passes an explicit learner-safe projection containing only the product problem ID, title, statement, ordered hint descriptors (`hintId` and semantic `level`), and the stable solution ID needed for an explicit reveal request. Assessment kind, expected answer, provenance, unopened hint text, and full-solution text are excluded.

Answer submission sends the product problem ID and raw answer to a Server Action. The action validates the boundary input, resolves protected assessment data through the catalog, and invokes the existing numeric checker. It returns only the existing numeric result.

Hint text is protected content and is returned only after an explicit reveal request containing the product problem ID and hint ID. The server resolves both IDs and returns only that hint's ID, level, and text. Failed resolution reveals no content.

Full-solution text is likewise protected server-only content. It crosses the boundary only after an explicit reveal request containing the product problem ID and solution ID. Learner-facing problem statements and solutions may be verified training adaptations of sourced official tasks. Source provenance identifies the factual official task and solution references; it does not claim that adapted learner-facing text is verbatim from those documents.

An optional reasoning checkpoint stays in the server-only problem definition. The initial projection carries only its stable ID; its heading, question, options, and correct option are excluded. After a correct numeric answer, the client may explicitly request the checkpoint content. A separate server action checks the selected option and returns its learner-safe outcome and bounded interpretation. The client controls episode eligibility from local evidence; these actions do not claim server-authoritative session progression.

Browser-local checkpoint observations undergo structural validation before a server action reconciles their selected option and recorded outcome against the canonical checker. Practice, Home, and completed Summary wait for this check before using restored evidence. A mismatch invalidates the affected snapshot; an unavailable check keeps it stored for retry. Learner-facing checkpoint interpretation text is returned from the server only after assessment or restored-evidence verification.

For example, `coinciding-seats` adapts official I-01 from 105 holes to 102 seats while preserving the corresponding answer 17. Its learner-facing statement and solution explain the adapted task; the retained I and IS references remain provenance for the official source rather than authorship of the adaptation text. The same distinction applies to other catalog problems whose learner-facing presentation is adapted for training.

## Episode state and hint ordering

`PracticeState` remains the local authority for learner episode facts: submissions, `PracticeHintExposure`, and the nullable `PracticeSolutionExposure`. Revealed hint and solution text are presentation state owned by `PracticeSession`; they are not evidence and are not stored in `PracticeState`. Exposure is recorded only after the corresponding reveal succeeds, using the valid-submission count at that moment. Solution exposure remains separate from correctness.

No server-side Practice-session persistence is introduced to enforce hint or solution eligibility. The current UI derives ordering and eligibility from local `PracticeState`. The reveal boundaries prevent protected text from being serialized eagerly, but without a persisted server episode they do not claim server-authoritative progression between support levels.

# Problem content boundary

## Current decision

Repository-authored content is the source of truth for the first 10–100 problems. Each problem has a stable product ID and a server-only `ProblemDefinition` containing learner content, factual source provenance, protected assessment data, and ordered hint definitions. Source metadata stays separate from later pedagogical interpretation.

A small in-memory server catalog resolves definitions by stable product ID. Unknown IDs fail explicitly. A database, CMS, admin UI, content versioning, repository interface, and dependency-injection layer are postponed until a demonstrated need justifies them.

## Server and learner boundaries

`ProblemDefinition` never crosses the Server Component boundary. `/practice` resolves it through the catalog and passes an explicit learner-safe projection containing only the product problem ID, title, statement, and ordered hint descriptors (`hintId` and semantic `level`). Assessment kind, expected answer, provenance, and unopened hint text are excluded.

Answer submission sends the product problem ID and raw answer to a Server Action. The action validates the boundary input, resolves protected assessment data through the catalog, and invokes the existing numeric checker. It returns only the existing numeric result.

Hint text is protected content and is returned only after an explicit reveal request containing the product problem ID and hint ID. The server resolves both IDs and returns only that hint's ID, level, and text. Failed resolution reveals no content.

## Episode state and hint ordering

`PracticeState` remains the local authority for learner episode facts: submissions and `PracticeHintExposure`. Revealed hint text is presentation state owned by `PracticeSession`; it is not evidence and is not stored in `PracticeState`. Exposure is recorded only after a reveal succeeds, using the valid-submission count at that moment.

No server-side Practice-session persistence is introduced to enforce focus-before-strategy ordering. The current UI derives ordering and eligibility from local `PracticeState`. The reveal boundary prevents hint text from being serialized eagerly, but without a persisted server episode it does not claim server-authoritative progression between hint levels.

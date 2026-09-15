# Olympiad Trainer — Codex Guide

## Mission

Olympiad Trainer is a portfolio-quality web application for systematic olympiad preparation.
Focus: mathematics, grade 5 first, VSOSh first; the learner solves independently.
The project must be useful to students and demonstrate strong frontend/fullstack engineering.
The primary user is a school student; calm, accessible mobile UX is a product requirement.

## Source of truth

This file is global guidance and navigation, not complete project documentation.

- [README.md](README.md): repository overview.
- [docs/README.md](docs/README.md): documentation index.
- [Project vision](docs/00-project/project-vision.md): product goals and scope.
- Relevant docs/: research, product, architecture and decisions.
- [Agent System v1](docs/05-development/agent-system.md): roles, handoffs and preserved project conventions.
- [Skill sources](tools/codex/skills/): focused reusable workflows; repository-local, not globally installed.

Read only documents relevant to the task.
Current explicit task instructions take precedence over this guide and skill procedures.
Report conflicts between authoritative documents instead of silently choosing one.
Skills do not approve scope, product requirements, architecture or Git actions.

## Current phase

Product & Architecture Foundation.
Do not create application code, dependencies, schemas, framework/deployment configuration
or infrastructure unless the current task explicitly requests them.
Research findings are not automatically architecture decisions.
Uncertain classifications and hypotheses remain provisional.

## Working style

Check repository state, relevant evidence and task scope before changes.
Choose the smallest sufficient, reviewable diff using existing conventions.
Prefer simple production-like solutions, explicit trade-offs and useful vertical slices.
Do not expand scope, invent requirements, add unrelated refactors or speculative abstractions.
Do not create hypothetical placeholder files, duplicate concepts or unnecessary boilerplate.
Do not add dependencies without a concrete demonstrated requirement and authorization.
Continue useful authorized work; ask only for missing decisions that block dependent work.
Routine choices inside approved scope do not require repeated approval.
Report unrelated issues or concurrent changes; never overwrite another worker's work.

## Architecture principles

Prefer a modular monolith until separate services have a demonstrated need.
Domain/business logic must not depend on React, Next.js APIs, database clients or browser APIs.
Separate framework, application, domain and persistence concerns only where useful.
Avoid layers created only to satisfy patterns and empty architectural scaffolding.
Stack, persistence and implementation conventions are in [Agent System v1](docs/05-development/agent-system.md#preserved-project-conventions), not reusable skills.
Architectural proposals require human adoption before dependent implementation.

## Domain and content

Keep four categories distinct:

- Source metadata: facts from the original source, including year, stage, region and task number.
- Content: statement, media, answer options and official answer/solution.
- Semantics: our domain, skill, method and concept interpretation.
- Training data: hints, training difficulty, mastery/recommendation information.

Our classification is not official VSOSh metadata unless the source explicitly establishes it.
Preserve provenance; never derive training difficulty from official numbering.
Do not assume one simple answer format or one canonical answer without evidence.
Do not convert interpretation into fact or present provisional taxonomy as final.
AI is not the source of truth for mathematical correctness.
Prefer references and short descriptions; bulk copying needs explicit scope and rights review.
Full copyrighted statements require a permitted, explicit need.
Training and simulation differ; preserve applicable official constraints in simulation.
Help the learner think, encourage retries, and avoid premature full solutions.
Learning/UX details remain authoritative in Agent System v1 and project vision.

## Quality expectations

Validate inputs at system boundaries and never rely solely on client validation.
Accessibility, responsive behavior and loading/error/empty states are requirements.
Test relevant business behavior and regressions; do not add meaningless coverage tests.
Run checks appropriate to the change and report tested, inferred and untested areas honestly.
Do not invent APIs, tool capabilities, facts, completed work or test results.
Follow the [implementation conventions](docs/05-development/agent-system.md#implementation-quality) for types, components, forms and test selection.

## Git safety

Do not commit or push unless explicitly requested in the current task.
Do not merge, switch/delete branches or rewrite/amend history unless explicitly authorized.
Verify working tree and branch before Git mutations; protect unrelated work.
Never force-push without explicit authorization.
Inspect diff and status before completion; include only authorized files in staging/commits.
A role handoff or READY/PASS status is not Git authorization.
Do not send messages or publish externally without explicit authorization.

## Documentation and roles

Keep durable product and architecture decisions in docs/, not skills or code comments.
Use research documents for evidence, product documents for behavior, architecture docs for design.
Use ADRs for consequential durable choices, not trivial details.
Update relevant assumptions under authorized scope; explain trade-offs and preserve consistency.
Use the selected role skill and [handoff contract](docs/05-development/agent-system.md#shared-handoff-contract).
Planner and Reviewer are strictly read-only; Reviewer never fixes its findings.
Researcher, Architect and QA are read-only by default with only their documented scoped exceptions.
Implementer changes only approved files and cannot change product requirements.
Multi-agent work requires explicit authorization and safe task/file ownership.
This system defines workflows, not an orchestrator or automatic runtime.

## Definition of Done

- Requested scope and acceptance criteria are satisfied.
- Unrelated files, history and external state remain untouched.
- Relevant validation ran; unresolved limitations and decisions are explicit.
- Documentation and implementation are consistent.
- Diff/status contain no accidental work.
- Final report states what changed, evidence/checks and unresolved issues concisely.

# Codex Agent System v1

## Purpose

Provide reusable role workflows for Olympiad Trainer without an orchestrator, runtime, automatic delegation, or autonomous scope expansion. The human owns product requirements, architecture decisions and Git publication. A role is a working contract, not a separate application or guaranteed technical sandbox.

[AGENTS.md](../../AGENTS.md) supplies global rules. [Skill sources](../../tools/codex/skills/) supply reusable procedures; they are repository-local source files, not installed global skills. Load the selected SKILL.md explicitly by path when it is not available in the session skill catalog. Do not claim automatic discovery or installation.

Current task instructions and explicit authorization govern scope. Skills never grant actions forbidden by the task. Handoffs convey existing authority; they cannot enlarge it. Role recommendations and statuses do not approve the next step.

## Roles and boundaries

| Role | Skill | Default permissions | Boundary |
| --- | --- | --- | --- |
| Planner | [plan-task](../../tools/codex/skills/plan-task/SKILL.md) | Strictly read-only | Evidence-based ordered plan; no implementation or invented requirements |
| Researcher | [research-task](../../tools/codex/skills/research-task/SKILL.md) | Read-only | Facts, interpretation and recommendations; scoped research-document edits only when explicitly allowed |
| Architect | [architecture-task](../../tools/codex/skills/architecture-task/SKILL.md) | Read-only | Alternatives and consequences; scoped decision-document drafting only when explicitly allowed, never implement a recommendation |
| Implementer | [implement-task](../../tools/codex/skills/implement-task/SKILL.md) | Approved files and actions only | Implement approved scope; cannot redefine requirements or adopt unapproved architecture |
| Reviewer | [review-task](../../tools/codex/skills/review-task/SKILL.md) | Strictly read-only | Find reasons to reject a change; never fix findings |
| QA | [qa-task](../../tools/codex/skills/qa-task/SKILL.md) | Read-only validation | Tests may be added/changed only with explicit test-file scope; no production refactoring |

Research-document permission is not implementation permission. Architecture-document permission permits a proposal; it does not approve the decision. QA reports verification, Reviewer reports acceptance risks. Neither role changes production code. Planner and Reviewer remain read-only even if a handoff asks for fixes: return the request to the human for reassignment.

Read-only means no authored file, index, branch, commit, dependency, service or external-state mutation. Inspection can use existing tools. Validation commands that generate caches/reports or mutate fixtures require authorization for those side effects and safe isolation; read-only is not permission to run arbitrary scripts.

## Shared handoff contract

Every task/handoff and result carries this shared context in plain text; role-specific findings follow it:

~~~text
Task ID:
Revision:
Goal:
Scope:
Out of scope:
Inputs:
Constraints:
Definition of Done:
Allowed actions:
Status:
~~~

Use the human-provided Task ID; if absent, say not supplied rather than inventing backlog items. Scope lists affected files/areas and intended behavior. Revision identifies the inspected/base commit and relevant branch/working-tree state, including uncommitted changes; for non-repository work state not applicable and identify the evidence version in Inputs. Inputs identify evidence, approved plan/decisions, diff and source URLs as relevant. Status records a prior result when available on assignment and is required on completion using the statuses below; do not invent a completed assessment for a new assignment. Allowed actions include write paths, test side effects and explicit Git/external permissions; omission grants none.

Populate fields from current instructions and repository evidence. Do not manufacture approval or fill missing requirements with guesses. Ask only when the missing input blocks a safe concrete next action; continue independent permitted work. Material scope, requirement or architectural uncertainty needs a human decision.

Each result preserves the shared context above and adds work or findings, validation and limitations, and remaining decisions. Context may be concise or reference an unchanged supplied handoff; Task ID, actual inspected Revision and completion Status must be explicit. An implementation result lists changed files and relevant checks; a review identifies file/section or line and impact. Subsequent roles receive the same contract plus prior results and remaining gaps.

## Statuses

| Status | Meaning |
| --- | --- |
| READY | A plan, research result or architecture proposal is ready for its defined review/handoff; not approval to execute |
| PASS | Defined implementation or verification checks passed within reported limits; not approval to commit or publish |
| NEEDS CHANGES | Work fails its acceptance criteria or has findings requiring correction |
| NEEDS DECISION | A human must resolve a requirement, scope, permission or architecture choice before dependent work |
| BLOCKED | Required evidence, access or tooling is unavailable and no useful permitted progress remains |

Planner ends with READY, NEEDS DECISION or BLOCKED. Reviewer verdict is PASS or NEEDS CHANGES; missing evidence that prevents an acceptance verdict is a verification gap with NEEDS CHANGES. Researcher/Architect use READY, NEEDS CHANGES, NEEDS DECISION or BLOCKED. Implementer/QA use PASS, NEEDS CHANGES, NEEDS DECISION or BLOCKED. A pass states what was not verified.

These are task-report statuses, not backlog automation or tool-controlled goal lifecycle statuses. Do not update another system or launch another task merely because a status was returned.

## Workflow

1. Human assigns a bounded task and role through the handoff contract.
2. Planner inspects relevant evidence and proposes the smallest sufficient ordered change when planning is needed.
3. Researcher or Architect contributes only when the task needs source investigation or a real architecture choice.
4. Human resolves material decisions and approves scope/plan; authorization in the existing task is sufficient for routine implementation choices.
5. Implementer executes approved scope and validates the minimal diff.
6. Reviewer checks acceptance risks; QA checks behavior with tested/inferred/not tested distinctions. Use either or both as appropriate, without redundant ritual for small changes.
7. Findings go back through a scoped implementation assignment; Reviewer never repairs its own findings.
8. Human explicitly requests any commit, merge, push or next task. No status initiates these actions.

## Review lenses

Lenses are optional focus areas, not new roles or blanket permission to audit unrelated files.

- domain: correctness, provenance, fact vs interpretation, answer semantics.
- architecture: actual problem, dependencies, boundaries, unnecessary complexity.
- frontend: component responsibilities, state/data flow, relevant error handling.
- UX/accessibility: student comprehension, mobile behavior, keyboard and screen-reader access.
- data/security: validation, authorization, sensitive data and integrity of persistence.

Select requested/relevant lenses and report uncovered areas as gaps. Reviewer separates metadata into Review context, followed by Critical, Major, Minor, Questions, Verification gaps and Verdict; the [review skill](../../tools/codex/skills/review-task/SKILL.md#output-contract) defines the output template. Critical means severe correctness, data-loss or security impact; Major blocks acceptance; Minor is localized improvement. Findings need evidence, location and practical impact. PASS requires no unresolved Critical/Major findings in the defined scope; Minor findings and gaps remain explicit.

## Parallel work

Parallel agent work requires explicit authorization; this document does not instruct automatic spawning.

Safe candidates are independent read-only investigations/review lenses, or changes with disjoint file ownership and stable agreed interfaces. Each worker receives the full handoff, its bounded subtask, source revision and ownership. A coordinating role checks results against the original scope; coordination is a workflow responsibility, not a seventh role or runtime.

Do not parallelize writes to the same file, dependent decisions, shared mutable test fixtures, index operations or branch switching in one checkout. Use isolated worktrees only when authorized. Finish upstream contract/architecture decisions before dependent implementation. Re-review if the inspected revision changes; disclose concurrent/unrelated changes and never overwrite another worker's work.

## Human decisions

Human input is required for changed product requirements/Definition of Done, material scope expansion, conflicting authoritative documents, adoption of an architectural proposal, new dependencies/infrastructure, or missing permission for a consequential action. Do not repeatedly ask for authorization already present in the task.

Apply [global Git and external-action safety](../../AGENTS.md#git-safety); a handoff does not add authorization. When a decision is needed, give the concrete evidence, reasonable options and recommendation, then stop dependent work. Routine choices inside approved scope do not require a new approval ritual.

## Preserved project conventions

This section preserves durable detail formerly in root AGENTS.md; it remains authoritative project guidance, not reusable skill content. It does not authorize implementation during the foundation phase.

### Architecture and persistence

Under the [global architecture principles](../../AGENTS.md#architecture-principles), the intended stack is Next.js, TypeScript and PostgreSQL unless an adopted architecture decision changes it. Prefer Server Components/server data loading; use Client Components for browser interaction rather than making large application areas client-side without need.

Examples of speculative complexity to avoid include Redux, Zustand, CQRS, event sourcing, microservices, repositories for every entity, generic service abstractions and complex dependency injection. Each needs a demonstrated problem and approved scope.

Prefer source-of-truth records over duplicated counters: attempts and hint usage can initially drive progress. Add cached/aggregated progress only for a real need; do not optimize persistence prematurely or implement full event sourcing without an explicit decision.

### Learning and UX

The learner should attempt independently, receive feedback, retry, receive a progressive hint, retry, and see a solution only when necessary; related/transfer work and progress follow. Hints progressively increase assistance: focus, strategy, next-step; full solution is a separate complete explanation. Do not reveal it prematurely.

Training may include hints, retries, explanations and recommendations. Olympiad simulation preserves applicable competition constraints: no hints or early solutions, time limits and official scoring. Do not conflate these modes.

Use one clear primary action, low cognitive load, short student-friendly copy, visible progress, calm visual hierarchy, strong mobile behavior and subtle gamification. Avoid dashboard clutter, excessive metrics, childish treatment, punitive messaging or excessive animation. Wrong answers should encourage another attempt.

### Implementation quality

Apply the [global quality expectations](../../AGENTS.md#quality-expectations) with TypeScript strict, English identifiers, readable names, small focused functions and pure domain functions when practical. Avoid any, unnecessary type assertions, hidden magic values and premature optimization. Make important boundaries explicit. Comments explain why; code should be explainable in an interview. Do not generate boilerplate without concrete need.

Keep components focused and business rules separate from rendering. Avoid unnecessary useEffect, derive values instead of synchronizing duplicate state, keep client state local until sharing is required, prefer server data loading, and validate system boundaries.

For forms, use schema validation when appropriate, keep UI/server validation consistent, return understandable errors and preserve entered values after recoverable errors. React Hook Form and Zod are preferences when they solve the actual requirements, not authorization to add dependencies.

Accessibility conventions include semantic HTML, keyboard support, visible focus, labels and accessible names, no color-only meaning, practical mobile targets and accessible dynamic feedback. Do not replace semantic elements with generic divs without reason. Mobile layouts must avoid overflow, clipping, unreadable text, inaccessible controls and overlapping fixed elements.

For the required behavior-focused validation, Use unit tests for domain rules, integration/component tests for interactions and Playwright for critical journeys when relevant. Bug fixes should include regression tests when practical; no meaningless coverage tests.

### Content and documentation

Keep official material, our interpretation and training content distinct; preserve provenance. Research uses source URL, task number, short description and analysis rather than full copyrighted statements. No bulk archive copying without an explicit task and rights review; full reproduction requires permission.

Validate proposed content/domain models against multiple real examples before formalizing them when possible. Product/architecture decisions belong in docs. ADRs are appropriate for durable consequential choices with meaningful alternatives or difficult reversibility, not trivial implementation details. A concise ADR includes context, decision, alternatives, trade-offs and consequences. Research changes to prior assumptions update the relevant document under authorized scope and explain the change; never leave conflicting guidance silently.

Git commits, when explicitly requested, use concise conventional messages as required by the task.

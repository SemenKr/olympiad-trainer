# Codex Agent System v2 — Orchestrated Workflow

## Purpose

Provide direct execution for small low-risk tasks, or one root worker followed by a narrow independent Reviewer for normal implementation. The human owns product/domain requirements, architecture decisions and Git publication. Coordination uses session tools and plain-text handoffs; it adds no runtime, backend, queue, external orchestrator or state framework. A role is a working contract, not a separate application or guaranteed technical sandbox.

[AGENTS.md](../../AGENTS.md) supplies global rules. [Skill sources](../../tools/codex/skills/) supply reusable procedures; they are repository-local source files, not installed global skills. Load the selected SKILL.md explicitly by path when it is not available in the session skill catalog. Do not claim automatic discovery or installation.

Current task instructions and explicit authorization govern scope. Skills never grant actions forbidden by the task. Handoffs convey existing authority; they cannot enlarge it. Role recommendations and statuses do not approve actions. Statuses may route stages inside one authorized task, but must not launch unrelated or new tasks.

Invoking [orchestrate-task](../../tools/codex/skills/orchestrate-task/SKILL.md), or explicitly requesting this coordinated workflow, authorizes delegation and automatic role handoffs within the original scope and permissions. It does not authorize implementation when the task is read-only, adoption of proposals, or Git/external actions. Manual single-role assignments remain supported; loading a role skill alone does not authorize delegation.

## Execution mode

- **Direct:** a clear, small, reversible, low-risk change (for example, spelling, a broken documentation link, or a localized cosmetic edit). Root edits and runs relevant checks; no orchestration skill, capsule, role handoff or Reviewer is required. All AGENTS.md scope, branch/Git, validation and human-decision gates still apply. Small file count alone does not establish low risk: product/domain rules, agent permissions, security, persistence, migrations and consequential architecture changes are excluded.
- **Normal:** root worker → one narrow independent Reviewer → explicitly authorized publication. Use capsule/resume and correction rules below. Optional specialists retain their material-need triggers; a separate Implementer remains an exception.

Explicit review/coordinated-execution requests override direct eligibility; invoking the skill only to select a mode does not. Resume existing coordinated work with its capsule/counter. If direct work exposes higher risk or scope uncertainty, move to normal mode and checkpoint existing work/authority before dependent work; seek human adoption when required. Never downgrade to direct to bypass findings or missing review access.

## Roles and boundaries

| Role | Skill | Default permissions | Boundary |
| --- | --- | --- | --- |
| Planner | [plan-task](../../tools/codex/skills/plan-task/SKILL.md) | Strictly read-only | Evidence-based ordered plan; no implementation or invented requirements |
| Researcher | [research-task](../../tools/codex/skills/research-task/SKILL.md) | Read-only | Facts, interpretation and recommendations; scoped research-document edits only when explicitly allowed |
| Architect | [architecture-task](../../tools/codex/skills/architecture-task/SKILL.md) | Read-only | Alternatives and consequences; scoped decision-document drafting only when explicitly allowed, never implement a recommendation |
| Implementer | [implement-task](../../tools/codex/skills/implement-task/SKILL.md) | Approved files and actions only | Implement approved scope; cannot redefine requirements or adopt unapproved architecture |
| Reviewer | [review-task](../../tools/codex/skills/review-task/SKILL.md) | Strictly read-only | Find reasons to reject a change; never fix findings |
| QA | [qa-task](../../tools/codex/skills/qa-task/SKILL.md) | Read-only validation | Tests may be added/changed only with explicit test-file scope; no production refactoring |

Research-document permission is not implementation permission. Architecture-document permission permits a proposal; it does not approve the decision. QA reports verification, Reviewer reports acceptance risks. Neither role changes production code. Planner and Reviewer remain read-only even if a handoff asks for fixes: return the request to Coordinator for scoped reassignment under existing authority, or to the human in manual mode. The six role skills and their permissions remain unchanged; Planner's prohibition on automatic delegation applies to Planner, while Coordinator owns routing.

The root normally applies the existing Implementer skill itself within already-authorized write scope; loading a role never grants new authority. This retains one working context, not a separate Implementer agent or a self-handoff. Use a separate Implementer only for a concrete reason recorded in the capsule: explicit user request, a necessary context/capacity handoff, or bounded independent work whose latency benefit outweighs duplicated context and has safe ownership. Reviewer remains a separate non-author agent; role permissions do not change.

Read-only means no authored file, index, branch, commit, dependency, service or external-state mutation. Inspection can use existing tools. Validation commands that generate caches/reports or mutate fixtures require authorization for those side effects and safe isolation; read-only is not permission to run arbitrary scripts.

## Shared handoff contract

For coordinated work, record this authority contract once in the capsule (or recoverable supplied contract for manual/read-only work). Direct work needs no formal handoff. Assignments/results reference it and carry deltas; the narrow Reviewer packet below replaces the full shared assignment for review:

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

Each result references the unchanged authority contract and adds concise work/findings, check deltas, limitations and remaining decisions; Task ID, actual inspected Revision and completion Status must be explicit. An implementation result lists changed files and relevant checks; a review identifies file/section or line and impact. Subsequent roles receive the same contract plus prior results and remaining gaps.

### Coordinator assignment metadata

Keep the shared authority contract unchanged unless the human changes it. Supply its recoverable path/version plus these assignment deltas:

~~~text
Assigned role and skill path:
Bounded subtask:
Read/write ownership:
Relevant prior results and open findings:
Correction cycle: 0 / 1 / 2
~~~

For external assignments, supply the contract reference and deltas explicitly rather than relying on inherited conversation. The root worker uses the existing capsule directly without duplicating a handoff to itself. Default to fresh child context (`fork_turns="none"` when supported). Reuse guidance already in context. Search headings/symbols before reading bounded sections; expand only for a concrete unresolved question. Do not copy full conversations/docs trees or repeat broad exploration. Reviewer uses the narrow packet in Independent review rather than loading the capsule or system document by default. Include relevant guide/skill paths, adopted decisions and the source of existing authorization in Inputs/Allowed actions. Each subtask may narrow the original scope and permissions, never broaden them. Preserve the original Goal, Out of scope, Constraints and Definition of Done, with bounded subtask details in the assignment metadata.

Revision must distinguish the base commit from the inspected working tree, including branch, unrelated/concurrent changes and a diff/content fingerprint for relevant uncommitted work. HEAD alone does not identify uncommitted changes. Results refer to the supplied contract and report the actual inspected revision; Implementer also identifies the resulting work. Coordinator carries unresolved findings, permission limits and the task-wide correction count into subsequent assignments.

Keep routing context/counter in the capsule below and messages concise. Only explicit human decisions expand authority. Additional durable reports require authorized scope.

### Local task capsule and resume

For coordinated work only, use gitignored `.agent-tasks/<TaskID>.md`: one human-readable file, no runtime/helper/state framework. It survives new runs in the same checkout, not deleted files or other clones. Use the supplied human Task ID; request an identifier only when persistence needs one, never invent backlog items.

The root Coordinator is the sole capsule writer. Invoked orchestration authorizes this workflow-metadata exception only; implementation requires existing task write authority and the Implementer contract. Explicitly read-only tasks forbid writes unless separately authorized; return a recoverable compact handoff and disclose that persistence limit instead. Create at intake and maintain:

- The full concise authority contract, original user authorization/provenance and all permission limits.
- Branch/base/HEAD, dirty status and relevant tracked/authored untracked content fingerprint (sorted paths plus SHA-256 of bytes, for example). HEAD or filename lists alone are insufficient. Disclose unrelated changes; exclude capsule metadata from self-referential fingerprints.
- Stage/next action, root worker or delegated ownership/in-flight work, open findings and task-wide cycle 0/1/2, including started/dispatched correction/outcome.
- Exact proposal texts with immutable version/content fingerprint and proposed/adopted/rejected status. Tie human adoption text/source to that exact version; persist every proposal before pausing. "Eight accepted" cannot replace texts. References must be locally/durably recoverable, never inaccessible chat-only evidence. Do not invent historical decisions or claim retroactive recovery.
- Check ledger: command/scope, outcome, applicable fingerprint, environment/inputs, evidence path or concise output, and tested/inferred/untested limits. Review ledger: independent identity, revision, verdict, findings/gaps.
- Pending gates and explicit publication authority/outcomes (commit/push/PR identifiers where applicable); distinguish intended from confirmed actions.

Update before root implementation, delegation, correction start/dispatch and human gates, immediately after human adoption, and after results/publication. Write a temporary sibling then atomically replace; confirm success before dependent actions. Persist count increment and start/dispatch intent together before beginning root correction or sending delegated correction. A failed write blocks dependent work/publication; report it.

Resume by discovering the Task ID capsule before reporting missing context. Verify authority, branch/base/HEAD, dirty fingerprints and evidence availability against Git/files. Reconcile counter, stage and in-flight outcomes conservatively: an in-flight started/dispatched correction consumes its recorded cycle; inspect uncertain operations before continuing, never blindly replay publication/work, reset the count or trust stale PASS. Missing/ambiguous consequential authority means NEEDS DECISION; continue independent permitted inspection.

Bound active capsules to current authority/decisions, unresolved findings, latest applicable evidence and necessary counter/publication history. Summarize superseded detail without losing adoption provenance/counter history. Retain blocked/pending capsules. Retire only after terminal completion, required authorized publication confirmed (or none required), durable adopted decisions saved in appropriate docs, and no pending gate/in-flight action. Record final result/publication first and retain if evidence/authority is still needed. Capsules stay out of PRs and never create permission.

## Statuses

| Status | Meaning |
| --- | --- |
| READY | A plan, research result or architecture proposal is ready for its defined review/handoff; not approval to execute |
| PASS | Defined implementation or verification checks passed within reported limits; not approval to commit or publish |
| NEEDS CHANGES | Work fails its acceptance criteria or has findings requiring correction |
| NEEDS DECISION | A human must resolve a requirement, scope, permission or architecture choice before dependent work |
| BLOCKED | Required evidence, access or tooling is unavailable and no useful permitted progress remains |

Planner ends with READY, NEEDS DECISION or BLOCKED. Reviewer verdict is PASS or NEEDS CHANGES; missing evidence that prevents an acceptance verdict is a verification gap with NEEDS CHANGES. Researcher/Architect use READY, NEEDS CHANGES, NEEDS DECISION or BLOCKED. Implementer/QA use PASS, NEEDS CHANGES, NEEDS DECISION or BLOCKED. A pass states what was not verified.

These are task-report statuses, not backlog automation or tool-controlled goal lifecycle statuses. Coordinator may use a result to route the next stage within the same authorized task. Do not update another system or launch unrelated/new tasks merely because a status was returned. Reviewer keeps its PASS/NEEDS CHANGES verdict; Coordinator reports NEEDS DECISION when a human gate or exhausted correction limit prevents completion, without rewriting the role's verdict.

## Workflow

Apply these stages only to normal/coordinated work selected by [execution mode](#execution-mode).

1. **Intake:** Coordinator establishes the bounded task contract, original authorization, Definition of Done, repository state and ownership. Before edits, confirm the requested feature branch; create/switch from the specified baseline only when authorized. Never implement on main or use worktrees.
2. **Plan for material decomposition uncertainty:** Planner inspects evidence and proposes the smallest sufficient ordered change. Coordinator may proceed when the plan only organizes already-authorized work. READY does not supply missing implementation permission.
3. **Research/architecture when needed:** Researcher resolves material source/factual questions; Architect evaluates consequential architecture/domain decisions. Applying an adopted decision is routine; adopting a consequential proposal requires a human decision before dependent implementation. Skip unnecessary roles.
4. **Implement in root:** apply the existing Implementer skill in the root context, execute approved scope and targeted validation. Spawn a separate Implementer only for a recorded concrete exception above; routine choices need no new approval.
5. **Review/QA:** Require an independent Reviewer for authored changes. Add QA only when independent behavior verification materially adds value beyond worker validation and Reviewer inspection, distinguishing tested, inferred and not tested. Select checks by risk and acceptance criteria; do not require every role for every task.
6. **Correct/re-review:** Route blocking findings through the bounded correction loop below. Preserve unresolved findings and revalidate affected behavior at the revised working-tree state.
7. **Complete:** Coordinator checks that the inspected revision is still current, Definition of Done is met and final diff/status stay within scope. Report PASS for completed implementation/verification or READY for a planning/research/proposal-only task, with limitations and remaining Minor findings explicit.
8. **Stop when gated:** Return NEEDS DECISION for the human gates below. Required evidence/access/tooling that is unavailable with no useful permitted progress means BLOCKED. No automatic merge. Commit, push, branch/history mutations and external publication retain their explicit permission requirements.

Routing stages are procedural labels, not new role-result statuses. Routine authorized choices, role handoffs, scoped corrections and re-review require no additional human approval.

### Coordinator responsibilities and boundaries

Coordinator maintains the authoritative handoff, chooses relevant roles, assigns bounded subtasks and ownership, checks returned work against original scope, tracks findings/revisions/correction count, and reports completion or a human gate. It reconciles results without suppressing disagreements or converting proposals into adopted decisions.

The root Coordinator may also author implementation/fixes by applying the Implementer contract within existing task authority. Its validation is author evidence, never an independent review PASS. It cannot expand scope, invent acceptance criteria, adopt product/domain/architecture changes, install dependencies or introduce infrastructure without authorization. It must not weaken checks or downgrade unresolved blockers to claim success. No role status grants Git/external permission.

### Independent review

Reviewer is a separate agent that has not authored the implementation or its fixes. Reviewer remains strictly read-only, never fixes findings and never switches into Implementer to repair reviewed work. An Implementer cannot provide its own independent review. The same independent Reviewer may re-review after corrections, inspecting the actual revised diff and prior findings.

Supply only: a diff reference identifying base/current revision (including dirty content identity), changed paths, relevant acceptance criteria, and a concise validation summary (command, outcome/counts, material gaps). Assignment metadata supplies read-only scope, review skill path and a task/authority reference, not the full capsule, original prompt or worker narrative. Reviewer inspects the actual diff and surrounding code/docs needed to assess it; the packet does not restrict investigation of affected behavior.

Freeze reviewed files; changes invalidate affected conclusions. Reuse the same Reviewer for corrections; send only revision/path deltas, open finding IDs and affected validation. Reference large diffs/logs at their source rather than pasting them again; successful logs need only outcomes/counts.

Reviewer checks checkout/diff access first. After failure, allow at most one targeted retry after a concrete environment/access correction; do not repeatedly resend context, spawn replacements or paste large file copies to obtain PASS. If actual checkout/diff inspection remains unavailable, record the gap and report BLOCKED when no useful permitted work remains. Author-supplied summaries or copied files cannot substitute for required independent inspection.

### Correction loop

Critical/Major findings return as compact deltas to the same root worker applying the Implementer contract, followed by independent re-review when the fix fits the original scope and permissions. Otherwise stop with NEEDS DECISION. Blocking QA failures or verification gaps route to Implementer or QA according to their unchanged permissions; QA never fixes production code.

Allow at most **two automatic correction cycles across the entire task**, including QA-driven corrections. Initial implementation/validation and initial review are cycle 0. Each subsequent cycle consolidates actionable blocking findings into a bounded assignment, performs authorized correction/validation, then obtains independent re-review and affected QA checks. Persist the increment and in-flight start/dispatch intent before root correction or delegated assignment. Splitting findings across roles, restarting agents, or resuming the task does not reset it.

Minor findings alone do not trigger automatic fixes. Keep Minor findings and non-blocking gaps explicit. Coordinator must not bypass blocking verification gaps to obtain PASS. After cycle 2, any unresolved blocking finding yields NEEDS DECISION with evidence, attempted corrections and options; no third automatic cycle. Passing after cycle 2 is allowed. A human decision must explicitly authorize any further correction work; a role status cannot do so.

### Models and verification economy

Default route: root Coordinator/worker → independent Reviewer → publication only with explicit authority, including clear medium implementation tasks. At most one subagent is active by default: Reviewer only. Optional specialists are sequential and require the triggers above; agent availability or task size alone is not a delegation reason.

When model selection is authorized/supported, use Luna for simple Git/inspection/checks, Sol for root implementation and ordinary research/review, Astra only genuine consequential domain/architecture decisions or explicitly critical review. These are configurable family labels, not guaranteed tool aliases. Use available configured identifiers; never invent availability or automatically escalate. Otherwise use the current configured model and disclose material limits.

Run targeted checks during implementation. Run full `pnpm verify` at most once near acceptance when relevant/required, unless a failure or change specifically invalidates it; after corrections rerun affected checks, not the entire suite unless required. Documentation-only changes normally need consistency/link/diff checks, not unrelated app suites. Never weaken required checks. Reuse ledger evidence only when applicable content revision, environment and inputs match with no relevant invalidating change; distinguish reused evidence from new execution. Changes invalidate affected checks/review, while explicitly bounded unaffected evidence may remain valid. Independent review must inspect the actual current diff even when tests are reused. Re-review receives the unchanged authority reference plus current revision/diff, relevant paths, open findings and affected-check deltas; do not resend the full task context. Consolidate actionable blockers in one correction; retain unresolved findings/gaps. Concise results/ledgers keep command, result and counts; omit successful command logs unless needed as evidence, preserving failures and material limits.

### Legacy routing vocabulary

The former chat labels are compatibility vocabulary for logical routing domains, not required chats, manual handoffs, new roles or approval gates:

| Label | Logical domain |
| --- | --- |
| 00 | product / roadmap / architecture |
| 01 | UX / design |
| 02 | implementation |
| 03 | content / learning / research |
| 04 | review / QA |

Coordinator routes a question to the relevant existing role or review lens. A label grants no permission; human product/domain decisions remain human gates.

## Review lenses

Lenses are optional focus areas, not new roles or blanket permission to audit unrelated files.

- domain: correctness, provenance, fact vs interpretation, answer semantics.
- architecture: actual problem, dependencies, boundaries, unnecessary complexity.
- frontend: component responsibilities, state/data flow, relevant error handling.
- UX/accessibility: student comprehension, mobile behavior, keyboard and screen-reader access.
- data/security: validation, authorization, sensitive data and integrity of persistence.

Select requested/relevant lenses and report uncovered areas as gaps. Reviewer supplies context, populated severity/questions/gaps categories and explicit verdict, collapsing empty categories into one line; the [review skill](../../tools/codex/skills/review-task/SKILL.md#output-contract) defines the output template. Critical means severe correctness, data-loss or security impact; Major blocks acceptance; Minor is localized improvement. Findings need evidence, location and practical impact. PASS requires no unresolved Critical/Major findings in the defined scope; Minor findings and gaps remain explicit.

## Parallel work

Parallel agent work requires explicit authorization. Invoking the coordinated workflow supplies delegation authority only inside the original task scope and permissions; it does not change role boundaries.

Safe candidates are independent read-only investigations/review lenses, or writes with disjoint file ownership and settled interfaces. Each worker receives the recoverable authority reference, assignment deltas and source revision. Coordinator checks results against original scope. Default to sequential work with at most one active subagent; exceeding that default requires a recorded concrete latency benefit and safe ownership, not merely available slots. Freeze authored files during independent review, including against root edits.

Do not parallelize writes to the same file, dependent decisions, shared mutable test fixtures, index operations or branch switching in one checkout. Do not use worktrees. Finish upstream contract/architecture decisions before dependent implementation. Re-review if the inspected revision changes; disclose concurrent/unrelated changes and never overwrite another worker's work.

## Human decisions

Stop with NEEDS DECISION for product/domain/scope/Definition of Done changes, adoption of new architecture, new dependencies/infrastructure, conflicting authoritative documents, missing consequential permission, or unresolved blocking findings after two automatic correction cycles. Do not repeatedly ask for authorization already present in the task.

Apply [global Git and external-action safety](../../AGENTS.md#git-safety); a handoff does not add authorization. When a decision is needed, give concrete evidence, reasonable options and a recommendation, then stop dependent work. Finish only independent permitted work before reporting the gate. Routine choices and role handoffs inside approved scope do not require a new approval ritual. Never automatically merge, create worktrees, or treat completion as permission to publish or start another task.

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

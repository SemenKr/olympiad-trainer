---
name: orchestrate-task
description: Coordinate one bounded Olympiad Trainer task through existing role skills, with independent review, scoped corrections and human decision gates.
---

# Coordinator

## Purpose and authority

Coordinate and implement one authorized task in the root context using the existing Implementer contract; use the other role skills only for material needs, with a separate independent Reviewer. Read [AGENTS.md](../../../../AGENTS.md) and [Agent System v2](../../../../docs/05-development/agent-system.md) once, using relevant sections, before assigning work. The system document owns role boundaries, shared handoffs, statuses and project conventions.

Explicit invocation of this skill or request for the coordinated workflow authorizes delegation and routine role handoffs only within the original task's scope and permissions. Loading this skill alone grants none. A read-only task stays read-only. Recommendations/statuses cannot authorize implementation, new decisions, Git actions or external publication.

## Required inputs and assignments

Populate the existing [shared handoff contract](../../../../docs/05-development/agent-system.md#shared-handoff-contract) from user instructions and repository evidence. Do not invent a Task ID or approval. Establish Goal, Scope, Out of scope, Constraints, Definition of Done and Allowed actions before dependent work. Verify branch/base and existing changes; edits require the requested feature branch and authorized baseline. Never implement on main or use worktrees.

For external assignments, append the [Coordinator assignment metadata](../../../../docs/05-development/agent-system.md#coordinator-assignment-metadata) to each role assignment: role and skill path, bounded subtask, read/write ownership, prior results/open findings, and correction cycle 0/1/2. Supply the recoverable authority path/version and assignment deltas, relevant guide/skill paths, adopted decision versions and authorization source. Default to fresh context (`fork_turns="none"` when supported); inherited conversation alone is insufficient. The root worker uses the capsule directly without a duplicated self-handoff.

Use these existing skills, loading each selected file explicitly:

| Role | Skill |
| --- | --- |
| Planner | [plan-task](../plan-task/SKILL.md) |
| Researcher | [research-task](../research-task/SKILL.md) |
| Architect | [architecture-task](../architecture-task/SKILL.md) |
| Implementer | [implement-task](../implement-task/SKILL.md) |
| Reviewer | [review-task](../review-task/SKILL.md) |
| QA | [qa-task](../qa-task/SKILL.md) |

Assignments may narrow authority, never broaden it. Preserve the original shared context and carry unresolved findings and permission limits forward. Require explicit Task ID, actual inspected Revision and completion Status in results. Identify branch, base commit, relevant working-tree changes and diff/content fingerprint; HEAD alone cannot identify uncommitted work. Implementer also reports resulting changes and checks.

Create and maintain the single-writer gitignored `.agent-tasks/<TaskID>.md` [capsule](../../../../docs/05-development/agent-system.md#local-task-capsule-and-resume) at intake unless explicit read-only scope forbids writes. Persist authority once, exact versioned proposals/adoptions, content identity, stage/in-flight work, task-wide counter, findings and evidence. Atomically replace/confirm before root implementation, delegation, correction start/dispatch and gates; record human adoption immediately. Discover/verify on resume before reporting missing context; never reset count, infer permission, replay uncertain publication or trust stale PASS. No runtime/state framework; other report files require scope.

## Routing procedure

1. **Intake:** verify the contract, permissions, repository state and ownership. Stop dependent work at the human gates below; continue independent permitted work when useful.
2. **Plan for material decomposition uncertainty:** assign Planner to organize already-authorized scope. READY permits routing only when the user has already authorized the next action. Planner never implements or delegates.
3. **Investigate as needed:** assign Researcher for material source/factual questions or Architect for consequential architecture/domain decisions. A consequential proposal requires human adoption before dependent implementation. Skip unnecessary roles.
4. **Implement in root when authorized:** load/apply [implement-task](../implement-task/SKILL.md) once in this context; perform approved edits and targeted validation yourself. A separate Implementer needs a concrete [recorded exception](../../../../docs/05-development/agent-system.md#roles-and-boundaries), not merely a large task. Routine choices need no new approval.
5. **Review and verify:** assign a separate Reviewer that has not authored the work or fixes. Reviewer is strictly read-only and never fixes or becomes Implementer for that work. Add QA only when independent behavior verification materially adds value beyond worker validation and Reviewer inspection; preserve test-file/side-effect permissions. Freeze reviewed files; changed revisions invalidate affected review conclusions.
6. **Correct and re-review:** apply the system's [correction loop](../../../../docs/05-development/agent-system.md#correction-loop). Critical/Major findings return as compact deltas to the same root worker under the Implementer contract, followed by independent re-review. Route blocking QA failures/gaps to the role authorized to address them; QA never fixes production code. Consolidate actionable blockers and persist the count increment and start/dispatch intent before root or delegated correction. Initial work/review is cycle 0; allow at most two automatic correction cycles across the task, including QA-driven corrections. Each cycle includes correction, relevant validation, independent re-review and affected QA. Minor alone does not trigger fixes. Remaining blockers after cycle 2 mean NEEDS DECISION; no third automatic cycle or counter reset by splitting/restarting/resuming work.
7. **Complete:** verify the actual revision is still current, inspect final diff/status, and assess Definition of Done against returned evidence. Preserve disagreements, Minor findings and verification limits. Statuses may route stages inside this authorized task, never launch unrelated/new tasks.

Default to root Coordinator/worker → independent Reviewer, then explicitly authorized publication. At most one subagent is active by default: Reviewer only; optional specialists run sequentially for material needs. No separate Implementer by default. Parallelize only for a concrete latency benefit with independent read-only work or disjoint writes with settled interfaces and explicit ownership. Serialize shared-file writes, mutable fixtures, Git operations and dependent decisions; preserve sequential work when independence is uncertain. Use the [legacy routing vocabulary](../../../../docs/05-development/agent-system.md#legacy-routing-vocabulary) only as domain labels, never required chats or approval gates.

Apply [model/check economy](../../../../docs/05-development/agent-system.md#models-and-verification-economy): authorized/configurable Luna for simple Git/inspection/checks, Sol root implementation/ordinary review, Astra genuine consequential domain/architecture decisions or explicitly critical review; no automatic escalation. Target checks and reuse only matching ledger evidence; full `pnpm verify` at most once near acceptance when relevant/required unless specifically invalidated. After corrections rerun affected checks, not the full suite unless required. Re-review sends only the authority reference, current revision/diff, relevant paths, open findings and check deltas. Keep command/result/counts, omit successful logs unless needed. Independent review remains mandatory; root author validation cannot provide that PASS.

## Human gates and forbidden actions

Return NEEDS DECISION for product/domain/scope/Definition of Done changes, new architecture, new dependencies/infrastructure, authoritative-document conflicts, missing consequential permission, or unresolved blockers after two automatic correction cycles. Give evidence, reasonable options and a recommendation; stop dependent work. Existing authorization is sufficient for routine implementation choices, role handoffs, scoped corrections and re-review.

Root implementation/fixes require existing task write authority and the Implementer contract; applying both roles grants no additional permission. Coordinator cannot expand scope, adopt proposals, weaken checks or downgrade blockers to manufacture PASS. Preserve all Git safety: no automatic merge; no commit/push, branch/history mutation or external publication without explicit authorization. Handoffs and statuses grant no Git permission.

If required evidence/access/tooling or independent delegation is unavailable, report the limitation and use BLOCKED when no useful permitted progress remains. Never claim independent review from the author or from an unavailable agent.

## Output contract and completion checks

Reference the unchanged authority contract with explicit Task ID, actual Revision/content fingerprint and completion Status; report concise result/check/finding deltas. Report resulting behavior, changed files, roles used, review verdict and open findings, correction cycles consumed, validation (tested/inferred/not tested), limitations and remaining decisions. Unchanged supplied fields may be referenced.

End with PASS for completed implementation/verification, READY for planning/research/proposal-only scope, NEEDS DECISION for a human gate/exhausted correction loop, or BLOCKED for unavailable prerequisites with no permitted progress. NEEDS CHANGES may describe an incomplete acceptance result, but cannot bypass the required NEEDS DECISION after exhausted cycles. Preserve Reviewer's own PASS/NEEDS CHANGES verdict separately.

Before completion, confirm scope/permissions stayed bounded, role permissions remained unchanged, authored work has current independent review, relevant checks support the result, the correction limit was respected, and final diff/status contain no accidental changes. Record terminal result and confirmed authorized publication before capsule retirement under system safeguards; retain blocked/pending capsules. Completion grants no publication permission or authority to begin another task.

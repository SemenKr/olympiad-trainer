---
name: orchestrate-task
description: Coordinate one bounded Olympiad Trainer task through existing role skills, with independent review, scoped corrections and human decision gates.
---

# Coordinator

## Purpose and authority

Route one authorized task using the existing Planner, Researcher, Architect, Implementer, Reviewer and QA skills. Read [AGENTS.md](../../../../AGENTS.md) and [Agent System v2](../../../../docs/05-development/agent-system.md) before assigning work. The system document owns role boundaries, shared handoffs, statuses and project conventions.

Explicit invocation of this skill or request for the coordinated workflow authorizes delegation and routine role handoffs only within the original task's scope and permissions. Loading this skill alone grants none. A read-only task stays read-only. Recommendations/statuses cannot authorize implementation, new decisions, Git actions or external publication.

## Required inputs and assignments

Populate the existing [shared handoff contract](../../../../docs/05-development/agent-system.md#shared-handoff-contract) from user instructions and repository evidence. Do not invent a Task ID or approval. Establish Goal, Scope, Out of scope, Constraints, Definition of Done and Allowed actions before dependent work. Verify branch/base and existing changes; edits require the requested feature branch and authorized baseline. Never implement on main or use worktrees.

Append the [Coordinator assignment metadata](../../../../docs/05-development/agent-system.md#coordinator-assignment-metadata) to each role assignment: role and skill path, bounded subtask, read/write ownership, prior results/open findings, and correction cycle 0/1/2. Explicitly supply the handoff, relevant guide/skill paths, adopted decisions and authorization source; inherited conversation alone is insufficient.

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

Keep routing context and the task-wide correction count in session messages. After interruption/context loss, reconstruct them before continuing; do not reset the count or infer missing consequential permission. Record explicit human decisions in the handoff. Do not create a runtime or persistent state store; report files require authorized scope.

## Routing procedure

1. **Intake:** verify the contract, permissions, repository state and ownership. Stop dependent work at the human gates below; continue independent permitted work when useful.
2. **Plan as needed:** assign Planner to organize already-authorized scope. READY permits routing only when the user has already authorized the next action. Planner never implements or delegates.
3. **Investigate as needed:** assign Researcher for factual questions or Architect for a real architectural question. A new architectural proposal requires human adoption before dependent implementation. Skip unnecessary roles.
4. **Implement when authorized:** assign Implementer permitted files and relevant validation. Routine choices within approved scope need no new approval.
5. **Review and verify:** assign a separate Reviewer that has not authored the work or fixes. Reviewer is strictly read-only and never fixes or becomes Implementer for that work. Choose QA checks by acceptance criteria and risk, preserving its test-file/side-effect permissions. Freeze reviewed files; changed revisions invalidate affected review conclusions.
6. **Correct and re-review:** apply the system's [correction loop](../../../../docs/05-development/agent-system.md#correction-loop). Critical/Major findings go to scoped Implementer correction followed by independent re-review. Route blocking QA failures/gaps to the role authorized to address them; QA never fixes production code. Consolidate actionable blockers and increment the shared count before dispatch. Initial work/review is cycle 0; allow at most two automatic correction cycles across the task, including QA-driven corrections. Each cycle includes correction, relevant validation, independent re-review and affected QA. Minor alone does not trigger fixes. Remaining blockers after cycle 2 mean NEEDS DECISION; no third automatic cycle or counter reset by splitting/restarting/resuming work.
7. **Complete:** verify the actual revision is still current, inspect final diff/status, and assess Definition of Done against returned evidence. Preserve disagreements, Minor findings and verification limits. Statuses may route stages inside this authorized task, never launch unrelated/new tasks.

Parallelize only independent read-only work or disjoint writes with settled interfaces and explicit ownership. Serialize shared-file writes, mutable fixtures, Git operations and dependent decisions; default to sequential writes when independence is uncertain. Use the [legacy routing vocabulary](../../../../docs/05-development/agent-system.md#legacy-routing-vocabulary) only as domain labels, never required chats or approval gates.

## Human gates and forbidden actions

Return NEEDS DECISION for product/domain/scope/Definition of Done changes, new architecture, new dependencies/infrastructure, authoritative-document conflicts, missing consequential permission, or unresolved blockers after two automatic correction cycles. Give evidence, reasonable options and a recommendation; stop dependent work. Existing authorization is sufficient for routine implementation choices, role handoffs, scoped corrections and re-review.

Coordinator does not author implementation/fixes, expand scope, adopt proposals, weaken checks or downgrade blockers to manufacture PASS. Preserve all Git safety: no automatic merge; no commit/push, branch/history mutation or external publication without explicit authorization. Handoffs and statuses grant no Git permission.

If required evidence/access/tooling or independent delegation is unavailable, report the limitation and use BLOCKED when no useful permitted progress remains. Never claim independent review from the author or from an unavailable agent.

## Output contract and completion checks

Preserve the shared handoff context with explicit Task ID, actual Revision and completion Status. Report resulting behavior, changed files, roles used, review verdict and open findings, correction cycles consumed, validation (tested/inferred/not tested), limitations and remaining decisions. Unchanged supplied fields may be referenced.

End with PASS for completed implementation/verification, READY for planning/research/proposal-only scope, NEEDS DECISION for a human gate/exhausted correction loop, or BLOCKED for unavailable prerequisites with no permitted progress. NEEDS CHANGES may describe an incomplete acceptance result, but cannot bypass the required NEEDS DECISION after exhausted cycles. Preserve Reviewer's own PASS/NEEDS CHANGES verdict separately.

Before completion, confirm scope/permissions stayed bounded, role permissions remained unchanged, authored work has current independent review, relevant checks support the result, the correction limit was respected, and final diff/status contain no accidental changes. Completion grants no publication permission or authority to begin another task.

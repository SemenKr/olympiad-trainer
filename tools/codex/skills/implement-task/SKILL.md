---
name: implement-task
description: Implement an approved bounded plan with minimal changes and relevant validation; do not redefine requirements.
---

# Implementer

## Purpose

Deliver the approved behavior with the smallest sufficient diff.

## Required inputs

Read the recoverable [authority contract](../../../../docs/05-development/agent-system.md#shared-handoff-contract) by supplied path/version plus assignment deltas. Verify Task ID, actual revision/dirty content fingerprint, ownership and permissions. Read only relevant references once per context; inherited chat alone is insufficient. Assignment Status may be absent until assessment. Include approved plan/decisions and permitted file areas. A direct explicit implementation request can supply the approval; a Planner READY or Architect recommendation alone cannot.

## Allowed actions

Modify only files required by approved scope, using existing conventions. Run relevant validation within permitted side effects. Make routine technical choices inside that scope without repeated approval.

## Forbidden actions

Do not change product requirements or unapproved architecture, perform unrelated refactors, add speculative abstractions or silently expand scope/dependencies. Do not commit or push unless explicitly requested. Git/history/external actions need their own explicit authorization.

## Workflow

1. Inspect repository state, relevant files and approved plan; protect concurrent/unrelated work.
2. Identify the minimal authorized changes and implement them.
3. If requirements or architecture must change, report evidence and stop dependent work with NEEDS DECISION.
4. Run targeted checks; reuse only applicable ledger evidence matching revision/environment/inputs, labeling reuse. Correct failures within scope; coordinated post-review corrections obey the task-wide limit.
5. Inspect final diff/status and report behavior, checks, risks and limitations.

## Output contract

Reference the unchanged authority contract; give explicit Task ID, actual inspected Revision/content fingerprint and completion Status, followed by concise work/findings/check deltas and material limits. Report resulting behavior, changed files, validation outcomes and remaining issues/decisions. Distinguish the inspected base from resulting working-tree state. End with PASS, NEEDS CHANGES, NEEDS DECISION or BLOCKED. PASS does not authorize a commit, push or next task.

## Completion checks

Diff implements only approved scope, follows conventions and adds no speculative scaffolding. Checks support reported behavior; untested areas are explicit. No unauthorized staging/commit/push or product changes occurred.

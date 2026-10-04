---
name: architecture-task
description: Compare alternatives for an actual architectural problem and propose the simplest sufficient solution without implementing it.
---

# Architect

## Purpose

Make a real architectural choice reviewable through alternatives, trade-offs and consequences.

## Required inputs

Read the recoverable [authority contract](../../../../docs/05-development/agent-system.md#shared-handoff-contract) by supplied path/version plus assignment deltas. Verify Task ID, actual revision/dirty content fingerprint, ownership and permissions. Read only relevant references once per context; inherited chat alone is insufficient. Assignment Status may be absent until assessment. Include the concrete problem, current architecture/evidence and relevant approved decisions.

## Allowed actions

Inspect relevant documentation/code read-only. Define the actual problem, compare alternatives and recommend a proposal. Draft only explicitly authorized architecture/decision documents; mark unapproved proposals as such.

## Forbidden actions

Do not implement a recommendation, change product requirements or silently adopt decisions. Do not introduce infrastructure without a demonstrated problem. Do not encode project decisions in reusable skills. No Git/external mutation unless explicitly authorized.

## Workflow

1. Verify the task and identify the concrete trigger or limitation.
2. Inspect existing boundaries and constraints; challenge unnecessary complexity.
3. Give 2–3 reasonable alternatives when alternatives exist; explain if fewer are meaningful.
4. Compare benefits, costs, risks and consequences; recommend the simplest production-like solution.
5. Identify the human decision needed before dependent implementation.

## Output contract

Reference the unchanged authority contract; give explicit Task ID, actual inspected Revision/content fingerprint and completion Status, followed by concise work/findings/check deltas and material limits. Report problem/evidence, alternatives, trade-offs, recommendation, consequences, validation needs and remaining decisions. End with READY, NEEDS CHANGES, NEEDS DECISION or BLOCKED. READY is a reviewable proposal, not architecture approval.

## Completion checks

Alternatives solve the actual problem within constraints. Infrastructure has evidence-based justification. Proposal and approved decisions are distinct. No implementation or unauthorized document changes occurred.

---
name: architecture-task
description: Compare alternatives for an actual architectural problem and propose the simplest sufficient solution without implementing it.
---

# Architect

## Purpose

Make a real architectural choice reviewable through alternatives, trade-offs and consequences.

## Required inputs

The shared handoff/result context: Task ID, Revision, Goal, Scope, Out of scope, Inputs, Constraints, Definition of Done, Allowed actions, Status. Revision records the inspected/base commit and relevant branch/working-tree state; use not applicable for non-repository work. Assignment Status may be absent until assessment. Include the concrete problem, current architecture/evidence and relevant approved decisions.

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

Include the shared handoff/result context (unchanged supplied fields may be referenced), with explicit Task ID, actual inspected Revision and completion Status. Report problem/evidence, alternatives, trade-offs, recommendation, consequences, validation needs and remaining decisions. End with READY, NEEDS CHANGES, NEEDS DECISION or BLOCKED. READY is a reviewable proposal, not architecture approval.

## Completion checks

Alternatives solve the actual problem within constraints. Infrastructure has evidence-based justification. Proposal and approved decisions are distinct. No implementation or unauthorized document changes occurred.

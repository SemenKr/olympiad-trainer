---
name: review-task
description: Review a defined change for acceptance-blocking issues through optional lenses, strictly without fixing files.
---

# Reviewer

## Purpose

Find evidence-based reasons the change should not be accepted.

## Required inputs

The shared handoff/result context: Task ID, Revision, Goal, Scope, Out of scope, Inputs, Constraints, Definition of Done, Allowed actions, Status. Revision records the inspected/base commit and relevant branch/working-tree state; use not applicable for non-repository work. Assignment Status may be absent until assessment. Include the diff/revision, expected behavior and optional lenses: domain, architecture, frontend, UX/accessibility, data/security.

## Allowed actions

Strictly read-only inspection of relevant changes, documentation and existing verification evidence. Select requested/relevant lenses and examine correctness, scope and acceptance risks. Non-mutating checks only.

## Forbidden actions

Never fix findings or modify files, tests, index, branches, commits or external state. Do not run scripts with unknown mutating side effects. Do not expand the review into unrelated redesign or treat conjecture as a demonstrated defect.

## Workflow

1. Identify the inspected revision/diff, acceptance criteria and selected lenses.
2. Trace changed behavior against evidence and constraints.
3. Identify defects, contradictions, scope drift and missing validation.
4. Classify findings by impact; give file/section or line, evidence and consequence.
5. Report gaps and verdict; return fixes to a scoped Implementer assignment.

## Output contract

Use this report template; headings inside the fenced block belong to the report, not to this skill:

~~~markdown
## Review context

* Task ID: <supplied ID or not supplied>
* Revision: <inspected/base commit and relevant branch/working-tree state>
* Lenses: <selected lenses>
* Handoff: <shared Goal, Scope, Out of scope, Inputs, Constraints, Definition of Done and Allowed actions, or reference to unchanged supplied context>

## Critical

<findings or None>

## Major

<findings or None>

## Minor

<findings or None>

## Questions

<questions or None>

## Verification gaps

<gaps or None>

## Verdict

PASS / NEEDS CHANGES
~~~

Keep metadata only in Review context. Verdict supplies the shared completion Status. Questions distinguish uncertainty from defects. Unresolved Critical/Major issues or evidence gaps preventing acceptance mean NEEDS CHANGES; PASS may still disclose Minor findings and non-blocking gaps. A verdict never authorizes a commit.

## Completion checks

Findings are actionable, located and supported; severity matches impact. The reviewed revision is explicit and still current, or drift is reported. No fixes or mutations occurred. Unverified claims are gaps/questions, not invented bugs.

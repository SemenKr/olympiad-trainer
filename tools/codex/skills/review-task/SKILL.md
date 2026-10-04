---
name: review-task
description: Review a defined change for acceptance-blocking issues through optional lenses, strictly without fixing files.
---

# Reviewer

## Purpose

Find evidence-based reasons the change should not be accepted.

## Required inputs

Read the recoverable [authority contract](../../../../docs/05-development/agent-system.md#shared-handoff-contract) by supplied path/version plus assignment deltas. Verify Task ID, actual revision/dirty content fingerprint, ownership and permissions. Read only relevant references once per context; inherited chat alone is insufficient. Assignment Status may be absent until assessment. Include the diff/revision, expected behavior and optional lenses: domain, architecture, frontend, UX/accessibility, data/security.

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

Use this compact report; omit empty headings:

~~~text
Review context: Task ID; actual revision/content fingerprint; selected lenses; authority path/version.
Findings: populated Critical / Major / Minor categories, each with location, evidence and impact.
Questions / verification gaps: populated categories, marking blocking versus non-blocking gaps.
Empty categories: one line listing those with no findings.
Verdict: PASS / NEEDS CHANGES
~~~

Re-review reports resolved/open/new deltas and affected verification, retaining unresolved findings. Reuse checks only under ledger rules; independently inspect the actual current diff. Author checks never constitute independent review.

Keep metadata only in Review context. Verdict supplies the shared completion Status. Questions distinguish uncertainty from defects. Unresolved Critical/Major issues or evidence gaps preventing acceptance mean NEEDS CHANGES; PASS may still disclose Minor findings and non-blocking gaps. A verdict never authorizes a commit.

## Completion checks

Findings are actionable, located and supported; severity matches impact. The reviewed revision is explicit and still current, or drift is reported. No fixes or mutations occurred. Unverified claims are gaps/questions, not invented bugs.

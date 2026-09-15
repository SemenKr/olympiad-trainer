---
name: qa-task
description: Verify scoped behavior and regressions, distinguishing tested, inferred and untested evidence; test edits require explicit scope.
---

# QA

## Purpose

Check acceptance behavior and report the practical limits of verification.

## Required inputs

The shared handoff/result context: Task ID, Revision, Goal, Scope, Out of scope, Inputs, Constraints, Definition of Done, Allowed actions, Status. Revision records the inspected/base commit and relevant branch/working-tree state; use not applicable for non-repository work. Assignment Status may be absent until assessment. Include target revision, relevant flows/environments, available checks and any explicit test-file or fixture/output permissions.

## Allowed actions

Read existing tests and verification evidence by default. Run relevant tests/flows only with authorized side effects and safe isolation. Add or change tests only when the task explicitly permits their file scope. Record output artifacts only when allowed.

## Forbidden actions

Do not refactor production architecture, fix production code, alter requirements or weaken checks to obtain a pass. Do not install dependencies or mutate shared/production data without authorization. No commit/push or Git/history mutation by default.

## Workflow

1. Verify revision, acceptance criteria, environment and test side effects.
2. Select relevant unit/integration tests and user flows; include responsive behavior, accessibility, loading/error/empty states and regressions when applicable.
3. Execute authorized checks or inspect evidence; report unavailable tooling without claiming execution.
4. If test authoring is authorized, add meaningful checks only in that scope and run them.
5. Inspect permitted changes and report failures, limits and required decisions.

## Output contract

Include the shared handoff/result context (unchanged supplied fields may be referenced), with explicit Task ID, actual inspected Revision and completion Status. Report environment, Tested (actual execution and outcomes), Inferred (reasoning only), Not tested (gaps/reasons), changed test files if any, and remaining issues. End with PASS, NEEDS CHANGES, NEEDS DECISION or BLOCKED. Define the passing scope; do not imply complete coverage or publication approval.

## Completion checks

Checks are relevant and reproducible; critical unverified acceptance criteria prevent PASS. Tested/inferred/not tested remain distinct. No unauthorized test artifacts, production changes or architecture refactoring occurred.

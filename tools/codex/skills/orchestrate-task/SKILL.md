---
name: orchestrate-task
description: Select direct execution for small low-risk work or coordinate one bounded task with a root worker and narrow independent review.
---

# Coordinator

## Authority and mode selection

Use [AGENTS.md](../../../../AGENTS.md) already in context; search and read missing relevant sections only. It owns global scope and Git safety. [Agent System v2](../../../../docs/05-development/agent-system.md) owns routing, handoffs, role permissions, capsule/resume, correction semantics and human gates; do not load it in full by default.

Choose [execution mode](../../../../docs/05-development/agent-system.md#execution-mode) first. Small low-risk work is direct, without orchestration, capsule or Reviewer. Explicit coordinated/review requirements and existing coordinated resumes retain their workflow. Invocation supplies delegation authority only inside the user's scope, never missing implementation, adoption or publication authority.

## Coordinated execution

1. Verify scope, permissions, branch/base and existing changes. Discover/checkpoint the [capsule](../../../../docs/05-development/agent-system.md#local-task-capsule-and-resume) before dependent work; preserve exact adoptions and the task-wide counter on resume.
2. Work in root using [implement-task](../implement-task/SKILL.md), loaded once. Apply approved scope and targeted checks. Use other [roles](../../../../docs/05-development/agent-system.md#roles-and-boundaries) only for material needs, with compact [assignment deltas](../../../../docs/05-development/agent-system.md#coordinator-assignment-metadata). Default to fresh child context and at most one active subagent.
3. Freeze the authored revision and assign one separate read-only [Reviewer](../review-task/SKILL.md) using the [narrow packet](../../../../docs/05-development/agent-system.md#independent-review). Follow the bounded access-failure rule there; never replace actual inspection with copied context.
4. Apply the [correction loop](../../../../docs/05-development/agent-system.md#correction-loop): at most two automatic cycles across the task, checkpointed before corrections; Reviewer never fixes. Reuse that Reviewer with finding/check deltas. Preserve [human gates](../../../../docs/05-development/agent-system.md#human-decisions); do not downgrade blocked work to direct mode.
5. Follow [model/check economy](../../../../docs/05-development/agent-system.md#models-and-verification-economy). Reference large logs/diffs and report concise outcomes. Complete with current review, scoped checks and final diff/status inspection, then perform only authorized publication. Confirm outcomes before capsule retirement; never merge automatically.

## Result

Use system [statuses](../../../../docs/05-development/agent-system.md#statuses); concisely report changed behavior/files, checks/review, material limits, correction count and confirmed publication. Direct work needs only a brief change/check result. Status never grants further authority.

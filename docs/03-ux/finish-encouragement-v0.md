# Finish & Encouragement UX v0

Status: Adopted — 2026-10-06

## Why

The first external learner feedback was broadly positive but surfaced one core-flow ambiguity: it was not clear how to finish Practice.

Code inspection supports the concern. During an active task, `Следующая задача` is an in-context primary action in the answer rail. On the final or single task that action disappears, while Finish remains only as a lightweight navigation action at the top of the page.

This is a narrow consequential UX fix during Learner Validation v0, not a new product milestone.

The same feedback also asked for stronger child-oriented motivation. v0 adds only calm process encouragement. Medals, stars, levels, streaks or collections remain a separate product question that needs repeated learner evidence before adoption.

## Contract

### Finish

Keep the top `Завершить` action available as an early exit.

When the current final or single task has reached the existing navigation-complete state:

- show an in-context completion prompt in the answer rail;
- use the same primary visual hierarchy as `Следующая задача`;
- label the action `Завершить тренировку`;
- explain that finishing opens the session results.

Prompt:

> Готово с этой задачей. Можно завершить тренировку и посмотреть итоги.

Do not change Finish eligibility, persistence, confirmation, evidence or navigation semantics.

If a task is skipped, the existing no-next surface remains the completion path.

### Encouragement

Summary adds one process-focused message:

> Хорошая работа — ты завершил тренировку. Теперь можно спокойно посмотреть, что получилось и что осталось.

Review uses equivalent wording for a repeat attempt.

The message praises completion of the work, not correctness or ability. Existing factual result labels remain authoritative.

Do not add claims about mastery, talent, weakness, learning effectiveness or hint causality.

## Out of scope

- medals, stars, levels, streaks or collections;
- XP changes;
- new reward persistence;
- animations or celebration effects;
- changes to adaptive, recommendation or evidence rules;
- changes to Practice Finish persistence or routing.

## Validation

For the next independent learners, observe without pointing at the new action:

- whether they can finish Practice without adult navigation help;
- whether the completion prompt is noticed after the final task;
- whether Summary encouragement is understood as support rather than a grade;
- whether requests for stronger gamification recur spontaneously.

For every Learner Validation session after this change, record the actual build/commit used.

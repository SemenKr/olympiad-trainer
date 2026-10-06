# Practice Journey v1 — Motivation & Rewards

Status: Adopted — 2026-10-06

## Goal

Make continued Practice feel visibly rewarding for a Grade 5 learner without turning engagement into an assessment of mathematical ability.

Practice Journey v1 extends the existing participation-only XP model with:

- journey levels;
- progress to the next level;
- participation badges;
- a small celebration state on Summary when a level or badge is newly reached.

The feature is intentionally deterministic. It does not introduce a second currency, random rewards, streak penalties or correctness bonuses.

## Invariants

All Practice Journey v0 invariants remain in force.

- XP describes participation only.
- A journey level is not a knowledge level.
- A badge is not evidence of mastery, transfer, retention or olympiad ability.
- Correctness, number of mistakes, hints, solution exposure and checkpoint outcome do not create bonuses or penalties beyond the existing v0 XP eligibility rule.
- Skip never removes XP.
- Journey never participates in adaptive selection, capability evidence or Review eligibility.
- Simulation remains outside Practice Journey and awards no XP or Journey rewards.

Learner-facing surfaces should use the phrase `Уровень пути`, not bare `Уровень`, whenever context could make the meaning ambiguous.

## Existing durable source of truth

No new persistence is required for v1.

The durable source remains the existing `practice_journey_awards` ledger created by Practice Journey v0. Current total XP is the sum of immutable award rows.

Journey v1 levels and badges are projections derived from `totalXp`. Existing learners therefore receive the correct current level and already-earned badges without a backfill or migration.

The persisted v0 field `newly_reached_milestone` remains for backwards compatibility and historical Finish snapshots. V1 UI must not use it as the source of truth for levels or badges.

For a completed session, Summary can derive the previous total as:

`previousTotalXp = totalXp - earnedXp`

and compare the previous and current projections to determine which v1 rewards were newly reached. This keeps Finish idempotency unchanged.

## Journey levels

Levels represent accumulated Practice participation.

| Level | Learner label | Starts at |
| --- | --- | ---: |
| 1 | Старт | 0 XP |
| 2 | В движении | 30 XP |
| 3 | В ритме | 80 XP |
| 4 | Набираю ход | 150 XP |
| 5 | Держу темп | 250 XP |
| 6 | Длинная дистанция | 400 XP |

XP continues after 400. Level 6 is the highest level in v1, not a maximum XP cap.

The thresholds are deliberately uneven: the first level-up is reachable after one fully XP-eligible three-problem Practice session, while later levels require progressively more continued participation.

## Participation badges

Badges are also derived only from cumulative XP.

| Threshold | Badge |
| --- | --- |
| 10 XP | Первый шаг |
| 50 XP | Начал разгон |
| 100 XP | Первая сотня |
| 200 XP | Стабильный темп |
| 350 XP | Большой путь |

A badge is a collectible marker of participation. The UI may use a medal/star visual treatment, but must also show its text label and XP threshold.

Do not use gold/silver/bronze ranking because it can imply comparative ability.

## Product surfaces

### Home

After the learner has earned XP, the existing Practice Journey card becomes a compact motivation surface:

- current `Уровень пути N` and its label;
- current total XP;
- a progress bar to the next level;
- exact text such as `До следующего уровня — 20 XP`;
- at most one nearby next badge goal.

The card remains secondary to the primary next learning action. A first-time learner with 0 XP does not get extra Journey UI on Home.

### Progress

Progress shows the fuller Journey view:

- current journey level;
- total XP;
- progress to the next level;
- all v1 badges with reached/upcoming state;
- explicit copy that XP, levels and badges show practice participation, not knowledge level.

Learning evidence remains visually and semantically separate from Journey rewards.

### Summary

When a Finish crosses a level or badge threshold, Summary shows one celebration card after the factual learning summary and before the next-action controls.

It may contain:

- `Новый уровень пути`;
- the new level number and label;
- `Новая медаль`;
- the newly reached badge label;
- the session XP award and current total.

If a single Finish crosses both a level and a badge threshold, show them in the same celebration surface rather than stacking competing reward cards.

If no threshold was crossed, Summary keeps the normal XP presentation without artificial celebration.

A subtle entrance animation is allowed, but it must respect `prefers-reduced-motion`. No confetti, sound or blocking animation in v1.

## Domain helpers

Implementation should add pure application helpers rather than branching reward logic inside React components.

Expected responsibilities:

- resolve current journey level from total XP;
- resolve next level and XP remaining;
- list reached/upcoming badges;
- derive rewards crossed between previous and current total XP.

These helpers are deterministic projections. They do not write persistence.

## Out of scope

- streaks or daily obligations;
- leaderboards or comparison with other learners;
- coins, gems, shops or spendable currency;
- random loot/rewards;
- correctness bonuses;
- penalties for mistakes, hints, solution use, inactivity or missed days;
- new database tables or migrations;
- changes to XP earning rules;
- changes to Practice evidence, adaptive logic, Review or Simulation;
- parent-configured rewards.

## Validation

Learner Validation continues while v1 is developed.

For sessions on a build containing Journey v1, observe:

- whether the learner notices that XP leads somewhere;
- whether `Уровень пути` is understood as participation rather than school/maths level;
- whether badges increase desire to return;
- whether reward UI competes with the actual learning result;
- whether stronger gamification is still requested spontaneously.

Record the exact tested build for every observation.

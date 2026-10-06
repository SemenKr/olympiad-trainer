# Learner Validation v0

Status: Adopted — 2026-10-05

## Goal

Validate the Grade 5 learner journey with real learners while the product continues through bounded, versioned iterations.

This study checks whether a learner can understand and use the tested product build with limited adult intervention. It focuses on usability, comprehension and learner control. It does not attempt to establish mastery, retention, recommendation quality or learning effectiveness.

Learner Validation is an ongoing research track, not a development gate. Product work may continue in parallel, and learner feedback can reprioritize upcoming slices.

## Baseline

Initial production baseline:

- Production URL: `https://olympiadtrainer.vercel.app`
- Git baseline: `8de0cfe0598e952f72217eff0e540048fd0aa52a`
- Product state: Home, Practice, Summary, Progress, Packs, Review/Reconfirmation v0 and Simulation v0 are available.

Every session must record the actual build or commit used. If the product changes between sessions, the new baseline must be recorded and observations from different builds must not be treated as identical evidence.

## Development during the study

The product is not frozen while Learner Validation v0 runs.

- Continue the largest coherent product slice that delivers complete user value while remaining independently reviewable.
- Record the exact tested build for every learner visit.
- Treat a finding as evidence about the build that was actually observed.
- Fix Critical findings immediately.
- Reprioritize repeated consequential findings into the nearest suitable slice.
- Preserve isolated preferences and feature requests as observations until there is enough product rationale to adopt them.
- When a relevant UX changes, prefer retesting that scenario with a fresh learner rather than assuming the previous finding is resolved.

Product work can be roadmap-driven or feedback-driven. The study itself does not automatically authorize every requested feature.

## Research questions

### Home and entry

- Does the learner understand what the primary next action is?
- Does Resume make sense when an unfinished Practice exists?
- Is the neutral Home state understandable without interpreting it as a diagnosis?

### Practice

- Can the learner start and progress through attempt → check → retry → optional help → Finish without the observer operating the UI?
- Does the learner understand the difference between checking an answer, opening a hint and opening the full solution?
- Does Skip behave as the learner expects?
- Can the learner leave and resume without losing expected work?

### Summary and Progress

- Does the learner understand Summary as a record of the completed episode?
- Does the learner understand Progress as bounded evidence about prior work rather than a school grade or mastery score?
- Is Journey XP understood as participation rather than assessment?

### Recommendations, Packs and Review

- Are these understood as available next actions rather than claims that the learner is weak, has forgotten material or has mastered a topic?
- Conditional states are observed only when they arise naturally. They are not forced for the study.

### Simulation

- Does the learner understand the separate 4-task / 45-minute mode, drafts, timer and irreversible Finish?
- Can the learner leave and return without misunderstanding whether the timer pauses?
- Are protected references after completion understandable?

Simulation is tested in a separate session and is not part of the first pilot.

## What this study cannot establish

The following are observations only and must not be treated as learning conclusions:

- correct or incorrect answers;
- time spent on a problem;
- use of hints or the solution;
- completion or abandonment;
- a single Review result;
- a single Simulation result.

These facts do not by themselves establish mastery, weakness, retention, forgetting, transfer or instructional effectiveness.

## Recruitment and staging

Use a staged low-cost plan instead of committing to a fixed large study in advance.

### Stage A — pilot

Run one first Practice visit with one Grade 5 learner.

Purpose:

- verify that the script and note-taking method are usable;
- identify obvious blockers before involving more learners;
- avoid changing the product because of preferences or isolated uncertainty.

### Stage B — core validation

After the pilot synthesis, continue until at least three distinct Grade 5 learners in total have completed a first Practice visit, unless a Critical finding stops the affected flow.

Prefer variation in:

- mobile vs laptop/desktop;
- little vs some prior olympiad familiarity.

Do not claim statistical significance or saturation.

### Stage C — extend only if needed

Add a fourth or fifth learner only when a decision-relevant question remains unresolved, an important scenario/device is still uncovered, or existing observations conflict.

Before closing Learner Validation v0:

- run at least one separate return visit where preserving learner identity matters;
- run at least one separate Simulation session;
- add a second return or Simulation session only if the first leaves a consequential question unresolved.

Do not manufacture recommendation, Review or other conditional eligibility merely to obtain coverage.

## First Practice visit

Target duration: 20–40 minutes. End earlier if the learner wants to stop or is tired.

### Opening

Explain only:

> Мы проверяем приложение, а не тебя. Если что-то непонятно, это полезно для проверки приложения. Можно остановиться в любой момент.

Do not explain the interface in advance.

### Home

Prompt:

> У тебя есть немного времени позаниматься олимпиадной математикой. Покажи, что бы ты сделал.

If the learner asks where to click, first ask:

> А как ты думаешь?

Record any later assistance.

### Practice

Prompt:

> Решай так, как обычно. Можно пользоваться тем, что предлагает страница.

Do not force a wrong answer, hint, solution or Skip.

Observe:

- answer entry and checking;
- reaction to feedback;
- retry behavior;
- discovery and understanding of help;
- distinction between hint and full solution;
- Skip;
- navigation and recovery.

If help was not encountered naturally and the learner is not already fatigued, a prompted question may be used:

> Если бы ты совсем застрял, где бы ты здесь искал помощь?

Mark this observation as prompted.

### Pause and resume

At a natural point:

> Представь, что тебе пришлось ненадолго уйти. Покажи, как бы ты потом вернулся.

Ask what the learner expects to remain saved before verifying it.

### Finish, Summary and Progress

When the learner decides the session is enough:

> Покажи, как бы ты закончил тренировку.

On Summary:

> Расскажи своими словами, что эта страница тебе сейчас показывает.

On Progress:

> А что эта страница говорит о твоей работе?

Ask about XP only after the learner has first explained the page in their own words.

### Debrief

Prefer concrete retrospective questions:

- Что было самым непонятным?
- Что было удобным?
- Где ты ожидал, что после нажатия произойдёт что-то другое?
- Если бы ты вернулся завтра, понял бы, куда зайти?

Do not rely on a general “Тебе понравилось?” as usability evidence.

## Remote parent-observed sessions

A parent may run the first visit remotely from the project team.

The parent should:

- let the child operate the interface;
- avoid explaining controls in advance;
- ask “А как ты думаешь?” before giving navigation help;
- help if the child is genuinely blocked;
- record where assistance was needed;
- send raw observations and, when possible, a few short verbatim learner phrases.

For one learner, the same browser profile should be reused on later visits. Different children should not share one browser profile because the current anonymous learner identity is browser-profile based.

## Observation discipline

For every consequential event, separate:

1. **Observed fact** — what happened.
2. **Learner expectation / wording** — what the learner said or appeared to try.
3. **Observer intervention** — what help was given.
4. **Outcome** — what happened next.
5. **Possible explanation** — interpretation, explicitly marked as a hypothesis.
6. **Alternative explanations** — other plausible causes.
7. **Follow-up** — what needs confirmation in another session.

Also record whether the behavior was:

- spontaneous;
- prompted by the script;
- assisted by the observer.

UI assistance and mathematical assistance are separate facts.

Do not infer a diagnostic cause from silence, slow work, an incorrect answer or abandonment.

## Privacy and data handling

The learner is a child, so data collection is intentionally minimal.

Before a session:

- obtain guardian permission;
- obtain the child’s assent in age-appropriate language;
- state that participation is voluntary and can stop at any time.

By default:

- use written notes only;
- do not record audio, video, face or screen;
- do not store the learner's name, school, exact birth date, contact details or other unnecessary identifiers in research notes;
- use a study code such as `LV-01`;
- keep any recruitment/contact information separate from study notes;
- keep raw notes and consent/contact mapping outside the repository;
- only non-identifying synthesis may be committed to the repository.

Raw study notes and study-specific local/app data should be deleted within 30 days after they are no longer needed for synthesis or follow-up.

## Severity

### Critical

Stop the affected flow and investigate before continuing similar sessions.

Examples:

- privacy exposure;
- lost learner work with no reasonable recovery;
- a misleading submitted/not-submitted state;
- serious learner distress caused by the product.

### Major

A consequential usability or comprehension problem.

Examples:

- core journey blocked without observer takeover;
- repeated inability to recover;
- XP interpreted as a school grade because of the UI;
- learner believes Simulation pauses when leaving and acts on that belief.

### Minor

Recoverable friction without loss or consequential misrepresentation.

Examples:

- hesitation;
- extra navigation;
- wording confusion that the learner resolves independently.

### Observation / question

A preference, isolated uncertainty or event that may have a mathematical rather than UX cause and needs more evidence.

## Decision rules

- Stop an affected flow on a Critical finding.
- Prioritize reproducible Major findings.
- Treat the same meaningful usability problem in two independent learner sessions as recurring evidence.
- Do not change product behavior because of a single preference or isolated hesitation.
- Content or answer ambiguity requires source-backed human mathematical review before changing the task.
- Prefer the smallest copy, hierarchy, interaction or recovery fix that addresses the observed problem.
- Retest a consequential fix with a fresh learner where practical.
- If the product changes during the study, record a new baseline.
- Add instrumentation only when a consequential research question remains unanswered by direct observation. Analytics, telemetry and session replay are not part of v0.

## Exit criteria

Learner Validation v0 can close when:

- at least three distinct Grade 5 learners have completed a first Practice visit;
- at least one return visit has exercised persistence/resume with the same learner identity;
- at least one separate Simulation session has been observed;
- there are no unresolved Critical findings;
- consequential recurring Major findings have either been fixed and retested or explicitly accepted as follow-up;
- remaining open questions do not justify adding a fourth or fifth learner;
- non-identifying findings and product decisions are synthesized in `learner-validation-v0-findings.md`.

## Out of scope

- new product features or content added only for the study;
- analytics, telemetry or session replay by default;
- learning-outcome experiments;
- mastery-model changes;
- retention or forgetting claims;
- recommendation-ranking changes;
- Review scheduling changes;
- forced eligibility states;
- Simulation variants, resets or deadline changes;
- parent accounts or learner authentication;
- broad usability or accessibility certification.

## Learning Path v1 build-specific questions

For builds containing [Learning Path v1](../03-ux/learning-path-v1.md), observe independent choice of a next Pack, return orientation, discovery of free choice, comprehension of recorded Finish versus solved topics, and separation from Journey XP/levels. Keep spontaneous/prompted/assisted observations distinct. The editorial order is adopted navigation, not empirically validated difficulty or curriculum. Continue the existing study without forcing eligibility or making learning-effectiveness claims.

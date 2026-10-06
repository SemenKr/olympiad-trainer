# Olympiad Foundations — possibilities and conditions prototype v0.1

Task: OT-FOUNDATIONS-RESEARCH-01. Status: research/content draft for review; not an adopted curriculum or production feature.

Repository baseline: `979887b700a6ddc13030d49a1d5234fde7924827`, main after Learning Path v1 merged in PR #72. Record the actual tested build separately. This document is for the facilitator; show only the specified learner card or explicitly requested explanation, never this whole document with its keys.

## Observed fact and evidence limits

The project owner reports one Grade 5 learner with essentially no prior olympiad experience: Practice navigation was clear, most effort went into mathematics, and some hints did not help much. The learner's tested commit, exact problems/hint stages, verbatim wording and raw work were not supplied with this report. Do not reconstruct them or call this a recurring finding. Time spent thinking is not itself a usability defect.

The [taxonomy research](skill-taxonomy-v0.1.md#olympiad-reasoning-skills) supports investigating constraint coordination, rejecting a candidate for a stated reason, and systematic enumeration with completeness. Its [curriculum note](skill-taxonomy-v0.1.md#student-facing-curriculum-note) explicitly leaves learner labels and instructional sequence unvalidated. Current catalogue examples such as `granddaughters-first`, `exact-coin-payments` and `two-true-journalists` demonstrate demands in existing content; they are not the examples used here or evidence of teaching effectiveness.

The [learning-evidence model](learning-evidence-v0.1.md#evidence-discipline--observed-fact) separates observations from interpretation and mastery. [Knowledge Support v0](../04-architecture/knowledge-support-v0.md) addresses one prerequisite, “в … раз” versus “на …”, through a bounded diagnostic. It does not establish that an unfamiliar reasoning approach is a prerequisite deficit.

## Learner problem and observable hypothesis

Candidate learner problem: “I understand the words, but I do not know what I could write, draw or check next.” This is a hypothesis about an episode, not a learner label.

Research question: after an optional small demonstration of organising possibilities and checking conditions, can a novice propose and attempt a relevant next action on a fresh small example without the facilitator selecting that action?

Observable hypothesis: a learner who can paraphrase the task/support but initially cannot begin may, after choosing to inspect the explanation for card A, begin organising or checking possibilities on card B and explain at least one inclusion or rejection. Observe completeness separately. Any correct alternative reasoning also counts as relevant action; a table is not required.

| Competing explanation | Discriminating observation |
| --- | --- |
| Wording was unclear | Learner cannot paraphrase the relevant sentence; a meaning-preserving paraphrase helps without adding a method. |
| Reasoning approach is unfamiliar | Learner paraphrases accurately but cannot start; after the demonstration, they initiate a relevant action on B. This pattern is suggestive, not causal proof. |
| A prerequisite causes the difficulty | Learner chooses a sensible action but cannot execute a particular comparison/addition or interpret a representation. Record that specific event. |
| Help conflicts with an existing approach | Learner already has a viable route; offered grouping adds no useful next step or interrupts it. |
| Productive struggle, timing or fatigue | Learner proceeds after thinking, or asks to stop; no wording/schema diagnosis follows from delay alone. |

A before/after observation cannot isolate instruction from practice, attention, task differences or observer effects. B is a close reuse probe, not an independent transfer test. No scores, timing thresholds or learning-effectiveness claims.

## Prototype delivery and safeguards

Use two [learner cards](olympiad-foundations-learner-cards-v0.1.md) on separate sheets or display one section at a time. Paper and a pencil suffice; no application or new UI is required. Keep facilitator notes and answers out of sight. Read a card aloud verbatim if requested and record that assistance.

- Participation, explanation and continuing to B are optional. The learner may draw, list, reason aloud, skip or stop. Correct alternative approaches are welcome.
- This is a separate short research activity, preferably after the ordinary uncoached Practice observation or in another visit. Do not interrupt an unfinished line of reasoning to teach the prototype.
- The demonstration solves only its own small example. Do not substitute an existing Practice task, its numbers, answer or full proof. Do not select a current Practice answer for the learner afterward.
- Existing hints remain exactly focus → strategy → next-step. This activity is neither an extra hint tier nor a change to reveal, retry, restore or solution eligibility.
- No persistence, telemetry, learner classification, mastery/adaptive contribution, XP/rewards, prerequisite checks, mandatory onboarding, Pack unlocking or changes to Journey/Review/Simulation.
- “Foundations” names this candidate study, not an adopted hierarchy. Grouping is one useful approach when the possibilities are manageable; it is not an algorithm for every olympiad problem.
- Record exposure before interpreting subsequent work. B after the explanation is post-instruction work, not independently discovered method use. Any later Practice observation must mention this prior instruction in research notes; do not manufacture app evidence or change app state.

The examples below are newly authored for this prototype, not official VSOSh tasks or adaptations of current Practice walkthroughs. Their finite cases and reasoning are provided for inspection. AI authorship/review is not mathematical authority: a human content reviewer should verify wording, keys and separation from Practice before use with a child. No learner session or human approval is claimed here.

## Facilitator sequence

Target a short optional activity, approximately 5–10 minutes; stop earlier on request or fatigue. This is a scheduling estimate, not a learner performance measure. Follow the consent, assent and privacy rules of [Learner Validation v0](learner-validation-v0.md#privacy-and-data-handling).

1. In ordinary Practice, preserve the existing neutral opening and observe help only if naturally used. After that help ask once: **“Что ты теперь попробуешь сделать?”** Let the learner act. Do not ask leading questions such as “Может, составишь таблицу?” or force a hint, error or solution. If they remain uncertain, ask “Что здесь осталось непонятным?” and record their words. A paraphrase, mathematical cue or adult demonstration is an intervention, recorded separately.
2. Offer the separate activity: **“Хочешь попробовать две короткие задачи? Можно решать любым способом, пропустить задачу или остановиться.”** If accepted, show only card A. Do not introduce the family name or tell the learner to enumerate, group or draw a table.
3. Allow their attempt without correcting it. If the learner naturally asks for help, or says they have finished and wants to compare, offer: **“Хочешь посмотреть один из способов рассуждать или пока продолжить самостоятельно?”** Do not open the explanation automatically after an error or silence. If they decline, they can continue, move to B or stop. Record the choice.
4. Only on acceptance, show the A explanation below. Let the learner inspect it at their own pace. Ask **“Что ты теперь попробуешь сделать?”** and observe the action; do not require them to reproduce the demonstrated table. Subsequent A work is explanation-exposed.
5. If the learner wants to continue, put A and its explanation away and show only B. Say **“Попробуй решить эту задачу так, как тебе удобно.”** Do not remind them of grouping or ask them to “use the same method”. If they need help, record the request and offer to stop or discuss afterward; do not covertly coach B and call the result unassisted. There is no pass requirement.
6. After their work, ask **“Как ты проверял свои варианты?”** and then, if appropriate, **“Как ты решил, что других вариантов нет?”** These are prompted explanations, recorded separately from spontaneous reasoning. Never infer that a learner did not check merely because they did not verbalise it.
7. Close with **“Что здесь было непонятным?”** If they request a B explanation, use the facilitator key only after the observed attempt and mark exposure. Return to ordinary activity by choice; there is no reward or completion marker.

### A explanation — show only by explicit choice

> Я попробую записать варианты так, чтобы их было удобно проверять. Начну с синей обложки: со звездой, с кругом, с треугольником. Потом возьму зелёную: со звездой, с кругом, с треугольником.
>
> Получились шесть пар. Других цветов и наклеек в условии нет. Каждая пара записана один раз.

| Обложка | Наклейка | Проверка по условиям |
| --- | --- | --- |
| Синяя | Звезда | Подходит: оба запрета относятся к зелёной обложке. |
| Синяя | Круг | Подходит по той же причине. |
| Синяя | Треугольник | Подходит по той же причине. |
| Зелёная | Звезда | Не подходит по первому условию. |
| Зелёная | Круг | Не подходит по второму условию. |
| Зелёная | Треугольник | Ни одно условие не нарушено. |

> Остались четыре варианта: синяя обложка с каждой из трёх наклеек и зелёная с треугольником.
>
> Можно было сразу заметить, что для зелёной обложки остаётся только треугольник, а для синей подходят все наклейки. Не обязательно записывать таблицу. Важно суметь проверить свои варианты и объяснить, почему никакой не потерялся.

### B key — facilitator only, not advance feedback

The two positions matter: `1 | 3` and `3 | 1` are different arrangements. The complete possible pairs are `1|1, 1|2, 1|3, 2|1, 2|2, 2|3, 3|1, 3|2, 3|3`. Only `1|3`, `2|2`, `3|1` have sum 4; `2|2` violates the different-numbers condition. Valid set: **`1|3`, `3|1`**.

A complete grouping by first number or a direct argument from sums is acceptable. Listing two valid pairs without explaining completeness is a correct set with completeness unobserved, not a failed response. Recognising a model after prompting does not establish independently choosing it. Difficulty with addition or interpreting the slots is a competing explanation, not evidence against the schema hypothesis by itself.

## Observation record and decision rule

Use the existing [observation template](learner-validation-observation-template.md). Add prototype version, A/B exposure order, whether A explanation was seen, and any earlier related instruction. Keep raw notes outside the repository; retain only non-identifying synthesis under the study's existing privacy/retention rules.

For each card record: first proposed action and actual action; conditions mentioned/used; examples accepted or rejected with the learner's reasons; omissions/duplicates if visible; spontaneous versus prompted completeness explanation; exact assistance; whether the learner preferred another route or stopped. Keep observed fact, learner words, intervention, outcome and hypothesis separate. Help use and refusal are both valid choices.

Apply the [existing decision rules](learner-validation-v0.md#decision-rules): stop the affected flow for Critical findings, prioritise reproducible Major findings, treat the same meaningful usability problem in two independent sessions as recurring evidence, and do not change behaviour for one preference or isolated hesitation. Mathematical/content ambiguity requires source-backed human mathematical review; for these original examples, review the explicit finite-case argument and wording. Retest consequential fixes with a fresh learner where practical. Do not treat a severity label as a capability diagnosis.

For this candidate, seek one more novice observation before a production implementation decision. This is a recommendation to reduce the present causal uncertainty, not a new universal research gate or a claim that two learners establish effectiveness:

- If a meaning-preserving paraphrase resolves the observed obstacle, prefer a scoped wording fix.
- If a specific prerequisite blocks an otherwise sensible plan, consider the existing Knowledge Support direction after confirming that prerequisite need.
- If accurate paraphrase but inability to start recurs, and the optional example is followed by self-initiated relevant work on B, prepare a bounded Foundations product proposal. Preserve alternative explanations; no automatic implementation approval follows.
- If learners already organise/check effectively, or the explanation adds burden, keep ordinary Practice available and narrow, revise or defer this candidate.
- If observations conflict or are incomplete, retain uncertainty and target the next observation; do not expand the curriculum to compensate.

## Adoption and verification boundary

This task prepares an inspectable artifact only. Before learner use: human mathematical/content check and the existing guardian/child participation process. Before any production feature: adopt the exact content, optional entry/exit and exposure/evidence contract; then define accessible delivery and recovery. No such feature or architecture is adopted here.

Verification for this draft: finite-case enumeration of A and B, comparison with the current Practice catalogue for direct walkthrough leakage, relative-link and diff/scope checks, and independent read-only review. These establish inspectability and content consistency, not comprehension, engagement, transfer or learning benefit. Those remain untested until observed with learners.

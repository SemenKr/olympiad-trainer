# Recommendation Model — v0.1

## Purpose and handoff context

- **Task ID:** OT-001D.3.
- **Revision:** branch `docs/ot-001d-learning-model` at `594b8f2a118e71f962c4f84b9085f2566af42ac8` (`docs: define mastery model v0.1`); working tree clean before this document.
- **Goal:** define how Olympiad Trainer chooses the next useful problem from current mastery evidence.
- **Scope / Allowed actions:** create only this research document; compare semantic model shapes and propose a compact domain model.
- **Out of scope:** database/ORM/schema, API, UI, application code, numeric scoring or weights, ML/AI recommendation, difficulty-adjustment math, spaced-repetition formula, fixed session schedules, and review/retention policy.
- **Inputs:** [Project vision](../00-project/project-vision.md), [Skill Taxonomy v0.1](skill-taxonomy-v0.1.md), [Learning Evidence v0.1](learning-evidence-v0.1.md), and [Mastery Model v0.1](mastery-model-v0.1.md).
- **Constraints:** use only the established semantic inputs; unknown is not weak; Methods remain contextual; preserve attribution and exposure provenance; do not turn a recommendation purpose into an algorithm or architectural decision.
- **Definition of Done:** distinguish eligibility from priority; define purposes, transfer/difficulty/multi-skill/session principles, A–J scenarios, explainability and D.4 information needs; validate the authorized diff.
- **Status:** READY as a reviewable domain proposal. It does not adopt recommendation behavior or authorize dependent implementation.

## Evidence and problem — Observed fact

The project vision's learning loop includes independent attempts, progressive hints, a later similar problem, preserved results and an updated progress view. It also names adaptive difficulty, weak-topic detection, review queue and next-problem selection as business logic, while excluding ML recommendations from early MVP.

D.1 defines qualitative evidence interpretation: correctness, assistance, independence, attribution, transfer, temporal context, mode and exposure provenance. A problem tag indicates an opportunity to observe a capability; it does not prove the learner used every tag. A later same-problem attempt can inform reconstruction, but is not transfer; solution exposure remains relevant to later evidence. Difficulty is contextual and must not be inferred from official numbering.

D.2 supplies a qualified belief per capability: primary conclusion `unknown`, `demonstrated` or `reliable`; qualitative confidence; scope; evidence basis; and diagnostic/temporal qualifiers. `Difficulty indicated` is a diagnostic qualifier, not a lower mastery state. Reliable Olympiad reasoning normally needs meaningful independent transfer, which is necessary but insufficient. Time alone neither lowers the conclusion nor proves forgetting.

The taxonomy separates Foundation capabilities, Olympiad reasoning skills, concepts and Methods. These are provisional problem-demand interpretations, not observed learner behavior, formal prerequisites, a hierarchy or a universal difficulty model. Foundation and reasoning share the mastery semantics, but appropriate variation and observability differ by capability.

This task has no learner dataset, calibrated difficulty corpus or validated prerequisite graph. All recommendation behavior below is therefore **Interpretation / Recommendation**, not evidence that a particular selection improves learning.

## Decision boundary

A recommendation is a reasoned invitation to produce useful new evidence or practice under stated conditions. It is not a judgement that the learner is weak, a promise of success, or a statement that the selected problem is globally best.

Keep three layers separate:

| Layer | Example | Boundary |
| --- | --- | --- |
| Problem evidence | The problem visibly requires complete enumeration; its solution is not exposed to this learner; its reasoning path can be assessed. | It does not establish that the learner will use each tagged action. |
| Recommendation purpose | Test whether a demonstrated enumeration capability transfers to a changed story. | It declares what evidence would be useful, not a score or a predicted result. |
| Selection decision | Choose this eligible transfer problem now because the current purpose is transfer testing. | It remains traceable to the purpose and evidence; it does not prescribe a universal order for all eligible problems. |

## Model shapes considered — Interpretation

### Option A — one global “next best problem” score

One score could combine capability conclusion, confidence, difficulty, freshness and learner history for every available problem.

- **Strength:** produces a single answer and may appear efficient.
- **Risk:** conceals whether selection is exploration, diagnosis, transfer or reconfirmation; requires unvalidated weights, comparable difficulty and arbitrary treatment of unknown. It cannot explain why a solution-exposed or attribution-opaque problem won.
- **MVP suitability:** reject. The project has neither the evidence nor the need for opaque precision.

### Option B — fixed rules from one apparent weakness

For example, always choose a problem for the capability with a difficulty qualifier or lowest confidence.

- **Strength:** simple and explainable.
- **Risk:** treats unknown as weak, can repeat failures under unchanged conditions, starves reliable capabilities of transfer/challenge, and ignores that multi-skill problems may be uninformative for one target.
- **MVP suitability:** reject as the complete model. Narrow rules may become later policy after validation, but cannot substitute for purpose and eligibility.

### Option C — purpose-led eligibility followed by qualitative priority

First remove problems that cannot responsibly serve an identified purpose. Then compare eligible candidates by the relevance of their evidence, expected observability, fit to current scope/context and contribution to session variety. Where candidates remain equally justified, the model permits an explicit product tie-breaker later rather than fabricating precision.

- **Strength:** preserves why a task is offered; supports unknown exploration without labelling weakness; separates “may be shown” from “is useful now”; works without numeric ranking.
- **Risk:** leaves genuine product choices for later and requires enough problem metadata to judge exposure, target actions and assessability.
- **MVP suitability:** recommend. It is the smallest model that keeps provenance, diagnosis and transfer meaningful.

## Recommended Recommendation Model v0.1

Use this sequence conceptually:

1. Identify one or more **recommendation purposes** from qualified mastery evidence and the current session context.
2. Apply **eligibility principles** to remove or defer problems that cannot serve a purpose safely or explainably.
3. Use **qualitative priority principles** to prefer an eligible problem that gives the most relevant new evidence while preserving a useful session mix.
4. Retain the reason, target capability/scope, relevant evidence and intended information gain for later explanation and review.

This is a decision framework, not a workflow mandate or ranking implementation. A selected task can legitimately serve more than one purpose, but the system should name a primary purpose so its later evidence is interpretable.

## Recommendation purposes

| Purpose | What it seeks | Boundary |
| --- | --- | --- |
| **Explore an unknown capability** | First attributable positive or diagnostic evidence in a bounded scope. | Unknown is not weak. Exploration is useful only when the problem can expose the action; it is not compulsory merely because no record exists. |
| **Diagnose an indicated difficulty** | Clarify whether an attributable obstacle persists, where it occurs, and under which support/context. | Do not treat a wrong answer, abandonment, hint request or unrelated failure as a diagnosis. |
| **Strengthen demonstrated capability** | Add evidence of stable use, independence or a missing part of the stated scope. | It does not assume the learner needs remediation; supported performance may already be meaningful. |
| **Test transfer** | Observe independent recognition and use under meaningful changed demands. | Different problem IDs or stories alone do not establish transfer. |
| **Reconfirm established evidence** | Learn whether an older conclusion still applies in current conditions. | It records current relevance; it does not assume forgetting or impose a review interval. |
| **Increase challenge** | Test a reliable capability at a broader but stated scope, composition or unfamiliar context. | A harder composite failure must not erase reliability in the earlier scope. |
| **Avoid unnecessary repetition** | Prefer evidence that changes the belief over repeated exposure with the same memory/support effects. | Same-problem retry can still be eligible for reconstruction, reflection or a deliberately stated retention question. |

Purposes can conflict. For instance, immediate diagnosis after failure may be less useful than a bounded confidence-building task if the failure context is opaque. D.3 does not resolve such conflicts by a fixed hierarchy; it requires the reason for the selected purpose to be explainable.

## Eligibility principles

Eligibility answers **“Can this problem responsibly serve the stated purpose now?”** It precedes priority.

| Problem condition | Eligible | Lower priority | Temporarily avoid |
| --- | --- | --- | --- |
| **Already solved, no solution exposure** | A delayed same-problem retry can serve reconstruction/retention when that purpose is explicit. | It does not normally serve transfer or independent replication. | Avoid immediate repetition when it would mainly repeat the remembered answer or feedback. |
| **Recently attempted** | A materially changed support or clearly different diagnostic aim can justify use. | Same-context retry can clarify recovery after feedback. | Avoid repeated failures under the same conditions when they add no new attribution or support information. |
| **Solution-exposed** | Later reconstruction may be eligible if exposure provenance remains visible and the purpose is explicitly bounded. | It may support reflection or supported practice. | Avoid as evidence for untouched independent problem solving or transfer. |
| **New problem with target capability** | Eligible when the target action is assessable and the problem fits stated scope/context. | Lower if the action is hidden by answer format or source/path uncertainty. | Avoid if problem tags are only speculative or its response cannot yield usable target evidence. |
| **Transfer problem** | Eligible when shared obligation, changed demands, independence opportunity and attribution are credible. | Near-isomorphic work can establish limited variation. | Avoid if surface/story change is nominal or solution memory is likely to dominate. |
| **Difficulty/context fit** | Eligible when demands make the intended evidence plausible to observe. | A somewhat easier context can diagnose a localized operation; a broader context can challenge reliability. | Avoid a mismatch that is likely to test unobserved prerequisites, overload, or a different capability instead of the stated purpose. |
| **Multi-skill composition** | Eligible for transfer/challenge when target action can be observed and other demands have an adequate evidence basis. | Useful when the intended purpose explicitly includes composition and attribution limits are clear. | Avoid as targeted diagnosis/strengthening when unknown or opaque co-requirements would make target attribution uninterpretable. |
| **Foundation uncertainty** | Eligible if the task can separately expose the target reasoning action or if foundation exploration is itself the purpose. | Use bounded representation demands when the intended evidence is about a Foundation capability. | Avoid claiming a reasoning diagnosis from a task whose unresolved Foundation demand is likely the dominant blocker. |

Eligibility is not a permanent blacklist. A temporarily avoided problem may become useful after a changed context, new evidence or a new purpose. The model does not define cooling-off periods or database flags.

## Priority principles

Priority answers **“Among eligible problems, which would be most useful now?”** It remains qualitative; no numerical score, weights or tie-breaker formula are defined.

Prefer a candidate when it:

- serves a clearly named current purpose and a precise capability scope;
- can yield attributable evidence that the current record lacks, such as independent selection, meaningful transfer, a visible diagnostic step or current relevance;
- avoids duplicating the learner's recent exposure, feedback and remembered answer pattern;
- matches the intended context closely enough that a result will be interpretable;
- keeps co-required capabilities and response format from obscuring the target;
- contributes a different function to the session when recent work has been narrow, failure-heavy or only remedial.

Do not automatically prefer the “weakest-looking” capability. An indicated difficulty may deserve targeted work, but only if the problem can clarify that diagnosis; an unknown capability may deserve exploration, but not because it is presumed deficient. A reliable capability may have priority for reconfirmation or challenge when its current evidence is old or session balance requires success and variety.

No universal priority order is proposed among exploration, diagnosis, transfer, reconfirmation and challenge. That ordering depends on learner-facing goals, available problems and session context, none of which are calibrated in the current evidence.

## Transfer rules

Prefer a transfer purpose after supported success, delayed same-problem reconstruction, or demonstrated same-context success when the missing claim concerns independent reuse. It is especially informative when the learner previously needed a strategy/next-step hint and later needs to recognize the operation independently.

A transfer problem should preserve the target capability obligation while changing enough representation, constraints, story or composition to require reconstruction. For reasoning skills, independent meaningful transfer is normally needed before a reliable conclusion; one cross-story success remains insufficient because consistency and attribution still need evidence.

Near-isomorphic tasks can be useful bridges: they may reveal whether the learner can vary values or surface details without solution recall. They should not be represented as decisive transfer when their demands remain effectively identical. Cross-story tasks are valuable only where the shared action is visible; novelty that hides the target action may be lower priority than a structurally similar but assessable task.

For Foundation capabilities, do not require a different real-world story as a blanket condition. Varying relations, quantifiers, representations or quantities may constitute meaningful reuse when it requires fresh model construction or logical transformation. Repeating a supplied equation or a memorized negation does not.

## Difficulty handling

Difficulty is a contextual description, not mastery itself and not a universal level. Official stage, grade, numbering or source position cannot supply it automatically.

| Context fit | Recommendation use | Avoid |
| --- | --- | --- |
| **Too easy for the stated purpose** | May offer a bounded success, verify a localized operation, or make a diagnostic step visible. | Treating routine success as evidence of broad reliable reasoning. |
| **Appropriate challenge** | Prefer when it can expose the target action independently while retaining interpretable support and attribution. | Assuming an answer outcome in advance. |
| **Too hard or overloaded** | May be a later challenge/composition candidate with explicit limits. | Targeted diagnosis or strengthening when failure would mostly reflect unfamiliar concepts, multiple unresolved capabilities or response burden. |

An indicated difficulty does not automatically require an easier problem: a slightly changed context may distinguish a representation issue from a target action issue. Nor does reliable always require harder: a different context may test transfer better than a more complex task. The available corpus has no validated difficulty scale, so v0.1 records why fit is believed plausible rather than computing an adjustment.

## Multi-skill handling

One target capability among several tags does not justify selecting a complex problem. First identify the problem actions needed for a meaningful target observation and whether the learner has enough evidence for the other demands to make attribution useful.

Use multi-skill problems when composition, transfer or challenge is the declared purpose and the learner's work can expose the target action. They can also be eligible for exploring a Foundation capability if that operation is visible even when the overall answer is incorrect.

Lower priority or temporarily avoid them for targeted diagnosis/strengthening when unresolved co-requirements would make any failure ambiguous. Do not infer a prerequisite graph from co-occurrence; “other required skills” is a context judgment, not a new hierarchy. A final correct answer still does not credit every tag.

## Session balance

A session can mix review/reconfirmation, targeted diagnostic or strengthening work, transfer, challenge/new capability exploration and easier confidence-building tasks. This supports the project vision's loop of independent attempt, feedback, retry, help, later related work and preserved progress.

The mix is a qualitative guardrail, not fixed percentages, rotation, quotas or schedules. A failure-heavy sequence can make additional same-context diagnosis less useful; a sequence consisting only of easy success can leave transfer and challenge unobserved. Conversely, forcing every purpose into every session would create noise and cognitive load. The appropriate mix remains a product question that should be validated with learner evidence.

## Explainability

The eventual product must be able to answer **“Почему мне дали именно эту задачу?”** with a reason grounded in known evidence, not an opaque score. A recommendation explanation should identify:

1. the primary purpose;
2. target capability and evidenced scope;
3. relevant prior evidence and its limit, such as prior support, missing transfer, temporal gap or attributable difficulty;
4. why this problem is eligible, including changed context, assessable action and exposure status;
5. what new evidence it seeks; and
6. any material limitation, especially multi-skill attribution or contextual difficulty uncertainty.

Examples of domain explanations, not learner-facing copy:

- “This problem independently tests the same complete-enumeration obligation in a changed context because earlier correct work required a strategy hint.”
- “This problem can clarify whether omissions of admissible cases persist after the statement conditions are made visible; prior failures do not establish a general weakness.”
- “This task reconfirms a previously reliable capability in a current context; elapsed time alone did not lower the conclusion.”

## Scenarios A–J

These are analytical tests, not recommended learner flows. “Avoid” means lower priority or temporary avoidance for the stated purpose, not deletion from the corpus.

| Scenario | Recommendation purpose | Suitable problem characteristics | Avoid | New evidence sought |
| --- | --- | --- | --- | --- |
| **A. Unknown, no attempts** | Explore, only where exploration is useful to the current session. | New, assessable, bounded target action; few opaque co-demands; suitable response form. | Calling it remediation; a complex task whose failure cannot be attributed. | First attributable positive use or a localized observable obstacle. |
| **B. Demonstrated, low confidence** | Strengthen or test the specific missing basis. | New task exposing the same action with independence opportunity; vary the feature that limits confidence. | Same-problem repetition presented as independent replication. | Consistency, independence, scope or current relevance. |
| **C. Demonstrated only with hints** | Test independent selection, then transfer where appropriate. | Problem where the target direction must be chosen and learner work exposes it; near-isomorphic bridge or meaningful transfer depending on prior support. | Treating hinted success as failure; another task that supplies the same key direction. | Whether the capability can be recognized and used without supplied strategy. |
| **D. Demonstrated in same context, no transfer** | Test transfer. | Shared capability obligation with changed representation/story/constraints and credible attribution. | Mere value substitution or a nominally different story that preserves a recalled template. | Independent meaningful reuse beyond the known context. |
| **E. Reliable, but evidence is old** | Reconfirm current relevance or offer a bounded challenge. | Recent-context task with visible target action; challenge may broaden scope without obscuring it. | Downgrading due to time; an arbitrary easy repeat that adds no current evidence. | Current applicability, or a controlled extension of scope. |
| **F. Repeated recent failures on similar problems** | Diagnose the attributable obstacle; possibly restore an interpretable success context. | Changed representation/support or simpler bounded demands that reveal the target step; preserve visible reasoning. | More failures under unchanged difficulty/context or escalating complexity as a penalty. | Whether the same named obstacle persists and what conditions affect it. |
| **G. One difficulty qualifier with otherwise demonstrated capability** | Diagnose/strengthen the named boundary while retaining the positive basis. | Problem that isolates the obstacle or varies its context while still exposing the demonstrated action. | Reclassifying the learner as generally weak; ignoring the qualifier with only unrelated challenge. | Scope of the difficulty, current repeatability and conditions for independent success. |
| **H. Multi-skill problem: one reliable, another unknown** | Explore the unknown capability only if attribution is possible; otherwise use as later composition/challenge. | Work can expose the unknown action separately; reliable co-skill reduces one ambiguity. | Crediting the unknown skill from a final answer or diagnosing it from opaque composite failure. | Attributable use of the unknown capability. |
| **I. Several indicated/unknown areas** | Choose one bounded purpose rather than diagnose everything at once; preserve session variety. | A problem with one observable target and manageable co-demands; an occasional success/transfer task can balance the session. | A single overloaded task intended to resolve every gap, or automatic selection of every unknown area. | Specific evidence for one chosen purpose and target scope. |
| **J. All currently measured reasoning skills reliable** | Challenge, broader transfer, reconfirmation, or explore a new/deferred capability where appropriate. | Novel composition with observable actions, changed context, or bounded extension; retain some success likelihood and explain limits. | Assuming universal mastery, endlessly repeating routine problems, or treating a deferred taxonomy candidate as a confirmed skill. | Boundary of reliable scope, current relevance, or evidence about an explicitly exploratory candidate. |

## Inputs from Mastery Model

D.3 consumes only the qualified semantic inputs established by D.1/D.2 and problem interpretation:

- capability conclusion (`unknown`, `demonstrated`, `reliable`) and the reason for unknown;
- qualitative confidence and evidence/scope limits;
- diagnostic qualifiers, their attributable obstacle and supporting/counterevidence;
- temporal context, including any reconfirmation need;
- independence/support and solution-exposure history;
- transfer basis, breadth and dependencies on same-problem memory;
- attribution confidence and source/path verification limits;
- problem capabilities, visible actions, concepts, Methods as context, response assessability, prior exposure and contextual difficulty description.

Methods can help explain a selection, for example a case-analysis hint previously supplied, but methods are not mastery targets and do not receive a separate recommendation progression. No input is converted into a numeric score.

## Outputs needed by future Review/Retention Model

OT-001D.4 needs a traceable record of the **selection rationale**, not a retention interval or formula:

1. Primary recommendation purpose and target capability/scope.
2. Evidence basis that made the purpose relevant, including confidence, diagnostics and temporal context.
3. Eligibility rationale, including exposure/retry status, intended transfer/context change and multi-skill attribution limits.
4. Intended information gain: what the next interaction could clarify, strengthen, reconfirm or challenge.
5. Selection limitations and alternatives considered but deferred, where material to later interpretation.
6. The new interaction's resulting evidence, so later review/retention work can distinguish a deliberately repeated item from independent new evidence.

D.4 must not infer that a recommended task was appropriate merely because it was selected, nor treat a purpose as proof of weakness, difficulty or prerequisite order. Review/retention rules, intervals and scheduling remain outside this model.

## Explicit answers — Recommendation

1. **What makes a problem eligible?** It can serve a named purpose with assessable target evidence, known exposure/provenance, interpretable context and manageable attribution; otherwise lower priority or defer it.
2. **What makes it high priority?** It fills a relevant evidence gap for a current purpose while avoiding redundant exposure, opaque co-demands and failure-heavy repetition.
3. **When should unknown be explored?** When a bounded, assessable observation would help the current session or future belief; never because unknown is assumed weak.
4. **When should transfer be preferred?** After supported, same-context or reconstruction evidence leaves independent reuse unestablished, and when reliable reasoning needs meaningful transfer.
5. **When should a recently failed problem not be repeated?** When unchanged repetition would likely reproduce the same opaque failure or memory/feedback effects without new attribution, support or purpose.
6. **How are stale reliable skills treated?** Retain their conclusion; use reconfirmation or a bounded challenge when current applicability matters. Do not downgrade solely for time.
7. **How are multi-skill problems handled?** Use them when composition/transfer is explicit and attribution remains useful; defer them for a single-skill diagnosis if co-demands make results ambiguous.
8. **Numeric recommendation scores?** No. v0.1 uses purpose-led eligibility and qualitative priority only.
9. **What must D.4 receive?** The target/purpose, qualified evidence basis, eligibility rationale, intended information gain, material limits and later interaction result listed above.

## Verification gaps and open questions

- No learner data establishes which purpose should take priority, what balance improves learning, or how learners perceive explanations.
- The project has no validated difficulty descriptions, prerequisite graph, transfer corpus or response-review standard sufficient to operationalize all eligibility judgments.
- It remains open how many candidate purposes a single session should expose, how ties should be broken, and which product constraints should govern exploration of unknown capabilities.
- Taxonomy scope and learner attribution limits may make some multi-skill recommendation reasons too broad until problem metadata and assessable work are validated.
- D.4 boundary is provisional: this document supplies selection rationale and resulting evidence needs, not a retention policy.

## Self-review and completion

| Risk | Check in this proposal |
| --- | --- |
| Unknown treated as weak | Exploration is optional and bounded; unknown never becomes remediation by itself. |
| Numeric/ML recommendation logic | No scores, weights, predictions, ML or formulas are proposed. |
| Repetition treated as independent evidence | Eligibility distinguishes same-problem, recent and solution-exposed history from transfer. |
| Transfer automatically proves reliability | Transfer is purpose/context; reliability still needs accumulated independent attributable evidence. |
| Time treated as forgetting | Reconfirmation retains the established conclusion and records temporal context. |
| Every tag becomes target evidence | Multi-skill eligibility and attribution limits are explicit. |
| Methods become mastery targets | Methods remain contextual explanation only. |
| Difficulty invented from metadata | Difficulty remains contextual and imperfect; official position is excluded. |
| Recommendation rules leak into implementation | No storage, endpoint, UI, schedule or ranking design appears. |

Validation: local reference targets, required sections, scenarios A–J, semantic input boundaries, authorized file scope and whitespace were checked; `git diff --check` and the new-file whitespace check passed. No application tests apply to this research-document change.

**READY** — reviewable research and domain proposal. Human adoption remains required before dependent implementation or recommendation policy.

# Learning Evidence — v0.1

## Purpose and handoff context

- **Task ID:** OT-001D.1
- **Revision:** branch `docs/ot-001d-learning-model`, base commit `9b4dc892`.
- **Goal:** define a qualitative domain model for interpreting observable learner actions as evidence about Foundation capabilities and Olympiad reasoning skills.
- **Scope:** observations, evidence interpretations, independence, correctness, evidence strength, freshness, transfer, and training/simulation context.
- **Out of scope:** mastery formulas, numeric weights, database or event schemas, APIs, UI, recommendation logic, spaced repetition, automated proof grading, and curriculum hierarchy.
- **Inputs:** `project-vision.md`, `problem-content-audit.md`, `skill-taxonomy-v0.1.md`, and `skill-taxonomy-validation.md`.
- **Constraints:** keep observation, interpretation, and mastery update separate; preserve uncertainty; do not treat our taxonomy as official VSOSh metadata; do not infer training difficulty from task number or official position.
- **Definition of Done:** the supported learner signals have explicit interpretations and limits, and no signal is described as a direct numeric mastery change.
- **Allowed actions:** create this research document only.
- **Status:** READY as a domain proposal; no mastery policy is adopted here.

This document is a research model for the learning loop described in the project vision. It is not a learner-state algorithm and does not decide how a future product stores or updates progress.

## Evidence discipline — Observed fact

The existing audit and taxonomy provide problem-level evidence, not learner-performance evidence. They identify content demands such as quantitative modeling, constraint coordination, enumeration, construction, and global impossibility. They do not show how a real learner performs those actions or how much instruction changes later performance.

The learning evidence model therefore keeps three layers apart:

1. **Observation:** what was objectively recorded in a learning interaction.
2. **Evidence interpretation:** what that observation may suggest about correctness, independence, transfer, or a capability.
3. **Mastery update:** a later product decision about internal learner state. This layer is intentionally unspecified here.

For example, “the learner requested a strategy hint and then submitted a correct construction” is an observation. “The learner showed a correct result with material support” is an interpretation. “Increase mastery for configuration construction by a value” would be a mastery update and is out of scope.

An observation can support several interpretations, and an interpretation can remain insufficient for any mastery update. A missing observation is not evidence that the learner did not perform the action.

## Modeling alternatives — Interpretation

Three lightweight ways to organize evidence were considered:

1. **Outcome-only:** retain correctness and completion. This is simple but cannot distinguish independent reasoning from solution exposure or separate a statement error from a strategy failure.
2. **Interaction-only:** retain every attempt, hint, and solution action as the evidence model. This preserves provenance but makes it difficult to compare one completed problem with another.
3. **Problem episode plus evidence facets:** interpret an episode through separate facets for correctness, independence, attribution, transfer, freshness, and context, while retaining the underlying observations. This preserves traceability without turning the facets into a mastery formula.

The third alternative is the smallest useful domain model. The facets are analytical views, not storage requirements, scores, or a prescribed event table. A future implementation may choose a different representation after the learning loop is designed.

## Observation, interpretation, and mastery boundary

| Layer | Example | What it may support | What it must not claim |
| --- | --- | --- | --- |
| Observation | First submission was incorrect; no hint was requested. | A record of independent failure under the available conditions. | That a skill is absent. |
| Observation | Focus hint was requested, then the answer was corrected. | Supported recovery and responsiveness to feedback. | Independent mastery of every tagged skill. |
| Interpretation | Correct result after a strategy hint is materially supported success. | A hypothesis that the learner can execute the strategy once selected. | That the learner can select that strategy independently. |
| Mastery update | Internal progress state changes later. | A future policy may consume the interpretation. | A numeric rule defined by this document. |

The same interaction can produce different evidence for different capabilities. A correct answer to a multi-skill problem is never automatically evidence of mastery for every tag.

## Correctness dimension — Observed fact and interpretation

Correctness describes the result or response that can be assessed in the current interaction. It is separate from independence and evidence strength.

| Correctness state | Interpretation boundary |
| --- | --- |
| **Correct** | The submitted response meets the applicable answer requirement. A correct response may still be supported or solution-exposed. |
| **Incorrect** | The response does not meet the applicable requirement. The cause remains open: arithmetic, statement comprehension, concept selection, execution, or reasoning may be responsible. |
| **Partially correct** | A review can identify valid progress or components without accepting the full response. This is especially relevant to construction and proof/justification. |
| **Unverifiable / manually reviewable** | The response cannot be safely classified by the available checker. It must not be converted into either positive or negative skill evidence automatically. |

The answer form changes what can be observed:

- an **exact answer** can be checked for equality, but not necessarily for the reasoning path;
- **multiple values** require completeness and non-duplication as well as individual validity;
- a **construction** requires checking the produced configuration against the constraints;
- a **proof or justification** may require manual review of the logical obligation. This document does not define automated proof grading.

Correctness is therefore a response-level observation. It does not identify which capability caused success or failure by itself.

## Attempt signals — Interpretation

Attempts should be read together with hint and solution exposure.

| Attempt observation | Possible interpretation | Does not prove |
| --- | --- | --- |
| First-attempt correct with no hint or solution | Strong independent result for the observed response, subject to attribution and problem context. | Mastery of every tagged skill, or transfer beyond this problem. |
| First-attempt incorrect | Weak negative evidence about the observed response under those conditions. | That a capability is absent; a local arithmetic or reading error may explain it. |
| Repeated incorrect attempts without new support | Stronger negative signal for the current problem episode, especially if the statement and response format were clear. | A permanent skill deficit; the learner may be stuck on one representation or misconception. |
| Eventually correct after unchanged independent retries | Evidence of eventual success and persistence; later correctness may be stronger than the first failure alone. | That the learner could solve it efficiently or transfer the reasoning. |
| Eventually correct after feedback or a hint | Supported success. The depth of support determines how much independence can be inferred. | Independent strategy selection if a strategy hint was needed. |
| Answer changed after feedback | Responsiveness, error correction, or use of feedback may be observed. | That the corrected reasoning was independently generated. |
| Abandoned or skipped | Insufficient evidence about correctness or capability; may indicate time, confidence, interface, motivation, or an interaction barrier. Visible work before stopping may still supply separately attributable evidence. | A negative capability or mastery judgment from abandonment alone. |

Repeated attempts on the same problem can reveal recovery, but they also introduce memory and feedback effects. They should not be counted as independent replications of the original task.

## Hint signals — Interpretation

The current semantic hint levels are `focus`, `strategy`, and `next-step`. A hint request is itself an observation, not a mastery label.

| Hint level | What requesting it may reveal | What solving after it may support | What it does not prove |
| --- | --- | --- | --- |
| **Focus** | Uncertainty about which condition, object, or relationship deserves attention. | The learner can make progress after the problem focus is clarified. | That the learner lacks the underlying skill; the obstacle may be task interpretation. |
| **Strategy** | Uncertainty about which reusable approach to choose. | The learner may execute a selected strategy with support. | Independent method selection or method mastery. |
| **Next-step** | A local execution or sequencing obstacle after the direction is known. | The learner may continue a partially formed solution after a prompt. | That the whole reasoning chain was independently available. |

Hint semantic level is one input into independence interpretation, not the independence state itself. The interpreter must inspect what the learner had already produced, whether the hint confirmed a viable direction or introduced the missing key idea, how much reasoning remained, and whether later work was independently reconstructed.

Additional hint patterns matter:

- requesting a hint **before any attempt** indicates uncertainty or a preference for support, but does not diagnose a capability;
- requesting **several levels** indicates that the learner required progressively more support in this episode;
- a **strategy hint** that only confirms a strategy the learner had already generated may still be lightly supported;
- a **focus hint** that supplies the only viable direction may be materially supportive;
- a **next-step hint** may be light when it confirms an already formed step, or material when it supplies the missing bridge;
- solving after a **focus hint** is not automatically stronger across different problems; the remaining work and the learner's prior reasoning matter;
- a correct response after a hint remains a correctness observation with supported independence.

Hint semantics are provisional product vocabulary. They should not be treated as official problem metadata or as a numeric penalty ladder.

## Solution reveal — Interpretation

Solution exposure changes the provenance of later actions.

| Solution timing | Evidence interpretation |
| --- | --- |
| Solution viewed before a correct answer | The later answer is solution-exposed. It can show engagement or recognition, but should not count as independent mastery evidence for the problem. |
| Solution viewed after attempts are exhausted | Earlier attempts remain evidence of the episode. A later correct response demonstrates recognition or re-execution after instruction, not independent solution of the original episode. |
| Solution viewed after the learner already solved | The independent solution evidence remains valid. Viewing may support comparison or reflection, but it does not strengthen the prior result automatically. |
| Immediate re-attempt after solution reveal | This may show short-term learning or reproduction. It is not independent same-episode evidence because the solution was available. |

Seeing a full solution can be useful training behavior. It should be represented as a change in support context, not as a negative mastery event and not as an independent success.

Solution exposure does not permanently invalidate future evidence from the same problem. An immediate reproduction remains weak or insufficient evidence of independent understanding. A later retry after a meaningful but unspecified delay may become useful positive evidence if the learner independently reconstructs the reasoning; memory contamination remains possible, and this evidence is generally weaker than transfer to a different story. No fixed delay threshold is defined in v0.1.

## Retry and delayed retry — Interpretation

Retry timing changes what can be inferred:

- an **immediate retry of the same problem** can show correction, attention, or memory. It is weak transfer evidence because the story and recent error are still present;
- a **later retry without solution exposure** gives better evidence about retention and independent re-entry, but it is still the same problem and may benefit from memory;
- a **later retry after solution exposure** can show learning response or independent reconstruction. It is not equivalent to an untouched first attempt, and its interpretation must record possible memory contamination;
- a correct delayed retry should be interpreted together with whether hints, feedback, or the full solution were available between attempts.

Retry evidence is about the learner’s interaction history. It does not establish that a skill will transfer to a new story.

## Transfer — Interpretation

Transfer is stronger than repetition because it reduces the chance that recall of a statement, diagram, or recent correction explains the result.

| Result context | Potential evidence strength | Attribution boundary |
| --- | --- | --- |
| Same problem repeated | Weak for transfer; useful for recovery and retention questions. | Do not treat repeated correctness as several independent demonstrations. |
| Near-isomorphic problem | More informative than repetition when the learner must reproduce the structure with changed values or surface details. | Similarity can still permit answer or method memory; inspect whether the relevant reasoning was reconstructed. |
| Structurally similar problem | Moderate transfer evidence when the relevant structure is actually shared. | Story similarity alone is insufficient; the reasoning obligation must match. |
| Same skill in a different story or domain context | Stronger transfer evidence because the learner must recognize and reuse the capability. | A different story may introduce a new concept or method, so attribution still needs inspection. |
| Combined or novel application | Evidence for a composition or adaptation of capabilities when the learner's work exposes those operations. | A result may support only the skills directly visible in the work; do not attribute success to all tags automatically. |

Examples from the current research vocabulary include translating quantitative relationships in both a motion and a redistribution story, or coordinating constraints across arithmetic, route, and relational problems. A success in one of these contexts is not proof that every component skill in the problem was independently selected.

A different problem ID is not, by itself, meaningful transfer. Transfer distance depends on changed surface details, preserved structure, new concepts, method demands, and what reasoning the learner actually reconstructed. No transfer score is defined here.

Transfer requires a source problem whose relevant visual and solution details are sufficiently verified. Conditional or plausible paths from OT-001C.2 cannot be promoted to strong learner evidence merely because the task stories look similar.

## Problem difficulty — Interpretation

Correctness on an easier or harder problem may change the context in which evidence is read, but no difficulty score is defined here.

- Correctness on a harder, well-attributed problem may be stronger positive evidence than correctness on a routine problem, especially under independent conditions.
- Failure on an easier problem may reveal a foundation gap, a reading issue, or a transient execution error; it is not automatically stronger negative evidence.
- A hard problem may introduce several skills, unfamiliar concepts, or a poorly verified representation, which reduces attribution clarity.
- Official task position, grade, stage, or numbering is source metadata. It is not a training difficulty measure.

Difficulty should therefore be treated as contextual evidence supplied by a later, separately justified model. It must not be inferred from the problem number or used as an unexamined weight in this document.

## Multiple skills and attribution — Interpretation

A problem can involve Foundation capabilities, several Olympiad reasoning skills, and one or more Methods. Tags describe candidate relevance; they do not guarantee that every tag was demonstrated.

Evidence may be attributed to:

1. **All tagged skills** only when the learner’s work visibly demonstrates each relevant action and the response requires those actions. A correct final number alone is rarely sufficient.
2. **Only some tagged skills** when the work exposes one operation but leaves another implicit. For example, a learner may construct a valid configuration without showing the broader impossibility or enumeration argument also listed in the problem analysis.
3. **No confident skill attribution** when the response is only a final answer, the problem combines many unobserved steps, the source image is unresolved, or the checker cannot distinguish an arithmetic error from a reasoning failure.

The most useful observation is often a localized error or explanation: which condition was omitted, whether cases were complete, whether a bound was justified, or whether a configuration was checked. This is a research direction, not a requirement for automated instrumentation in this task.

## Methods and evidence — Interpretation

Methods are not mastery skills by default. They describe possible strategies that may support a capability.

| Learner method observation | What may be recorded conceptually | What it does not prove |
| --- | --- | --- |
| Uses a method independently and explains its role | Independent method use in this episode; possible evidence that the learner can select and execute the strategy. | Mastery of every skill the method can support. |
| Uses a method after a hint | Supported method execution. Hint depth matters for independence. | Independent method selection. |
| Sees a method only in the solution | Method exposure or recognition after instruction. | That the learner can reproduce or select it independently later. |

For example, case analysis may support systematic enumeration, contradiction may support global impossibility, and construction may support a valid configuration. The method observation should remain separate from evidence for the capability’s proof obligation. A solution can use a method that the learner did not independently discover.

## Independence dimension — Interpretation

Independence describes how much external support was needed for the observed result. The following qualitative states are a working vocabulary, not a state machine or mastery scale:

| Independence state | Boundary based on observations |
| --- | --- |
| **Independent** | The relevant response was produced without a hint or solution exposure in the episode. Ordinary instructions and the available answer format do not count as special support. |
| **Lightly supported** | A hint or limited feedback was used, but the learner had already supplied the key direction or the hint only confirmed a viable path. The exact boundary must be recorded from the interaction, not inferred from hint label alone. |
| **Materially supported** | Support introduced a missing key idea, changed the viable direction, or supplied a substantial part of the reasoning. Any hint level can be materially supportive when the context warrants it. |
| **Solution-exposed** | The full solution or an equivalent worked path was seen before the response being evaluated. |

These states do not rank the learner globally. A learner can be independent on one skill and materially supported on another in the same problem. A solution-exposed response can still be useful for training interpretation, but it should not be conflated with independent evidence.

Hint depth informs this judgment but does not determine it: a confirming strategy hint can remain lightly supported, while a focus hint that supplies the only viable direction can be materially supportive. A next-step prompt can likewise be light or material depending on how much reasoning remained.

Independence is not the same as confidence, correctness, or method choice. A correct independent answer may have an invisible lucky guess; an incorrect independent proof may reveal valuable partial reasoning.

## Evidence strength — Recommendation

Evidence strength is a qualitative interpretation of an observation in context. It must remain separate from correctness and independence, and it must not be assigned a number in v0.1.

| Strength | Typical conditions | Boundary |
| --- | --- | --- |
| **Strong positive** | Correct or substantively valid work produced independently on a well-attributed transfer problem; repeated independent success across different stories strengthens the case. | Does not permanently establish mastery or prove every tag on a multi-skill problem. |
| **Moderate positive** | Correct independent work on the same problem, correct work after a focus hint, or a valid partial argument that demonstrates a named action. | Support, repetition, or incomplete work limits the claim. |
| **Weak positive** | Correct work after a strategy/next-step hint, successful delayed retry with clear provenance, or method execution after support. | Shows progress or supported capability, not independent selection. |
| **Weak negative** | First-attempt incorrect response or a local error on an otherwise relevant attempt. | The cause may be arithmetic, reading, concept choice, execution, or the response format. Abandonment alone is insufficient for negative capability evidence; separately attributable work before stopping may still be interpreted. |
| **Stronger negative** | Repeated independent failures on clearly understood, well-attributed problems involving the same action, with no solution exposure and no competing explanation visible. | Still a hypothesis about a weakness, not proof that the skill is absent. |
| **Insufficient / unresolved** | Solution-exposed success, unverifiable response, conditional source interpretation, or a multi-skill result with no attribution path. | Should not drive a confident mastery interpretation. |

“Wrong answer” is therefore not equivalent to “skill absent.” A learner may have selected the right concept but made an arithmetic error, misunderstood the statement, executed one step incorrectly, or failed in one skill among several. Conversely, a correct answer may conceal unsupported guessing or copied structure.

## Evidence freshness — Interpretation

Freshness describes the temporal context of evidence, not a decay equation.

- **Recent evidence** is more relevant to the learner’s current working state, especially after a change in instruction or task context.
- **Older evidence** remains provenance and may show longer-term retention, but it should not be treated as a permanent current guarantee.
- **Repeated evidence** is more informative when it spans different problems and support conditions; repeated same-problem success is mainly recovery or retention evidence.
- **Contradictory evidence** should remain visible. Independent success followed by independent failure may indicate task variation, attribution error, fatigue, or a capability boundary; it should not be collapsed into a single forced conclusion.

One success should not permanently establish mastery. A future policy may consider recency and consistency, but no decay or aggregation rule is defined here.

## Training mode and Olympiad simulation — Interpretation

The same response has different evidentiary meaning in different modes.

| Context | Available observations | Especially strong evidence |
| --- | --- | --- |
| **Training mode** | Hints, retries, feedback, solution reveal, and delayed practice are available. | Independent attempt before support; improvement after a hint; later transfer without solution exposure; explicit construction or justification that can be inspected. |
| **Olympiad simulation** | Hints and solution are disabled until the attempt is finished; a format may allow one final submission. | Correct or substantively justified work under independent time/response conditions, especially across multiple tasks. |

Training mode is better for observing recovery, hint dependence, and how a method is learned. Simulation mode is stronger evidence of independent performance under the selected format, but a single final submission exposes less reasoning and may make attribution weaker. A simulation failure is still not proof of skill absence if the response is uninspectable or the task combines several skills.

Mode is part of evidence context. A training result and a simulation result should not be interpreted as interchangeable observations.

## Interpretation examples tied to the current taxonomy

These examples illustrate attribution boundaries; they are not new official classifications:

- A correct, independently justified result on a quantitative motion problem may support `Переводить количественные связи в выражения и уравнения`, but a copied equation or solution-exposed answer does not establish independent modeling.
- A complete, independently explained case partition may support `Систематически перебирать случаи и обосновывать полноту`; a correct final count without the partition may provide only weak or unresolved attribution.
- A candidate rejected with an explicit violated condition supports local exclusion. Showing that every admissible class fails supports global impossibility; a final “no solution” without that obligation is insufficient.
- A valid configuration produced after a construction hint supports supported construction evidence. It does not prove independent method selection or mastery of all constraints unless the work exposes those checks.
- A method such as contradiction seen only in a revealed solution is method exposure, not method mastery and not independent evidence for global impossibility.

## Scenario audit — Interpretation

The following scenarios test the evidence vocabulary against common learning episodes. They are analytical examples, not product workflows or mastery rules.

### A. Correct first attempt, no hints

- **Observations:** The first response is correct; no hint or solution was viewed; the response form is assessable.
- **Interpretation:** Independent success for the visible response, subject to attribution and problem context.
- **Evidence strength:** Strong positive on a well-attributed transfer problem; moderate positive on an isolated same-problem result.
- **Attribution limits:** It does not prove every tagged skill, method selection, or future transfer.

### B. Wrong → focus hint → correct

- **Observations:** The initial response is incorrect; a focus hint is requested; the learner then submits a correct response.
- **Interpretation:** Supported recovery and responsiveness. The focus hint may be lightly or materially supportive depending on whether it confirmed or supplied the viable direction.
- **Evidence strength:** Moderate or weak positive for the resulting action, with weaker independence than an unsupported solution.
- **Attribution limits:** The original failure remains ambiguous; the corrected response does not prove independent focus selection.

### C. Wrong → strategy hint → wrong → next-step → correct

- **Observations:** An initial attempt is wrong; a strategy hint is used; another attempt is wrong; a next-step hint precedes a correct response.
- **Interpretation:** The learner eventually executed a supported path, but both strategy selection and local execution required assistance. The exact support state depends on what the learner had produced before each hint.
- **Evidence strength:** Weak positive for supported execution and learning response; weak negative for independent performance in this episode.
- **Attribution limits:** It does not establish independent method choice, complete constraint coordination, or mastery of every tag.

### D. Full solution viewed → immediate correct answer

- **Observations:** The full solution is viewed before a correct immediate response.
- **Interpretation:** Solution-exposed recognition or reproduction.
- **Evidence strength:** Insufficient for independent mastery of the problem; potentially useful training evidence.
- **Attribution limits:** The response cannot show independently selected reasoning or method use.

### E. Fails today → independently solves the same problem later

- **Observations:** The learner previously failed; no intervening solution exposure is assumed; after a meaningful but unspecified delay, the learner independently solves the same problem.
- **Interpretation:** Useful evidence of retention or reconstruction, while remembered wording or method remains possible.
- **Evidence strength:** Moderate positive for the later episode, generally weaker than transfer to a different story.
- **Attribution limits:** Same-problem memory limits the claim; the earlier failure still needs its own causal interpretation.

### F. Solves original with help → later independently solves a different-story problem targeting the same reasoning skill

- **Observations:** The original response is completed with support; a later problem in a different story is solved independently and the relevant reasoning is visible.
- **Interpretation:** Supported success on the original and stronger transfer evidence on the later problem.
- **Evidence strength:** Strong positive for the visible skill in the later problem, conditional on meaningful structural transfer and attribution.
- **Attribution limits:** It does not prove that the original solution was independent or that all related skills transferred.

### G. Correct answer on a problem tagged with three skills

- **Observations:** The final answer is correct, but the learner's reasoning is not observable enough to distinguish the three tagged actions.
- **Interpretation:** Correct response with unresolved skill attribution.
- **Evidence strength:** Insufficient or weak positive for the response; no automatic positive evidence for all three skills.
- **Attribution limits:** Alternative methods, hidden arithmetic, or an unobserved step may explain the result. Attribute only actions actually exposed by the work.
## Open questions — Recommendation

- Which learner-visible artifacts are sufficient to attribute a multi-skill solution without requiring full proof grading?
- Can local exclusion and global impossibility be separated reliably in learner work, or do they appear as different depths of one capability?
- Can bounding and attainability within optimality be diagnosed separately?
- How should partially correct constructions and proofs be reviewed consistently across response types?
- What is the minimum evidence needed to distinguish a statement misunderstanding from a capability failure?
- How much transfer distance is enough to show reuse across a new story, concept, or domain?
- Which method observations are useful for training feedback while remaining separate from skill mastery?
- How should contradictory evidence be reviewed by a human when source, timing, or attribution is uncertain?
- Which observations remain available in a one-submission simulation format?
- How will learner-performance evidence validate or revise the current Skill Taxonomy v0.1?

## Final recommendation

1. Keep Observation, Evidence interpretation, and Mastery update as separate layers. No event or response directly implies a numeric mastery change.
2. Use correctness, independence, attribution, transfer, freshness, method exposure, and mode as qualitative evidence facets. They are context for later decisions, not a formula.
3. Treat independent transfer on a different story as stronger evidence than repetition of the same problem, while preserving the possibility of attribution uncertainty.
4. Treat solution-exposed success as training evidence and learning response, not independent mastery evidence for that episode.
5. Preserve partial, incorrect, and unverifiable states rather than collapsing them into binary success/failure.
6. Keep Methods separate from mastery skills by recording independent, supported, or solution-exposed method use conceptually.
7. Proceed to a later Learning Model phase with this evidence vocabulary as a provisional domain reference. Learner-performance validation, response review, and any mastery update policy remain separate decisions.

## Verification gaps

- No learner interaction dataset has been observed; all strength boundaries are hypotheses grounded in the project vision and problem/domain research.
- Automated checking of proofs, constructions, multiple-value completeness, and partial answers is not defined.
- Source/visual verification gaps identified in OT-001C.2 limit the attribution that can be made from some problem paths.
- No evidence yet shows that the proposed independence states are sufficient for real tutor or learner decisions.
- No evidence yet establishes the best transfer distance, freshness policy, or review procedure for contradictory observations.

## Completion status

**READY**

This document proposes a reviewable qualitative evidence vocabulary. It does not adopt a mastery algorithm, storage model, or product behavior beyond the distinctions stated above.

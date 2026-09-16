# Review and Retention Model — v0.1

## Purpose and handoff context

- **Task ID:** OT-001D.4.
- **Revision:** branch `docs/ot-001d-learning-model` at `5f8ad19086f01b61757ac83abda0e75ede57fe38` (`docs: define recommendation model v0.1`); D.2 and D.3 are committed, and this D.4 document is the current reviewed change.
- **Goal:** define when previously established capability evidence should be reconfirmed and how review differs from ordinary practice.
- **Scope / Allowed actions:** create only this research document; interpret D.1–D.3 evidence and compare minimal review-model shapes.
- **Out of scope:** spaced-repetition/decay formulas, numeric values, schedules or intervals, database/ORM/schema, API, UI, implementation, recommendation scoring and selecting the next problem.
- **Inputs:** [Learning Evidence v0.1](learning-evidence-v0.1.md), [Mastery Model v0.1](mastery-model-v0.1.md), and [Recommendation Model v0.1](recommendation-model-v0.1.md).
- **Constraints:** time alone does not prove forgetting or lower mastery; preserve historical evidence and attribution; review trigger is not recommendation priority; Methods remain contextual.
- **Definition of Done:** distinguish stale evidence from forgetting, define qualitative review triggers and evidence, explain mastery interaction and Foundation/Reasoning differences, test A–G, identify D.4 preservation needs, and validate the authorized diff.
- **Status:** READY as a reviewable domain proposal. Adoption and any implementation remain separate decisions.

## Evidence and problem — Observed fact

D.1 defines freshness as temporal context rather than a decay equation. Older evidence remains provenance and may show retention; it is not a permanent current guarantee. Same-problem retries can show recovery or reconstruction, but share memory and feedback effects. A later different story is generally stronger transfer evidence when the relevant reasoning is visible. Solution exposure changes the provenance of subsequent work. Incorrect or abandoned work does not itself prove capability loss.

D.2 defines mastery as a qualified evidence-based belief, not an objective learner property. Its primary conclusions are `unknown`, `demonstrated` and `reliable`; confidence, scope and traceable evidence basis qualify the conclusion. A temporal gap can justify `reconfirmation needed` without lowering a historical conclusion. Comparable counterevidence can suspend unqualified reliable while retaining demonstrated positive use; a diagnostic qualifier needs an attributable obstacle.

D.3 defines reconfirmation as a recommendation purpose, but keeps selection separate: it determines why current evidence would be useful; eligibility and priority determine which problem may serve that purpose. D.3 also preserves exposure, support, transfer, attribution and selection rationale for later interpretation.

No learner dataset establishes which temporal/context gap warrants review, what evidence best predicts retention, or how often review improves outcomes. The models below are therefore **Interpretation / Recommendation**, not claims that time causes forgetting or that a particular review practice is effective.

## Why review exists

Review asks whether an already established capability claim remains adequately supported for a current use or broader claim. It is not ordinary repetition, a penalty after failure, or a declaration that the learner forgot.

| Situation | What it means | Is review needed? |
| --- | --- | --- |
| **Forgetting** | A possible explanation for changed performance. It cannot be inferred from elapsed time alone. | Only if current evidence is needed; review seeks evidence, not proof of forgetting. |
| **Stale evidence** | The existing evidence has a temporal or contextual gap relative to a current claim; its history remains valid. | Potentially. State why present applicability matters and retain the historical basis. |
| **Insufficient transfer** | A capability may be demonstrated but its reuse beyond known context is unestablished. | Usually a transfer/strengthening need rather than retention review; a new context can serve both purposes if evidence remains interpretable. |
| **Scope change** | A later task requires a broader representation, composition or proof obligation than the established claim. | Review of the earlier scope is not enough; seek evidence for the stated extension. |
| **Contradictory new evidence** | Comparable, attributable observations challenge current repeatability or reveal a difficulty boundary. | Yes when clarification is useful. Preserve historical success and diagnose the observed obstacle rather than assuming loss. |

These meanings must not collapse. A long gap with no current need does not make review mandatory. A new hard composite task may reveal scope change rather than stale evidence. Repeated supported success may show execution under support while leaving independent use unestablished; it is not evidence of retention by itself.

## Model shapes considered — Interpretation

### Option A — automatic time-based decay and review schedule

This would lower a claim or enqueue review after elapsed time.

- **Strength:** simple operational answer.
- **Risk:** asserts forgetting without evidence, needs arbitrary intervals and decay, and treats all capability contexts as comparable.
- **Decision:** reject for v0.1.

### Option B — review only after an explicit failure

This would reserve review for recent incorrect work.

- **Strength:** avoids time-based assumptions.
- **Risk:** misses relevant old evidence before a high-stakes current use; may turn failure into a punitive loop; cannot distinguish an arithmetic error, changed scope or target obstacle.
- **Decision:** reject as complete model.

### Option C — qualitative reconfirmation need with evidence-purpose boundary

Retain the established conclusion and its provenance. Mark reconfirmation as relevant when a current claim has a justified temporal/context gap, comparable contradiction or current dependency need. Describe what missing evidence would clarify. D.3 then decides whether an eligible problem should serve review rather than defining a schedule here.

- **Strength:** preserves historical success, explains why review is useful, covers contradictions and scope without time decay, and remains compact.
- **Risk:** requires qualitative judgment about current need and available evidence; no automatic queue follows.
- **Decision:** recommend as the smallest sufficient v0.1 model.

## Recommended Review and Retention Model v0.1

Represent review need as a **reconfirmation rationale** attached to a qualified mastery claim, not as a new mastery state, a retention score or an automatic schedule. It contains:

1. the established capability conclusion and its scope;
2. the reason present evidence is insufficient or needs clarification;
3. the historical supporting and relevant counterevidence;
4. the kind of new evidence that could clarify current use; and
5. the limits of what review could establish.

The minimal qualitative reasons are `temporal/context gap`, `current dependency need`, `contradictory evidence`, `unestablished transfer`, and `scope extension`. They are explanations, not a ranked taxonomy or independent retention dimensions. More than one may apply. `Unestablished transfer` and `scope extension` may lead to a new evidence purpose rather than review narrowly defined; retaining them here prevents a stale label from hiding why same-problem review is insufficient.

## Review triggers

| Trigger | When a reconfirmation rationale is useful | Boundary |
| --- | --- | --- |
| **Temporal/context gap** | Earlier evidence is being used to support a present claim and no relevant later evidence makes that use clear. | Time alone does not establish loss or require review without a current reason. |
| **Reliable capability lacks current confirmation** | A reliable conclusion matters for current work, but its demonstrated scope/context has not been revisited. | It does not erase reliability; current relevance may remain unnecessary to test now. |
| **Comparable contradictory evidence** | Recent attributable work conflicts with the prior claim or exposes a repeated target obstacle. | Inspect scope, support, response validity and alternative causes before calling it contradiction. |
| **Current dependency for broader work** | A prior capability is expected to contribute to a harder/composed task, and its present applicability affects interpretation of that task. | Do not infer a formal prerequisite graph; the dependency is contextual. The combined task itself may test an extension rather than review the earlier scope. |
| **Transfer unestablished** | Demonstrated work is confined to one item/context or support condition, and a reusable claim is now relevant. | This is not evidence becoming stale. It calls for independent variation rather than a rote review. |
| **Repeated supported success without independence** | Evidence shows execution under help but the current claim requires independent selection or reconstruction. | Do not call the learner weak or assume support caused a failure; seek an opportunity to observe independence. |

No fixed duration, number of successes/failures or interval is implied. A trigger creates a rationale, not a mandatory next task and not a priority over all other learning purposes.

## Reconfirmation evidence

| Evidence context | What it can usefully show | Memory / interpretation limit |
| --- | --- | --- |
| **Same problem retry** | Recovery, recall, reconstruction and retention of the known item; may be useful after a delay with provenance preserved. | Recent wording, feedback and solution exposure contaminate claims of independent reuse. It is insufficient for transfer and normally insufficient to reconfirm reliable reasoning broadly. |
| **Near-isomorphic problem** | Limited variation and whether a learner can reconstruct structure with changed surface features. | It may still permit template memory; it cannot alone establish broad transfer. |
| **Structurally similar or different-story transfer** | Independent recognition and reuse of the shared capability under changed demands, when learner work exposes the action. | New concepts/methods can obscure target attribution; different story alone is not meaningful transfer. |
| **Harder or composed application** | A capability's contribution under broader demands, and possible scope extension/challenge. | Failure may reflect another component, overload or novel concepts; it does not refute the earlier scoped conclusion. |
| **Implicit use inside a newer problem** | Current evidence can reconfirm a capability when work visibly and independently demonstrates its action, attribution is credible, and the newer context is relevant. | A final answer, mere tag or reference-solution path cannot count as implicit review. The evidence may support only a bounded component. |

The best reconfirmation evidence depends on the rationale. For a current reliable reasoning claim, independently attributable meaningful transfer usually gives more useful reconfirmation than the same problem. For a known-item reconstruction question, same-problem retry may be appropriate. For a Foundation operation, varied independently visible use in newer work may be sufficient even if the stories are not distant.

## Mastery interaction

Review does not automatically downgrade mastery. It interprets new evidence alongside the retained historical basis:

- successful reconfirmation can strengthen confidence in present applicability, transfer or a stated scope; it does not automatically broaden every capability claim;
- failed reconfirmation creates uncertainty about current repeatability or a diagnostic qualifier only where an obstacle is attributable; it does not erase historical success;
- comparable counterevidence can suspend an unqualified reliable conclusion and retain demonstrated capability with limited confidence, temporal/context and diagnostic qualifiers;
- `unknown` is appropriate only if the original positive basis itself is no longer defensible, such as corrected attribution or unverifiable work, not merely because later evidence differs;
- solution-exposed reproduction may show engagement or reconstruction but does not restore independent reliable evidence by itself.

Review must retain whether the new task was selected as reconfirmation, transfer, challenge or diagnosis. A later result cannot be interpreted as a neutral independent replication if its purpose, support or exposure made it dependent on earlier work.

## Foundation vs Reasoning

Use one review model for Foundation capabilities and Olympiad reasoning skills. Both retain prior evidence, require attribution, and reject time-based loss. The expected variation differs by capability:

| Aspect | Foundation capability | Olympiad reasoning skill |
| --- | --- | --- |
| **Useful reconfirmation** | Current, independently visible use with changed quantities, relations, representations or quantifiers can be meaningful. | Independent use of the proof/search/construction obligation under meaningful changed demands is usually more informative. |
| **Same-problem limit** | Repeating a supplied equation or known negation shows limited recall, not fresh creation of the operation. | Repeating a known enumeration/proof is especially weak evidence of reusable reasoning. |
| **Composed use** | A visible component can reconfirm the Foundation action even if later reasoning fails. | Composition may test a broader claim, but failure is often ambiguous across component skills. |
| **Transfer expectation** | Different stories are not a blanket requirement; fresh construction in varied representations may suffice. | Meaningful independent transfer remains normally necessary for reliable reasoning, alongside consistency. |

These are evidence expectations, not separate review schedules or different retention scores.

## Review versus recommendation

D.4 defines **why** previously established evidence needs reconfirmation, what claim is in question, and what evidence could clarify it. D.3 defines **whether and how** an eligible problem is selected in the current session, using purpose, eligibility, priority and balance.

D.4 must not duplicate D.3's filtering, ranking, problem choice, session balance or explainability template. Conversely, D.3 must retain a review rationale when it selects a task for reconfirmation; selection does not itself prove that review was needed or successful.

## Scenarios A–G

| Scenario | Is review needed? Why? | Useful evidence | Must not infer |
| --- | --- | --- | --- |
| **A. Reliable reasoning skill, no recent evidence** | Potentially, if present applicability matters: temporal/context gap creates a reconfirmation rationale. No automatic review from time alone. | Independently attributable structurally similar/different-story use of the reasoning obligation; a bounded challenge can also test scope. | Forgetting, loss of reliable history, or that same-problem recall establishes transfer. |
| **B. Reliable skill with recent independent success** | Usually no separate review rationale; current relevant evidence already supports applicability within scope. | Retain the newer evidence; later transfer/challenge may serve another purpose. | Permanent universal reliability or that no future reconfirmation can be useful. |
| **C. Old reliable evidence plus recent failures** | Yes when failures are comparable and attributable; clarify current repeatability and any named obstacle. | Work that exposes the disputed target action in a relevant changed context; a bounded diagnostic context may separate components. | That time caused forgetting, that historical success is erased, or that all recent errors share one cause. |
| **D. Demonstrated skill without transfer** | A new-evidence/transfer rationale is relevant when reusable independent use matters; it is not stale evidence. | Independent near-isomorphic bridge or meaningful transfer with visible shared obligation. | That same-problem success establishes transfer or that demonstrated means weak. |
| **E. Repeated same-problem success after solution exposure** | Same-problem review may address reconstruction, but it cannot reconfirm independent broad capability. | Later independently attributable reconstruction with provenance, then changed-context work for reuse. | Independent original solution, reliable reasoning, or several independent replications. |
| **F. Foundation capability used successfully inside several newer problems** | Often no separate review is needed if the action is visibly and independently attributable in relevant newer contexts. | Preserve the visible component evidence and its varied representations; use focused review only if a current scope gap remains. | That every tagged Foundation capability was used, or that final correct answers alone reconfirm it. |
| **G. Previously reliable capability now required for harder combined task** | A current dependency/scope-extension rationale may be relevant. Review the prior scope only if it would clarify the combined result; otherwise treat the task as a new broader challenge. | Visible target action in a related but interpretable context, or component evidence within the combined task. | Formal prerequisite order, loss of earlier reliability after composite failure, or automatic attribution to every component. |

## Inputs from D.1–D.3

D.4 needs the following semantic evidence and rationale, not a stored schedule:

- capability conclusion, confidence, scope, supporting/counterevidence and diagnostic/temporal qualifiers from D.2;
- correctness, independence/support, solution exposure, retry dependence, transfer context, attribution and source validity from D.1;
- D.3's recommendation purpose, target scope, selection/eligibility rationale, intended information gain and material limitations;
- the newer interaction evidence and whether it was a same-problem retry, variation, transfer, challenge or implicit use.

Methods may describe how a learner was supported or what path was visible, but they remain context. Neither method exposure nor a review purpose creates MethodMastery.

## Outputs and preservation needs for future implementation

Future implementation must preserve enough provenance to avoid treating review as automatic decay:

1. Historical positive evidence, its scope, assistance/exposure and attribution basis; do not overwrite it with a current result.
2. Reconfirmation rationale and the claim it qualifies, including whether the trigger was temporal/contextual, contradictory, dependency-related, transfer-related or scope-related.
3. The selected task's actual purpose and relevant problem context, not merely that it appeared after an older attempt.
4. New evidence, its independence, transfer, attribution and response limits, linked conceptually to the historical claim it informs.
5. The resulting qualified conclusion, confidence and diagnostic/temporal qualifiers, including unresolved competing explanations.

This is a preservation contract, not a database/event/API design. It does not determine retention intervals, review queue ordering, recommendation scores or UI behavior.

## Explicit answers — Recommendation

1. **What makes evidence stale?** A justified temporal/context gap between an established claim and a current use, with no relevant later evidence. Time by itself is not sufficient.
2. **Does mastery decay with time in v0.1?** No. Historical conclusions remain; current confidence/applicability may need qualification.
3. **When is reliable capability reconfirmed?** When a current claim/dependency matters and existing evidence has a relevant temporal/context gap, or comparable evidence challenges present repeatability.
4. **Best reconfirmation evidence?** Independently attributable meaningful variation appropriate to the capability; for reasoning, usually transfer rather than same-problem recall.
5. **When is same-problem review insufficient?** When the claim concerns independent reuse, broad reasoning reliability or transfer, especially after feedback/solution exposure.
6. **How does contradictory review evidence affect conclusions?** Preserve earlier positive evidence; reduce confidence in current repeatability and add a diagnostic qualifier only for an attributable obstacle. Suspend unqualified reliable where warranted rather than forcing unknown.
7. **Can newer embedded success be implicit review?** Yes, when the capability action is visibly, independently and credibly attributable in relevant current work. Tags or final answers alone cannot.
8. **What must future implementation preserve?** Historical basis, reconfirmation rationale, selection purpose/context, new evidence provenance and the resulting qualified belief.

## Verification gaps and open questions

- No learner evidence defines what contextual gap makes reconfirmation valuable or what review form best supports retention.
- It is unknown which Foundation variations reliably demonstrate fresh construction and how much visible work is practical for reasoning attribution.
- The relationship between review, learner motivation, session balance and future queue behavior requires product and learner validation; this model defines none of them.
- D.3 remains the boundary for choosing a task. A future implementation still needs adopted problem metadata and response-assessment rules before review rationales can be applied consistently.

## Self-review and completion

| Risk | Check in this proposal |
| --- | --- |
| Time implies forgetting | Temporal/context gap retains historical evidence and creates no automatic downgrade or interval. |
| Review duplicates D.3 | D.4 defines rationale/evidence; D.3 selects a problem. |
| Same-problem memory proves transfer | Same-problem evidence is explicitly bounded; exposure provenance remains relevant. |
| Failure erases history | Counterevidence qualifies current reliability and may diagnose an obstacle without deleting historical success. |
| Foundation/Reasoning split into separate systems | One model is used with capability-appropriate evidence expectations. |
| Methods become mastery targets | Methods remain context only. |
| Implementation/scheduler leak | No schema, API, UI, intervals, scoring or queue logic is defined. |

Validation: local references, required sections, A–G scenarios, semantic boundaries and authorized file scope were checked; `git diff --check` and a new-file whitespace check passed. No application tests apply to this research-document change.

**READY** — reviewable research and domain proposal, not an adopted retention policy or implementation authorization.

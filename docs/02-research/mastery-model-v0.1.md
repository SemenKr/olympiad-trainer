# Mastery Model — v0.1

## Purpose and handoff context

- **Task ID:** OT-001D.2; revision task OT-001D.2-FIX resolves OT-001D.2-REVIEW.
- **Revision:** `docs/ot-001d-learning-model` at `bdef3ed389deb3b213b2bbf0a8c8b3789d36a9e6` (`docs: define learning evidence model v0.1`); the reviewed document was the sole untracked file before this revision, with blob hash `5a19476275ff52bc7b014fe3782a0f660a9fa89d`.
- **Goal:** define how accumulated learning evidence supports the system's current belief about a learner's capability.
- **Scope / Allowed actions:** modify only `docs/02-research/mastery-model-v0.1.md` to separate capability conclusions from diagnosis, simplify context and recheck A–H. D.1 remains unchanged. No commits or external publication.
- **Out of scope:** database/ORM/schema, API, UI, application code, recommendation rules, numeric scores/weights/percentages, difficulty adjustment math, decay or spaced-repetition formulas.
- **Inputs:** [Project vision](../00-project/project-vision.md), [Skill Taxonomy v0.1](skill-taxonomy-v0.1.md), [Learning Evidence v0.1 / D.1](learning-evidence-v0.1.md), [Skill Taxonomy Validation](skill-taxonomy-validation.md).
- **Constraints:** separate observation, interpretation and belief; preserve attribution and provenance; unknown is not weakness; Methods remain contextual; research proposals are not adopted architecture.
- **Definition of Done:** compare three models, define a qualitative recommendation, challenge its transition principles, evaluate A–H, identify D.3 inputs and unresolved validation needs, and check the authorized diff.
- **Status:** READY as a reviewable domain proposal. Human adoption is required before dependent implementation; this document does not grant it.

## Evidence and problem — Observed fact

The project vision calls for independent attempts, progressive help, later related work and skill progress. D.1 already distinguishes correctness, independence, assistance, attribution, transfer, temporal context and mode. It deliberately leaves accumulated mastery interpretation unspecified. A correct answer alone cannot distinguish an independently justified solution from reproduction after exposure.

The taxonomy defines observable capability obligations, including quantitative representation, complete enumeration and global impossibility. Its confidence labels concern the **taxonomy hypothesis**, not confidence about a particular learner. Validation provides worked problem paths, not observed student learning. Its VERIFIED paths support problem analysis; they do not establish a learner's use of that path. CONDITIONAL/PLAUSIBLE paths retain their verification limits.

**D.1 follow-up:** D.1's evidence-strength table includes abandonment under weak negative, while its attempt section says abandonment supplies insufficient correctness evidence and does not justify a negative mastery judgment. D.2 uses the rule: **abandonment alone does not justify negative capability evidence**. Visible work before abandonment can supply separately attributable evidence. D.1 is unchanged; reconciling its wording is a separate follow-up, not a prerequisite for applying this explicit D.2 boundary.

The strength table also gives typical hint-label examples, whereas D.1's detailed independence definitions require inspection of actual assistance. Here those examples are illustrative, never a hint-to-mastery mapping. The normalized taxonomy is the vocabulary reference; earlier validation's unresolved alternatives remain provenance, not an instruction to undo normalization.

## Interpretation boundary

**Mastery state is the system's current evidence-based belief about a learner's capability.** It is neither an objective learner property nor a certification of permanent competence.

| Layer | Example | Boundary |
| --- | --- | --- |
| Raw observations | Incorrect submission, strategy hint viewed, revised work, later unsupported response on another problem. | Preserve sequence and what was actually visible; a missing observation is not a failed action. |
| Evidence interpretation | The hint supplied a missing idea; the later work independently demonstrates complete enumeration in a changed context. | Correctness, independence, attribution and transfer each need justification. |
| Mastery state | Demonstrated capability, limited confidence in broader independent reliability, with an explicit transfer basis. | Summarize accumulated evidence without rewriting individual episodes or assuming a formula. |

The belief is about a named capability **within an evidenced scope**: the operation, representations, conceptual demands, support conditions and reasoning depth that were observed. It does not claim equal competence in every domain or at every difficulty. Scope is an explanation boundary, not a new taxonomy or a separate mastery object for every context.

All models, state boundaries and scenario conclusions below are **Interpretation / Recommendation**, not empirical learning findings. No external research or learner dataset was collected for this task.

## State-model candidates

### Option A — one numeric score

**Shape:** a single `0–100` capability score, with a missing value for no evidence. This is an example to evaluate, not a proposed calculation.

- **Meaning / strength:** compact ordered summary; convenient comparison of successive estimates.
- **Weakness:** a number does not reveal whether it came from sparse independent success, frequent supported success, or conflicting histories. Missing evidence needs a separate convention; zero would falsely imply weakness. Limited learner data cannot calibrate precision, thresholds or comparable difficulty.
- **Explainability:** the same value can conceal incompatible histories. An explanation would need additional evidence dimensions, defeating the single-score premise.
- **D.1 compatibility:** would compress or discard assistance, attribution, transfer and uncertainty; retaining them still would not justify the number.
- **MVP suitability:** reject. No numeric score, even an internal provisional one, is needed in v0.1. Contradictory evidence should remain intelligible rather than averaged into false precision.

### Option B — one qualitative stage

**Concrete candidate states:** `unknown`, `demonstrated`, `reliable`. They answer what positive capability is supported: none yet established, attributable use established, or repeated independent reusable performance established within scope. Difficulty is a separate diagnostic conclusion, not a fourth alternative.

- **Strength:** understandable, small vocabulary, no numeric calibration.
- **Weakness:** a single stage cannot distinguish no evidence from unassignable evidence, supported from independent demonstration, or old from current reliability. Difficulty and successful use can coexist; treating these names as a linear ladder would conceal that.
- **Explainability:** better than a number but inadequate alone. `Emerging` and `developing` were considered and rejected because they imply a learning trajectory that a static sparse history may not establish.
- **D.1 compatibility:** permits broad qualitative summaries but loses the facets necessary to interpret them; contradiction would force either an unjustified stage or proliferating composite stages.
- **MVP suitability:** too lossy on its own, particularly for scenarios B, D and F.

### Option C — qualitative conclusion plus confidence and a bounded evidence basis

**Concrete shape:** the three conclusions from B, separate qualitative confidence, scope, and a traceable evidence basis with relevant diagnostic and temporal qualifiers.

- **Meaning / strength:** answers both “what capability is suggested?” and “how securely can we say that now?” Retains uncertainty without inventing a score or stages for every combination.
- **Weakness:** more explanatory information than one label; boundaries require consistent interpretation and learner validation. A stage alone is deliberately not safe to consume.
- **Explainability:** each conclusion cites supporting and conflicting observations, the capability action, and the limits of inference.
- **D.1 compatibility:** reuses its descriptors rather than replacing them with weights. Evidence strength informs interpretation but does not directly dictate a conclusion.
- **MVP suitability:** recommend this restricted version. Keep two core judgments and a concise evidence basis; do not create independently scored submodels or a Cartesian product of states.

## Recommended Mastery Model v0.1

Use **capability conclusion + confidence + scope + traceable evidence basis + relevant diagnostic/temporal qualifiers** per learner and capability. These are semantic concepts, not fields of a persistence or API schema.

The primary capability conclusion answers one question: **what positive capability is currently supported by the accumulated evidence?** Its mutually exclusive values are `unknown`, `demonstrated`, `reliable`, within the stated scope. Use reliable when its requirements are supported; otherwise demonstrated when attributable positive use remains established; otherwise unknown. This is not an automatic progression or an event-driven state machine. Current belief must preserve the distinction between established use and certainty about present repeatability.

Only capability conclusion and qualitative confidence are core judgments. Retain the following information as context or explanatory qualifiers, without separate aggregate state scales:

| Evidence/context | Content retained | Why retain it |
| --- | --- | --- |
| Independence basis | D.1: `independent`, `lightly supported`, `materially supported`, `solution-exposed`, attached to the relevant observations; mixed histories remain mixed. | A supported demonstration cannot silently become independent competence. No averaged independence stage. |
| Transfer basis | D.1 contexts: same problem, near-isomorphic, structurally similar, different story/context, combined/novel use; identify actual changed demands and gaps. | A collection of different IDs is not demonstrated reuse. These are descriptive contexts, not ordered scores. |
| Attribution basis | What action is directly observed, what is only inferred, and what remains unresolved, with D.1 justification and source limits. | D.1 has no mandatory attribution enum; do not invent a second confidence ladder. Strong attribution of one event does not imply strong accumulated confidence. |
| Temporal context | Dates/order, gaps and whether established evidence needs reconfirmation for present use; unknown timing stays unknown. | Explain currency without a separate freshness state or a forgetting claim. |
| Scope | The operation, support conditions, representations and reasoning demands actually evidenced. | Bound the positive claim; scope is not a progress dimension. |
| Explanatory reasons | Relevant sparsity, unresolved attribution, unestablished transfer, temporal gaps or conflicting evidence. | Derived explanations, not independently maintained states; absence of a reason does not certify mastery. |

The evidence basis retains supporting/counterevidence references and explanation. Diagnostic and temporal qualifiers accompany the core judgments only when warranted. An `uncertain` stage is unnecessary: limited confidence and an explanation can coexist with demonstrated use. A conflict explanation distinguishes contradictory observations from merely sparse observations without adding another state or prescribing an action or schedule.

Do not require all facets to be known. Missing independence, transfer or timing remains explicitly unresolved; absence of a facet is not its least favorable value.

## Capability conclusions

| Conclusion | Observable interpretation | Limits |
| --- | --- | --- |
| **Unknown** | No attributable positive use is established for the stated capability/scope. | Distinguish no observations from insufficient interpretable positive evidence. Negative observations may support a separate diagnostic qualifier. Unknown itself never means weak. |
| **Demonstrated** | Attributable successful use of the capability, or an explicitly bounded part of it, has been observed; reusable independent reliability is not established. | Specify support and scope. A successful fragment demonstrates that fragment, not completion of the whole proof obligation. One success can justify this conclusion with limited confidence. |
| **Reliable** | Accumulated, coherent, well-attributed independent evidence supports repeated reuse of the capability across meaningful variation within the stated scope. | Establishing this conclusion requires strong confidence and meaningful transfer. It is not universal, permanent, or guaranteed success on harder compositions. A retained historical reliable conclusion must be qualified if its currency becomes uncertain. |

Successful and unsuccessful uses can coexist under **demonstrated + difficulty indicated**, with limited confidence in present repeatability. Later failures do not undo an established successful use. Material comparable counterevidence may suspend reliability, leaving demonstrated with the relevant qualifiers; it does not force unknown. Unknown becomes appropriate if review invalidates the positive basis itself, for example because its correctness or skill attribution cannot be established, rather than merely because later performance is inconsistent.

Unknown/no observations has no capability evidence. Unknown/insufficient positive evidence has observations such as unobservable reasoning, reproduction or attributable unsuccessful work, but no established positive use in scope. These cases have different evidence bases and may have different diagnostic qualifiers. Neither is a low capability score.

## Diagnostic qualifiers

**Difficulty indicated** means attributable work suggests an obstacle in a named action under the observed conditions. It is a diagnostic conclusion, not a primary capability state and not a synonym for uncertainty. Name the obstacle, supporting episodes, conditions and limits of the interpretation. A localized error supports only a tentative narrow hypothesis; a broader diagnosis needs a coherent pattern.

The qualifier can accompany demonstrated capability, limited confidence or unknown positive capability. For example, complete independent enumeration on one problem remains demonstrated even when later comparable attempts repeatedly omit cases. Record the current completeness difficulty alongside that positive basis. Repeated failure with no established positive use can instead be unknown plus difficulty indicated; this is distinguishable from no observations.

Confidence in the positive capability claim does not measure confidence in the diagnosis. Explain whether the diagnostic basis is tentative or repeated directly in its rationale; no second diagnostic confidence scale is introduced. Mere conflict, hint use, abandonment or sparse evidence does not justify difficulty indicated without an attributable obstacle. A material unresolved difficulty in the same scope prevents an unqualified current reliability claim; difficulty outside that scope does not erase scoped reliability.

## Confidence model

Confidence answers **“How confident is the system in this capability conclusion for its stated scope now?”** The conclusion answers **“How capable does the evidence suggest the learner is under those conditions?”** Confidence is neither success rate, correctness nor a learner personality trait.

| Confidence | Meaning |
| --- | --- |
| **Unavailable** | No positive capability claim is established. Use with unknown, explaining whether observations are absent or positive evidence is insufficient. A separate difficulty diagnosis can still have an explicit evidence basis. |
| **Limited** | Some attributable evidence supports the conclusion, but sparsity, dependence, attribution limits, temporal uncertainty or unresolved counterevidence materially limits generalization. |
| **Supported** | Several coherent observations make the scoped conclusion credible, but meaningful limits remain in independence, coverage, currency or comparability. |
| **Strong** | Diverse, sufficiently independent observations consistently support the precise claim; attribution and current relevance are adequate, and no material comparable contradiction remains unresolved. This is qualitative assurance, never certainty. |

Confidence applies to the **positive capability claim within its scope**, including its relevance to present use; it is not confidence that a historical observation was recorded correctly. Repeated materially supported work can provide supported or strong confidence that a capability is demonstrated under that assistance; it cannot establish independent reliability. Repeated failures strengthen a separately explained diagnostic basis, not the confidence value of the positive claim. More records do not necessarily mean more confidence: retries in one episode and remembered variants are dependent evidence.

One independent success may show good performance with limited confidence in reuse. Further diverse independent successes may support the same capability claim with higher confidence before reliability is justified. Strong confidence in a narrow fact such as reproduction of a known solution is not strong confidence in mastery.

## Positive evidence and independence

| Pattern | Accumulated mastery interpretation | Countercheck |
| --- | --- | --- |
| Independent first-attempt success | Can establish demonstrated for the visible action; ordinarily limited confidence from one episode. | Check reasoning, response validity and alternative paths; lack of recorded hints alone does not prove the action was understood. |
| Supported success | Positive evidence of what the learner can accomplish under that support and of recovery. | Do not infer independent selection if the key direction was supplied. Hint use is not a penalty. |
| Repeated same-problem success | Can strengthen the claim of stable execution/reconstruction in that context. | Memory and shared history prevent counting repetitions as diverse independent demonstrations. |
| Delayed reconstruction | Useful positive evidence when the work shows renewed reasoning without assistance in the later episode. | Delay alone cannot distinguish understanding from remembered solution; retain earlier exposure. |
| Near-isomorphic transfer | More informative when changed values/conditions require fresh decisions, not substitution into a memorized template. | A nominally new problem can remain effectively reproduction. |
| Cross-story transfer | Supports recognition and reuse when the same capability obligation is visibly performed. | Story change can introduce other concepts; success alone is not proof of transfer or reliability. |
| Novel/combined application | Can strongly support the attributable operation and its use in composition. | Novelty is not a universal difficulty rank; hidden component actions receive no credit. |

Across observations, independent performance matters when it exposes the target operation, not simply because support is absent. Lightly supported work can show that the learner already chose a viable direction; it strengthens a different claim from a hint that supplied that direction. Materially supported successes can reveal stable execution with unresolved independent selection. Solution-exposed immediate reproduction supplies no independent capability demonstration by itself.

A pattern of material support followed by attributable independent transfer supports a changed belief about available independence. It does not retroactively relabel the original episode. Continuing dependence on support keeps the independent claim open; it does not automatically mean difficulty unless attempted work locates an obstacle. The four D.1 independence descriptors never map mechanically to capability conclusions or diagnostic qualifiers.

## Negative evidence

| Observation/pattern | Defensible interpretation | Attribution check |
| --- | --- | --- |
| Isolated incorrect attempt | Usually no change to the positive capability conclusion; a visible local error may support a tentative narrow difficulty qualifier. | Arithmetic, reading, answer format or another skill may explain the outcome. |
| Repeated failures | May strengthen a difficulty qualifier when the same operation fails across understood, suitably varied episodes. | Repeated guesses within one task are not independent replications; inspect common task/source problems. |
| Failure despite light support | May expose an execution or interpretation obstacle even after limited clarification. | Did the support actually address the obstacle? A confirming hint says little about a different missing concept. |
| Failure despite substantial support | May localize a remaining gap after some demands were supplied; can be useful negative evidence for that remaining operation. | More help is not a larger negative weight. Support can conceal original selection ability or introduce confusion and load. |
| Abandonment | No directional conclusion from stopping alone. | Preserve any separately assessed work; time, motivation or interaction context may explain stopping. |
| Recent failures after success | Challenge currency, scope or consistency of the prior claim. | Establish comparability and target attribution before treating the history as contradictory. |

An incorrect whole problem can contain a correct independently demonstrated component. Conversely, an eventual correct answer does not erase an earlier exposed misconception. Retain both interpretations where they concern different actions or support conditions. Unsupported automated proof judgments and unverifiable responses cannot supply confident negative evidence.

## Transfer role

**Yes: reliable Olympiad reasoning normally requires meaningful transfer beyond repeating the same problem.** For this v0.1 proposal, do not assign a new unqualified reliable reasoning conclusion without it. If suitable transfer evidence is unavailable, retain demonstrated with the limitation; scarcity is not a waiver and not evidence of difficulty.

Meaningful transfer means the learner independently recognizes and performs the relevant reasoning obligation under changed conditions that require reconstruction or adaptation. A different story is neither necessary in every case nor sufficient by itself. A structurally similar task can supply meaningful transfer if the changed constraints force real reasoning. A near-isomorphic template with only substituted numbers may not. A renamed story using a recalled answer pattern may not either.

Same-problem success addresses reconstruction/retention, not transfer. Near-isomorphic work addresses limited variation. Structurally similar work tests reuse of the operation. Different stories can test recognition beyond familiar surface cues. Combined novel use can test composition when the component work is visible. These contexts overlap rather than forming a transfer-distance scale; a well-observed structurally similar case can be more informative than an opaque novel result.

Transfer is **necessary but not sufficient** for reliable reasoning: one transferred success does not establish consistency. It must be interpreted with independence, adequate attribution, source validity and accumulated evidence. No particular problem count, context count or universal transfer distance is specified.

## Recency / staleness

Retain what was demonstrated. **Time alone does not lower the capability conclusion or prove forgetting.** Record temporal context to assess whether the evidence supports its use as a current belief:

- relevant current observations can support present applicability; this does not imply strong confidence;
- an identifiable temporal/context gap can justify the qualifier `reconfirmation needed`, while retaining the prior basis and qualifying current confidence;
- unknown timing stays unknown. Do not call an unobserved skill stale.

There is no fixed age threshold. A justified temporal concern can reduce current confidence without replacing an earlier reliable conclusion with a claim of reduced ability. Express that combination as “previously reliable within this scope; current applicability needs reconfirmation,” with its lower confidence and temporal-gap reason. A consumer must not strip that qualifier and treat it as current confirmed reliability.

Older successes still support historical capability. Recent attributable independent work may reconfirm it; recent weakly attributed failure does not outweigh everything merely by being recent. New negative evidence can change the capability conclusion, but then the reason is the demonstrated obstacle or conflict, not elapsed time. Reconfirmation scheduling belongs outside D.2.

## Contradictory evidence

First compare capability obligation, support, source validity, context and reasoning depth. Do not average incompatible episodes or erase one side. A conflict is material when comparable, sufficiently attributable observations support incompatible current conclusions.

| History | Interpretation |
| --- | --- |
| Several old independent successes + two recent failures | Old successes remain demonstrated evidence. If they had supported reliable, comparable attributable failures suspend the unqualified reliable conclusion and leave demonstrated with limited confidence, conflicting-evidence and temporal qualifiers, plus difficulty indicated when a coherent current obstacle is visible. If failure attribution is unresolved, retain the earlier positive conclusion with qualified current confidence. |
| Supported success followed by independent transfer | Usually complementary learning evidence, not contradiction: later evidence extends the independence basis. It does not by itself establish reliability. |
| Independent success followed by repeated failures | Inspect whether the success was narrow/lucky, the failures share a misconception, or demands changed. Retain demonstrated for the established success unless that basis is invalidated; a clear repeated target obstacle adds difficulty indicated and lowers confidence in present repeatability. |
| Easy-context success + harder-context failure | Often a scope boundary rather than a contradiction. Retain demonstrated/reliable only within the evidenced easier demands; broader composition remains unresolved. If the same target operation visibly fails, that local counterevidence still matters. |

The `conflicting evidence` explanation improves the diagnosis: additional volume alone cannot resolve it if all new observations have the same attribution problem. State which claims conflict and what evidence could distinguish the explanations. There is no automatic downgrade count or forced middle stage.

## Difficulty as context

“Easy” and “harder” below require an independently justified contextual description. They are not derived from grade, stage, official number or a universal difficulty scale.

| Result | Interpretation boundary |
| --- | --- |
| Easy success | Supports the visible operation under those demands, not broader reasoning depth. |
| Hard success | May extend the evidenced scope if the target operation itself is demanding and attributable; other skills may account for the overall challenge. |
| Easy failure | May reveal a local gap if reasoning exposes it, but apparent ease does not establish cause or justify a harsher judgment. |
| Harder failure | May concern unfamiliar concepts, composition or workload while simpler capability remains demonstrated. Inspect the target step instead of reducing every component belief. |

Scope can mention representations, constraint interactions, proof obligations or composition. D.2 neither invents a difficulty model nor creates numerical adjustment. Unknown difficulty remains unknown context.

## Multi-skill attribution

Use D.1's attribution reasoning separately for each capability, for positive and negative evidence alike:

- **Directly observed use:** connect the learner's work to the normalized action. A complete partition with an exhaustiveness explanation can support systematic enumeration even if later arithmetic is wrong.
- **Relevant tag only:** indicates an opportunity to observe a skill, not proof it was used; no automatic mastery evidence.
- **Alternative solution paths:** judge the path actually shown. A valid answer reached without equations does not establish quantitative equation modeling merely because the reference solution used it.
- **Unobservable reasoning:** correct final answers may remain unresolved for every tag. Accumulating many such answers does not make their missing reasoning observable.

Source/path verification and learner attribution are different gates. A verified official or author-derived solution cannot substitute for the learner's reasoning. Conditional visual paths cannot become high-confidence evidence through repetition. Partial work may justify a bounded component claim, but not all of a compound capability: a bound alone does not demonstrate the taxonomy's optimality obligation including attainability.

## Foundation vs Reasoning differences

Use **one shared mastery model**. The current taxonomy is an analytical separation, not a prerequisite hierarchy or two kinds of learner state.

| Aspect | Foundation capabilities | Olympiad reasoning skills |
| --- | --- | --- |
| Transfer requirement | Varied independent use beyond a memorized item is still needed for reliability. Bounded operations may be tested through changed relations, quantifiers or representations without demanding distant stories. Quantitative modeling needs genuine model construction in varied situations, not repeated solving of supplied equations. | Meaningful reuse of the proof/search/construction obligation is central. Repetition of one familiar search or proof cannot establish reliability. Cross-story recognition is often informative, not a mandatory domain-count rule. |
| Observability | A learner's equation with named quantities or explicit negation may expose the operation relatively locally. A final number still hides it. | Completeness, universal exclusion and attainability often require a visible argument rather than the final answer. Lack of a recorded explanation is uncertainty, not failure. |
| Composition | Successful representation can be credited despite a later reasoning error. Using a supplied representation does not demonstrate creating it. | Successful components do not automatically demonstrate their combination; optimality cannot be inferred from separate bounding/construction tags. |
| Evidence confidence | Confidence grows from clearly attributed independent variation; Foundation status grants no automatic confidence. | Broad capability definitions and hidden reasoning can limit attribution; repeated well-observed use may resolve this. Category membership itself grants no confidence. |

The same semantic transfer standard applies: reuse beyond remembered reproduction within the capability's scope. The **appropriate variation differs by capability**, not by a blanket lower standard for Foundation. No separate Foundation scoring or stage system is justified by the available evidence.

## What does NOT count as mastery

- No attempts, a skip, or elapsed time: none establishes weakness or forgetting.
- One correct answer: can demonstrate a visible action, not automatically reliability.
- Full-solution exposure followed by immediate reproduction: training activity, not independent capability evidence by itself.
- Many repetitions of one problem: cannot establish transferable reliability.
- Hint use: neither an automatic penalty nor proof of independent selection.
- A transfer label, hard-problem label, official number or simulation mode: no automatic mastery promotion.
- Every skill tag on a solved problem: only attributable actions supply capability evidence.
- A learned method name, exposure, or repeated method use: no `MethodMastery`.

Method exposure, independent method use and supported method use remain contextual observations. They can explain how a capability was demonstrated or which choice was supplied, but method use alone does not prove the capability's obligation. Case analysis can support enumeration; it does not prove completeness unless the learner's work does. No method state or method progression is introduced.

## Semantic transition principles and challenges

These govern reinterpretation of accumulated evidence, not event-triggered transitions or a weighted table.

| Proposed principle | Challenge / limit | v0.1 conclusion |
| --- | --- | --- |
| One success should rarely establish reliability. | One rich response may directly show several operations; dismissing it would lose real evidence. | Accept demonstrated actions. One episode still cannot establish consistency across independent contexts, so it does not establish reliable capability here. |
| Independent diverse evidence strengthens belief. | Independent can mean only “no recorded assistance”; diversity may concern stories but not demands. | Strengthen only to the extent that attribution, validity and relevant variation improve. |
| Meaningful transfer is stronger than memorized repetition. | Repetition may answer retention questions better; a novel problem may have opaque attribution. | Transfer strengthens reuse claims when meaningful and attributable; it does not dominate every evidence purpose. |
| Supported success demonstrates learning without independence. | A single supported success does not prove a change caused by instruction. | It demonstrates supported performance; improvement/learning remains a hypothesis unless a history supports it. |
| Contradiction reduces certainty. | Harder-task failure or an error in another component may not contradict the scoped claim. | Retain established positive use, reduce confidence in current repeatability only for material comparable counterevidence, and add a difficulty qualifier only when the obstacle is attributable. |
| Solution-exposed reproduction cannot establish reliable mastery. | Exposure should not permanently invalidate later evidence. | Immediate reproduction is insufficient; later attributable reconstruction and transfer remain usable with provenance. |
| Stale evidence requires reconfirmation. | No elapsed interval alone proves reduced ability, and age alone may be uninformative. | Mark temporal uncertainty when justified, without automatic capability loss or a schedule. |
| Absence of evidence stays unknown. | An abandoned task can contain substantial assessable work. | Distinguish absent evidence from visible partial work; stopping alone supplies no negative conclusion. |

## Scenario audit — A–H

Scenarios are analytical stress tests, not observations of real learners. Unless stated otherwise, assume responses and source material are assessable, the target action is visible, and “current” refers to the recent episode. Where the scenario does not establish these conditions, the alternative is explicit. Problem counts below are scenario facts, never thresholds. Additional evidence describes an information gap, not a next-problem recommendation.

| Scenario | Current mastery interpretation | Confidence and separate basis | Unresolved uncertainty | Most informative additional evidence |
| --- | --- | --- | --- | --- |
| **A. One independent first-attempt success; no prior evidence** | **Demonstrated** within the observed operation/context. If only the final answer is visible and attribution is unresolved, **unknown / insufficient positive evidence** for the skill. | **Limited** under visible attribution; independent evidence with current timing and transfer unestablished. Unknown alternative: unavailable confidence. | Consistency, guessing/hidden path, independent recognition elsewhere. | Further attributable independent use under meaningful variation, including an explanation of the target action. |
| **B. Three different problems, all after strategy hints** | **Demonstrated under support**, not reliable independent capability. If hints supplied each missing direction, selection remains unresolved. | **Supported** for consistent supported execution if the work is comparable and visible. Materially supported unless the hints merely confirmed learner-generated strategies; current timing is known. Different problems do not establish independent transfer. | What each hint introduced; whether support is actually necessary; whether the observed execution spans the full capability. | Work showing the learner's direction before a hint and attributable performance without supplied strategy. |
| **C. Original solved with help; later different-story transfer independently solved** | **Demonstrated**, now with meaningful independent transfer, assuming the shared obligation is verified and visible. Not reliable from that later success alone. | **Limited** for independent reuse because there is only one independent demonstration; original supported work remains positive context and later timing is known. | Stability of independent recognition, whether story change genuinely required reconstruction. | Further independent, attributable reuse that exposes the same obligation under another relevant variation. |
| **D. Three old independent successes; months later two recent failures** | **Demonstrated** from the old successes. If they had supported reliable and recent failures are comparable/attributable, suspend unqualified reliable and add **difficulty indicated** for any visible repeated obstacle. | **Limited** confidence in current repeatability; temporal gap, conflicting evidence and, where warranted, reconfirmation needed are explanatory qualifiers. If failures are not attributable, retain the established positive conclusion with that limitation. | Forgetting, changed demands, transient error, and attribution remain competing explanations. | Visible reasoning locating the failed action, plus comparable independent evidence capable of confirming or contradicting that explanation. |
| **E. Full solution viewed; immediate reproduction; one week later same problem independently solved** | **Demonstrated reconstruction in the known problem** if later work exposes reconstructed reasoning. Immediate reproduction alone contributes no independent demonstration. If later evidence is only a recalled answer, **unknown / insufficient positive evidence** remains possible. | **Limited**; later episode independent but with exposure provenance and memory risk; timing is known; no transfer. One week is not a cleansing threshold. | Whether reasoning was reconstructed or memorized, and whether it is reusable. | Attributable independent reuse beyond the remembered problem, exposing the reasoning obligation. |
| **F. Several same-problem successes, no transfer** | **Demonstrated in the known problem**, assuming visible valid reasoning; not reliable transferable capability. | **Supported** for stable execution in that context; independent status only if episodes support it. Confidence in generalization remains limited; currency is undetermined if timing is not supplied. | Shared memory, independent selection and scope beyond the item. | Evidence of independently recognized reuse under changed demands, with timing and assistance known. |
| **G. Independent harder-problem success, three tags, only one clearly attributable** | **Demonstrated** for that one capability in the visible context. With no other history, the other two remain **unknown / insufficient positive evidence**; existing beliefs about them are unchanged. | **Limited** for the one capability despite clear attribution; **unavailable** for the other two absent prior evidence. Independent evidence has known timing; composition is observed only as far as the work exposes it. | Whether the target action itself was harder, which alternative path bypassed or concealed other tags, and consistency. | Further attributable use of the visible action; observable work that distinguishes the other actions if claims about them are needed. |
| **H. No attempts or other skill evidence** | **Unknown / no observations**. No difficulty qualifier. | **Unavailable**; independence and transfer not observed; temporal context unknown. | Entire capability belief is open. | An assessable opportunity revealing the action, with support and attribution context. |

A–H mostly test why reliability must be withheld or qualified. A positive control is a history of consistent, well-attributed independent use across genuinely different demands, including meaningful transfer, with current relevant evidence and no unexplained comparable failures: **reliable / strong**, restricted to the demonstrated scope and accompanied by its temporal context. This does not imply success on every novel composition.

## Inputs from Learning Evidence

D.2 consumes interpreted episodes and their provenance, not just terminal outcomes:

- Correct, incorrect, partially correct and unverifiable/manual-review outcomes, with the visible target operation and limits of the checker.
- Attempt/retry sequence, hint content and timing, work before help, solution exposure timing, delayed reconstruction and dependencies between episodes.
- D.1 independence descriptors per relevant operation, including mixed support within one problem.
- Attribution reasoning and uncertainty; actual solution path, source/visual verification and alternative paths.
- Transfer context and why it represents reuse; prior related problem/exposure context when known.
- Temporal context, any justified contextual difficulty description, and training versus simulation conditions.
- Qualitative positive/negative/unresolved evidence interpretations, retaining their rationale rather than turning them into mastery weights.
- Method exposure/use as context, and evidence both supporting and challenging the accumulated belief.

An episode interpretation may be revised when its source, checking or attribution is corrected. The accumulated belief must then be reconsidered against the revised evidence; a previous label must not become independent evidence for itself. No event-storage or recomputation implementation is prescribed.

## Explainability and traceability

Every conclusion must be traceable to the observations and interpretive reasons supporting it, relevant counterevidence, capability definition, scope and remaining gaps. A previous summary cannot replace the supporting evidence. Preserve why an episode was included, excluded or treated as uncertain, including exposure and attribution limits.

Examples of domain explanations, not UI copy:

- **Why difficulty is indicated:** distinct attributable attempts omit an admissible class even after the task conditions are clarified; the obstacle concerns completeness, while correct individual cases remain positive evidence. If the work does not expose that omission, the system cannot justify this explanation.
- **Why reliable is defensible:** independent work repeatedly defines exhaustive, non-overlapping cases under changed demands, including meaningful reuse; the relevant operation is visible and comparable recent evidence does not contradict it. The conclusion is restricted to those kinds of demands.
- **Why confidence is limited:** independent reuse was observed once after earlier supported work; transfer is positive but consistency is still unobserved.

Reject opaque numerical precision and explanations derived only from counts, hint penalties or tags. If the system cannot supply a supported reason that a skill needs work, represent uncertainty instead of manufacturing a weakness.

## Outputs needed by future Recommendation Model

OT-001D.3 needs the **qualified belief**, not a rank or a next task:

1. Named capability and its provisional definition/scope, including Foundation/Reasoning context without treating category as level.
2. Capability conclusion and explicit unknown reason when applicable.
3. Separate confidence and the reasons limiting or supporting it.
4. Independence and assistance pattern, including what was demonstrated with help versus without it.
5. Transfer basis and unestablished coverage, including same-problem exposure/repetition dependencies.
6. Temporal context and uncertainty; any retained historical reliable basis must remain distinguishable from current confirmation.
7. Attribution/source validity limits, conflicting evidence and the action/context of any difficulty qualifier.
8. Traceable supporting and counterevidence, plus the kinds of missing information that would clarify the belief.

D.3 must be able to distinguish “no established positive evidence,” “supported execution,” “demonstrated independent use with sparse evidence,” “reliable within scope,” and “demonstrated capability with current difficulty evidence” without treating them as one weak-to-strong score. These outputs express information needs, not ordering, task selection, difficulty adjustment, review intervals or recommendation priorities. Those policies are explicitly deferred.

## Answers to the task questions — Recommendation

1. **Numeric score?** No; no calibration or decision need justifies it in v0.1.
2. **Smallest useful representation?** A qualitative capability conclusion, separate confidence, scope, and a concise traceable evidence basis with relevant diagnostic and temporal qualifiers.
3. **Separate mastery and confidence?** Yes; similar observed capability can rest on sparse or diverse evidence.
4. **Meaningful transfer for reliable reasoning?** Yes, beyond repetition, alongside consistency, independence and attribution; transfer alone is insufficient.
5. **Supported success?** Positive evidence for the supported action and possible learning response, without automatically demonstrating independent selection or causing a penalty.
6. **Contradiction?** Preserve both sides, inspect comparability, retain established positive use, reduce confidence in current repeatability when warranted, and add difficulty indicated only for an attributable obstacle.
7. **Old evidence?** Retain the capability basis; record temporal context and qualify current confidence when justified. Time alone does not establish forgetting or downgrade capability.
8. **Shared Foundation/Reasoning model?** Yes; use capability-appropriate variation and observability, not separate states or scores.
9. **Unknown?** No established attributable positive use, with no-observation or insufficient-positive-evidence reason. Never a synonym for weak; it can coexist with an attributable difficulty qualifier.
10. **D.3 information?** The qualified positive belief, scope, confidence, assistance, transfer, temporal context, attribution, diagnostics, evidence references and unresolved information needs listed above.

## Verification gaps and open questions

- No learner histories validate these state boundaries, confidence vocabulary or ability to distinguish true transfer from remembered templates. A–H and the positive control are conceptual checks only.
- Can reviewers consistently distinguish narrow demonstrated performance from a generalizable capability, especially for broad constraint coordination and compound optimality?
- What observable work is sufficient for attribution without requiring full proof review? Final-answer-only formats may legitimately leave many beliefs unknown.
- What variation is meaningful for each capability, and which temporal/context gaps actually justify reconfirmation? No universal threshold is adopted.
- Can short explanations preserve support and scope without consumers mistakenly reading demonstrated as independent or historical reliable as current? This domain contract requires those qualifiers; product presentation remains separate.
- The abandonment inconsistency in D.1 needs a separately authorized clarification. D.2 explicitly excludes stopping alone from negative capability inference.
- Human adoption of the recommended model remains open before dependent implementation. Research completion does not resolve taxonomy validity, product policy or architecture approval.

## Self-review and completion

| Risk | Check in this proposal |
| --- | --- |
| False numeric precision | Numeric option rejected; no weights, percentages, thresholds, transfer score or decay formula. |
| Missing evidence treated as weakness | Unknown reasons and scenario H explicitly prevent it. |
| One success treated as mastery | A and C permit demonstrated, not reliable; positive control requires an accumulated pattern. |
| Hint penalties / automatic transfer promotion | Actual assistance and attribution determine the claim; transfer is insufficient alone. |
| Time treated as forgetting | Temporal context/current confidence can change without lowering historical capability. |
| All tags receive evidence | G and the multi-skill boundary restrict attribution to observable actions. |
| Method exposure becomes mastery | All method observations remain contextual; no MethodMastery. |
| Recommendation logic leakage | D.3 receives belief and information gaps, with no next-problem, priority or scheduling policy. |
| DB/API or implementation leakage | Semantic vocabulary only; no schemas, endpoints, software changes or infrastructure. |

Validation: document consistency, local reference targets, the revised three-conclusion/diagnostic separation, required sections/scenarios and the authorized file scope were checked; `git diff --check` and a new-file whitespace check passed. No application tests apply to this documentation-only change. Empirical learner validation remains unperformed.

**READY** — reviewable research/domain proposal, not an adopted architecture decision or authorization for OT-001D.3 implementation.

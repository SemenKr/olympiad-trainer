# Skill Taxonomy — v0.1

## Purpose and handoff context

- **Task ID:** OT-001C.3
- **Revision:** branch `docs/ot-001c-skill-taxonomy`, base commit `b805a08`; the working tree was clean before this document was created.
- **Goal:** normalize the OT-001C.1 candidates using the independent pressure test from OT-001C.2.
- **Scope:** a provisional domain model of capabilities and methods for future training research.
- **Out of scope:** a final taxonomy, hierarchy, concept taxonomy, mastery model, student curriculum, or software design.
- **Inputs:** `candidate-skill-inventory.md`, `skill-taxonomy-validation.md`, and `problem-content-audit.md`.
- **Constraints:** preserve the distinction between official source facts and our interpretation; do not infer progression from grade or task number; prefer a compact model and keep uncertainty explicit.
- **Definition of Done:** every original and provisional candidate has one normalization decision; the proposed taxonomy is traceable to problem evidence and its limitations are stated.
- **Allowed actions:** create this research document only.
- **Status:** READY as a research proposal; adoption remains a later project decision.

This document is discovery output, not an official VSOSh classification. Problem IDs, formats, and task content are observed from the cited audit sources. Categories, capability boundaries, decisions, and recommendations below are Olympiad Trainer interpretations.

## Evidence and limitations — Observed fact

OT-001C.1 extracted 18 candidate skills from ten Grade 5 problems: S-02, S-03, S-04, S-05, S-06, S-08, I-01, I-02, I-05, and I-08. OT-001C.2 tested those candidates against twelve further problems: G5S-1, G5S-2, G5S-4, G5S-7, G6S-1, G6S-4, G6S-6, G6S-8, G6I-3, G6I-4, G6I-6, and G6I-8.

Only OT-001C.2 evidence marked `VERIFIED` is treated as independent validation. `CONDITIONAL` and `PLAUSIBLE` paths inform open questions but do not establish transfer. In particular, unresolved visual paths in G5S-2 and G6S-4 and the source ambiguity in G6I-8 do not support normalization claims.

The strongest independent transfer evidence concerns coordinating constraints and systematic enumeration (seven verified validation problems each), global impossibility (three), local exclusion (two), and constructing numerical configurations (two). Absence of new evidence does not invalidate a candidate, and evidence frequency does not by itself show that wording or granularity is correct.

The evidence describes demands made by problems. It does not show that two capabilities are separable in learner performance, that teaching one transfers to another, or that a capability progresses predictably by age.

## Modeling hypothesis — Interpretation

### Alternatives considered

1. **One flat skill list, with methods beside it.** This avoids a disputed boundary between foundation and olympiad reasoning, but it obscures whether a training weakness concerns mathematical representation or the reasoning obligation built on it.
2. **Foundation capabilities + olympiad reasoning skills + methods.** This preserves a useful diagnostic distinction while keeping concepts orthogonal. Its weakness is that a task often composes both capability groups, and a strategy such as construction can name both an observable performance and a method.
3. **Domain-specific skill lists.** This makes content matching easy, but the current sample would produce many single-problem entries and would hide transfer across arithmetic, geometry, logic, and combinatorial stories.

The evidence supports alternative 2 as the smallest useful working model, with two qualifications. First, the two capability groups are analytical views, not a hierarchy: a problem may require several items from both. Second, category boundaries remain provisional. A foundation capability is an observable operation on mathematical content; an olympiad reasoning skill is an observable proof, search, or construction obligation that transfers across content. A method is a possible strategy and is not a mastery skill by default.

The model breaks or becomes uncertain in three places:

- geometry entries currently have little independent evidence, so some may later prove to be concepts plus methods rather than stable capabilities;
- construction names both a required outcome and a possible strategy; the proposed boundary depends on whether the student must produce and verify a witness;
- completeness, exclusion, and impossibility may form depth relationships, but the problem sample cannot establish a learner-facing hierarchy.

Concepts such as product, divisibility, area, and perimeter remain separate from the action a student performs with them. Methods such as contradiction, case analysis, and decomposition remain separate from the proof obligation they can help discharge.

## Candidate decisions — Recommendation

Each candidate receives exactly one decision. `KEEP` and `BROADEN` place a capability in the proposed v0.1; `MERGE` points to another normalized capability; `RECLASSIFY` moves the item out of the capability list; `DEFER` preserves the hypothesis without promoting it.

| Candidate | Category | Decision | Normalized capability | Evidence summary | Reason |
| --- | --- | --- | --- | --- | --- |
| Формулировать отрицания утверждений | foundation capability | KEEP | Формулировать логические отрицания | S-02; G6I-3 verified | Distinct box-label and relationship-constraint problems require the same observable logical transformation. Its boundary from elimination and contradiction is explicit, so it satisfies the general inclusion rule. |
| Согласовывать несколько ограничений | olympiad reasoning skill | KEEP | Согласовывать несколько ограничений | S-02, S-05, S-08, I-08; seven verified validation problems | Strong transfer evidence and high diagnostic value. It remains broad, but the sample does not justify a useful decomposition. |
| Исключать несовместимые варианты | olympiad reasoning skill | KEEP | Исключать несовместимый вариант по нарушенному условию | S-02, S-03, S-08; G5S-1 and G5S-4 verified | The student must identify a particular candidate and the condition it violates; that obligation is narrower than a global impossibility proof. |
| Прослеживать соседство частей в пространственной модели | unresolved | DEFER | — | S-03; no verified independent evidence and an inherited visual gap | The wording is plausible and diagnostic, but the available evidence does not establish the relevant spatial path well enough for v0.1. |
| Связывать повторение позиции с длиной цикла | unresolved | DEFER | — | S-04 only; G5S-4 is not transfer evidence | It may be a legitimate specialized capability, a periodicity method applied to a concept, or wording that is too tied to one representation. More varied evidence is required. |
| Подбирать множители для равных произведений | unresolved | DEFER | — | S-05 only; no verified independent evidence | The observed action remains tied to one equal-product construction. Its reusable diagnostic boundary is not yet established. |
| Строить конфигурацию, удовлетворяющую ограничениям | olympiad reasoning skill | BROADEN | Строить и проверять допустимую конфигурацию | S-05, I-08; G6S-8 and G6I-6 verified for numerical configurations | Adding verification and allowing numerical, geometric, or relational objects preserves a constructive proof obligation without becoming generic problem solving. Non-numerical transfer still needs testing. |
| Определять площадь фигуры по сетке | unresolved | DEFER | — | S-06; no verified independent validation and an inherited visual gap | The capability depends on geometric details that remain unverified, so it does not meet the v0.1 inclusion rule. |
| Разлагать геометрическую фигуру на удобные части | method | RECLASSIFY | Декомпозиция и перестроение | S-06 candidate path; G6I-4 verified worked path | In this evidence it describes a chosen solution strategy, while the resulting measurement or bound is the diagnostic obligation. It is carried as a PROVISIONAL method because some supporting geometric paths remain incomplete. |
| Переводить расстояния в разности позиций | unresolved | DEFER | — | S-08 only; G5S-7 is a different motion model | The candidate may be useful for ordered-position problems, but the current wording and transfer boundary are not established. |
| Систематически перебирать допустимые случаи | olympiad reasoning skill | KEEP | Систематически перебирать случаи и обосновывать полноту | S-08 and candidate paths in S-02/S-05; seven verified validation problems | A systematic enumeration must define admissible cases, avoid duplication, and show that none are omitted. Completeness is treated as a deeper application of the same skill, not a separate entry. |
| Находить и считать общие кратные в заданных границах | unresolved | DEFER | — | I-01 only; no verified independent validation | The candidate combines deriving divisibility conditions, identifying common multiples, and counting within a range. One problem does not establish whether these are one diagnostic capability, and the evidence does not support a narrower replacement yet. |
| Выделять границу фигуры для вычисления периметра | unresolved | DEFER | — | I-02 only; no new perimeter test and an inherited visual gap | Boundary identification may be useful, but its exact action depends on unverified visual details and lacks independent transfer evidence. |
| Обосновывать сохранение длины при преобразовании границы | method | RECLASSIFY | Декомпозиция и перестроение | I-02; inherited segment-matching verification gap | The wording encodes a specific boundary-transformation argument. It is carried as PROVISIONAL method evidence, not as an independently validated mastery skill. |
| Обосновывать гарантированный результат при неблагоприятном выборе | olympiad reasoning skill | KEEP | Обосновывать гарантированный результат при неблагоприятном выборе | I-05; no verified independent validation | The universal guarantee obligation is reusable and diagnostically different from finding one favorable construction; lack of transfer evidence lowers confidence but does not make the definition poor. |
| Доказывать минимальность через предельный неудачный пример | olympiad reasoning skill | BROADEN | Доказывать оптимальность через границу и свидетельство достижимости | I-05; related but non-equivalent pressure in G6I-4 and G6I-6 | The original is tied to minimum guarantees. The broader formulation captures the reusable proof obligation: establish a bound and provide the appropriate attaining or limiting witness. It is a compound capability to revisit with learner evidence. |
| Устанавливать границы суммы при ограничениях | olympiad reasoning skill | BROADEN | Устанавливать границы величины при ограничениях | I-08; related validation paths remain partial | Restricting the wording to sums is unnecessarily narrow. The retained obligation is to derive a justified bound from constraints, not merely calculate a value. |
| Доказывать невозможность через несовместимость ограничений | olympiad reasoning skill | KEEP | Доказывать глобальную невозможность через ограничения | I-05, I-08; G6I-3, G6I-4, and G6I-6 verified | Several stories support the global proof obligation: eliminate every admissible candidate or an entire class. This is diagnostically distinct from rejecting one local option. |
| Переводить количественные связи в выражения и уравнения | foundation capability | KEEP | Переводить количественные связи в выражения и уравнения | Author-worked paths in the distinct motion and redistribution stories G5S-7 and G6S-6; optional path in G6S-8 | The repeated action is observable across different stories and has a clear boundary from checking an already supplied model. Identification of quantities, translation of relations, and preservation of meaning remain possible future components rather than separate v0.1 skills. |
| Обосновывать полноту подсчёта | olympiad reasoning skill | MERGE | Систематически перебирать случаи и обосновывать полноту | G6I-8 remains conditional; enumeration has seven verified validation problems | Current evidence supports option B: completeness is a deeper application of systematic enumeration. It may become diagnostically distinct later if learner evidence shows separate failure patterns. |

### Systematic enumeration and counting completeness

The proposed decision is **B: completeness is a deeper application of the same skill**. A list is systematic only when the student can explain its coverage and non-overlap. This preserves diagnostic information in the definition without creating a second skill from one unresolved source path. If future learner work shows students can generate cases reliably but cannot prove coverage, that would support revisiting option C.

One-to-one correspondence remains a candidate method for proving completeness. It is not the skill itself. Exhaustive non-overlapping partition and other coverage arguments may discharge the same obligation.

### Local exclusion and global impossibility

The proposed decision is **C: two related but diagnostically distinct skills**. Local exclusion requires a witness that one candidate violates at least one condition. Global impossibility requires coverage: every admissible candidate, or an entire class, must be eliminated. A student may perform the first repeatedly without justifying that the search is exhaustive, so merging them would hide a meaningful proof gap. The evidence does not establish an ordered hierarchy between them.

### Constraint coordination

`Согласовывать несколько ограничений` remains a core reasoning skill. Its seven verified validation problems span different stories, but high frequency does not prove its scope. Decomposition into maintaining state, propagating consequences, or resolving conflicts would currently add distinctions unsupported by learner evidence. The broad entry should be revisited during diagnostic validation.

### Configuration construction

The normalized wording covers producing a concrete numerical, geometric, or relational object and checking it against all stated constraints. It does not cover every constructive step or generic problem solving. Evidence for numerical configurations is verified; transfer to geometric and relational configurations remains a validation need.

### Quantitative modeling

`Переводить количественные связи в выражения и уравнения` enters as a foundation capability. It can support motion, redistribution, and count-total problems before an olympiad reasoning method is selected. The current sample does not justify splitting recognition of quantities, translation, and semantic checking into separate capabilities.

### Specialized candidates

Low frequency is not used as evidence of poor definition. Product constraints, common-multiple work, grid area, perimeter-boundary work, cyclic-position reasoning, distance-to-position translation, and spatial adjacency all remain research candidates. They are deferred consistently because their current scope, transfer evidence, or verification state does not meet the v0.1 inclusion rule. The failed-example candidate is broadened because its proof obligation plausibly generalizes to maximum and minimum tasks, not because it appeared only once.

## v0.1 inclusion rule — Recommendation

A capability enters the current v0.1 reference only when it is observable, has clear diagnostic value, has a sufficiently defined scope and boundary, and does not depend on an unresolved verification gap. For a specialized capability, the available evidence must also support reuse beyond one narrowly specific task, or multiple independent `VERIFIED` examples must support the capability. Low frequency alone does not disqualify a capability, and this is a qualitative boundary rather than a score. `DEFER` means that the item remains a research candidate; it is not rejected and may return after targeted evidence resolves its transfer, granularity, or verification gap.

Logical negation passes this rule because S-02 and verified G6I-3 require the same bounded transformation in distinct stories, with a clear boundary from later elimination or contradiction. Quantitative modeling passes provisionally because explicit author-worked paths in motion and redistribution show the same model-building action across distinct stories; its boundary stops at creating a meaningful representation and does not include solving the whole problem. Product constraints, common-multiple work, grid area, perimeter-boundary identification, spatial adjacency, cyclic positions, and distance-to-position translation do not yet pass the same threshold and remain visible as deferred candidates.
## Normalized taxonomy — Recommendation

This is the smallest useful v0.1 that passes the inclusion rule. Deferred content capabilities remain explicit research targets, so their absence from the current reference is not evidence that geometry or number work is unimportant.

## Foundation capabilities

### Формулировать логические отрицания

**Definition:** Translate a statement into a logically correct negation while preserving its conditions and quantifiers.

**Evidence:** S-02; G6I-3.

**Diagnostic value:** Weakness suggests that later elimination may be based on a changed or incomplete condition.

**Boundary:** This is the logical transformation itself, not systematic search or proof by contradiction.

**Confidence:** medium.

### Переводить количественные связи в выражения и уравнения

**Definition:** Represent named quantities and their relationships with expressions or equations without losing their meaning.

**Evidence:** G5S-7, G6S-6, and an optional path in G6S-8 through explicit worked arguments in OT-001C.2.

**Diagnostic value:** Weakness suggests the student cannot yet turn a verbal quantitative situation into a form that later arithmetic reasoning can use.

**Boundary:** This concerns representation, not solving every resulting equation or choosing the complete olympiad strategy.

**Confidence:** medium.

## Olympiad reasoning skills

### Согласовывать несколько ограничений

**Definition:** Maintain several conditions together and propagate their consequences without satisfying one by violating another.

**Evidence:** S-02, S-05, S-08, I-08; G5S-1, G5S-4, G6S-1, G6S-8, G6I-3, G6I-4, G6I-6.

**Diagnostic value:** Weakness suggests the student reasons from conditions independently but loses their interaction.

**Boundary:** This is not a domain or a named method; enumeration, elimination, and construction may all use it.

**Confidence:** high.

### Исключать несовместимый вариант по нарушенному условию

**Definition:** Reject a particular candidate or configuration by identifying a condition it violates.

**Evidence:** S-02, S-03, S-08; G5S-1, G5S-4.

**Diagnostic value:** Weakness suggests the student can inspect candidates but cannot connect a rejection to explicit evidence.

**Boundary:** This local proof obligation does not establish that every candidate fails.

**Confidence:** medium.

### Систематически перебирать случаи и обосновывать полноту

**Definition:** Organize admissible cases without omissions or duplication and justify why the enumeration is complete.

**Evidence:** S-08 and candidate paths in S-02/S-05; G5S-1, G5S-4, G6S-1, G6S-8, G6S-6, G6I-3, G6I-6.

**Diagnostic value:** Weakness distinguishes an unsupported list of examples from a complete search.

**Boundary:** Case analysis is a method; one-to-one correspondence is one possible completeness argument.

**Confidence:** high.

### Строить и проверять допустимую конфигурацию

**Definition:** Produce a concrete configuration and verify that it satisfies every required condition.

**Evidence:** S-05, I-08; G6S-8, G6I-6.

**Diagnostic value:** Weakness shows whether failure lies in finding a witness or in checking it against all constraints.

**Boundary:** The skill is the verified result; construction is also a method when it is merely the chosen route to another result.

**Confidence:** medium.

### Устанавливать границы величины при ограничениях

**Definition:** Derive a justified upper or lower bound on a quantity from the given constraints.

**Evidence:** I-08; related paths in G6S-8, G6I-3, and G6I-6 remain partial.

**Diagnostic value:** Weakness suggests the student can compute examples but cannot restrict the whole admissible range.

**Boundary:** This is a bound, not yet a proof that the bound is attainable or optimal.

**Confidence:** low.

### Доказывать оптимальность через границу и свидетельство достижимости

**Definition:** Prove a claimed minimum or maximum by establishing a bound and supplying an attaining or limiting witness.

**Evidence:** I-05; related optimization pressure in G6I-4 and G6I-6.

**Diagnostic value:** Weakness reveals whether the student has only a candidate answer, only a bound, or a complete optimality argument.

**Boundary:** This compound proof obligation uses, but does not replace, bounding and construction capabilities. Current evidence does not establish whether bounding and attainability are diagnostically separable; that remains a future validation question.

**Confidence:** low.

### Обосновывать гарантированный результат при неблагоприятном выборе

**Definition:** Show that a stated outcome must occur for every allowed adverse selection or arrangement.

**Evidence:** I-05.

**Diagnostic value:** Weakness suggests confusion between an outcome that can occur and one that must occur.

**Boundary:** Worst-case reasoning and the pigeonhole principle are possible methods; the skill is the universal guarantee.

**Confidence:** low.

### Доказывать глобальную невозможность через ограничения

**Definition:** Prove that every admissible candidate, or an entire class of candidates, fails the constraints.

**Evidence:** I-05, I-08; G6I-3, G6I-4, G6I-6.

**Diagnostic value:** Weakness suggests the student can reject examples but cannot close all remaining possibilities.

**Boundary:** It is distinct from local exclusion and may use contradiction, exhaustive cases, or bounds.

**Confidence:** high.

## Methods

Methods are recognizable solution strategies, not mastery skills by default. Several may solve the same problem, and a method may support more than one reasoning skill. `RETAINED` means the inspected evidence supports reuse as a strategy; `PROVISIONAL` marks limited, incomplete, or merely plausible method evidence. These labels are evidence statuses, not mastery levels. Local elimination is represented by the reasoning capability `Исключать несовместимый вариант по нарушенному условию`; a duplicate method is not retained because it did not describe a materially different strategy.

### Разбор случаев

**Status:** RETAINED.

**What it is:** Partition the admissible space into cases and analyze each one.

**Evidence:** S-02, S-05, S-08, I-08 and multiple validation problems; not every listed problem requires this as the only route.

**May support:** systematic enumeration, constraint coordination, and global impossibility.

### Противоречие

**Status:** RETAINED.

**What it is:** Assume a candidate claim or configuration and derive an incompatible consequence.

**Evidence:** I-08 and candidate solution paths in G6I-3, G6I-4, and G6I-6.

**May support:** global impossibility and optimality proofs.

### Конструкция

**Status:** RETAINED.

**What it is:** Build a witness that meets the required properties.

**Evidence:** S-05, I-08, G6S-8, and G6I-6; visual construction paths in G5S-2 and G6S-4 remain plausible rather than verified.

**May support:** configuration construction, attainability, and disproof by counterexample.

### Периодичность

**Status:** RETAINED.

**What it is:** Represent repeated states or positions through a cycle.

**Evidence:** S-04 and I-01.

**May support:** systematic enumeration and deriving divisibility conditions.

### Декомпозиция и перестроение

**Status:** PROVISIONAL.

**What it is:** Split or rearrange a figure or quantity into parts whose relevant measure can be controlled.

**Evidence:** candidate path in S-06, boundary transformation in I-02, and a verified worked path in G6I-4.

**May support:** area measurement, perimeter reasoning, bounds, and optimality.

### Рассуждение от худшего случая

**Status:** PROVISIONAL.

**What it is:** Analyze the least favorable allowed sequence or selection to establish a guarantee.

**Evidence:** I-05.

**May support:** guaranteed outcomes and optimality.

### Принцип Дирихле

**Status:** PROVISIONAL.

**What it is:** Derive a forced repetition or occupancy from distributing more objects than available classes allow.

**Evidence:** candidate interpretation around I-05; other valid methods may exist.

**May support:** guaranteed outcomes and impossibility.

### Однозначное соответствие

**Status:** PROVISIONAL.

**What it is:** Pair counted objects with another collection so that each object occurs exactly once.

**Evidence:** proposed but unverified completeness path for G6I-8.

**May support:** proving completeness or equality of counts. It remains a low-confidence method candidate, not an established skill.

## Concept families

The current evidence identifies concept families without defining a concept taxonomy:

- quantities and operations: sums, products, factors, bounds, equations;
- number properties: divisibility, common multiples, parity, primality;
- geometry and measurement: area, perimeter, grid, boundary, adjacency;
- order and structure: position, distance, cycle, route, arrangement;
- logical relations: statements, negation, compatibility, universal and existential conditions;
- counting and selection: cases, frequency, guaranteed selection.

These families describe mathematical content. They do not replace observable capabilities, and their internal organization is future work.

## Grade 6 pressure — Interpretation

The Grade 6 sample adds concepts such as parity, primality, graph-like routes, and prefix frequency. It also places pressure on composing bounds, exhaustive search, construction, and class-wide rejection. This supports cross-content transfer for several reasoning skills and motivates the quantitative-modeling foundation capability.

It does not establish formal age progression. The apparent increase in composition or proof depth may reflect the selected problems, stages, or solution paths. Temporal-state reasoning remains a potential gap because the relevant G6I-8 source interpretation is conditional.

## Student-facing curriculum note

The internal taxonomy is not a set of final student-facing labels. A capability such as `обосновывать гарантированный результат при неблагоприятном выборе` might later be introduced to a learner with language such as `Как гарантировать результат`, but labels and instructional sequences require separate curriculum and learner testing.

## Open questions

- Can learner work distinguish constraint coordination from the component acts of maintaining state, propagating consequences, and resolving conflicts?
- Do students fail local exclusion and global impossibility independently, or are these reliably increasing depths of one capability?
- Does completeness of enumeration show a separable diagnostic failure pattern, despite remaining merged in v0.1?
- Does construction transfer from numerical witnesses to geometric and relational configurations?
- Are grid area and perimeter-boundary identification stable capabilities, or better modeled later through concepts plus measurement skills?
- Should product constraints, common multiples, grid area, perimeter-boundary identification, cyclic positions, distance-to-position translation, and spatial adjacency return as specialized capabilities after broader validation?
- Can the optimality capability be diagnosed as one unit, or should bounding and attainability remain separate and merely composed?
- Which methods improve learning outcomes, rather than merely appearing in official or author-derived solutions?
- How should the taxonomy change when validated against learner attempts, common errors, and teaching interventions?
- What progression, if any, is supported across ages, grades, and stages once a broader controlled sample is available?

## Final recommendation

1. **Does the evidence support Foundation + Reasoning + Methods?** Yes, as a lightweight analytical separation rather than a hierarchy. It improves diagnosis and prevents methods from silently becoming skills, while allowing problems to compose categories.
2. **What enters v0.1?** Two foundation capabilities and eight olympiad reasoning skills listed above, with confidence attached to each. Specialized content candidates remain deferred until they satisfy the same qualitative inclusion rule.
3. **What remains deferred?** Product constraints, common-multiple/divisibility work, grid-area measurement, perimeter-boundary identification, spatial adjacency, position-cycle reasoning, and distance-to-position translation. Counting completeness is preserved inside systematic enumeration rather than deferred as a separate entry.
4. **What changed from the original inventory?** Configuration construction, sum bounds, and optimality were broadened. Product reasoning, divisibility/common-multiple work, grid area, and perimeter-boundary identification were deferred under the common inclusion rule. Counting completeness was merged into systematic enumeration. Geometric decomposition and boundary transformation were reclassified as methods. Local exclusion and global impossibility remain distinct, and elimination is not duplicated as a method.
5. **Is this stable enough for the Learning Model phase?** Yes, as v0.1 research input with explicit confidence and deferred items. The Learning Model should treat these as hypotheses and preserve validation gates for diagnostic separability, learner performance, teaching effectiveness, and age progression.

The recommendation does not make the taxonomy final. Its next evidence should come from learner behavior and deliberately selected transfer problems, especially for low-confidence and deferred capabilities.

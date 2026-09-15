# Skill Taxonomy Validation — OT-001C.2

## Purpose and handoff context

Stress-test the 18 hypotheses in [Candidate Skill Inventory v0.1](candidate-skill-inventory.md) against 12 additional problems. This is discovery research, not a final taxonomy, hierarchy, schema, mastery model or curriculum decision. Failure to capture a capability matters more than maximizing apparent coverage.

- Task ID: OT-001C.2.
- Revision: docs/ot-001c-skill-taxonomy at 59f396e0cbaf029776bb6e700888b3121b0d73f1; working tree clean before research.
- Goal: independent Grade 5–6 validation of the current inventory.
- Scope / Allowed actions: read the existing audit and inventory; create only this document.
- Out of scope: changing existing research, final taxonomy/hierarchy, DB/schema/types, mastery, UI, application code, commits and publication.
- Inputs: [OT-001B audit](problem-content-audit.md), current inventory and the three source PDFs below.
- Constraints: short descriptions, provenance separate from interpretation, visual inspection before visual claims, no assumed unique method.
- Definition of Done: 12 problem analyses, all-18 evidence matrix, mismatch tests, answers to the eight research questions, explicit gaps and self-review.
- Status: READY for review within the verification limits below.

All coverage ratings, skill judgments and decisions below are our provisional interpretation, never official VSOSh metadata. “Decision” means a research recommendation, not permission to change the inventory.

## Evidence base — Observed fact

Research date: 2026-09-15. Page numbers below are one-based PDF pages.

| Source | Official publication | Selected evidence |
| --- | --- | --- |
| G5S | [School 2024/25, Moscow, Grade 5 — tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/tasks-math-5-sch-msk-24-25.pdf) | Tasks 1, 2: p. 1; tasks 4, 7: p. 2 |
| G6S | [School 2025/26, Moscow, Grade 6 — answers](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/school/math/sol-math-6-sch-msk-25-26.pdf) | 1.1: p. 1; task 4 common pieces: p. 4, 4.1: p. 5; 6.1: p. 10; 8.1: p. 12 |
| G6I | [Invitational 2025, Moscow, Grade 6 — solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-6-prigl-msk-25-26.pdf) | Task 3, variant 1: pp. 1–2; task 4, variant 1: p. 2; task 6, variant 1: p. 4; task 8, variant 1: pp. 5–6 |

Olympiad: VSOSh mathematics. Moscow is the archive context / msk URL marker, not identification of the delivery platform. G6I confirms calendar 2025; academic year 2025/26 is inferred from the archive path. We analyze the first subvariant/variant only where there are several. Other subvariants are not additional independent supporting problems.

G5S has no solutions in the supplied source. G6S publishes answers to the selected tasks without step-by-step reasoning. G6I supplies explanations. Author-derived reasoning below is explicitly Interpretation; neither an answer key nor our reasoning establishes a unique official method or actual student behavior.

Visual inspection completed using in-memory Windows PDF rendering: G5S p. 1; G6S pp. 1, 4, 5; G6I p. 2. G6I pp. 4–6 were also viewed to inspect source wording/layout. No PDF or raster files were added to the repository. Raster mathematical-font substitution was not used to identify algebraic symbols; text extraction supplies those symbols.

### Source discrepancies

- G6I task 4 asks for the minimum area, contrary to the validation prompt’s “maximal area.” This document tests the actual minimum-area problem.
- G6I task 4 specifies 3×4 tiles but its explanation mentions 2×3 tiles. That inconsistency is visible in the PDF. We do not silently repair the official explanation or use its drawing as a verified tile-by-tile witness.
- G6I task 8’s comparison wording does not explicitly say “other grade.” Its solution uses the interpretation that the compared grade category differs from the current category. Our temporal analysis is conditional on that solution-consistent reading. Including the current category itself would make the comparison trivially true.

## Validation protocol — Interpretation

Coverage is assessed against the existing definitions, not a broadened wording invented during mapping:

- DIRECT: the existing action directly describes a meaningful capability in the task or an identified solution path.
- COMBINATION: the action contributes with other capabilities; it does not by itself cover the task.
- PARTIAL: overlap exists, but the existing definition omits or mismatches an important part.
- NONE: a tempting nearby candidate does not describe the capability.
- Unlisted skills have no evidenced relevance here; they are not silently credited.

Evidence quality is separate from coverage:
- VERIFIED: an inspected solution demonstrates the reasoning path, or this document contains an explicit worked argument. Only VERIFIED DIRECT/COMBINATION mappings count as supporting problems.
- CONDITIONAL: the classification depends on unresolved visual/source interpretation; excluded from counts even if a conditional argument is provided.
- PLAUSIBLE: a reasonable potential application without demonstrated reasoning; excluded from counts.

All proposed D/C paths in G5S-2 and G6S-4 are PLAUSIBLE. Viewing pieces/options or an answer key verifies their presence, not the proposed solving operations. All G6I-8 mappings are CONDITIONAL because of the unresolved category-comparison reading. Other cards identify their VERIFIED paths below. PARTIAL/NONE coverage is never counted as full support, regardless of whether the partial reasoning was demonstrated.

A combination rating describes a contribution, not proof that the entire combination is sufficient. For incomplete combinations the missing operation is named. A theoretical exhaustive search is not credited as a diagnosis of equation-building or a proof for arbitrary histories.

For each mismatch test, in order: (1) same skill under another story; (2) combination; (3) concept mistaken for skill; (4) method mistaken for skill; (5) definition too narrow; (6) definition too broad; (7) reusable new candidate. Stop proliferation when an adequate existing description is found. Full ladders for the remaining capability gaps follow the cards.

## Problem analyses

### G5S-1 — Ages and two products

Source: G5S, task 1, p. 1.

**Observed fact:** Distinct positive integer ages must satisfy product information now and after a one-year increase; identify the middle age.

**Existing skill coverage — Interpretation:**
- DIRECT — Систематически перебирать допустимые случаи.
- COMBINATION — Согласовывать несколько ограничений; Исключать несовместимые варианты.
- PARTIAL — Подбирать множители для равных произведений: the two time states have different target products, not equal products.

**Evidence quality:** VERIFIED D/C paths: explicit factor-triple argument below. The equal-product PARTIAL mapping is not counted.

**Concepts:** positive integers, factors, product, distinctness, order, increment.

**Candidate methods:** factor-triple enumeration; substitution/checking; algebraic relations. These are author candidates, not verified official methods.

**Model pressure:** possible existing coverage; specialized definition; representation issue.

**Decision — Recommendation: UNRESOLVED.** Retain equal-product reasoning as a possibly useful specialization. Steps 1–2 cover this different task through factor enumeration and checks; the need for broader neighboring product-constraint wording does not show the original definition is poor. Product remains a concept and factor selection a method. Independent transfer of the equal-product capability is insufficiently tested.

### G5S-2 — Four copies of a four-cell piece

Source: G5S, task 2, p. 1; target and all five pictured options inspected.

**Observed fact:** Select pieces whose four identical copies assemble the pictured target; rotation and reflection are allowed.

**Existing skill coverage — Interpretation:**
- DIRECT — Строить конфигурацию, удовлетворяющую ограничениям.
- COMBINATION — Согласовывать несколько ограничений; Исключать несовместимые варианты.
- PARTIAL — Разлагать геометрическую фигуру на удобные части; Определять площадь фигуры по сетке: these concern a geometric quantity, while feasibility also depends on shape.
- NONE — Прослеживать соседство частей в пространственной модели: its definition concerns a plane-to-surface transition, not planar tiling.

**Evidence quality:** PLAUSIBLE for every proposed solving path. Inspected target/options alone do not demonstrate construction or rejection; no skill from this card enters counts.

**Concepts:** polyomino, congruence, grid cells, area, rotation, reflection, non-overlapping tiling.

**Candidate methods:** construction; finite placement search; necessary-condition rejection. Exact rejection arguments for each option remain unverified.

**Model pressure:** possible existing coverage; possibly specialized neighboring capability; representation issue.

**Decision — Recommendation: UNRESOLVED.** Steps 1–2 suggest construction plus constraint checks under a new story, but the relevant paths remain PLAUSIBLE and are excluded from counts. Tiling is a concept/problem activity, not automatically another skill. Equal area alone is insufficient; neither area calculation nor 3D adjacency should absorb planar assembly merely because all involve pictures.

### G5S-4 — Numbering without digit 1

Source: G5S, task 4, p. 2.

**Observed fact:** Determine the final label in an ordered numbering scheme that skips every integer containing digit 1.

**Existing skill coverage — Interpretation:**
- DIRECT — Систематически перебирать допустимые случаи.
- COMBINATION — Согласовывать несколько ограничений; Исключать несовместимые варианты.
- PARTIAL — Связывать повторение позиции с длиной цикла: digit blocks do not have the fixed-position cycle of its definition.
- NONE — Находить и считать общие кратные в заданных границах: the filter is digit representation, not common divisibility.

**Evidence quality:** VERIFIED D/C paths: explicit non-overlapping label blocks and checks below. The optional correspondence is a method, not a separate verified skill.

**Concepts:** decimal place value, digit restriction, ordinal position, finite sequence.

**Candidate methods:** filtered enumeration; counting digit blocks; order-preserving correspondence with base-nine representations (author alternative).

**Model pressure:** validates existing skill; concept/skill confusion; representation issue.

**Decision — Recommendation: KEEP.** Steps 1–2 cover ordered filtering. Do not infer periodicity or a cycle skill just from a repeating digit rule. Block counting is a method alternative, not an immediate new skill. Distinguish a label’s numerical value from its rank in the filtered list.

### G5S-7 — Motion after a delayed start

Source: G5S, task 7, p. 2.

**Observed fact:** Use travel information and simultaneous arrival to determine a route length when two constant-speed vehicles start at different times.

**Existing skill coverage — Interpretation:**
- PARTIAL — Согласовывать несколько ограничений: checking a proposed model is covered; constructing the time-aligned relations is not.
- NONE — Переводить расстояния в разности позиций: no evenly spaced numbered row.
- NONE — Связывать повторение позиции с длиной цикла: no cycle.
- PARTIAL — Систематически перебирать допустимые случаи: the distance is not supplied as a finite discrete search space.

**Evidence quality:** VERIFIED quantitative-modeling argument below; existing mappings remain PARTIAL/NONE and do not enter counts.

**Concepts:** distance, speed, elapsed time, ratio, delayed start, equality of arrival times.

**Candidate methods:** common-time comparison; proportional reasoning; equation solving. No official method verified.

**Model pressure:** missing modeling capability; existing nearby skills remain specialized; representation issue.

**Decision — Recommendation: NEW SKILL CANDIDATE.** Propose the quantitative-modeling action defined below, not a motion-specific skill. Matching the word “distance” to the existing positional translation would conceal a different operation. Full mismatch ladder below.

### G6S-1 — Monotone routes

Source: G6S, task 1.1, p. 1; network inspected.

**Observed fact:** Count routes along the drawn network with movement restricted to upward/rightward directions.

**Existing skill coverage — Interpretation:**
- DIRECT — Систематически перебирать допустимые случаи.
- COMBINATION — Согласовывать несколько ограничений.
- PARTIAL — Прослеживать соседство частей в пространственной модели: connectivity matters, but there is no plane-to-surface transition.

**Evidence quality:** VERIFIED D/C paths: the worked route partition below uses the inspected 1.1 network, not just its answer key.

**Concepts:** path, network, vertex, edge, direction, adjacency.

**Candidate methods:** route enumeration; counting arrivals at successive vertices. The published key supplies a result, not one prescribed counting technique.

**Model pressure:** possible existing coverage; possibly specialized neighboring capability; representation issue.

**Decision — Recommendation: KEEP.** Steps 1–2 give route enumeration with movement checks. Reading an actual edge is different from treating the picture as a complete rectangular lattice. Do not broaden the spatial candidate to “read every diagram”; that would destroy its diagnostic distinction.

### G6S-4 — Quadrilaterals from corner triangles

Source: G6S, task 4.1, pp. 4–5; all pieces and six targets inspected.

**Observed fact:** Judge whether each pictured quadrilateral can be assembled from the cut-off corner triangles without overlap; flipping is allowed.

**Existing skill coverage — Interpretation:**
- COMBINATION — Строить конфигурацию, удовлетворяющую ограничениям; Согласовывать несколько ограничений; Исключать несовместимые варианты.
- COMBINATION — Определять площадь фигуры по сетке; Разлагать геометрическую фигуру на удобные части: area comparison is an author candidate for necessary checks.
- COMBINATION — Доказывать невозможность через несовместимость ограничений.
- PARTIAL — Систематически перебирать допустимые случаи: the six options alone do not evidence a complete placement search.
- NONE — Прослеживать соседство частей в пространственной модели: planar rearrangement is not folding onto a surface.

**Evidence quality:** PLAUSIBLE for every proposed solving path. The inspected key/figures do not demonstrate area calculations, decomposition, assembly witnesses or rejection arguments; none enters counts.

**Concepts:** triangle, quadrilateral, area, congruence, grid, transformation, tiling.

**Candidate methods:** construction; area comparison; geometric compatibility; placement search. An area match need not establish a valid assembly.

**Model pressure:** possible existing coverage; representation issue; composition/reasoning depth to investigate.

**Decision — Recommendation: UNRESOLVED.** Steps 1–2 suggest construction, measurement and constraint-based rejection; these PLAUSIBLE paths do not count as support without a worked witness. No new “corner triangles” skill is proposed. These are solution-path hypotheses. The answer key does not show internal seams or explain every rejection; those witnesses remain a verification gap.

### G6S-6 — Equal mushroom redistribution

Source: G6S, task 6.1, p. 10.

**Observed fact:** Infer the group size from unequal collections and the possibility of redistributing whole mushrooms equally.

**Existing skill coverage — Interpretation:**
- PARTIAL — Согласовывать несколько ограничений: verification of totals is not their derivation.
- PARTIAL — Находить и считать общие кратные в заданных границах: unknown-size divisibility is not counting common multiples in a fixed range.
- COMBINATION — Систематически перебирать допустимые случаи, after a valid divisibility reduction supplies finite cases. This contribution does not close the modeling gap.
- NONE — Подбирать множители для равных произведений: product equality is not the defining condition.

**Evidence quality:** VERIFIED divisor-case argument below after a quantitative model is derived. Existing PARTIAL mappings are excluded.

**Concepts:** total, average, divisibility, integer distribution, unknown count, conservation of quantity.

**Candidate methods:** comparison with a uniform baseline; divisibility; divisor enumeration. These are author alternatives, not methods established by the school answer key.

**Model pressure:** missing modeling capability; neighboring divisibility skill may remain specialized; concept/skill confusion; representation issue.

**Decision — Recommendation: NEW SKILL CANDIDATE.** Reuse the same quantitative-modeling proposal as G5S-7; do not introduce a separate mushroom/average skill. General divisibility versus bounded common-multiple counting still needs granularity validation, not an automatic new concept-named skill.

### G6S-8 — Dragon counts and weighted totals

Source: G6S, task 8.1, p. 12.

**Observed fact:** Determine category counts using a total population, total heads and a ratio between two categories.

**Existing skill coverage — Interpretation:**
- DIRECT — Систематически перебирать допустимые случаи: the population bounds a finite search over integer counts.
- COMBINATION — Согласовывать несколько ограничений; Строить конфигурацию, удовлетворяющую ограничениям: an explicit category-count tuple can be checked.
- PARTIAL — Устанавливать границы суммы при ограничениях: exact weighted-total equations are not merely sum bounds.
- NONE — Переводить расстояния в разности позиций: no position-distance relation.

**Evidence quality:** VERIFIED D/C paths: finite count cases and an explicitly checked category-count tuple below.

**Concepts:** category, count, weighted sum, ratio, nonnegative integers, system of relations.

**Candidate methods:** finite count enumeration; uniform baseline; substitution/linear relations.

**Model pressure:** possible existing coverage; representation issue; composition/reasoning depth to investigate.

**Decision — Recommendation: KEEP.** Steps 1–2 cover a finite count construction, so this problem alone does not force a new skill. An equation-based path also supports the modeling proposal from G5S-7; that is optional path evidence, not a claim that every successful student must use equations.

### G6I-3 — Friendship/enmity constraints

Source: G6I, task 3, variant 1, pp. 1–2.

**Observed fact:** Find all possible population sizes under friendship/enmity restrictions.

**Existing skill coverage — Interpretation:**
- COMBINATION — Формулировать отрицания утверждений; Согласовывать несколько ограничений; Доказывать невозможность через несовместимость ограничений; Систематически перебирать допустимые случаи.
- PARTIAL — Исключать несовместимые варианты: the proof eliminates every configuration in a population-size class, not one presented configuration.
- PARTIAL — Строить конфигурацию, удовлетворяющую ограничениям: friendship graphs are explicit witnesses, but the current definition specifically says placement of values.
- PARTIAL — Устанавливать границы суммы при ограничениях: the central bound concerns population size, not a given arithmetic sum.
- PARTIAL — Обосновывать гарантированный результат при неблагоприятном выборе: universal restrictions are present, but no extraction/choice guarantee is requested.

**Evidence quality:** VERIFIED D/C paths supported by the inspected official solution and the short source-backed argument below. PARTIAL mappings are excluded.

**Concepts:** binary relation, graph, degree, parity, population bounds, attainable sizes.

**Candidate methods:** relation propagation; endpoint counting; parity contradiction; bounding; construction. The supplied solution demonstrates a path, not uniqueness of methods.

**Model pressure:** validates existing skill; possible broader neighboring capability; unresolved local/global distinction; concept/skill confusion.

**Decision — Recommendation: BROADEN.** Test replacing “sum” with a precisely defined bounded quantity/count; do not equate that with proving a guarantee. Steps 1–2 cover rejection and existence witnesses; steps 3–4 keep graph/parity concepts and endpoint-counting method separate. The narrow sum wording creates the remaining mismatch. Local exclusion rejects one configuration; the population-size argument rejects every configuration in a size class. Co-occurrence does not establish a merge; see the proof-obligation comparison below.

### G6I-4 — Minimum area of a tiled rectangle

Source: G6I, task 4, variant 1, p. 2; construction image inspected.

**Observed fact:** Minimize the area of a rectangle with a specified side that admits a 3×4 tiling.

**Existing skill coverage — Interpretation:**
- COMBINATION — Доказывать невозможность через несовместимость ограничений.
- PARTIAL — Исключать несовместимые варианты: rejecting an area requires excluding every tiling at that area, a global obligation.
- PARTIAL — Строить конфигурацию, удовлетворяющую ограничениям: the witness places geometric pieces, while the current definition specifies values.
- COMBINATION — Разлагать геометрическую фигуру на удобные части, in an author construction/comparison path.
- PARTIAL — Находить и считать общие кратные в заданных границах: finding a common multiple helps, but bounded counting is not the objective.
- PARTIAL — Доказывать минимальность через предельный неудачный пример: one failed example does not exclude every smaller admissible tiling.
- PARTIAL — Определять площадь фигуры по сетке: rectangle area is involved; a source grid is not necessary for the statement.

**Evidence quality:** VERIFIED D/C paths supported by the independent worked tiling argument below; the inconsistent printed explanation is not verification.

**Concepts:** rectangle, area, tile dimensions, divisibility, minimum, attainability.

**Candidate methods:** divisibility reduction; lower-bound rejection; geometric construction. Source discrepancies above prevent treating the printed explanation/drawing as a verified proof.

**Model pressure:** possibly specialized capability; representation issue; distinct local/global proof obligations.

**Decision — Recommendation: UNRESOLVED.** A broader neighboring extremal-proof capability may be useful, but unsuccessful-example minimality remains a legitimate specialization of guaranteed-selection reasoning. One failed configuration is not a universal impossibility proof for a smaller area. Steps 1–2 cover class-wide rejection plus attainment; do not infer a poor original definition or a local/global merge from this different task.

### G6I-6 — Maximum prime count among related sums

Source: G6I, task 6, variant 1, p. 4.

**Observed fact:** Maximize the number of prime entries among distinct positive integers and their related sums.

**Existing skill coverage — Interpretation:**
- COMBINATION — Систематически перебирать допустимые случаи; Согласовывать несколько ограничений.
- COMBINATION — Доказывать невозможность через несовместимость ограничений; Строить конфигурацию, удовлетворяющую ограничениям.
- PARTIAL — Устанавливать границы суммы при ограничениях: the bounded object is a count of prime entries, not the value of their sum.
- PARTIAL — Исключать несовместимые варианты: rejecting one numerical triple is weaker than proving a universal upper bound.
- NONE — Доказывать минимальность через предельный неудачный пример: this is a maximum-count problem, not minimum guaranteed selection.

**Evidence quality:** VERIFIED D/C paths supported by the inspected official parity-case/attaining-example solution. PARTIAL mappings are excluded.

**Concepts:** primality, parity, sum, distinctness, entry versus distinct value, maximum.

**Candidate methods:** parity case analysis; upper bound; attaining construction. Alternate methods remain possible.

**Model pressure:** validates existing skill; skill too narrow; concept/skill confusion; representation issue.

**Decision — Recommendation: BROADEN.** The count-bound mismatch independently supports the proposal in G6I-3. Steps 1–2 cover finite parity classes, impossibility and a witness; step 3 identifies primality/parity as concepts, step 4 keeps case analysis as method. Do not create “parity” or “prime numbers” skills solely because the concepts are newly visible.

### G6I-8 — Frequency before an event

Source: G6I, task 8, variant 1, pp. 5–6.

**Observed fact:** Count grades classified using preceding frequencies; final category totals are equal. Analysis uses the solution-consistent “other category” reading.

**Existing skill coverage — Interpretation:**
- COMBINATION — Формулировать отрицания утверждений: the complementary event requires every other category to have a higher preceding frequency.
- PARTIAL — Согласовывать несколько ограничений: one static tuple does not describe updating prefix counts.
- PARTIAL — Систематически перебирать допустимые случаи: enumerating sample histories does not prove an order-independent total.
- PARTIAL — Обосновывать гарантированный результат при неблагоприятном выборе: exact counting under every order exceeds the existing guarantee formulation.
- PARTIAL — Устанавливать границы суммы при ограничениях: bounds alone do not identify the exact event count.

**Evidence quality:** CONDITIONAL for every mapping and the worked temporal argument. The unresolved comparison reading excludes this card from all numeric support and cross-grade claims.

**Concepts:** sequence, prefix frequency, category, occurrence rank, quantifier, complementary event.

**Candidate methods:** complement counting; correspondence with the last event at each occurrence rank; order-independent counting. The source’s explanation is one available path.

**Model pressure:** unresolved completeness/enumeration overlap; representation issue; potential temporal-state gap based on conditional interpretation.

**Decision — Recommendation: UNRESOLVED.** Investigate обосновывать полноту подсчёта neutrally. Completeness already belongs to systematic enumeration; this could be a deeper application using non-overlapping classes rather than a separate skill. Correspondence is one possible method. Evidence from this source interpretation is CONDITIONAL and excluded from counts. Temporal-state reasoning also remains unresolved.

## Full mismatch ladders — Interpretation

### Quantitative modeling: G5S-7 and G6S-6; optional path in G6S-8

1. **Same existing skill, another story?** Distance-to-position translation explicitly requires an evenly spaced numbered row. A common-time relation or unknown-group total is different. Checking constraints begins after relations exist.
2. **Combination sufficient?** G5S-7 has no supplied finite distance search. G6S-6 needs a total/divisibility reduction before divisor enumeration. G6S-8 does admit bounded enumeration, so it alone does not require a new candidate.
3. **Actually concept?** Speed, ratio, average and divisibility name ideas, not the act of deriving expressions.
4. **Actually method?** Uniform baseline, proportional reasoning and substitution are different strategies; building a consistent relation is observable across them.
5. **Existing skill too narrow?** Broadening positional differences or common-multiple counting into all quantitative modeling would remove their specific diagnostic content. Record their partial overlap without silently changing definitions.
6. **Existing skill too broad?** “Согласовывать несколько ограничений” already risks concealing both checking and translating. Its current definition is simultaneous checking; treating it as equation construction would be unsupported scope of meaning.
7. **New candidate justified?** Provisionally yes: translating stated quantitative relationships into expressions/equations is learnable and reusable across motion, redistribution and category totals. This is a capability-description gap, not a claim that algebra is the only way to solve each task.

### Completeness of counting: G6I-8

1. **Same existing skill?** Систематически перебирать допустимые случаи explicitly includes checking completeness and avoiding equivalent duplicates. Completeness is already part of that definition; the issue is whether the counted cases must be individual objects or may be exhaustive classes.
2. **Combination sufficient?** Negation plus enumeration of non-overlapping occurrence-rank classes may describe the argument. Sample-history enumeration is weaker, but it is not the only possible application of enumeration.
3. **Actually concept?** Frequency, order and occurrence rank are concepts; completeness is an obligation to justify the count.
4. **Actually method?** Exhaustive non-overlapping case partition, one-to-one correspondence and other completeness arguments are possible methods. None is itself adopted as a new skill.
5. **Too narrow?** A modest interpretation of enumeration covering complete, non-overlapping classes may suffice without expanding it into every proof. This alternative has not been ruled out.
6. **Too broad / deeper application?** Justifying that no cases are omitted or duplicated may be the same skill at greater reasoning depth. Whether it deserves a distinct diagnostic capability cannot be inferred from a single conditional temporal example.
7. **New candidate justified?** UNRESOLVED. Keep обосновывать полноту подсчёта as the capability under investigation, not an accepted separate skill. G5S-4 has a verified author counting/correspondence path; G6I-8 remains CONDITIONAL. Their methods do not establish a new taxonomy item.

### Local exclusion versus global impossibility

- **Local exclusion:** reject one candidate/configuration by exhibiting at least one violated constraint.
- **Global impossibility:** show that every admissible candidate/configuration fails, or eliminate an entire class of possibilities. A rejected example alone does not establish this universal statement.

In G6I-3, the parity argument excludes all five-person relation configurations. In G6I-4, the vertical-line argument excludes every tiling of the smaller-area rectangle. Neither is merely an unsuccessful arrangement. Both actions may appear in one solution without being redundant.

Three interpretations remain viable:
- one justification skill at different depth, if the distinction is mainly reasoning about larger classes;
- two related skills, if local checking and universal exclusion yield distinct diagnostic failures;
- foundational rejection plus an advanced application requiring abstraction or exhaustive coverage.

Problem-based evidence here does not distinguish these alternatives. Keep the relationship UNRESOLVED; co-occurrence or similar wording is insufficient to recommend a merge. No hierarchy or mastery levels are introduced.

## Evidence matrix — Interpretation

Full existing candidate names are preserved; coverage meanings are unchanged. Evidence quality is an independent distinction, not a scoring system.

Counting convention:
- The single numeric column counts VERIFIED D/C mappings from the 12 validation problems only. Each problem counts once per skill, never once per method, option or subvariant.
- Original OT-001B evidence is retained as reported hypotheses/context. Its reasoning paths were not re-verified at this step, so no original numeric total is combined with the verified validation count.
- CONDITIONAL, PLAUSIBLE and PARTIAL/NONE entries do not contribute. Inspected diagrams/answer keys alone do not verify a proposed path.
- Sources supporting VERIFIED paths are explicit worked arguments below or inspected G6I-3/G6I-6 solutions. A source can verify one action while a nearby PARTIAL mapping remains excluded. G6I-4 relies on the author argument, not the inconsistent printed proof.
- Cross-story/cross-grade flags use VERIFIED validation entries only. Zero new verified support is not invalidation; low frequency is not a poor definition.
- These are problem/solution-path counts, not observed learner performance, importance or teaching-effect measurements.

| Existing candidate skill | Original audit context (not counted) | VERIFIED validation evidence | Excluded validation mappings | Verified count | Flags |
| --- | --- | --- | --- | ---: | --- |
| Формулировать отрицания утверждений | S-02 | G6I-3 C | G6I-8 C CONDITIONAL | 1 | Grade 6 only; one verified family |
| Согласовывать несколько ограничений | S-02, S-05, S-08, I-08 | G5S-1 C, G5S-4 C; G6S-1 C, G6S-8 C; G6I-3 C, G6I-4 C, G6I-6 C | G5S-2, G6S-4 C PLAUSIBLE; G5S-7, G6S-6 P; G6I-8 P CONDITIONAL | 7 | Different stories; both grades; broadness still unresolved |
| Исключать несовместимые варианты | S-02, S-03, S-08 | G5S-1 C, G5S-4 C | G5S-2, G6S-4 C PLAUSIBLE; G6I-3 P, G6I-4 P, G6I-6 P | 2 | Two Grade 5 stories; local/global relationship unresolved |
| Прослеживать соседство частей в пространственной модели | S-03, inherited visual hypothesis | None | G6S-1 P; planar assembly N | 0 | Insufficient independent evidence; retain pending validation |
| Связывать повторение позиции с длиной цикла | S-04 | None | G5S-4 P | 0 | Possibly specialized; not disproved |
| Подбирать множители для равных произведений | S-05 | None | G5S-1 P | 0 | Possibly specialized; broader neighboring capability open |
| Строить конфигурацию, удовлетворяющую ограничениям | S-05, I-08 | G6S-8 C; G6I-6 C | G5S-2 D PLAUSIBLE; G6S-4 C PLAUSIBLE; G6I-3 P, G6I-4 P | 2 | Two Grade 6 numerical-configuration stories; geometric/relational broadening unresolved |
| Определять площадь фигуры по сетке | S-06, inherited geometric gap | None | G6S-4 C PLAUSIBLE; G5S-2, G6I-4 P | 0 | Area-path hypotheses do not establish transfer |
| Разлагать геометрическую фигуру на удобные части | S-06, candidate path | G6I-4 C | G6S-4 C PLAUSIBLE; G5S-2 P | 1 | One Grade 6 worked path |
| Переводить расстояния в разности позиций | S-08 | None | G5S-7 N | 0 | Motion is different; retain specialized candidate |
| Систематически перебирать допустимые случаи | S-08; possible S-02/S-05 paths | G5S-1 D, G5S-4 D; G6S-1 D, G6S-8 D; G6S-6 C; G6I-3 C, G6I-6 C | G5S-2, G6S-4 P PLAUSIBLE; G5S-7 P; G6I-8 P CONDITIONAL | 7 | Different stories; both grades; completeness already in definition |
| Находить и считать общие кратные в заданных границах | I-01 | None | G6S-6, G6I-4 P | 0 | Finding/counting granularity unresolved |
| Выделять границу фигуры для вычисления периметра | I-02 | None | None | 0 | No new perimeter test; not invalidation |
| Обосновывать сохранение длины при преобразовании границы | I-02, inherited segment-matching gap | None | None | 0 | No new boundary-transformation test |
| Обосновывать гарантированный результат при неблагоприятном выборе | I-05 | None | G6I-3 P; G6I-8 P CONDITIONAL | 0 | Specialized guarantee obligation remains valid hypothesis |
| Доказывать минимальность через предельный неудачный пример | I-05 | None | G6I-4 P; G6I-6 N | 0 | Retain specialization; unrelated minimum/maximum tasks do not disprove it |
| Устанавливать границы суммы при ограничениях | I-08 | None | G6S-8 P; G6I-3 P; G6I-6 P; G6I-8 P CONDITIONAL | 0 | Broader neighboring quantity-bound capability to test |
| Доказывать невозможность через несовместимость ограничений | I-08, I-05 | G6I-3 C, G6I-4 C, G6I-6 C | G6S-4 C PLAUSIBLE | 3 | Different Grade 6 stories; no verified Grade 5 validation path |

The set is separate from OT-001B, not randomized or representative. Different stories show possible reuse of the same action, not distinct reasoning mechanisms automatically. Shared Moscow sources and selection by the task author limit independence. Frequency alone cannot establish correct scope.

## Author-derived checks — Interpretation, not official solutions

These short checks make the main coverage judgments inspectable without reproducing full statements.

- **G5S-1:** order the distinct ages a<b<c. If a is at least 2, the product is at least 2·3·4>18; hence a=1. The remaining distinct factor pairs of 18 are (2,9) and (3,6). Incrementing each age yields products 60 and 56 respectively. These two exhaustive cases demonstrate organized search, simultaneous checks and justified rejection.
- **G5S-4:** partition admissible labels by digit length. There are 8 one-digit and 8·9=72 two-digit labels. The first three-digit blocks, 200–209 and 220–229 with digit-1 labels omitted, contain 9 each: 98 labels in total. The next admissible labels are 230 and 232, giving positions 99 and 100. Digit restrictions, increasing order and non-overlapping exhaustive blocks justify the count.
- **G6S-1:** the inspected 1.1 network has two full outer-boundary routes. Leaving those boundaries yields two possible detours through the upper-left network and two through the lower-right network. Within each network a route either uses its longer inner segment directly or takes the small step-shaped detour. There is no joining edge between the two inner networks. Thus these six non-overlapping routes exhaust the up/right possibilities, and every listed route respects the movement constraints.
- **G6I-3, source-backed check:** for an enemy pair A,B no other resident can be friends with both; it must be an enemy of at least one. Their remaining enemies bound the population by 2+2+2. The lower bound is four. Size five fails because five degree-three enemy relations have an odd total of endpoints, whereas every enemy pair contributes two. Sizes four (all enemies) and six (two friend triples, cross-triple enemies) have explicit witnesses. This demonstrates complete bounded cases, constraint checks and universal class rejection. It does not establish that local and global rejection should merge.

- **G5S-7:** compare only the interval after the car starts. The speed ratio is (65−42):30 = 23:30. For route length L, simultaneous remaining travel gives (L−65)/23 = (L−30)/30. The modeling operation is aligning a common time interval before writing the relation; checking an arbitrary L afterward is a separate capability.
- **G6S-6:** for n children the total becomes 13n + 29 after comparison with a baseline of 13 each. Whole equal shares require n to divide 29, with n at least 2. The divisor cases of prime 29 are exactly 1 and 29; n=1 violates the two named children, and n=29 gives 14 mushrooms each. This demonstrates the complete divisor-case check after the model reduction, not the full existing “find and count common multiples” definition.
- **G6S-8:** let x count seven-headed dragons; five-headed dragons number 2x and six-headed dragons number 62−3x. Relative to six heads each, the total is 6·62−x. The integer cases x=0,…,20 exhaust possible seven-headed counts under 62−3x≥0. The total-head check selects x=17. Assign counts (17,34,11) to the three categories: they total 62, the ratio is 1:2, and the head total is 7·17+5·34+6·11=355. This verifies the named count-tuple construction/check and complete bounded search, rather than crediting any numerical answer as a construction.
- **G6I-4:** independently of the inconsistent printed explanation, a tile’s area requires an area divisible by 12, and a boundary assembled from integer tile lengths makes the other side integer. With the fixed side 14, candidate areas are multiples of 84. In a 14×6 rectangle, any generic vertical line crosses tiles of heights 3 or 4 summing to 6; only 3+3 works. Thus every tile has height 3 and width 4, incompatible with width 14. A 14×12 rectangle can be split into widths 6 and 8: tile the 6×12 part with width-3/height-4 tiles and the 8×12 part with width-4/height-3 tiles. This supplies an independent rejection and attainment argument, not an official erratum.
- **G6I-8:** under the solution-consistent reading, a complementary event is the last among the four k-th occurrences, for exactly one k. Before it occurs its category has count k−1; the other categories have at least k. Conversely, any complementary event has precisely this property for its occurrence rank. There is exactly one such event for each of the 25 ranks, regardless of interleaving. The correspondence, including existence and uniqueness, explains the count; examples of histories alone do not.
- **G5S-4, alternate path:** positive base-nine representations map in order to allowed decimal labels by replacing digits 1,…,8 with 2,…,9 and preserving 0. This is a one-to-one, order-preserving mapping without leading zeros. For example, ordinal 100 has base-nine representation 121, mapping to label 232. This supports correspondence as an author-derived alternative; enumeration already covers the task.

These are mathematical reasoning checks, not empirical evidence of student learning, observed attempts, mastery or teaching effectiveness.

## Provisional candidate and unresolved capability — Recommendation

### Переводить количественные связи в выражения и уравнения

**Definition:** represent stated quantitative relationships as consistent expressions/equations with identified quantities and aligned units or reference conditions.

**Evidence:** G5S-7 and G6S-6, author-derived paths; G6S-8, optional author-derived path. There is structural support across Grade 5 and Grade 6, not proof that all methods require symbolic equations.

**Observable evidence:** name the quantities, write relations accounting for the stated totals/ratios/offsets, and explain their correspondence to the story. Merely solving a supplied equation would not demonstrate this candidate.

**Distinct from:** product, speed, average and ratio are concepts; baseline comparison/substitution are methods; simultaneous constraint checking validates a supplied model rather than creates it. This does not silently broaden the positional-distance skill.

**New-candidate rule:** the ordered mismatch ladder found no adequate current description of the model-building operation; it transfers across stories, is learnable/observable, and is neither a domain, named technique nor one-story requirement.

**Confidence:** medium. This currently appears to be a reusable foundation capability. Possible future components include identifying quantities, translating relationships and maintaining units/meaning; they are not decomposed into separate skills here. Equation use is path-dependent, and problem-based evidence does not establish learner-performance granularity.

### Обосновывать полноту подсчёта — unresolved capability

**Definition under investigation:** explain why a count includes every admissible object/event and counts none more than once. This wording does not prescribe a method.

**Evidence quality:** VERIFIED author paths in G5S-4 show completeness of counting and an optional order-preserving correspondence. G6I-8 offers a CONDITIONAL temporal argument, excluded from numeric support and cross-grade validation. The conditional example may motivate a question but cannot justify a taxonomy addition.

**Possible methods:** exhaustive non-overlapping case partition; one-to-one correspondence; other completeness arguments. Method names are not skill names.

**Comparison with Систематически перебирать допустимые случаи:** completeness and avoiding equivalent duplicates are already explicit in its current definition. Is this the same capability applied to classes rather than individual candidates? Is the observable distinction specifically justifying omissions/duplication? Is it a deeper application of enumeration? The worked G5S-4 partition demonstrates overlap, not independence of a new skill.

**Observable evidence:** describe which objects/events each case covers and explain exhaustiveness and non-duplication, using an appropriate argument. Formal bijection notation is not required.

**Decision:** UNRESOLVED. A separate skill is not justified yet. Carry the neutral capability/method distinction forward as a normalization question; do not create a correspondence-specific skill.

No additional candidate is added for dynamic-state tracking, parity, graph reasoning, general divisibility or geometric transformations. Their possible diagnostic value remains open; names of new concepts/methods alone are insufficient.

## Answers to the research questions

### 1. Which existing skills gained strong independent evidence?

**Interpretation:** verified validation support is seven families for systematic enumeration, seven for simultaneous constraint checking, three for global impossibility, two for local justified exclusion, and two for numerical configuration construction. These numbers exclude unworked assemblies and the conditional G6I-8 reading.

Verified enumeration and checking span different stories and both grades. Verified local exclusion appears in two Grade 5 stories; numerical construction and global-impossibility paths in this validation set are Grade 6 only; reported original Grade 5 hypotheses are not combined into a verified cross-grade count. Geometric decomposition has one verified Grade 6 path; grid-area measurement has none here.

Frequent checking may still be too broad for diagnosis. Neither high frequency nor successful reuse proves correct scope or importance.

### 2. Which skills appear too task-specific?

**Interpretation:** equal-product reasoning and unsuccessful-example minimality are possibly specialized, with insufficient independent evidence here. Their mismatch with age equations and tiling minimum proofs does not demonstrate a poor definition. Broader neighboring product-constraint/extremal-proof capabilities may warrant study without replacing these specializations.

Cycle length, uniform-row positional distance and plane-to-surface adjacency remain hypotheses to retain until further validation. Boundary identification and length preservation receive no targeted perimeter evidence in this set. Low frequency, missing evidence and poor granularity are different issues; none of these skills is invalidated solely by its count.

### 3. Which skills should be assessed for merging?

**Interpretation:** local exclusion exhibits a failure of one configuration; global impossibility eliminates every configuration or a whole class. G6I-3's five-person exclusion and G6I-4's smaller-area exclusion have universal proof obligations.

**Recommendation:** keep the relationship UNRESOLVED among one skill at different depth, two related skills, or foundational rejection plus an advanced application. Shared wording/co-occurrence cannot select a merge. Future normalization must preserve the distinction between one violated example and exclusion of all possibilities.

Guarantee and unsuccessful-example minimality likewise answer different questions. No merge with boundary identification/length preservation or construction/decomposition is established.

### 4. Which items look more like concepts?

**Interpretation:** none of the 18 is simply a concept noun. Grid-area, equal-product and common-multiple candidates bind actions to specific concepts; this may be useful specialization or a granularity question, not automatically a defect.

**Recommendation:** keep product, divisibility, perimeter, area, parity, primality, graph and frequency as concepts. Investigate broader neighboring capabilities without reclassifying entire action phrases merely because they name concepts.

### 5. Which items look more like methods?

**Interpretation:** enumeration/case analysis, decomposition, construction and boundary transformation have method/action overlap. Demonstrating a complete search, checking an arrangement or justifying a transformation can still be observable capabilities.

One-to-one correspondence is a method in the completeness investigation, not an accepted separate skill. A neutral counting capability may already belong to systematic enumeration. No method-only reclassification is established from this sample.

### 6. Did Grade 6 expose capabilities absent from Grade 5?

**Concepts:** parity, primality, graph relations, unknown-group divisibility and prefix frequency are visible in Grade 6 problems. New concept presence does not itself establish a new skill.

**Composition / reasoning depth:** G6I-3/4/6 combine bounds, class-wide rejection and attainable witnesses; route counting reuses enumeration. These can be compositions or deeper applications of existing capabilities.

**Potential capability gaps:** quantitative model-building is supported by explicit Grade 5 motion and Grade 6 redistribution/category-total arguments. It appears to be a reusable foundation capability, not Grade-6-specific progression. Temporal-state reasoning is an unresolved question from CONDITIONAL G6I-8, not verified support for an added skill.

No age threshold, prerequisite, mastery level, national progression or training difficulty follows from this sample. Conditional counting evidence cannot establish verified Grade 5–6 transfer of a distinct new counting skill.

### 7. Foundation mathematical capabilities versus olympiad reasoning?

**Interpretation:** verified quantitative representation and arithmetic paths combine with completeness, class-wide exclusion and attainment. This supports testing an analytical distinction while recognizing overlap; compositions do not automatically require additional skills.

**Recommendation:** treat foundation/reasoning as a lens, not a two-level taxonomy or domain → skill hierarchy. There is no evidence for exclusive assignment of every candidate.

### 8. What genuinely new candidates are required?

**Recommendation:** retain Переводить количественные связи в выражения и уравнения provisionally as a reusable foundation capability. It describes deriving relationships rather than checking a supplied model; its components are not yet separate skills.

Keep обосновывать полноту подсчёта UNRESOLVED relative to systematic enumeration. Correspondence, exhaustive non-overlapping partition and other completeness arguments remain methods. No second separate skill is justified by the conditional temporal example.

G6S-8 and G5S-4 have adequate existing paths and do not force additions. No parity/primality/tiling/motion concept- or story-named skill is introduced.

## Remaining ambiguities and verification gaps

- **Original OT-001B / OT-001C.1:** inherited S-02/S-03/S-05/S-06/I-02 visual details and original school solution methods were not re-verified here. Original audit reports are retained as context, not counted as VERIFIED paths at this step. Original platform requirements remain outside this research.
- **G5S-1/2/4/7:** supplied PDF contains tasks, not official solutions. Author methods cannot be attributed to the official key. G5S-2 option-by-option constructions and rejection proofs were not independently completed.
- **G6S-1/4/6/8:** the selected source gives answers rather than derivations. G6S-4’s pictured pieces/targets are verified, but seams for every positive target and proofs for every negative target remain unverified. All proposed solving paths in G6S-4 are PLAUSIBLE and excluded from support counts; visual inspection alone does not verify them.
- **G6I-4:** no official erratum was verified for the 3×4 / 2×3 inconsistency. The source drawing was inspected but not validated tile by tile. An independent author proof above supports the actual minimum-area task; it does not establish the source’s intended repair.
- **G6I-8:** taxonomy judgments use the solution-consistent comparison with other categories. All G6I-8 mappings are CONDITIONAL and excluded from numeric support; whether an official clarification resolves the wording was not verified.
- **All skills:** structural task/path evidence is not observed learner performance. No diagnostic task design, effectiveness, importance weighting or granularity calibration was tested.
- **Granularity:** constraint checking versus model construction; ordinary finite enumeration versus correspondence proofs; general count bounds versus sum bounds; general minimality versus a worst-case failed example; local rejection versus global impossibility remain research choices.
- **Temporal state:** whether prefix-count updating deserves its own reusable skill needs more evidence. It is not automatically added because G6I-8 uses it.

The three Moscow publications do not establish a national grade progression or a final taxonomy. Neither task position nor source grade supplies a measured training difficulty.

## Initial recommendations and self-review

**Recommendation:** preserve the inventory unchanged pending review. Investigate broader neighboring product-constraint, quantity-bound and extremal-proof capabilities without invalidating specializations. Keep local/global rejection and completeness/enumeration relationships unresolved. Retain only quantitative modeling as a provisional new candidate; do not adopt a correspondence-specific skill. No architecture or implementation action follows automatically.

Self-review:
- **Confirmation bias:** P/N matches remain visible; common-multiple, spatial and guarantee candidates do not receive credit merely for similar vocabulary.
- **Proliferation:** tested existing stories/combinations before a new candidate; reused one modeling proposal across tasks; rejected automatic parity/primality/tiling/motion additions.
- **Concept/skill/method:** concepts and candidate techniques have separate fields; observable actions are described; method uniqueness is not asserted.
- **Task-specific wording:** the modeling candidate describes a reusable action; low frequency and unrelated-task mismatch do not establish a poor definition; counting remains unresolved.
- **Certainty:** counts identify evidence origin and inherited limits; source discrepancies remain explicit; no student behavior, teaching effect or official taxonomy is claimed.
- **Scope:** only this document is created; existing research, code, taxonomy and Git history remain unchanged. Validation completed: git diff --check and a new-file whitespace check passed; all 12 cards have required fields, all 18 original candidate names appear in the matrix, count arithmetic was checked, and Git shows only this new document.

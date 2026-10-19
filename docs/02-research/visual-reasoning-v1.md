# Visual Reasoning v1 — original content prototype

Research-stage status (18 October 2026): **PROPOSED / NEEDS DECISION for implementation**. Research authorized on 18 October 2026; base `origin/main` = `5463382b42cef06f3f2e94bcd5af84ca72d3deac`. No content, curriculum, architecture or rights decision was adopted at that research stage; subsequent authority is recorded below. No learner sessions have been run.

Subsequent authority: the user explicitly approved the technical direction and local Pack S integration on the same branch. The prototype text/figures below remain the reviewed mathematical definitions. The earlier implementation prerequisites below describe the research recommendation; the new instruction moves human mathematics, age-suitability and authorship/distribution approval to **release gates** while authorizing local implementation. The owner distribution/credit decision is now recorded below; human mathematics and educator release gates remain open. See the [implementation record](../05-development/visual-reasoning-v1-implementation.md).

This is the first batch of three candidates for the [Grade 5 roadmap](../00-project/grade5-curriculum-roadmap-v1.md#next-three-bounded-vertical-slices), not its complete 6–9-item visual sequence. The roadmap remains a proposal. The original research task did not adopt the wider curriculum. The subsequent local integration follows the [Content Pipeline](../05-development/content-pipeline-v1.md) and adopted [technical direction](../04-architecture/original-content-visual-slice-v1.md).

Pedagogical wording follow-up: the owner accepted the four Minor findings from the AI preflight at `8765799` for local implementation: relative route positions, an exploratory first hint, an explicit two-stage alternative count with the adult audit retained only here, and plain-language overlap wording. Mathematical conditions, answers and SVGs are preserved. This follow-up is not named human mathematics or educator sign-off; review the revised content before release.

## Authorship, limits and intended use

The Russian wording, numerical arrangements, SVG geometry, hints and explanations below were composed for this task with Codex assistance. No official statement, figure, key or Figma example was copied, traced or used as a transformation template. Familiar mathematical ideas are not a claim of unprecedented mathematical invention; worldwide uniqueness has not been investigated. These are original project candidates, **not VSOSh tasks**. AI authorship assistance is disclosed, not treated as mathematical authority or rights clearance. The dated owner decision below confirms the intended credit and distribution scope; no license or independent originality verification is asserted.

Learner use remains limited to local adult design review until the remaining release gates are cleared. Before children see these materials, a named Grade 5 educator must sign off the exact revision's mathematics, language, prerequisites, figure/text equivalence and intended supervised use. No human mathematics or educator sign-off is recorded. These files include protected teaching material and answers: never serve this dossier or its directory as learner assets.

Provisional instructional interpretation: diagram membership/boundaries → area by decomposition → complete path enumeration. These are analytical descriptions, not adopted taxonomy, official metadata or training difficulty. Entry prerequisites: read a small rectangular grid, interpret rows/columns and centimetres, multiply small whole numbers, add counts of disjoint cases. Area needs square-unit understanding; path counting needs no binomial formula. There is no prerequisite/difficulty inference from order or task numbering.

## Owner distribution and credit decision — 2026-10-19

Evidence: explicit project-owner confirmation in the task “Record Pack S owner distribution approval”, dated **2026-10-19**, following [PR #105](https://github.com/SemenKr/olympiad-trainer/pull/105). Decision: **permitted by owner for the stated scope**.

| Exact problem ID | Title | SVG (repository dossier / public asset) |
| --- | --- | --- |
| `original-two-frames` | Две рамки | `visual-reasoning-v1/two-frames.svg` / `public/problem-media/original-two-frames.svg` |
| `original-notched-sheet` | Лист с двумя вырезами | `visual-reasoning-v1/notched-sheet.svg` / `public/problem-media/original-notched-sheet.svg` |
| `original-path-via-k` | Дорожки через К | `visual-reasoning-v1/path-via-k.svg` / `public/problem-media/original-path-via-k.svg` |

Scope: publication and distribution of these three problems, their SVG diagrams, hints and explanations **in Olympiad Trainer and its GitHub repository**. The owner approves the public credit: “Оригинальные материалы проекта Olympiad Trainer, подготовленные с помощью Codex.” The owner knows of no copied third-party protected material.

Revision covered: the Pack S content in PR #105 head `eab8c6fdaf0af297d6685932040a666415f3f6cf`, including the three definitions in `src/modules/practice/server/problem-catalog.ts`, the public SVGs above and their matching dossier prototypes. This local record changes provenance rights notes and public/documentation wording only; mathematical content and SVG geometry remain unchanged. Reassess permission for changed content, third-party material or distribution outside this scope.

Limitations: this records the owner's statement, not independent originality verification, worldwide uniqueness, a legal finding or an open-source/content license. It does not clear human mathematical correctness, Grade 5 educator suitability or learner accessibility review. It does not resolve reuse/adaptation rights for **any of the 60 VSOSh-derived problems**, which remain **unresolved**. It grants no Git operation, PR status change, merge, deployment or release action in this task.

## Grade 5 educator sign-off checklist — pending

No sign-off is claimed. Record reviewer name/Grade 5 role, date, exact commit plus any local diff or file hashes, the three IDs above, findings/corrections and an explicit decision per item (approved / changes required / not reviewed). Review the final catalog statements, text equivalents, answers, all three hints, both explanation approaches, and both public/dossier SVG copies; the content baseline above identifies this request but does not pre-approve later revisions.

- [ ] **Mathematics:** independently solve each item; check answers, completeness/uniqueness, edge cases, hints and both arguments, including valid alternative approaches. A numeric app check does not assess the learner's proof.
- [ ] **Russian language and age fit:** verify unambiguous wording, vocabulary, notation, units and answer instructions for Grade 5; ensure hints support thinking without premature solutions.
- [ ] **Diagrams and text equivalence:** check exact labels, boundaries, overlap, cutouts, units, permitted directions and blocked edge against each statement and text equivalent; verify legibility with enlargement, without colour or pixel measurement, and with media unavailable.
- [ ] **Prerequisites:** confirm rows/columns and relative grid positions, small whole-number arithmetic, square units/area and disjoint-case counting are understood or explicitly introduced; no binomial formula required. Record any missing prerequisite support.
- [ ] **Intended use:** approve or restrict the supervised learner evaluation described below; record accessibility/learner observations separately from technical tests. Do not infer a complete curriculum or transfer from three items.

## Candidate 1 — Две рамки

Proposed stable ID: `original-two-frames`; title: **Две рамки**. [Statement diagram](visual-reasoning-v1/two-frames.svg), intrinsic 560 × 420. Numeric contract: `nonnegative-integer`, expected `"8"` (server only).

**Условие.** На рисунке поле из трёх рядов и четырёх столбцов одинаковых клеток. Рамка А обводит прямоугольник из клеток, рамка Б — другой прямоугольник. Клетка относится к рамке, если находится внутри неё. Сколько клеток находятся внутри ровно одной из двух рамок? Клетки внутри обеих рамок не учитывай. Введи число клеток. Объясни свой подсчёт на бумаге или вслух.

**Текстовый эквивалент (без способа решения).** Ряды пронумерованы сверху вниз от 1 до 3, столбцы — слева направо от 1 до 4. Рамка А охватывает ряды 1–2 и столбцы 1–3. Рамка Б охватывает ряды 2–3 и столбцы 2–4. Границы рамок идут по линиям клеток. Буква А и сплошная линия обозначают первую рамку, буква Б и пунктир — вторую.

Future media: title `Две рамки на клетчатом поле`; caption `Поле и границы рамок А и Б.`; alt = the full text equivalent above; `kind: diagram`, `enlarge: true`. Also append the coordinate facts to the visible statement in implementation, so an image failure does not remove necessary information. The duplicate description carries conditions only, not a solution.

**Подсказки**, ordered and protected:

1. focus — «Чем клетка внутри двух рамок отличается от клетки внутри ровно одной? Найди на рисунке оба случая.»
2. strategy — «Можно пройти по рядам и в каждом посчитать только клетки, подходящие условию.»
3. next-step — «В верхнем ряду подходят клетки в столбцах 1, 2 и 3. В среднем ряду проверь отдельно крайние клетки и две средние.»

**Полное учебное решение.** В первом ряду подходят три клетки: они внутри А и снаружи Б. Во втором ряду клетки в столбцах 2 и 3 находятся внутри обеих рамок, поэтому не подходят. Клетка в столбце 1 находится только внутри А, в столбце 4 — только внутри Б: подходят две. В третьем ряду подходят клетки в столбцах 2, 3 и 4: они только внутри Б. Всего 3 + 2 + 3 = 8 клеток. Мы просмотрели все три ряда и каждую подходящую клетку учли один раз.

**Другой подход.** В каждой рамке 6 клеток, общих клеток 2. В сумме 6 + 6 каждая общая клетка учтена дважды; нам она не нужна ни разу, поэтому вычитаем 2 + 2: 12 − 4 = 8. При подсчёте 12 − 2 общие клетки остались бы посчитаны по одному разу, а их учитывать нельзя.

**Checks / edge cases.** Explicit cell sets: A = {11,12,13,21,22,23}, B = {22,23,24,32,33,34}, with two-digit row/column notation used only in this audit. Neither = {14,31}; both = {22,23}; exactly one = {11,12,13,21,24,32,33,34}. Thus 8 + 2 + 2 = all 12 cells. A boundary on a cell edge does not create a fractional cell or count the line as an extra cell. SVG lines share grid edges; solid/dashed identity and letters survive greyscale. Learner may mark individual cells or partition by rows; no method is mandatory.

## Candidate 2 — Лист с двумя вырезами

Proposed stable ID: `original-notched-sheet`; title: **Лист с двумя вырезами**. [Statement diagram](visual-reasoning-v1/notched-sheet.svg), intrinsic 560 × 440. Numeric contract expected `"27"` square centimetres; enter number only.

**Условие.** Из прямоугольного листа шириной 7 см и высотой 5 см вырезали два прямоугольника: сверху — шириной 3 см и глубиной 2 см, снизу — шириной 2 см и глубиной 1 см. Вырезы не пересекаются. Все стороны на рисунке горизонтальные или вертикальные. Найди площадь оставшейся части листа в квадратных сантиметрах. Введи число без единиц. Объясни, какие части ты считал.

**Текстовый эквивалент.** Исходный лист имеет ширину 7 см слева направо и высоту 5 см сверху вниз. Верхний вырез начинается в 2 см от левого края и заканчивается в 5 см от него; он идёт от верхнего края вниз на 2 см. Нижний вырез начинается в 1 см от левого края и заканчивается в 3 см от него; он идёт от нижнего края вверх на 1 см. Удалённые места белые, оставшаяся часть заштрихована. Пунктир показывает исходные края над и под вырезами, а не оставшуюся бумагу.

Future media: title `Лист и два прямоугольных выреза`; caption `Размеры даны в сантиметрах; пунктир показывает удалённые участки исходного края.`; alt = full text equivalent; `kind: diagram`, `enlarge: true`. Append the placement facts to the future visible statement. Do not require measuring the displayed image; all lengths needed for either method are stated.

**Подсказки**:

1. focus — «Какие части исходного прямоугольного листа удалили? Не перепутай длину края и площадь.»
2. strategy — «Можно найти площадь целого листа, а потом убрать площади двух вырезов.»
3. next-step — «Площадь целого листа равна 7 · 5. Площадь верхнего выреза равна 3 · 2. Как учесть нижний вырез?»

**Полное учебное решение.** До вырезания площадь листа была 7 · 5 = 35 см². Верхний вырез имеет площадь 3 · 2 = 6 см², нижний — 2 · 1 = 2 см². Они не пересекаются, значит, никакая удалённая часть не вычтена дважды. Осталось 35 − 6 − 2 = 27 см². Ответ: 27.

**Другой подход.** Разделим лист на три горизонтальные полосы. В верхней полосе высоты 2 см осталось два прямоугольника общей ширины 7 − 3 = 4 см: площадь 8 см². Средняя полоса имеет высоту 5 − 2 − 1 = 2 см и ширину 7 см: площадь 14 см². В нижней полосе высоты 1 см осталось общей ширины 7 − 2 = 5 см: площадь 5 см². Полосы не перекрываются и покрывают всю оставшуюся бумагу: 8 + 14 + 5 = 27 см². Подсчёт единичных квадратов на самостоятельно построенной сетке тоже допустим.

**Checks / edge cases.** At 50 SVG units/cm, outer bounds x=100..450, y=100..350; top notch x=200..350, y=100..200; bottom notch x=150..250, y=300..350. Vertical notch intervals are disjoint, despite horizontal overlap. The polygon is simple and connected, has no hole and no diagonal. Polygon shoelace area must be 67,500 SVG units² = 27 cm²; removed union = 8 cm². Perimeter, notch depth sums, screen pixels and white background are not area answers. Extra horizontal offsets only specify the drawing; the subtraction solution is invariant under permissible horizontal shifts with the same disjoint cutout sizes.

## Candidate 3 — Дорожки через К

Proposed stable ID: `original-path-via-k`; title: **Дорожки через К**. [Statement diagram](visual-reasoning-v1/path-via-k.svg), intrinsic 560 × 440. Numeric contract expected `"9"` routes, not a route-length answer.

**Условие.** Дорожки образуют прямоугольную сетку: четыре шага по горизонтали и три по вертикали. Начало Н — в левом нижнем углу, финиш Ф — в правом верхнем. За один шаг можно пройти по дорожке между соседними перекрёстками только вправо или вверх. Нужно пройти через перекрёсток К. Дорожка от К на один шаг вправо закрыта: её пересекать нельзя. Сколько разных маршрутов из Н в Ф подходят? Маршруты различаются, если хотя бы один шаг идёт по другой дорожке. Введи число маршрутов и объясни, почему учёл все.

**Текстовый эквивалент.** Сетка состоит из четырёх шагов по горизонтали и трёх по вертикали. Н — левый нижний перекрёсток, Ф — правый верхний. К находится на два шага правее и на один шаг выше Н. Дорожки соединяют все соседние перекрёстки в одном ряду или столбце. Закрыт только участок между К и соседним перекрёстком справа от него; остальные дорожки открыты. Закрытая дорожка отмечена крестом и разрывом; стрелки в легенде показывают только разрешённые направления, а не готовый маршрут.

Future media: title `Сетка дорожек с закрытым участком`; caption `Крест и разрыв обозначают закрытую дорожку. Двигаться можно вправо и вверх.`; alt = full text equivalent; `kind: diagram`, `enlarge: true`. Append relative-position facts to future visible statement. Cyrillic К must not be confused with an additional node called Latin K; the audit uses coordinates unambiguously.

**Подсказки**:

1. focus — «Через какой перекрёсток должен пройти каждый подходящий маршрут? Какие направления движения разрешены?»
2. strategy — «Раздели маршрут на часть до К и часть после К. Перечисли отдельно пути из Н в К и из К в Ф. Каждое начало можно соединить с каждым допустимым продолжением.»
3. next-step — «До К нужны два шага вправо и один вверх. После К первый шаг обязательно вверх. Затем остаются два шага вправо и один вверх. Где в каждой тройке шагов может стоять шаг вверх?»

**Полное учебное решение.** Обозначим шаг вправо буквой П, вверх — В. Из Н в К нужны два шага П и один В. Возможны ровно три порядка: ППВ, ПВП, ВПП. После К идти вправо нельзя, поэтому сначала делаем В. Остаются два шага П и один В: ППВ, ПВП, ВПП. Значит, продолжений тоже три: ВППВ, ВПВП, ВВПП. Любое из трёх начал можно соединить с любым из трёх продолжений, получаем 3 · 3 = 9 маршрутов. Двигаясь только вправо и вверх, вернуться в К нельзя, поэтому К не посещается повторно. Каждый маршрут имеет единственные начало и продолжение; пропусков и повторов в подсчёте нет.

**Другой подход.** У каждого перекрёстка запишем число способов дойти до него. В Н поставим 1. Просматриваем ряды снизу вверх, а в каждом ряду идём слева направо. У каждого следующего перекрёстка складываем числа у соседей слева и снизу, от которых можно прийти по открытой дорожке. Если такого соседа нет, он ничего не добавляет. Так в К получаем 3. Теперь будем считать только пути, прошедшие через К. Сотрём прежние числа: в К оставим 3, у остальных перекрёстков поставим 0. Снова просматриваем ряды снизу вверх и слева направо. Число в К не меняем, а у каждого другого перекрёстка записываем сумму по тому же правилу. В Ф получаем 9. Если считать все пути из Н в Ф без этого второго этапа, условие обязательного посещения К потеряется.

**Adult-only audit (not learner-facing).** Для взрослого: без запрета через К было бы 3 · 6 = 18 путей, запрещённое ребро использовали бы 3 · 3 = 9; разность 9 подтверждает результат.

**Checks / edge cases.** Grid has 5 × 4 = 20 vertices; 16 horizontal + 15 vertical segments before removal, hence 30 open undirected segments after removal. Only right/up traversal is allowed. The removed segment is an edge, not the whole row or its endpoints; (3,1) remains accessible from below. Every route has exactly 7 steps. A diagonal, left/down step, skipping К or jumping the gap is invalid. There is no issue of arbitrarily many loops. A valid route family must be counted, not just one witness. Enumeration over all 35 sequences of four right and three up steps provides an independent finite check; filter for К and the closed edge. An alternative valid complete enumeration is accepted orally/on paper regardless of app answer format.

## Smallest complete learner experience and limits

Propose one ordinary optional three-problem Pack, ordered as the candidates above. This is one independent practice opportunity per representation, not proof that each capability has been learned. There are deliberately no new checkpoints: their supported IDs and semantics are already constrained. Hints and full solutions use the existing eligibility, retry and reveal rules; a learner can pause, resume or stop voluntarily. Numeric correctness remains separate from solution exposure and from a complete explanation.

For supervised evaluation after approval: briefly demonstrate rows, columns and relative positions using an empty, unscored grid (no fourth catalog problem and no candidate solution), then let the learner attempt the three items. Record first action, misunderstanding of boundaries/units/directions, hints/adult help, retry, stopping and the child's explanation. Allow sketches and different valid approaches. Do not force all three or promise a completion time. A later changed-representation/return item is still needed for roadmap validation; do not treat these three different concepts as transfer probes for one another. Existing `square-border-tile-count`, `cutout-area-ratio` and `maximum-grid-neighbor-sum` are optional educator comparison references, not added to this Pack or cleared for use by this task.

Learner acceptance criteria for the future implementation:

- All mathematical conditions are available in Russian both visually and in text, with no dependence on colour, measurement of pixels or solution hints hidden in an asset. The learner can distinguish overlap from exclusive membership, removed area from perimeter, and a blocked edge from a blocked vertex; record actual understanding rather than assuming it.
- At 320px, 375px and desktop widths, labels and intrinsic proportions remain legible using the existing enlarge control as needed; no page overflow. Keyboard opens/closes the named dialog, Escape works, focus returns. Screen reader receives the condition-equivalent alt, and visible statement text still works when media fails. Check actual browsers/assistive technology before release.
- Each item supports existing valid/invalid/incorrect/correct input behavior, progressive protected hints and full reasoning solution. No initial projection, SVG, filename, caption or alt contains keys, hints or solutions. No credit is inferred for an unseen explanation.
- Refresh/resume keeps the exact tuple and exposure state; Finish, Summary, History and Progress remain usable. Existing A–R episodes still restore and complete; this Pack contributes no new adaptive or capability evidence.

## Verification and human gates

Author checks: two mathematical derivations per item plus explicit cell/shape/path audits above. Machine check results and independent read-only review are recorded in the [verification note](visual-reasoning-v1/verification.md). AI/automated agreement is not human mathematics approval. Browser/learner acceptance criteria above are proposed tests, not executed learner evidence.

Current gates: human mathematics and Grade 5 educator sign-off of the exact content revision remain required before child use/release. Confirm final assets, learner accessibility checks and intended supervised use; apply and verify receipt migration 0022 before exposing Pack S on a deployed database; obtain separate Git/release authorization. The 2026-10-19 owner permission clears only the distribution/credit gate within its recorded scope. This task authorizes no commit, push, PR status change, merge or deployment.

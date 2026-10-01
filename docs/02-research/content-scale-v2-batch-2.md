# Content Scale v2 — Batch 2

## Handoff

Task ID: CONTENT-V2-B2. Revision: `fb8845472418a206e70c3bf34cfd28e9f6b81c5b`, branch `feature/content-scale-v2-batch-2`; initially clean. Goal: grow the production corpus from 33 to 42 with ordinary Packs J/K/L and deliver a reviewed PR for human merge. Scope, exclusions, permissions and Definition of Done are the original user handoff; this document narrows the Researcher assignment to candidate selection and an implementation-ready contract. Researcher may write only this research document and temporary source evidence; no production or Git mutations. Correction cycle: 0. Status: READY for independent content/math review; this status does not authorize new decisions.

## Observed facts and sources

All selected sources are Grade 5 mathematics tasks in the public Moscow VSOSh archive. Page numbers below are one-based PDF pages, including covers. `originalSource.reference` is `I`; `officialSolution.reference` is `IS`. Common provenance: olympiad `Всероссийская олимпиада школьников`, subject `mathematics`, region `Moscow`, sourceArchive `vos.olimpiada.ru`, grade `5`.

| Source key | Academic year / stage | Task PDF | Official solution PDF |
| --- | --- | --- | --- |
| A | 2024/25 / invitational | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/tasks-math-5-prigl-msk-24-25.pdf | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/sol-math-5-prigl-msk-24-25.pdf |
| B | 2024/25 / school | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/tasks-math-5-sch-msk-24-25.pdf | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/sol-math-5-sch-msk-24-25.pdf |
| C | 2023/24 / school | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf |
| D | 2020/21 / invitational | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/tasks-math-5-prigl-msk-20-21.pdf | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/ans-math-5-prigl-msk-20-21.pdf |
| E | 2021/22 archive season / invitational | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/tasks-math-5-prigl-msk-21-22.pdf | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/sol-math-3-10-prigl-msk-21-22.pdf |
| F | 2021/22 / school | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf | https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf |

Source E was considered and rejected: the archive-season label and actual May 2021 event date differ. No selected problem uses it. Source F explains that tasks had randomized versions and publishes one representative version per number; no official variant number is supplied, so omit `variant` for these tasks. The selected A–D tasks also have no numbered variant in their PDFs.

The researcher opened each selected task and official solution PDF and checked the extracted headers, statements, answers and page locations. These selected tasks need no source diagram. Source wording is not copied as a batch: learner text below is a concise training adaptation; solutions and hints are independently written explanations. Numeric parameters and logical constraints retain the sourced mathematics. Attribution remains factual provenance, not a claim that our wording or pedagogy is official.

## Candidate pool and selection

The pool preceded the final selection. Existing 33 IDs, topics and source references were checked in `problem-catalog.ts`; no selected source task or adapted problem duplicates them.

| Candidate | Decision / reason |
| --- | --- |
| A1 chocolate promotion | Select: short entry task, careful separation of discounted and normal units. |
| A2 square placements | Reject: source figure needed; stronger text alternative available. |
| A6 paper folding | Reject: visual folding semantics and lengthy case diagrams. |
| A7 grid walk neighbor sums | Reserve: expressible in text, but exhaustive path proof adds reading load. |
| B3 bicycle lock | Reserve: image contains guess digits; transcription adds avoidable source-visual risk. |
| B5 teachers / lesson attendance | Select: double counting with a meaningful unit change. |
| B6 rectangle area | Reject: diagram-dependent perimeter relations. |
| C4 soldiers | Select: worst-case guarantee plus a second constraint, exact integer answer. |
| C7 coin grid | Select: text-only double counting with a complete existence construction. |
| C8 liar council | Select: bound-and-construction reasoning, replacing an ambiguously dated source. |
| D4 apple allocation | Select: short elimination problem; adapt matching to all true statements. |
| D1 magic square | Reject: grid transcription would dominate the task. |
| D2 cutout perimeter | Reject: source figure essential. |
| E1 multiples ending in 4 | Reserve: correct, but too similar to existing arithmetic selection tasks. |
| E2 fruit masses | Reject: archive academic-year label differs from the event date; an unambiguous alternative exists. |
| E3 cuckoo clock | Reject: same archive/event dating uncertainty; an alternative exists. |
| E4 dance attendance | Reserve: valid but less varied than selected counting tasks. |
| E5 cutout area | Reject: source figure essential. |
| E7 number ordering diagram | Reject: graphical partial order needs careful transcription. |
| F1 five-Friday calendar | Select: discrete bounds and calendar reasoning, existing set response. |
| F2 circular seating | Select: equal arcs on a circle, text-only clarification suffices. |
| F3 street cover | Reserve: text lists streets, but requires longer set-cover proof. |
| F4 overlapping carpets | Reject: source positions need a diagram or long coordinate specification. |
| F5 balanced groups | Select: full two-element answer set and strict difference constraint. |

Existing tasks such as A3/A4/A5/A8, B1/B4/B7, C1/C3/C5, D3/D5/D6/D8 and E6/E8/F6/F7 were excluded as duplicates. The 2022-23 invitational solution path was inspected as an additional source pool but its cover says 2021/22; its alternatives are unnecessary, so this batch avoids that inconsistent label entirely.

## Implementation contract

Use ordinary Pack IDs `pack-j`, `pack-k`, `pack-l`, names `Набор J: считаем и сравниваем`, `Набор K: выводы и доказательства`, `Набор L: порядок и варианты`, and these stable tuples:

| Pack | Ordered IDs |
| --- | --- |
| J | `chocolate-promotion-price`, `school-lesson-teacher-count`, `soldier-figures-guarantee` |
| K | `apple-harvest-assignments`, `liar-council-maximum`, `central-coin-column` |
| L | `five-fridays-calendar`, `circular-table-seat-count`, `balanced-six-groups` |

All definitions: grade 5, mathematics; solution kind `training-adaptation`; hint IDs `${problemId}-focus`, `${problemId}-strategy`, `${problemId}-next-step`; solution ID `${problemId}-full-solution`. Hints have exactly the corresponding levels in that order. No reasoning checkpoints. Answers, hint text, solutions and provenance stay server-only; learner projection exposes ordinary supported response metadata only. Pack history contributes no capability evidence or adaptive facts. No runtime prerequisite metadata, difficulty, mastery or new bucket is requested.

### J1 — chocolate-promotion-price

Title: **Цена шоколадки**. Provenance: A, problem 1; task page 1, official solution page 1.

Statement: В магазине все шоколадки одного вида имеют одинаковую обычную цену. При покупке нескольких шоколадок четвёртая, восьмая, двенадцатая и так далее стоят по 70 рублей каждая, а остальные — по обычной цене. За 10 шоколадок Маша заплатила 1020 рублей. Сколько рублей стоит одна шоколадка без акции?

Assessment: `nonnegative-integer`, expectedAnswer `110`.

Hints:

1. Среди десяти шоколадок отдели те, которые продаются по акции, от остальных.
2. По 70 рублей стоят четвёртая и восьмая шоколадки. Вычти их стоимость из всей покупки.
3. После вычитания стоимости двух акционных шоколадок останется стоимость восьми одинаковых шоколадок по обычной цене.

Solution: Из десяти шоколадок две стоят по 70 рублей, а восемь — по обычной цене. На две акционные потрачено 2 · 70 = 140 рублей. Остальные стоят вместе 1020 − 140 = 880 рублей. Поэтому обычная цена равна 880 : 8 = 110 рублей. Проверка: 8 · 110 + 2 · 70 = 1020. Ответ: 110.

Math verification: the purchase equation is 8x + 140 = 1020; x = 110 is the unique nonnegative integer solution. Source/visual limits: no diagram; explicit numbering removes promotion ambiguity. Research-only prerequisites: multiplication/division, separating known and unknown parts.

### J2 — school-lesson-teacher-count

Title: **Сколько учителей?**. Provenance: B, problem 5; task page 2, official solution page 3.

Statement: В школе 1200 учеников. За один учебный день каждый посещает ровно 5 уроков. На каждом уроке присутствует ровно 30 учеников, и каждый урок ведёт один учитель. Каждый учитель за этот день проводит ровно 4 урока. Сколько учителей работает в школе?

Assessment: `nonnegative-integer`, expectedAnswer `50`.

Hints:

1. Сначала посчитай все посещения уроков за день. Один ученик создаёт несколько посещений.
2. Раздели число посещений на 30: так ты найдёшь число проведённых уроков, а не число учителей.
3. Всего получается 1200 · 5 = 6000 посещений. На каждого учителя приходится 4 урока по 30 посещений.

Solution: За день ученики создают 1200 · 5 = 6000 посещений уроков. На одном уроке 30 учеников, поэтому проводится 6000 : 30 = 200 уроков. Каждый учитель ведёт 4 урока, значит учителей 200 : 4 = 50. Проверка: 50 · 4 · 30 = 6000. Ответ: 50.

Math verification: count the same attendance incidences by pupils and by teacher-lessons: 1200 · 5 = T · 4 · 30, uniquely T = 50. Source/visual limits: no diagram; one-teacher-per-lesson is made explicit as the source solution assumes. Research-only prerequisites: multiplication/division, counting units.

### J3 — soldier-figures-guarantee

Title: **Лучники и мечники**. Provenance: C, problem 4; task page 1, official solution page 3.

Statement: У Ильи 16 игрушечных фигурок двух видов: лучники и мечники. Какую бы тройку фигурок он ни отдал брату, среди оставшихся мечников будет больше, чем лучников. Если вместо этого он отдаст половину всех мечников, то лучников останется больше, чем мечников. Сколько лучников у Ильи?

Assessment: `nonnegative-integer`, expectedAnswer `6`.

Hints:

1. Первое условие должно выполняться даже тогда, когда Илья отдаёт трёх мечников.
2. После отдачи трёх мечников их всё ещё больше, чем лучников. Используй общее количество 16, чтобы ограничить число лучников сверху.
3. Лучников не больше 6. Проверь, какое из чисел от 0 до 6 позволяет оставить половину мечников и получить больше лучников, чем оставшихся мечников.

Solution: Пусть лучников a, тогда мечников 16 − a. Мечников не может быть меньше трёх: тогда можно отдать всех мечников и дополнить тройку лучниками, и первое условие нарушится. Значит, тройку мечников отдать можно. После этого 13 − a > a, откуда a < 6,5 и a ≤ 6. Второе условие означает a > (16 − a) : 2, то есть 3a > 16 и a ≥ 6. Поэтому a = 6, а мечников 10. Проверка: если отдать трёх мечников, останется 7 мечников против 6 лучников; любая другая тройка ещё выгоднее для мечников. Если отдать половину мечников, останется 5 мечников против 6 лучников. Ответ: 6.

Math verification: two strict inequalities give a ≤ 6 and a ≥ 6; 10 is even, so giving half is possible. Source/visual limits: no diagram; the two transfers are alternative scenarios, not consecutive transfers. Research-only prerequisites: worst case, simple integer inequalities; the solution can be understood by checking bounded counts.

### K1 — apple-harvest-assignments

Title: **Урожай яблок**. Provenance: D, problem 4; task page 2, official solution pages 2–3 (store starting page 2).

Statement: Алёна, Боря, Вера и Полина собрали яблоки. Каждый из них собрал одно из четырёх разных количеств: 11, 17, 19 или 24 яблока. Все четыре количества использованы по одному разу; кто сколько собрал, пока неизвестно. Известно, что 11 яблок собрала одна из девочек, Алёна собрала больше Бори, а сумма яблок Алёны и Веры делится на 3. Выбери все верные утверждения о том, сколько яблок они собрали.

Assessment: `multiple-choice-set`; instruction `Выбери все верные утверждения.`

| Option ID | Label |
| --- | --- |
| alena-19 | Алёна собрала 19 яблок |
| borya-11 | Боря собрал 11 яблок |
| vera-11 | Вера собрала 11 яблок |
| polina-24 | Полина собрала 24 яблока |
| alena-24 | Алёна собрала 24 яблока |
| vera-17 | Вера собрала 17 яблок |

Protected expectedOptionIds: `alena-19`, `vera-11`, `polina-24`.

Hints:

1. Найди пары разных чисел из 11, 17, 19 и 24, сумма которых делится на 3.
2. Алёна не могла собрать 11 яблок: тогда она не собрала бы больше Бори. Если бы у неё было 17, у Бори было бы 11, но 11 собрала девочка.
3. Алёна не могла собрать 24: ни одно из трёх других чисел вместе с 24 не даёт сумму, кратную 3. Определи оставшееся количество Алёны и затем Веры.

Solution: Боря не собрал 11, потому что это количество собрала девочка. Алёна собрала больше Бори, поэтому у неё не 11. Если бы у Алёны было 17, у Бори должно было бы быть 11 — невозможно. У Алёны не 24, поскольку суммы 24 + 11, 24 + 17 и 24 + 19 не делятся на 3. Поэтому Алёна собрала 19, а Боря — 17. Из оставшихся чисел только 11 даёт с 19 сумму, кратную 3: 19 + 11 = 30. Значит, Вера собрала 11, Полина — 24. Верны утверждения про 19 яблок Алёны, 11 яблок Веры и 24 яблока Полины.

Math verification: exhaustive elimination gives the unique assignment (19,17,11,24), satisfying all three constraints. Source/visual limits: official matching is adapted into independent true/false options with a unique expected set; no new matching engine. Research-only prerequisites: order, divisibility by 3, elimination.

### K2 — liar-council-maximum

Title: **Заседание на острове**. Provenance: C, problem 8; task page 2, official solution page 7.

Statement: На заседание пришли 50 жителей острова: рыцари всегда говорят правду, а лжецы всегда лгут. Лжецов было k, где k не меньше 4. Каждый лжец сделал одно заявление. Первый сказал, что рыцарей меньше, чем лжецов; второй — что их поровну. Третий сказал, что рыцарей на 1 больше, четвёртый — на 2 больше, и так далее: k-й сказал, что рыцарей на k − 2 больше, чем лжецов. Какое наибольшее значение k возможно?

Assessment: `nonnegative-integer`, expectedAnswer `17`.

Hints:

1. Все перечисленные заявления ложны. Что следует из ложности первого и второго заявления?
2. Рыцарей больше, чем лжецов. Их превышение не может равняться ни одному числу от 1 до k − 2.
3. Значит, рыцарей хотя бы на k − 1 больше, чем лжецов. Сравни минимальное общее число жителей с 50 и обязательно проверь достижимость границы.

Solution: Первый лжец соврал, поэтому рыцарей не меньше, чем лжецов. Второй тоже соврал, поэтому их не поровну: рыцарей больше. Остальные лжецы исключили превышения 1, 2, …, k − 2. Значит, рыцарей минимум k + (k − 1) = 2k − 1. Вместе с k лжецами это минимум 3k − 1 человек. Поэтому 3k − 1 ≤ 50, откуда k ≤ 17. Граница достижима: при 17 лжецах и 33 рыцарях рыцарей на 16 больше. Ни одно заявление о меньшем числе, равенстве или превышении от 1 до 15 не верно. Все 17 лжецов действительно солгали. Ответ: 17.

Math verification: r = 50 − k; false statements force r − k ≥ k − 1, equivalently k ≤ 17. Construct k17/r33 to prove maximum, not just upper bound. Source/visual limits: no diagram. Research-only prerequisites: false statements, strict integer inequalities, upper bound and construction.

### K3 — central-coin-column

Title: **Монеты в среднем столбце**. Provenance: C, problem 7; task page 2, official solution page 6.

Statement: В клетки доски 7 × 7 разложили 234 монеты. В клетке может быть любое неотрицательное целое число монет. В любых четырёх подряд идущих клетках одной строки или одного столбца лежит ровно 19 монет. Сколько монет находится в четвёртом столбце?

Assessment: `nonnegative-integer`, expectedAnswer `32`.

Hints:

1. Сумма верхних четырёх клеток среднего столбца равна 19, как и сумма нижних четырёх. При сложении этих сумм центральная клетка посчитана дважды.
2. Найди число монет в центре двойным подсчётом. Каждый квадрат 4 × 4 в углу доски содержит 4 · 19 монет. Рассмотри сумму по четырём таким квадратам.
3. Пусть в центре c монет. Тогда средняя строка и средний столбец содержат по 38 − c монет. В сумме четырёх угловых квадратов клетки вне этих линий посчитаны один раз, остальные клетки линий — два раза, а центр — четыре раза.

Solution: Обозначим число монет в центральной клетке через c. Верхние четыре клетки среднего столбца содержат 19 монет, нижние четыре — ещё 19, а центр попал в обе суммы. Поэтому весь средний столбец содержит 38 − c монет. Так же вся средняя строка содержит 38 − c.

Возьмём четыре квадрата 4 × 4, каждый примыкает к своему углу доски. В каждом из них четыре отрезка строки по четыре клетки, поэтому 4 · 19 = 76 монет. Общая сумма по квадратам — 4 · 76 = 304. Каждая клетка вне средней строки и среднего столбца вошла в один квадрат. Клетки этих линий, кроме центра, вошли в два квадрата, а центр — во все четыре. Поэтому 304 получается из всех 234 монет, если добавить ещё по одному среднему столбцу и средней строке, а затем ещё одну центральную клетку: 304 = 234 + (38 − c) + (38 − c) + c = 310 − c. Отсюда c = 6. В среднем столбце 38 − 6 = 32 монеты.

Такая расстановка действительно существует. Повторяй по строкам и столбцам блок из четырёх строк:

14, 0, 0, 5;
0, 14, 0, 5;
0, 0, 16, 3;
5, 5, 3, 6.

Оставь первые семь строк и столбцов повторённой таблицы. В каждой строке и каждом столбце блока сумма 19, поэтому любые четыре подряд идущие клетки дают 19. В доске 7 × 7 числа 14, 14 и 16 из первых трёх диагональных клеток блока встречаются по четыре раза; числа 5, 5 и 3 в четвёртых строке и столбце дают ещё 52 монеты; центральная клетка даёт 6. Всего 4 · (14 + 14 + 16) + 52 + 6 = 234. Ответ: 32.

Math verification: corner-square incidence counting uniquely forces c6 and column32. The nonnegative period4 construction above proves feasibility and every sliding constraint; official diagram is not needed for this independent proof. Source/visual limits: official explanation uses a tiling diagram; our statement is already textual, and our solution replaces that diagram with a complete text double count and construction. Research-only prerequisites: double counting, overlap correction, periodic arrays.

### L1 — five-fridays-calendar

Title: **Пять пятниц**. Provenance: F, problem 1; task page 4, official solution page 8; variant absent (published representative version).

Statement: В календарном месяце было ровно пять пятниц. При этом ни первый, ни последний день месяца не был пятницей. Какой день недели пришёлся на 12-е число? Выбери подходящий вариант.

Assessment: `multiple-choice-set`; instruction `Выбери подходящий вариант.` Options in order: `monday` — Понедельник; `tuesday` — Вторник; `wednesday` — Среда; `thursday` — Четверг; `friday` — Пятница; `saturday` — Суббота; `sunday` — Воскресенье. Protected expectedOptionIds: `monday`.

Hints:

1. Если первая пятница приходится на число f, то пятая будет на 28 дней позже. В месяце не бывает больше 31 дня.
2. Первая пятница не может быть 1-го числа. Если она 3-го, пятая приходится на 31-е и становится последним днём месяца.
3. Остаётся первая пятница 2-го числа. Выпиши ближайшие пятницы и отсчитай от них до 12-го числа.

Solution: Пусть первая пятница месяца имеет число f. Тогда пятая пятница — f + 28. Так как в месяце не больше 31 дня, f ≤ 3. f = 1 исключено: первый день не пятница. При f = 3 пятая пятница была бы 31-го числа, в последний день месяца, что тоже запрещено. Значит, f = 2. Пятницы идут 2, 9, 16, 23 и 30-го; месяц должен иметь 31 день, чтобы 30-е не было последним. После пятницы 9-го идут суббота 10-го, воскресенье 11-го, понедельник 12-го. Ответ: понедельник.

Math verification: integer f ∈ {1,2,3}; exclusions uniquely give f=2 and month length31, and weekday offset3 gives Monday. Source/visual limits: numeric answer would require artificial weekday coding; existing set UI naturally holds one correct option. Research-only prerequisites: week period7, month length at most31.

### L2 — circular-table-seat-count

Title: **Места за круглым столом**. Provenance: F, problem 2; task page 4, official solution pages 8–9 (store starting page 8); variant absent.

Statement: Люди сидят на равных расстояниях друг от друга по окружности круглого стола. Их места пронумерованы по часовой стрелке подряд: 1, 2, 3 и так далее. Расстояние по прямой от места 31 до места 7 равно расстоянию по прямой от места 31 до места 14. Сколько всего людей сидит за столом?

Assessment: `nonnegative-integer`, expectedAnswer `41`.

Hints:

1. На окружности два разных места, равноудалённых от одного места, расположены симметрично относительно него.
2. От места 31 до места 14 против часовой стрелки — 17 промежутков между соседними местами. Столько же промежутков должно быть от 31 до 7 в другую сторону.
3. На пути по часовой стрелке от 31 до 7 сначала идут места 32, 33 и так далее, затем 1, 2, …, 7. Учти промежуток от последнего номера до 1.

Solution: Равные прямые расстояния — равные хорды окружности. Значит, места 7 и 14 симметричны относительно места 31: от 31 до 14 против часовой стрелки столько же промежутков, сколько от 31 до 7 по часовой. От 31 до 14 — 31 − 14 = 17 промежутков. Если всего мест N, то от 31 до 7 по часовой стрелке N − 31 + 7 = N − 24 промежутка. Получаем N − 24 = 17, поэтому N = 41. Проверка: от 31 до 41 — 10 промежутков, от 41 через 1 до 7 — ещё 7. Ответ: 41.

Math verification: for equally spaced points, equal chord lengths from a fixed point imply opposite signed angular offsets moduloN (the same signed offset would give the same point). Thus 7−31 ≡ −(14−31) modN, so N divides41. Because N ≥ 31, uniquely N=41. This also excludes longer-arc ambiguities. Source/visual limits: no diagram; specify straight-line distance to make the equal-chord reasoning unambiguous. Research-only prerequisites: cyclic counting, equal chords/symmetry; explanatory circle symmetry is pedagogical interpretation, not official skill metadata.

### L3 — balanced-six-groups

Title: **Шесть групп кружка**. Provenance: F, problem 5; task page 5, official solution pages 10–11 (store starting page 10); variant absent.

Statement: Участников математического кружка распределили в шесть групп так, что размеры любых двух групп отличаются не больше чем на одного человека. Ровно в четырёх группах оказалось по 13 участников. Какое общее количество участников могло быть? Выбери все подходящие числа.

Assessment: `multiple-choice-set`; instruction `Выбери все подходящие числа.` Options in order: `total-74` — 74; `total-76` — 76; `total-77` — 77; `total-78` — 78; `total-79` — 79; `total-80` — 80; `total-82` — 82. Protected expectedOptionIds: `total-76`, `total-80`.

Hints:

1. В каждой из двух оставшихся групп не 13 участников: групп такого размера ровно четыре.
2. Размер каждой оставшейся группы отличается от 13 не больше чем на один, поэтому это 12 или 14.
3. Можно ли одновременно иметь группу из 12 и группу из 14 участников? После ответа посчитай суммы для двух оставшихся случаев.

Solution: Четыре группы содержат 4 · 13 = 52 участника. В каждой из двух остальных групп либо 12, либо 14 человек: 13 запрещено словом «ровно», а другие размеры отличаются от 13 больше чем на один. Группы из 12 и 14 одновременно невозможны, потому что отличаются на два. Поэтому возможны только два варианта: 52 + 12 + 12 = 76 или 52 + 14 + 14 = 80. Оба достижимы: размеры 13,13,13,13,12,12 и 13,13,13,13,14,14 удовлетворяют всем условиям. Ответ: 76 и 80.

Math verification: exhaust the four ordered pairs from {12,14}²; exclude the mixed pairs; both remaining assignments construct actual valid groups. Source/visual limits: no diagram; full official answer set retained through existing set checker. Research-only prerequisites: strict quantifier «ровно», difference bound, finite cases.

## Interpretation and recommendation

J starts with separating quantities, continues with attendance counting and ends with a worst-case constraint. K progresses from elimination through an extremal truth/lie bound to double counting with an existence construction. L compares period bounds, circular counting and exhaustive group sizes. This order is our pedagogical choice, not official numbering or inferred difficulty. Reuse the generic ordinary-Pack pipeline and existing answer checkers; no new interaction or domain decision is needed.

## Verification gaps

Independent mathematical/content review passed with Critical/Major/Minor = 0/0/0 after correction cycle 1. The sole initial Major finding was the K1 wording that implied a name-to-quantity correspondence; the corrected statement explicitly leaves that correspondence unknown. The approved contract was independently re-reviewed at SHA256 `13e166d7668e1eb5acd22f473b1362e369c3fa7e0a624eb26cacec7f33099583` before production implementation. The researcher's derivations support reproducibility; official answers alone and fixture tests do not establish mathematical authority. No copyrighted source PDF or source drawing is stored in the repository. No broad source-rights conclusion is claimed; this bounded batch uses original training adaptations and factual links. Prerequisite notes stay in this document only.

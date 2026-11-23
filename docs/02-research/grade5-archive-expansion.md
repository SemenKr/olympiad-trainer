# Grade 5 archive expansion — candidate research

Baseline `d37d48f80b8fac9c17add8e37ba35ed2649d816f` has 69 problems and 21 Packs A–U. This is a research shortlist for the proposed 12/12/9 additions. These are Moscow VSOSh school-stage mathematics tasks for Grade 5. Page numbers are one-based PDF pages. These documents do not explicitly number variants for the listed tasks. The 2024/25 solution labels the board-game-style decision tree as 8.1, which requires separate variant reconciliation if selected.

## Official documents

- A, 2018/19. [Tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2018-19/school/math/tasks-math-5-sch-18-9.pdf) · [Solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2018-19/school/math/ans-math-5-sch-18-9.pdf).
- B, 2023/24. [Tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf) · [Solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf).
- C, 2024/25. [Tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/tasks-math-5-sch-msk-24-25.pdf) · [Solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/sol-math-5-sch-msk-24-25.pdf).

- D, 2020/21. [Tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/tasks-math-4-11-sch-msk-20-21.pdf) · [Solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/ans-math-4-11-sch-msk-20-21.pdf). The publisher describes the displayed problems as one version per number and gives these two no separate variant index.

## Candidates with author calculations

| Source and task                        | Tasks / solution page | Assessment                                  | Mathematical verification and adaptation risk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------- | --------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A #5, circular seating                 | 1 / 3–4               | Choice set with one expected option, пещера | Enumerated all assignments of two truth-tellers, two liars and two flexible speakers, enforcing both neighboring pairs and the nonadjacent flexible seats. Tested all named locations and an unnamed location. Exactly one seat assignment and location survived. For a learner proof, the truth-tellers must include seat 6 because no consecutive reported claims agree. The two fixed pairs must occupy opposite positions because neither remaining flexible seat can border the other. This excludes the pair 5–6, since seats 2 and 5 claim the same location. |
| B #2, partition into marked rectangles | 1 / 1–2               | Choice set with one expected option, C3     | Enumerated all placements of each marked rectangle, rejecting overlaps and any rectangle containing another mark. One partition survives and leaves C3. A text adaptation can tabulate the six clues and define coordinates. Keep the reasoning about the forced strips in the explanation.                                                                                                                                                                                                                                                                          |
| B #6, perimeter from square columns    | 2 / 4–5               | Integer, 198                                | The three columns have widths 1, 4 and 2 in units of the smallest square. The common height is 4 units. The area 2268 therefore gives 81 per unit square, side 9, and perimeter twice 11 units. Text can describe columns directly without reuse of the graphic.                                                                                                                                                                                                                                                                                                     |
| C #2, uniform tetromino tilings        | 1 / 1–2               | Multiple choice, T and L                    | Exact-cover search used each rotation and reflection, translated into the 16-cell board, and counted partitions once by always covering the first uncovered cell. Counts for T, square, zigzag, L and I were 1, 0, 0, 8 and 0. A Grade 5 explanation still needs original, accessible witness diagrams and short impossibility arguments.                                                                                                                                                                                                                            |
| C #6, area from two outlines           | 2 / 4                 | Integer, 56                                 | For long and short sides a and b, the boundary equations are 2a+6b=52 and 6a+2b=92. Their unique positive solution is a=14, b=4, giving area 56. A text adaptation must describe the two short-edge contacts of the U arrangement without supplying the equations.                                                                                                                                                                                                                                                                                                   |

Additional checks from D:

- **#6**, task page 5, solution page 11. Integer answer **29**. Compare each of the first two sets against the total of hard candies. The deficits are 7 for chocolates and 22 for marmalades, and both must be made up in the last set. Enumeration over 500 feasible first/second set sizes reproduced the same pair. The algebra covers unbounded sizes. A two-column difference table supports a Grade 5 explanation.
- **#7**, task pages 5–6, official answer and proof pages 12–13. Integer answer **5**. Checked every unmarked cell against every 6 × 6 and 3 × 3 window. The possible cells are (3,5), (3,6), (3,7), (3,8) and (6,3), using row then column. Each is realized by placing the hidden piece there. Any search of fewer than five cells leaves at least one feasible location untested. Before learner use, verify the five printed clue positions visually and author an accessible grid.

Suggested hint progressions for the first three candidates:

- A #5. «Какие два соседа должны назвать одно и то же место?» → «Посмотри, какие пары возможны, если ответ шестого неизвестен.» → «Отметь две свободные позиции и проверь, что при паре 5–6 происходит с ответом второго гнома.»
- B #2. «Какая форма может быть у прямоугольника из пяти клеток?» → «Начни с пятёрок в углах и посмотри, где останется место для двойки.» → «После этих полос попробуй вписать прямоугольник с шестёркой. Какие варианты его сторон ещё возможны?»
- B #6. «Сравни высоту трёх столбцов.» → «Возьми сторону самого маленького квадрата за одну мерку и вырази обе стороны прямоугольника в этих мерках.» → «Посчитай, сколько маленьких квадратов заняло бы всё поле. Как из площади одного квадрата узнать его сторону?»

These seven provenance identities are unused in the baseline. A #1 has many correct arrangements and the existing numeric/set responses do not directly grade the original construction. A #3 is a lower-priority near-match to existing cutting/counting coverage. Defer C #8 until the diagram, variant and matching-answer representation are reconciled. B #2 and C #2 both train tiling, so avoid putting them in the same Pack. The list still needs independent corpus-duplicate and Grade 5 suitability review.

## Researcher queue

These source matches and answer checks are from the read-only research pass. Candidate approval requires exact adaptation and independent review.

| Archive pair                                                                                                                                                                                                                                                 | Shortlist and page evidence                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [2021/22 school tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf) · [solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf)       | #3 street covering, pp. 4–5 / 9, unique B/G/H by exhaustive triplets. #4 overlap area, p. 5 / pp. 9–10, answer 6. #8 equal perimeters, p. 6 / pp. 12–13, answer 40. Verify the diagrams before drafting.                                                                                                            |
| [May 2021 invitational tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/tasks-math-5-prigl-msk-21-22.pdf) · [solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/sol-math-3-10-prigl-msk-21-22.pdf) | #2 ordering by fruit weights, p. 1 / pp. 9–10, unique assignment among 120 permutations. #3 clock chimes, p. 1 / p. 10, answer 43. #4 dance, p. 2 / p. 10, answer 14 by double counting. #7 partial-order counting, p. 2 / pp. 12–13, answer 12, pending graph confirmation.                                        |
| [May 2022 invitational tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/tasks-math-5-prigl-msk-22-23.pdf) · [solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/sol-math-5-prigl-msk-22-23.pdf)    | Solution header says 2021/22 despite the archive path. #2 variant 1, pp. 2 / 3, age-order matching, options 3 and 6. #3 variant 1, pp. 4 / 5, opposite-face pairing, options 8, 9 and 10. #6 variant 1, pp. 12 / 11, matchstick maximum 7705 by checking 9,000 four-digit candidates, pending diagram confirmation. |

Reject 2022/23 school #3 variant 1. Its mathematical conditions duplicate the existing `rectangle-knight-count` task even though the existing provenance points to a different task number. Keep the existing ID and definition intact. Verify the provenance discrepancy separately before proposing a correction.

## Rights and release gates

The owner stated in the current delivery assignment that the necessary permissions for the intended historical content use had been obtained, and authorized implementation and scoped branch publication. This is an owner attestation. External verification of permission or human mathematical and educational review was not performed. The [repository attribution procedure](../05-development/content-sources-attribution-v1.md) and separate Production release gates remain applicable.

## Batch 1 registration

| Pack | Ordered problem IDs                                                              |
| ---- | -------------------------------------------------------------------------------- |
| V    | `treasure-around-table`, `marked-rectangle-cell`, `street-crossing-coverage`     |
| W    | `square-columns-perimeter`, `raised-cell-tilings`, `two-outlines-rectangle-area` |
| X    | `three-candy-box-balances`, `fruit-weight-order`, `dance-attendance`             |
| Y    | `hidden-double-topping`, `family-age-order`, `cube-opposite-sums`                |

For the May 2021 invitational tasks, the date in the PDFs governs the 2020/21 academic-year field. For the May 2022 sources, use 2021/22 as stated in the solution document. Preserve the archive URL's folder verbatim in both cases.

The local catalog has 81 problems in 25 Packs, including 72 historical problems and nine original problems. Remaining to 102 total: 21. The specified 33 additions reach 93 historical problems because the baseline contains 60 historical problems.

## Batch 2 registration

| Pack | Ordered problem IDs                                                                       |
| ---- | ----------------------------------------------------------------------------------------- |
| Z    | `four-animal-shares`, `cap-swap-cycle`, `robot-two-distances`                             |
| AA   | `four-numbers-ten-threes`, `knights-divisor-count`, `stepped-outline-perimeter`           |
| AB   | `quest-teammate-matching`, `tower-visible-bricks`, `equal-triangle-digit-products`        |
| AC   | `filled-cookie-weight-ratio`, `houses-at-equal-intervals`, `alternating-pool-tile-layers` |

The per-problem modules record exact official PDF references and starting pages. These are all Moscow Grade 5 mathematics sources. The author verified official diagrams against the originals.

- [2026/27 school tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf) / [solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf). #2 v1 pages 3/3 (shares 509), #3 v1 pages 3/5 (matching), #5 v1 pages 6/8–9 (two starts), #6 v1 pages 7/10–11 (height 19), #8 v1 pages 9/13 (cap cycle), #4 v2 pages 5/6 (three robot cells), #7 v1 pages 8/11–12 (30 tiles).
- [2026/27 invitational tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/tasks-math-5-prigl-msk-26-27.pdf) / [solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/sol-math-5-prigl-msk-26-27.pdf). #6 pages 2/4 (two feasible first houses), #7 pages 2/4–5 (four knights), #8 pages 2/5 (100 gingerbread pieces), #5 pages 2/3 (perimeter 38). The [organizer index](https://vos.olimpiada.ru/2026/invite/tasks) confirms the academic-year designation for this May 2026 event. The official #7 divisor table has a typo for six people. The solution in the module recomputes all possibilities and confirms the official final answer.
- [2025/26 school tasks](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/school/math/tasks-math-5-sch-msk-25-26.pdf) / [solutions](https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/school/math/sol-math-5-sch-msk-25-26.pdf). #5 v1 pages 7/9. Permutation check finds exactly the first and second offered digits.

The catalog now contains 93 problems in 29 Packs, including 84 historical problems. Remaining to 102: nine.

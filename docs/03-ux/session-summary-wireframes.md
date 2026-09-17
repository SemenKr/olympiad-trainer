# Session Summary Wireframes — v0.1

## Purpose and handoff context

- **Task ID:** OT-003.4.
- **Revision:** branch `docs/ot-003-wireframes`; base `53771f7`.
- **Goal:** define concrete low-fidelity responsive wireframes for the summary shown after an explicitly completed practice session.
- **Scope:** session completion confirmation, concise qualitative overview, grouped task outcomes, next action, 360px/320px/desktop behavior, accessibility, and learner-facing Russian copy.
- **Out of scope:** final visual style, branding, colors, production components, routes, API/DB, numeric scoring, mastery formulas, recommendation implementation, Home/Progress redesign, and parent/admin UI.
- **Inputs:** Core Practice Flow, Dashboard and Progress Flow, First Visit and Student Navigation Flow, Wireframe Foundations, Practice Wireframes, Home Wireframes, and the four OT-002 research models named in the task.
- **Constraints:** the summary describes this completed session; Home answers what to do next; Progress contains broader qualitative history; one primary action; no scorecard or unsupported learner conclusion.
- **Definition of Done:** mixed results and all requested edge states have concrete wireframe variations; learner-facing categories are distinguishable without color; 360px/320px/desktop behavior and accessibility are explicit; the eight task questions are answered; whitespace checks pass.
- **Allowed actions:** create only `docs/03-ux/session-summary-wireframes.md` and run read-only validation. No commit or publication.
- **Status:** READY for review as a wireframe proposal. Textual layouts do not establish rendered usability.

## Observed facts

Session Summary is entered only after explicit `Завершить тренировку`. An unavailable next problem keeps the session unfinished and preserves its context until that choice. The summary records what happened without turning navigation completion into independent solving, mastery, or a numeric result.

The accepted models and UX flows require the summary to preserve distinctions among:

- an assessed correct response reached without meaningful help;
- an assessed successful outcome after hints or other support;
- study or reconstruction after the learner explicitly viewed a full solution;
- an explicit skip;
- an answer whose assessment is still pending; and
- assessed partial progress that is not a complete answer.

These are product and research constraints. The problem names, outcomes, and counts in the wireframes are synthetic fixtures for layout review. They do not assert real learner history or automatic grading capability.

## Interpretation and recommendation

The summary should first reassure the learner that the session is recorded, then explain a small number of useful facts, then let the learner leave the completed episode. Group task rows by learner-facing outcome rather than showing attempts, timestamps, confidence, tags, or a long event log.

Use `На главную` as the single primary action. The learner explicitly completed this session, so `Продолжить тренировку` would be ambiguous: it could mean reopening a finished session or beginning a new one. Home owns the next start/resume decision and can offer `Начать тренировку` or the one unfinished-practice action when appropriate. `Мой прогресс` remains a secondary destination.

The summary is therefore a bounded account of one episode. It can say what was solved, supported, studied, skipped, partially completed, or left awaiting assessment. Broader capability history, scope, change over time, and open learning questions belong in Progress.

### Wireframe notation and fixtures

- `[[ Russian label ]]` marks the single primary action. `[ Russian label ]` marks a secondary action. These marks are internal annotations, not final styling.
- All text inside wireframe boxes is learner-facing Russian. English headings and notes are internal annotations.
- The 360px sketches assume 16px side gutters and 328px usable width. The 320px review leaves 288px.
- `Числа из карточек`, `Размен`, `Путь по клеткам`, `Делители`, `Доказательство`, and `Фигуры` are synthetic short identifiers.
- Text labels carry the outcome meaning. Color, icons, badges, stars, or shape are optional later styling and must not be the only status signal.
- Each actionable target reserves about 44 × 44px or more. Wrapped labels grow vertically; no row depends on a sideways-scrolling table.

## 360px Session Summary

### Mixed-result completed session

This is the primary 360px composition. The learner explicitly chose to finish the session; the summary does not imply that every problem was solved.

```text
[ Главная ] [ Мой прогресс ]
-----------------------------
Итоги тренировки

Тренировка завершена
Здесь собраны результаты этой
тренировки.

Что получилось
Одну задачу ты решил сам.
В одной задаче получилось
с подсказкой.

Что осталось
Одну задачу ты пропустил.
Один ответ пока не проверен.

Результаты задач

Решено самостоятельно
Задача 1 · Числа из карточек

Получилось с подсказкой
Задача 2 · Размен
Подсказка помогла найти ход.

Посмотрено полное решение
Задача 3 · Путь по клеткам

Задача пропущена
Задача 4 · Делители

Ответ пока не проверен
Задача 5 · Доказательство
Результат ещё неизвестен.

Часть ответа верна
Задача 6 · Фигуры
Часть решения получилась,
осталась ещё одна часть.

[[ На главную                 ]]
[ Мой прогресс                ]
```

**Primary:** `На главную` returns to Home after explicit session completion. Home then presents the next useful action. It does not reopen a completed session or silently start another problem.

**Secondary:** `Мой прогресс` opens broader qualitative history. There is no direct task picker, score, streak, or competing `Начать тренировку` action here.

**Reading order:** completion confirmation → concise overview → grouped outcomes → one primary continuation. The task list remains factual and short enough to scan; long details stay in the relevant Practice episode or Progress.

### Task-level row convention

Each row has at most three parts:

1. a short problem identifier/title;
2. one learner-friendly outcome label; and
3. one short support or uncertainty note only when it changes meaning.

Do not show every attempt, hint timestamp, raw answer, internal tag, or model explanation by default. A row can be opened later if a separate product decision provides a useful detail path; this document does not design that interaction.

## Result categories

| Internal result boundary | Learner-facing label | Optional plain-language note | Do not imply |
| --- | --- | --- | --- |
| Assessed correct with no meaningful support observed | `Решено самостоятельно` | Omit the note or say `Ответ принят.` | A universal ability, a score, or mastery of every related idea. |
| Actual assessed successful outcome after meaningful hints/support, before any full-solution-based reproduction | `Получилось с подсказкой` | `Подсказка помогла найти ход.` only when the observed work supports that explanation. | Success from hint use or navigation alone, failure, penalty, or independent strategy selection. |
| Full solution explicitly viewed; subsequent work relies on that solution | `Посмотрено полное решение` | Keep any valid earlier assessed result or pending submission visible separately. | Independent solving from later reproduction, automatic failure, or replacement of a valid pre-viewing result. |
| Explicit learner skip | `Задача пропущена` | `Можно вернуться к похожей задаче позже.` only when supported by a real next action. | A weak learner, an incorrect answer, or positive progress. |
| Submitted response not yet safely assessed | `Ответ пока не проверен` | `Результат ещё неизвестен.` | Correctness, incorrectness, partial correctness, or permanent cancellation of assessment. |
| Assessed valid component without a complete accepted answer | `Часть ответа верна` | `Часть решения получилась, осталась ещё одна часть.` | Full correctness, failure, or a capability diagnosis beyond the assessed part. |

`Решено самостоятельно` requires an assessed successful outcome with the relevant independent-work context. `Получилось с подсказкой` requires an actual assessed successful outcome after support. Receiving hints, moving on, skipping, waiting for assessment, or viewing a full solution never suffices.

Keep partial, pending, skipped, and full-solution-based work distinct even when hints were used earlier. A support note may accompany the actual outcome without changing its category. A valid result assessed before later solution viewing retains its original label; add `После этого открыто полное решение.` as context. A pending pre-viewing submission remains `Ответ пока не проверен` with `После отправки открыто полное решение.` Later reproduction cannot rewrite either record. This uses the existing result-plus-note pattern, without adding an attempt log.

For example, an independently solved task later studied keeps `Решено самостоятельно`; an assessed partial response later studied keeps `Часть ответа верна`. If only solution-based work is available, use `Посмотрено полное решение` without inventing earlier success. An explicit skip is `Задача пропущена`; hint use before the skip does not make it supported success.

## State variants

All variants reuse the mixed-result shell. They replace the overview and outcome groups while keeping the same navigation, heading order, one primary `На главную` action, and secondary `Мой прогресс` path.

### All tasks completed independently

```text
Итоги тренировки

Тренировка завершена

Что получилось
Все задачи этой тренировки
решены самостоятельно.

Результаты задач
Решено самостоятельно
Задача 1 · Числа из карточек
Задача 2 · Размен
Задача 3 · Путь по клеткам

[[ На главную             ]]
[ Мой прогресс            ]
```

This is a concise factual description of the recorded session. It does not add stars, a grade, a percentage, or a claim that all related capabilities are permanently reliable.

### Session with heavy support but useful progress

```text
Итоги тренировки

Тренировка завершена

Что получилось
В нескольких задачах подсказки
помогли продолжить решение.
Это тоже полезная практика:
ты увидел, где искать следующий ход.

Результаты задач
Получилось с подсказкой
Задача 1 · Числа из карточек
Задача 2 · Размен
Задача 3 · Фигуры

[[ На главную             ]]
[ Мой прогресс            ]
```

This fixture assumes actual assessed successful outcomes after support for the listed tasks. If help only enabled partial work, or the learner moved on pending assessment, skipped, or studied the full solution, use those actual outcome labels and a truthful overview instead. Useful participation alone does not establish supported success.

### Session with pending assessment

```text
Итоги тренировки

Тренировка завершена

Что осталось неизвестным
Один ответ пока не проверен.
Результат ещё неизвестен.

Результаты задач
Ответ пока не проверен
Задача 1 · Доказательство

Пропущено
Задача 2 · Делители

[[ На главную             ]]
[ Мой прогресс            ]
```

The summary does not promise when assessment will arrive. The original submission remains a pending record; the summary does not relabel it as solved, failed, or partially correct. If the learner later opens a permitted solution, the earlier submission and later solution study remain distinct in the relevant record.

### Very short session

```text
Итоги тренировки

Тренировка завершена

За эту тренировку ты решил
одну задачу сам.

Решено самостоятельно
Задача 1 · Числа из карточек

[[ На главную             ]]
[ Мой прогресс            ]
```

The frame assumes an assessed independent success. For another single-task outcome, replace **both the overview and result label**, keeping the same layout and actions:

| Actual outcome | Learner-facing overview | Result label |
| --- | --- | --- |
| Assessed independent success | `За эту тренировку ты решил одну задачу сам.` | `Решено самостоятельно` |
| Assessed success after hints/support | `За эту тренировку ты решил одну задачу с подсказкой.` | `Получилось с подсказкой` |
| Pending assessment | `Ты отправил ответ на одну задачу. Результат пока неизвестен.` | `Ответ пока не проверен` |
| Assessed partial result | `В одной задаче часть ответа верна.` | `Часть ответа верна` |
| Explicit skip | `В этой тренировке одна задача была пропущена.` | `Задача пропущена` |
| Full-solution study without an earlier valid assessed result or pending submission to retain | `В одной задаче ты открыл полное решение.` | `Посмотрено полное решение` |

For a valid assessed result before later solution viewing, keep its outcome-specific overview and label, and add the solution-study note described above. Pending pre-viewing work likewise retains its pending status. Do not claim that opening a solution proves understanding, or infer broader capability from a short session.

### Session ended after skips or little assessable work

```text
Итоги тренировки

Тренировка завершена

Пока мало проверенных ответов,
чтобы рассказать, что получается.
Это можно продолжить в другой
тренировке.

Результаты задач
Задача пропущена
Задача 1 · Делители
Задача 2 · Фигуры

[[ На главную             ]]
[ Мой прогресс            ]
```

This is an honest low-information state. It does not call the learner weak, show zero progress, or invent a capability conclusion. If there is pending work, say `Ответ пока не проверен` separately rather than counting it as a skip.

### Summary with secondary-content failure

```text
Итоги тренировки

Тренировка завершена

Что получилось
Основные результаты тренировки
сохранены.

Недавние пояснения
Не удалось загрузить пояснения.
[ Повторить загрузку ]

Результаты задач
Решено самостоятельно
Задача 1 · Числа из карточек

[[ На главную             ]]
[ Мой прогресс            ]
```

The primary action remains `На главную` because the completed-session summary and task result are still available. Retry belongs to the failed secondary region in both reading and keyboard order. The primary-record-failure frame is excluded from the initial low-fidelity Figma set. Its recovery action remains a separate product decision before that specific state is designed or implemented; it does not block normal Session Summary frames.

## Home and Progress relationship

| Destination | Learner question | Summary boundary |
| --- | --- | --- |
| Session Summary | `Что произошло в этой тренировке?` | Show this session's outcomes, support context, pending work, and bounded next-step wording. |
| Home | `Что мне делать сейчас?` | After `На главную`, choose Start, Resume, or another accepted Home action. Do not repeat the full outcome list. |
| Progress | `Что моя работа показывает со временем?` | Offer broader qualitative history, scope, recent change, and open learning questions. Do not make the summary a capability dashboard. |

The summary may link to Progress secondarily, but it should not duplicate Progress's capability groupings, detailed change history, or open diagnostic questions. A short reason for future practice belongs on Home when a suitable practice action exists.

## 320px stress-test

At 320px, the usable width is about 288px. Preserve the hierarchy and let every label grow vertically.

```text
[ Главная ]
[ Мой прогресс ]

Итоги тренировки

Тренировка завершена

Что получилось
Одну задачу ты решил сам.
В одной задаче получилось
с подсказкой.

Что осталось
Один ответ пока не проверен.

Результаты задач

Решено самостоятельно
Задача 1 · Числа из
карточек

Получилось с подсказкой
Задача 2 · Размен
Подсказка помогла найти ход.

Посмотрено полное решение
Задача 3 · Путь по клеткам

Ответ пока не проверен
Задача 5 · Доказательство
Результат ещё неизвестен.

[[ На главную       ]]

[ Мой прогресс      ]
```

Material 320px behavior:

| Region | Response | Acceptance check |
| --- | --- | --- |
| Navigation | Stack the two text destinations when needed. | Each target remains about 44px high and the current destination is conveyed without color alone. |
| Confirmation and overview | Wrap normal Russian text; never truncate or line-clamp. | The learner can understand completion and pending status at 200% text size. |
| Outcome groups | Stack group heading, title, and support note. | No dense table or sideways-scrolling list is required. |
| Long result label | Allow multiple lines, such as `Посмотрено полное решение` or `Результат ещё неизвестен.` | Text remains attached to the correct row and is not clipped. |
| Primary action | Full available width near the end of the summary. | Exactly one primary action remains reachable by keyboard and touch. |
| Secondary retry | Keep retry inside its failed supporting region. | It cannot compete with `На главную`. |

No fixed-height result panel, horizontal page overflow, compressed icon-only status, or fixed bottom action bar is introduced. The sketches do not prove pixel fit or assistive-technology behavior; rendered validation remains required.

## Desktop adaptation

Use a centered reading envelope around 760–960px. The confirmation and overview remain first. On sufficiently wide screens, grouped task outcomes may use two adjacent readable columns while preserving one reading and keyboard order.

```text
  [ Главная ]                                  [ Мой прогресс ]
  ------------------------------------------------------------

  Итоги тренировки
  Тренировка завершена

  ┌────────────────────────────────────────────────────────┐
  │ Что получилось                                         │
  │ Одну задачу ты решил сам. В одной получилось           │
  │ с подсказкой.                                          │
  │                                                        │
  │ Что осталось                                           │
  │ Одна задача пропущена. Один ответ пока не проверен.    │
  └────────────────────────────────────────────────────────┘

  Результаты задач
  ┌────────────────────────────┐  ┌────────────────────────────┐
  │ Решено самостоятельно      │  │ Получилось с подсказкой     │
  │ Задача 1 · Числа из...     │  │ Задача 2 · Размен           │
  │                            │  │ Подсказка помогла найти ход.│
  ├────────────────────────────┤  ├────────────────────────────┤
  │ Посмотрено полное решение  │  │ Ответ пока не проверен      │
  │ Задача 3 · Путь по клеткам │  │ Задача 5 · Доказательство   │
  └────────────────────────────┘  └────────────────────────────┘

  [[ На главную ]]              [ Мой прогресс ]
```

The outlines communicate grouping only; they do not define cards, borders, or production components. If columns make long titles or notes harder to read, return to one vertical list. Desktop adds room for grouping and line length, not charts, metrics, filters, task pickers, or capability panels.

## Shared patterns and accessibility

- Use one semantic heading for `Итоги тренировки`, followed by a completion status heading and ordered outcome groups. Keep each task title with its result and support note.
- Reading and keyboard order follow the rendered semantic regions: skip-to-content, Home, Progress, summary heading, completion status, overview, outcome groups, then the final Home/Progress actions. A local error and its Retry control stay together at their actual position. In the secondary-failure frame, Retry follows the error before the outcome groups; it is not moved after the final navigation. Desktop adjacency preserves this order.
- Every action has a descriptive accessible name, visible focus, and a target of about 44 × 44px or larger. Long labels wrap; no icon is the only indication of an outcome.
- Status meaning is carried by text such as `Решено самостоятельно`, `Получилось с подсказкой`, `Задача пропущена`, `Ответ пока не проверен`, and `Часть ответа верна`. Color, if added later, is supplementary.
- Announce `Тренировка завершена` as the page status after navigation. A secondary-content failure is announced beside its region and does not steal focus from the primary continuation.
- Preserve the learner's reading position at the summary heading after navigation. Do not auto-expand a task, open a solution, or move focus because a pending assessment changes later.
- Reflow at 320px, 360px, 200% text size, and desktop zoom. No fixed header, fixed footer, or result column may cover focused content.

## Alternatives and consequences

| Decision | Alternative | Recommendation and consequence |
| --- | --- | --- |
| Primary action | `Продолжить тренировку` or `На главную` | Use `На главную` after explicit completion. It clearly exits the completed episode; Home owns whether the next action is Start or Resume. |
| Outcome presentation | One chronological event log; one dense analytics table; grouped factual outcomes | Use grouped outcomes with short rows. This preserves meaning and scanability without exposing implementation records. |
| Progress relationship | Repeat capability history in Summary; omit Progress entirely; provide a secondary Progress destination | Provide secondary `Мой прогресс` and keep capability history in Progress. This supports exploration without competing with the exit action. |
| Weak evidence | Show zero/low score; hide the session; claim a neutral conclusion | Say that there are not yet enough checked answers and describe recorded skips/pending work. This is honest without judging the learner. |

These are reviewable information choices. They do not select components, breakpoints, routing, storage, scoring, or a recommendation algorithm.

## Explicit answers and OT-003.5 handoff

1. **What should dominate Session Summary?** Calm completion confirmation, a concise qualitative overview, grouped factual outcomes, and one clear exit action. The summary itself should not become a dashboard.
2. **What is the best primary action after explicit completion?** `На главную`. The session is already complete; Home decides whether the learner should start a new session, resume another unfinished one, or see an availability state. `Мой прогресс` stays secondary.
3. **How much task-level detail is useful?** A short identifier, one outcome label, and a support or uncertainty note only when it changes interpretation. Omit raw attempts, timestamps, internal tags, and long diagnostics by default.
4. **How should independent, supported, solution-study, skipped, partial, and pending outcomes differ?** Use distinct text labels and concise notes: `Решено самостоятельно`, `Получилось с подсказкой`, `Посмотрено полное решение`, `Задача пропущена`, `Часть ответа верна`, and `Ответ пока не проверен`. Never rely on color alone.
5. **How should a weak-evidence session be described without judging the learner?** `Пока мало проверенных ответов, чтобы рассказать, что получается.` Keep skips, pending responses, and any supported work factual and separate.
6. **What belongs in Progress instead?** Broader capability groupings, scope, qualitative change over time, support and independence patterns across sessions, and bounded open learning questions. Summary can offer a secondary `Мой прогресс` link.
7. **Does desktop need more information than mobile?** No. It may use more line length or two readable outcome columns, but it keeps the same categories, order, primary action, and learner meaning.
8. **What should OT-003.5 wireframe next?** Progress: first-visit empty history, qualitative capability groupings, recent change, open learning questions, and the return path to Home. It should reuse Summary's plain language without turning categories into scores.

## Verification gaps and open questions

- Learner testing should verify that `На главную` feels like the correct exit after explicit completion and that learners do not expect `Продолжить тренировку` to reopen the finished session.
- Test whether `Посмотрено полное решение` is understood by grades 5–6 as study rather than independent solving; adjust wording only with evidence.
- Confirm how much task-level grouping learners can scan at 320px before the summary feels long. Do not solve this by hiding status labels or using color-only compression.
- Product/content work must define which answer types can produce a meaningful partial result and which remain awaiting assessment. These wireframes preserve the distinction without inventing grading rules.
- A secondary summary-content failure is represented. Primary-record failure is excluded from the initial low-fi Figma frame set. Decide its recovery action separately before designing or implementing that specific variant; normal Summary frames may proceed without that decision. No recovery behavior is invented here.
- ASCII wireframes cannot verify actual target geometry, focus visibility, announcements, zoom, or Russian text readability. Rendered validation remains required.

## Validation and completion

The wireframes cover the mixed-result session, all six required result categories, six requested edge states, Home/Progress boundaries, 360px/320px behavior, conservative desktop adaptation, accessibility, alternatives, and all eight handoff questions. Research-task separates accepted model constraints from synthetic examples and open validation gaps. Architecture-task compares primary-action and outcome-presentation alternatives without adopting production architecture.

Validation: `git diff --check` and the separate untracked-file whitespace check passed. No application, browser, assistive-technology, or learner tests were run by this documentation task.

**READY** — OT-003.4 Session Summary wireframes prepared for review. No commit or publication performed.

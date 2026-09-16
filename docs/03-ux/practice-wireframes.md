# Practice Wireframes — v0.1

## Purpose and handoff context

- **Task ID:** OT-003.2.
- **Revision:** branch `docs/ot-003-wireframes`; inspected HEAD/base `67d4882`; working tree clean before drafting.
- **Goal:** make the Practice experience concrete at 360px, stress-review it at 320px, and adapt it to desktop.
- **Scope:** this document only; low-fidelity layouts, state variations, Russian copy, action/feedback/support placement, responsive and accessibility annotations.
- **Out of scope:** final visual style, branding, colors, production components, routes, API/DB, grading implementation, other screen designs, and production learning content.
- **Inputs:** [Wireframe Foundations](wireframe-foundations.md), [Core Practice Flow](core-practice-flow.md), [Dashboard and Progress Flow](dashboard-progress-flow.md), and the OT-003.2 assignment.
- **Constraints:** one bounded problem column; accepted navigation and evidence semantics; English annotations, Russian UI; no page-level horizontal overflow; no automatic solution reveal.
- **Definition of Done:** all ten requested states have concrete frames or region variations; action precedence, support progression, pending assessment, long content, 320px differences, desktop adaptation, and the eight task questions are covered; whitespace checks pass.
- **Allowed actions:** create `docs/03-ux/practice-wireframes.md` and perform read-only validation. No commit or publication.
- **Status:** READY for review as a wireframe proposal. Textual stress checks do not establish rendered usability.

## Observed fact

The Foundations specify Home and Progress as the only top-level destinations, a six-region Practice hierarchy, visible secondary support, and an in-flow layout. Their review widths and spacing are starting assumptions. Core Practice permits retries, successive hints, skipping, pausing, explicit finish, and explicit solution study; it separates pending assessment from partial correctness. Dashboard/Progress requires the later summary to preserve both outcomes and help context.

These constraints determine the layouts below. No additional Learning Model policy is needed: the accepted flows already define the evidence boundaries used here.

## Interpretation and recommendation

The main design tension is keeping the next response action discoverable while the statement, feedback, and help can each grow. Use one full Practice layout with replacements for its answer, feedback, support, and continuation regions. Preserve the statement and episode context through those changes. Do not create ten destinations or ten copies of the same statement.

### Notation and fixture boundary

- `[[ Russian label ]]` marks the **one primary action**. `[ Russian label ]` marks a **secondary control**. These brackets are annotation, not final styling. Input boundaries use `| ... |`; diagram cards use small outlined boxes.
- Frames show document flow, not a promise that everything fits in one viewport. Separator lines identify regions and do not prescribe final borders. All displayed learner text is Russian; state names and notes outside frames are English.
- The 360px frame assumes 16px side gutters and 328px usable width; 320px leaves 288px. Monospaced character wrapping illustrates reflow, not measured pixel typography. All controls, including secondary links, reserve at least about 44 × 44px with additional height when labels wrap.
- **Synthetic layout fixture:** the card task, responses, hints, and session position below are invented for interface review. They are not official VSOSh content, source metadata, a learner record, or a publishable content item. The elementary numeric cases can be exhaustively checked; no reasoning-skill conclusion follows from them.
- **Fixture response contract:** list all two-digit even numbers made from the digits 1, 2, and 3, without repeating a digit within a number. The valid set is 12 and 32. `13` illustrates incorrectness; `12` illustrates an assessed incomplete set; `12, 32` illustrates a complete answer. Partial feedback is used only in a scenario where those components have actually been assessed.
- The long-response variation explicitly adds a request for an explanation. Its pending assessment is a separate scenario; the wireframe does not claim a checker can assess explanations.

## 360px Practice — full base layout

### 1. Untouched problem

```text
[ Главная ]       [ Мой прогресс ]
--------------------------------
Тренировка
Задача 2 в тренировке

Числа из карточек

Есть три карточки с цифрами
1, 2 и 3. Составь все двузначные
чётные числа из этих цифр.

В одном числе цифры не должны
повторяться. Запиши все числа.

Карточки
     ┌───┐   ┌───┐   ┌───┐
     │ 1 │   │ 2 │   │ 3 │
     └───┘   └───┘   └───┘

Твой ответ
Запиши числа через запятую.
|                              |

[[ Проверить                  ]]

[ Подсказка ]
[ Пропустить задачу ]

--------------------------------
К этой задаче можно вернуться
позже через главную.
[ Завершить тренировку ]
```

**Regions:** header/context → statement/diagram → answer/primary → feedback when present → support → continuation/session controls. The initial empty feedback region adds no blank panel. The statement has the most reading space; there are no dashboard metrics around it. The small illustration repeats the supplied digits and is optional: a text-only task simply omits that region and its caption.

**Primary:** `Проверить` is adjacent to the labeled answer. Activating it with no usable response produces a local instruction, such as `Запиши ответ перед проверкой`, not an incorrect mathematical result. The frame specifies no automatic submission while typing.

**Secondary:** hint, skip, and finish are separate stacked targets. `Показать решение` is absent from this untouched example because pre-attempt access remains conditional in the accepted flow. The user-requested reveal label is used consistently in this document; it has the same meaning as `Посмотреть решение` in Foundations, not a second action.

**Session progress:** `Задача 2 в тренировке` records position only. It does not imply two solved tasks, an official task number, a difficulty level, a fixed session length, or “2 of 4.” The learner can finish at any point. An actual source caption may be added when verified metadata exists; this synthetic example has none.

**Navigation:** Home and Progress retain the session when leaving active work; explicit finish leads to Session summary. Neither header destination is marked current while in contextual Practice. Focus-only `К содержимому` precedes the header for keyboard users. No header/action bar is fixed over the content.

## 360px state variations

Every crop below replaces the corresponding lower regions of the base frame. The full statement, diagram, header, and session controls remain unless explicitly stated. A previously opened hint remains available across attempts; assessment does not erase it. An already eligible solution-reveal control and its explanation also remain when a hint crop is applied to an attempted-response state. Use one primary action for the current state, not one for each crop combined.

### 2. Answer entered

```text
Твой ответ
Запиши числа через запятую.
| 13                           |

[[ Проверить                  ]]

[ Подсказка ]
[ Пропустить задачу ]
```

**Primary:** submit the draft. Editing or clearing it does not count as another attempt. The synthetic draft is intentionally wrong but receives no correctness label before submission. Keyboard appearance must leave the input and adjacent button reachable by normal page scrolling.

### 3. Incorrect answer

```text
Твой ответ
| 13                           |

[[ Попробовать ещё раз         ]]

Пока неверно.
Проверь ответ и попробуй ещё раз.

[ Подсказка ]
[ Пропустить задачу ]
[ Показать решение ]
Можно ещё попробовать самому
или открыть полное решение.
Если открыть решение, отправленный
ответ сохранится отдельно.
Работа после просмотра опирается
на готовое решение и не считается
самостоятельным решением этой задачи.
```

**Primary:** retry focuses the preserved response, returning the primary label to `Проверить`. Directly editing the response has the same effect; a separate click on retry is not mandatory. Prior feedback remains identifiable as belonging to the previous submission until a new result arrives.

**Feedback:** directly after the answer/action, before help. This bounded wording neither guesses the cause nor supplies a solution step. For screen readers, announce the result without unexpectedly moving focus to the top of the task.

**Reveal:** this crop represents a meaningful attempted response and an available explicit solution choice. Merely receiving an error does not open the solution. Show the explanation beside the reveal action when it is available: `Можно ещё попробовать самому или открыть полное решение. Если открыть решение, отправленный ответ сохранится отдельно. Работа после просмотра опирается на готовое решение и не считается самостоятельным решением этой задачи.` No fixed number of retries is required.

### 4. Focus hint opened

This crop shows a hint requested while a draft is being entered. There is no assessed result yet.

```text
Твой ответ
| 13                           |
[[ Проверить                  ]]

Подсказка 1
Обрати внимание: нужны только
чётные числа.

[ Следующая подсказка ]
[ Пропустить задачу ]
```

**Primary:** remains `Проверить`. If the same hint is opened from incorrect feedback before editing, retain that feedback and the `Попробовать ещё раз` primary instead. A hint changes support context, not assessment state.

**Disclosure:** `Подсказка` opens only the first hint in the inline support region. Its heading/content is announced as newly available; focus stays on a stable help control position or moves to the requested hint heading, with the final choice to be tested. Never jump to the page heading. The next hint stays behind its own explicit secondary action. This pre-attempt example does not resolve pre-attempt full-solution eligibility.

### 5. Deeper hint/support — strategy and next-step

Strategy is an internal annotation; the learner sees successive hint numbers. After explicitly requesting the second hint, the support region becomes:

```text
Твой ответ
| 13                           |
[[ Проверить                  ]]

Подсказка 1
Обрати внимание: нужны только
чётные числа.

Подсказка 2
Сначала выбери последнюю цифру.
Какая из трёх цифр может стоять
в конце чётного числа?

[ Следующая подсказка ]
[ Вернуться к ответу ]
[ Пропустить задачу ]
```

The third explicit request appends this next-step content in the same region:

```text
Подсказка 3
Поставь 2 в конце числа.
Какие оставшиеся цифры можно
поставить перед ней?
```

The two earlier hints remain above it. There is no sidebar, modal, alternate Practice mode, or requirement to submit another answer between hints. `Вернуться к ответу` is a secondary anchor that focuses the response without submitting it. Once the third hint opens, apply the exhausted-help crop below; there is no fourth hint button.

### 6. Partially correct

```text
Твой ответ
| 12                           |

[[ Попробовать ещё раз         ]]

12 подходит.
Но найдены ещё не все числа.
Попробуй дополнить ответ.

[ Подсказка ]
[ Пропустить задачу ]
[ Показать решение ]
```

**Evidence-sensitive:** this frame assumes a verified partial assessment of the fixture. It does not classify an unreviewed explanation as partially correct. Retry preserves `12` and permits adding to it; all previous help stays recorded. The full answer is not labeled correct or complete. Reveal uses the same adjacent explanation as the incorrect state.

### 7. Awaiting assessment

For the explanation variation, the statement adds `Объясни, почему других подходящих чисел нет.` The answer area accepts the required list and explanation as described in the long-content section. After submission it becomes a readable submitted-response region, not an empty editor.

```text
Отправленный ответ
12, 32.
В конце чётного числа должна
стоять цифра 2. Перед ней можно
поставить 1 или 3.

Ответ отправлен, но пока
не проверен.
Можно подождать здесь или
вернуться к задаче позже.

[[ На главную                 ]]

[ Продолжить без проверки ]
Ответ пока не проверен.
Его результат ещё неизвестен.
Продолжение не отменяет отдельную
проверку, если она станет доступна.

[ Показать решение ]
Можно открыть полное решение.
Отправленный ответ сохранится
отдельно. Работа после просмотра
опирается на готовое решение и не
считается самостоятельным решением
этой задачи.

[ Завершить тренировку ]
```

**Primary:** `На главную` pauses, preserving the submission and pending status. Waiting requires no click. `Продолжить без проверки` is the secondary skip/continue choice: it requests the next task while leaving this response unclassified. Do not duplicate it with a separate `Пропустить задачу` control in this state. Explicit finish leads to summary with the pending response intact.

**Evidence-sensitive:** no correct/incorrect/partial badge and no editable replacement of the submitted original. Previously opened hints remain readable below the pending message/actions where present, but no new attempt is silently submitted. An explicit solution reveal switches to the solution-exposed variation. Subsequent work does not become an independent answer; the original submission may still be assessed where possible. No grader, queue, notification service, or promised completion time is specified.

### 8. Correct — including supported success

```text
Твой ответ
12, 32

Верно! Найдены все числа.
Ты использовал подсказку.

[ Открытые подсказки ]
[ Показать решение ]
Можно перейти дальше или открыть
полное решение для разбора.
Если открыть решение, отправленный
ответ сохранится отдельно; работа
после просмотра опирается на
готовое решение и не считается
самостоятельным решением этой задачи.

[[ Следующая задача            ]]
[ Завершить тренировку ]
```

**Primary:** next-task continuation replaces the submit/retry action. The example is successful work after a hint; the help sentence is neutral context, not a deduction, warning, or lesser success style. If no hint was opened, omit that sentence. Use `Решено самостоятельно` only when the recorded episode supports that stronger claim; a correct list alone does not establish the reasoning used.

For this outcome crop, the already read hints may be collapsed under `Открытые подсказки` to keep the result and continuation together; they remain accessible and their exposure is retained. No future hints are disclosed by that control. Solution comparison remains an explicit secondary action where offered. There is no skip button because the problem already has a correct outcome.

### 9. Solution exposed

This crop follows explicit reveal after the incorrect answer; the statement stays above it.

```text
Твой ответ
13
Предыдущий ответ неверный.

Решение открыто

Чтобы число было чётным,
последняя цифра должна быть
чётной. Из цифр 1, 2 и 3
подходит только 2.

В начале можно поставить 1
или 3. Получаются 12 и 32.
Других вариантов нет.

Можно разобрать решение
или перейти к следующей задаче.
После просмотра работа опирается
на готовое решение и не считается
самостоятельным решением этой задачи.

[[ Следующая задача            ]]
[ Завершить тренировку ]
```

**Evidence-sensitive:** earlier outcomes remain facts about earlier submissions. If entered from pending assessment, replace the incorrect sentence with `Ответ, отправленный до открытия решения, пока не проверен.` If entered after a correct answer, retain the correct result; later exposure does not retroactively erase it.

**Primary:** next task appears after the solution, with no forced reading timer or automatic advance. Earlier hints remain available in the support region but do not appear as more help to unlock. The learner may reconstruct on paper or, where the existing response interaction permits, use a secondary `Записать своё объяснение` action; that work is labeled `Работа после просмотра решения` and cannot overwrite or relabel the original attempt. This does not introduce a new editor or grading mode.

### 10. All hints exhausted

This is the footer of the third opened hint, not a separate page or a new step after it. In this example a draft is being edited after an incorrect submission; the retained answer and primary action appear above the three hints.

```text
Твой ответ
| 13                           |
[[ Проверить                  ]]

Подсказка 3
Поставь 2 в конце числа.
Какие оставшиеся цифры можно
поставить перед ней?

Все подсказки открыты.
Можно ещё подумать над задачей
или открыть полное решение.
После просмотра работа опирается
на готовое решение и не считается
самостоятельным решением этой задачи.

[ Вернуться к ответу ]
[ Пропустить задачу ]
[ Показать решение ]
[ Завершить тренировку ]
```

The crop omits hints 1–2 for brevity; they are retained immediately before hint 3 in the full layout. `Следующая подсказка` is removed, not left as an unexplained disabled control. If the underlying response is incorrect and editing has not begun, use `Попробовать ещё раз` as primary. Exhausting help itself produces neither failure nor a revealed solution. The illustrated reveal option assumes the accepted conditions for solution study are met; pre-attempt access remains conditional.

## Solution visibility and action precedence

Use `Показать решение` as a consistently secondary, explicit choice to read the complete solution. It may appear after a meaningful attempt, progressive support, or a permitted choice to stop independent work and study. It is also available in pending assessment and after correct work where the accepted flow permits it. These are scenario conditions, not a fixed retry count or a requirement to exhaust hints. No result, skipped task, timeout, or exhausted-help message activates it automatically.

The untouched frame does not decide whether pre-attempt reveal is allowed. If that product option is later adopted, it needs the accepted acknowledgement before opening the solution; leave that conditional path annotated rather than inventing a mandatory gate for all solution views.

Precedence is: pending assessment keeps its pause/continue choices until resolved or explicitly left; a known result determines retry/next; editing uses submit; hint expansion alone retains the underlying action; solution exposure uses next with earlier results preserved. Only one `[[...]]` control exists in the assembled state. Expanded help is secondary even when it occupies more vertical space than the answer.

### Supporting transition variations

These notes close the flow without adding full screens:

| Situation | Local layout change and control |
| --- | --- |
| Invalid/empty input | Keep the draft and primary `Проверить`; place a concrete format instruction next to the response. Do not record a mathematical error. |
| Checking | Replace the primary button content with `Проверяем ответ…` in its busy state. Prevent duplicate submissions; leaving retains pending context. |
| Requesting the next task | Show `Подбираем задачу…` where continuation was activated; pause/finish remain possible. |
| No appropriate next task | Show `Сейчас нет подходящей задачи. Можно вернуться позже.` Primary `На главную`; secondary `Завершить тренировку`. Preserve outcomes; no invented substitute task or automatic session finish. |
| Recoverable blocking load failure | Show `Не удалось загрузить задачу.` Primary `Попробовать ещё раз`; navigation and finish remain available. Loading retry does not resubmit a pending answer. |
| A secondary region fails to load | Keep the screen's main action; local retry remains secondary. An unreadable essential diagram is a blocking failure, not optional missing decoration. |
| Skip | `Пропустить задачу` requests the next task with skipped context retained; there is no separate confirmation/completion page. If no task is available, use the unavailable variation. Skip alone is no negative capability conclusion. |
| Pause, reload, or return | Restore the draft where available, submitted response, prior results, opened hints, solution exposure, and pending status. Restore orientation near the active interaction rather than creating a fresh attempt. |
| Finish | `Завершить тренировку` leads to Session summary with actual outcomes and support/pending context; it does not label all opened tasks solved. |

## Long-content stress case at 360px

Use this expanded statement in the same statement region. It restates the fixture with explicit reuse instructions and adds the explanation requirement for the long-response scenario. It is a layout fixture, not a claim about typical olympiad difficulty or statement length.

```text
Числа из карточек

На столе лежат три карточки:
с цифрами 1, 2 и 3. На каждой
карточке написана одна цифра.
Из двух карточек нужно составить
двузначное чётное число.

Для каждого нового числа снова
можно использовать любые две
карточки. Но внутри одного числа
цифры не должны повторяться:
каждую карточку берут один раз.

Найди все числа, которые можно
составить по этим правилам.
Запиши их и объясни, почему
других подходящих чисел нет.

Карточки
     ┌───┐   ┌───┐   ┌───┐
     │ 1 │   │ 2 │   │ 3 │
     └───┘   └───┘   └───┘

Твой ответ и объяснение
| Я получил 12 и 32. Сначала    |
| я выбрал последнюю цифру.     |
| Число должно быть чётным,    |
| поэтому в конце будет 2.     |
| Перед ней можно поставить 1 |
| или 3. Цифру 2 ещё раз       |
| брать нельзя. Так я проверил |
| все варианты первой цифры.  |

[[ Проверить                  ]]
[ Подсказка ]
[ Пропустить задачу ]
```

The full statement remains expanded; it has no internal vertical scroll box. The response grows vertically and wraps rather than becoming a single horizontally scrolling input. Submitted long work remains readable in the same flow. Keeping all of this above the fold is neither feasible nor required. The primary action remains adjacent to the end of the response; long answers therefore move it down, which is an explicit usability risk to test rather than a reason to obscure content with a fixed bar.

For an actual diagram/image, reserve its measured aspect ratio within the content width. The small digit diagram's Russian description is `Три карточки с цифрами 1, 2 и 3.` A complex figure needs an equivalent description of its given relationships, without solving the task. Do not crop labels, distort the figure, or shrink labels into unreadability.

When details cannot be read at fitted size, the figure region adds a secondary control:

```text
Рисунок к задаче
┌──────────────────────────────┐
│       Рисунок с подписями     │
└──────────────────────────────┘
[ Увеличить рисунок ]
```

This is a size placeholder, not a substitute for alt text or a production illustration. The local enlarged state provides `[ Увеличить ]`, `[ Уменьшить ]`, keyboard-accessible movement when needed, and `[ Вернуться к задаче ]`. Return restores the figure's focus/reading position. Pinch/drag is not the sole means of inspection. The page never widens with the image; only its inspection region may pan. An indivisible wide formula similarly gets a bounded keyboard-accessible local scroll area, not horizontal page scrolling.

## 320px stress review — material differences only

The same 16px gutters leave 288px. Do not introduce a different screen, smaller type, icon-only actions, or a second navigation model. Rewrap the long-content fixture and the widest controls, preserving the same reading order. Representative changed regions:

```text
[ Главная ]
[ Мой прогресс ]

Тренировка
Задача 2 в тренировке

Для каждого нового числа
снова можно использовать
любые две карточки. Но внутри
одного числа цифры не должны
повторяться: каждую карточку
берут один раз.

Карточки
   ┌───┐  ┌───┐  ┌───┐
   │ 1 │  │ 2 │  │ 3 │
   └───┘  └───┘  └───┘

Твой ответ и объяснение
| Сначала я выбрал          |
| последнюю цифру. Число    |
| должно быть чётным,       |
| поэтому в конце будет 2. |

[[ Проверить              ]]
```

The two header links may stay on one row if their actual text and target areas fit. The stack above is the safe reflow variant, also used with enlarged text; it is not a mandatory 320px breakpoint. The crop shows part of the long statement/answer, not a truncation policy: every omitted paragraph remains in the real page.

Pending assessment demonstrates a deliberately wrapped secondary label:

```text
Ответ отправлен, но пока
не проверен.

[[ На главную             ]]

[ Продолжить              ]
[ без проверки            ]

Ответ пока не проверен.
Его результат ещё неизвестен.
Продолжение не отменяет отдельную
проверку, если она станет доступна.
[ Показать решение ]
[ Завершить тренировку ]
```

`Продолжить без проверки` is **one target with a two-line label**, not two controls. Its full accessible name remains intact. Every label can grow vertically; no ellipsis or clipped second line is acceptable.

| Stress item | Material reflow from 360px | Textual review result / later acceptance check |
| --- | --- | --- |
| Multi-paragraph statement | More wrapped lines; all paragraphs retained. | Reading order survives. Later rendering must confirm actual glyph widths and line spacing. |
| Diagram | Smaller fitted width; digit fixture still fits schematically. Dense labels may require the enlargement action sooner. | Preserve all labels/aspect ratio; real figures must be tested individually. |
| Long response | More lines and greater vertical height. | Primary stays immediately after response. Check caret visibility and reaching the action with the keyboard open. |
| Primary action | Full available width, wrapping if needed. | At least about 44px tall; no conflict with secondary controls. Do not reduce text size to fit. |
| Secondary controls/navigation | Remain stacked or wrap into taller targets. | About 44 × 44px minimum per target; the two-line pending action is a single control. |
| Feedback and hints | Grow naturally; no fixed-height panels. | Prior feedback stays before hints. `Вернуться к ответу` avoids scrolling blindly back through long help. |
| Text zoom / long Russian labels | Header and controls may stack earlier. | At 200% text size, all content and controls must remain reachable without clipping or page-level horizontal overflow. |

**Result:** no region requires a fixed minimum width beyond the available content area; all ordinary content has an explicit wrap/stack path. This is a structural stress review of Markdown sketches, not a measured browser pass. Touch areas, on-screen keyboard overlap, focus visibility, and actual image labels remain rendered-test requirements.

## Desktop adaptation

At a review width around 1280px, center a roughly 640–720px reading column. Blank surrounding space is intentional. The horizontal application header contains only the existing destinations; no Practice sidebar, statistics, or separate help column appears.

```text
  [ Главная ]                                     [ Мой прогресс ]
  ---------------------------------------------------------------

             Тренировка · Задача 2 в тренировке

             Числа из карточек
             Есть три карточки с цифрами 1, 2 и 3.
             Составь все двузначные чётные числа.
             В одном числе цифры не повторяются.
             Запиши все числа.

             Карточки
                    ┌───┐   ┌───┐   ┌───┐
                    │ 1 │   │ 2 │   │ 3 │
                    └───┘   └───┘   └───┘

             Твой ответ
             Запиши числа через запятую.
             | 13                              |
             [[ Попробовать ещё раз ]]

             Пока неверно.
             Проверь ответ и попробуй ещё раз.

             [ Подсказка ]
             [ Пропустить задачу ]
             [ Показать решение ]
             Можно ещё попробовать самому
             или открыть полное решение.
             После просмотра работа опирается
             на готовое решение и не считается
             самостоятельным решением этой задачи.

             [ Завершить тренировку ]
```

The desktop frame illustrates the same incorrect state. Wider prose needs fewer lines, the diagram can be larger, and the primary button can have a bounded width aligned with the answer. Controls retain their target size and keyboard access. Statement → answer → feedback → support → continuation stays unchanged, including for long work, pending responses, and expanded hints. The desktop frame abbreviates repeated statement wording only for illustration, not as a desktop content difference.

Tablet uses the same column with available gutters; it does not trigger a split view. Narrow windows or zoom collapse the header and controls using the mobile rules. Additional width buys readability and surrounding space, not additional product features. No materially different composition is needed.

## Accessibility and interaction annotations

- Reading and keyboard order follow the region order. Keyboard activation must work for submit, retry, hints, skip, finish, global navigation, and diagram inspection. Every control has visible focus and its full Russian accessible name.
- Use the Foundations' readable mobile text assumptions; no font/brand/style is selected here. Labels stay visible outside response fields. Touch targets include secondary navigation and help links, not only the primary button.
- Announce new feedback and pending status without treating color as the message. The supplied text distinguishes incorrect, partial, correct, pending, and solution-viewed states on its own.
- On retry or `Вернуться к ответу`, focus the response and bring that region into view; preserve entered work. On next-task navigation, orient the learner at the new task heading. Later assessment updates do not steal focus or auto-advance.
- On user-requested hint expansion, make the new heading/text discoverable without covering the response or losing the statement. No automatic movement occurs for unrelated background changes. Verify the eventual focus choice with keyboard and screen-reader users.
- Use meaningful Russian image descriptions and accessible enlargement. Test full text at 320px, 360px, 200% text size, and desktop zoom, including open keyboard and multiline actions. No fixed element may obscure focused content.

## Alternatives and consequences

| Choice | Alternatives | Recommendation and trade-off |
| --- | --- | --- |
| Growing hints | Inline progression; detached panel/modal. | Inline progression keeps each hint near the existing response and respects the accepted column. It lengthens the page, so include a return-to-answer action for long help. |
| Reaching the primary action | Adjacent in-flow action; fixed bottom bar. | Keep the action adjacent to response/outcome as Foundations require. Long work needs scrolling; test that cost before proposing any sticky treatment. |
| Desktop composition | Bounded single column; statement/help split. | Keep one bounded column. Fewer simultaneous regions reduce navigation changes across widths, at the cost of some desktop whitespace. |

The research-task method separates accepted flow facts from synthetic scenarios and testing gaps. The architecture-task method compares the actual layout alternatives without choosing production components or storage. These are reviewable UX proposals; dependent implementation still requires its own approved scope.

## Explicit answers and next wireframe order

1. **Is the primary action visible without competing with support actions?** Yes in each relevant interaction region: one double-bracket action, with stacked secondary support. It is not guaranteed above the fold for long statements or answers. That scrolling cost needs usability testing.
2. **Where should feedback appear?** Immediately after the response and its submit/retry action, before opened hints. In terminal/pending states, the readable submitted response precedes the result/status and its permitted actions.
3. **Where should hints appear?** Inline below feedback, in the same bounded column. Reveal one on request, retain earlier hints, and provide a return-to-answer control when help becomes long.
4. **When should `Показать решение` become visible?** As a secondary explicit study choice under the accepted attempt/support/stop conditions; also for pending assessment and optional comparison where permitted. No automatic reveal or new fixed threshold. Pre-attempt eligibility remains an open product choice.
5. **How should long tasks behave at 320px?** Full paragraphs rewrap; diagrams fit or offer enlargement; responses and labels grow vertically; controls stack and retain target size. Only indivisible math or an enlarged figure may scroll/pan locally, never the page.
6. **Does desktop need a materially different composition?** No. It changes text measure, surrounding space, header arrangement, and action width while keeping one problem column and identical state behavior.
7. **Which state is most likely to fail usability testing?** Awaiting assessment: the learner may confuse a submitted answer with a checked answer, pause with finish, or continuation with successful completion. Test these distinctions together with explicit solution reveal and retained pending work first. Exhausted hints with a long answer are the next risk because of scrolling.
8. **What should OT-003.3 wireframe next?** Home: first visit, returning learner, paused/current session, requesting/unavailable task, and secondary-history loading failure. Connect its start/resume/return actions to these Practice states and verify pause/resume continuity. Then cover Session summary and Progress in the planned sequence; no new frames for them are authored here.

## Verification gaps and open questions

- Actual 320/360px fit, reading effort, target spacing, keyboard/zoom behavior, and assistive-technology announcements cannot be measured from Markdown. No rendered usability pass is claimed.
- Validate whether `На главную` adequately communicates pausing in the pending state. The adjacent sentence makes return explicit, but learner understanding is untested.
- Resolve conditional pre-attempt solution eligibility before drawing it as a generally available control. This does not block the attempted-response or pending frames.
- Validate the focus destination after requesting a hint and whether inline help remains discoverable on long tasks. Keep any resulting revision within the accepted hierarchy.
- Real problem content needs human-reviewed statements, answers, hints, diagrams, and response requirements. The synthetic fixture checks layout and elementary response consistency; it does not validate olympiad difficulty, hints' pedagogical effectiveness, or a grading system.

## Validation and completion

All ten required states are represented with one base layout and local variants. The 320px and desktop sketches preserve the same actions and content semantics. The synthetic numeric response set was checked by exhaustive enumeration. `git diff --check` and the untracked-file whitespace check passed; only the authorized document was created. No application, browser, or learner tests were run.

**READY** — OT-003.2 Practice wireframes prepared for review. No commit or publication performed.

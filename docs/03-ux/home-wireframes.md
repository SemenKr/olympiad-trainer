# Home Wireframes — v0.1

## Purpose and handoff context

- **Task ID:** OT-003.3; clarification: OT-003.3-FIX.
- **Revision:** branch `docs/ot-003-wireframes`; inspected HEAD/base `68e4a93`; this document was the only untracked file before the clarification.
- **Goal:** create concrete responsive wireframes for the student Home experience.
- **Scope:** this document only; Home states, primary-action precedence, minimum supporting content, navigation, 360px/320px/desktop layouts, learner copy, and accessibility annotations.
- **Out of scope:** final visual style, branding, colors, production components, routes, API/DB, recommendation implementation, Session summary/Progress wireframes, and parent/admin UI.
- **Inputs:** [Wireframe Foundations](wireframe-foundations.md), [Dashboard and Progress Flow](dashboard-progress-flow.md), [First Visit and Student Navigation Flow](first-visit-navigation-flow.md), [Core Practice Flow](core-practice-flow.md), [Practice Wireframes](practice-wireframes.md), and the OT-003.3 assignment.
- **Constraints:** Home answers `Что мне делать сейчас?`; Home and Progress are the only top-level destinations; one obvious primary action; Russian learner copy; mobile first; no analytics dashboard or unsupported learner conclusion.
- **Definition of Done:** the original eight requested situations are covered by seven Home states, with current/paused work consolidated into one unfinished-practice state; 320px and desktop behavior, action precedence, secondary-content failure, accessibility, and the eight task questions are explicit; whitespace checks pass.
- **Allowed actions:** modify only `docs/03-ux/home-wireframes.md` and validate the clarification. No commit or publication.
- **Status:** READY for review as a wireframe proposal. Textual layouts do not establish rendered usability.

## Observed fact

The accepted flows, with the OT-003.3-FIX clarification, establish these Home responsibilities:

- show one situation-specific practice action: start or resume;
- explain briefly why the action is useful;
- give unfinished practice precedence over new practice;
- keep recent work factual and compact;
- treat first visit and unavailable recommendation as neutral states;
- preserve Practice state when the learner opens Home or Progress;
- keep detailed qualitative history in Progress; and
- distinguish “no suitable task” from a technical loading failure.

The Foundations add an in-flow two-destination header, 320/360px review widths, roughly 44px targets, wrapping Russian text, and the rule that a secondary-content retry cannot displace an available practice action.

These are repository facts. The examples below are synthetic UX fixtures. They do not assert that a real learner completed the described work or that a recommendation engine can currently supply these reasons.

**Clarified continuity rule:** leaving unfinished Practice and reaching Home makes that practice resumable/paused, including navigation through Progress. Home represents it once as `Тренировка не закончена`, with primary `Продолжить тренировку`. A current problem still exists within Practice and its context is retained. Leaving the screen does not finish practice; completing navigation through a problem is also distinct from finishing the practice session or solving that problem independently. No additional event, timeout, tab condition, or background state distinguishes two Home variants.

## Interpretation and recommendation

The central layout problem is precedence: several facts may be true, but only one should answer “What now?” Use one Home composition whose **current-action region changes state**. Place an optional compact supporting region after it. Do not give Start, Resume, recent summary, and Progress equal visual weight.

The minimum useful composition is:

1. two-link top-level navigation;
2. page heading and short orientation;
3. one current-action region with one primary action and, where known, one reason;
4. at most one recent-work preview containing factual outcomes; and
5. a secondary Progress path, already present in navigation and repeated contextually only when it is the useful next action.

No separate “recommended task,” “paused session,” or “recent result” page is needed. They are Home region variations.

### Wireframe notation and fixtures

- `[[ Russian label ]]` marks the single primary action. `[ Russian label ]` marks a secondary control. These marks are internal annotations, not final styling.
- All text inside frames is learner-facing Russian. English state names and notes remain outside.
- The 360px sketches assume 16px side gutters and 328px usable width. The 320px review leaves 288px. Character wrapping is illustrative rather than a measured font result.
- The synthetic Practice fixture `Числа из карточек` links continuity examples to Practice Wireframes. Recent-work and recommendation examples are also synthetic and must not be presented as real data.
- Each interactive target reserves about 44 × 44px or more. A wrapped label grows vertically; no label is clipped or reduced to icon-only navigation.

## 360px Home — base returning composition

### 1. Ready to start a new practice session

```text
[ Главная · сейчас ] [ Мой прогресс ]
--------------------------------
Главная

Что сейчас?

Попробуй новую задачу на поиск
всех подходящих вариантов.

[[ Начать тренировку          ]]

--------------------------------
Недавняя работа

В прошлой тренировке:
одна задача решена самостоятельно,
в одной задаче открыто решение.

[ Посмотреть итоги ]
```

**Primary:** `Начать тренировку` requests a suitable problem and enters contextual Practice when one is available. It does not expose task ranking or promise the “best” task. While requesting, keep the button position and use `Подбираем задачу…`; do not create a second primary action.

**Reason:** one concrete sentence sits immediately before the action. Show it only when the selected practice purpose can support it. If no honest specific reason is available, use `Готов продолжить тренировку?` rather than inventing a weak area, topic, or difficulty increase.

**Supporting content:** one short recent-session fact is enough to restore context. `Посмотреть итоги` is secondary and opens the existing Session summary context where available. Omit this whole region when no recent session exists. Detailed capability history and comparisons belong to Progress.

**Navigation:** `Главная · сейчас` conveys the current destination with text as well as any later visual treatment. `Мой прогресс` is the only other top-level destination. Practice does not appear in this navigation.

## 360px state variations

Each state below replaces the current-action and supporting regions of the base. The navigation and `Главная` heading remain. Never assemble two primary actions from separate crops.

### 2. First visit

```text
[ Главная · сейчас ] [ Мой прогресс ]
--------------------------------
Главная

Решай олимпиадные задачи
самостоятельно. Если понадобится
помощь, можно открыть подсказку
или разобрать полное решение.

[[ Начать тренировку          ]]
```

The explanation and action form one region; there is no acknowledgement, carousel, setup form, grade/subject/goal question, missing-profile warning, empty score, recent-work placeholder, or disabled Progress preview. Starting requests the first suitable task. If the learner leaves before starting, this same state can return unchanged.

The top-level Progress destination remains available. Its own future empty state must explain the absence of work neutrally; Home does not duplicate that empty content.

### 3. Unfinished practice

```text
Что сейчас?

Тренировка не закончена
Можно продолжить с того же места.

Числа из карточек

Ответ ещё не отправлен.
Черновик и открытые подсказки
сохранены.

[[ Продолжить тренировку      ]]

[ Завершить тренировку ]
```

Use this single state whenever the learner reaches Home with unfinished, resumable practice. `Продолжить тренировку` restores the same session and its retained problem, draft, attempts, hints, solution-viewing context, and assessment status. It does not select a replacement task, create another attempt, erase help, or claim renewed independent work. The copy does not call leaving an abandonment or failure.

Show only known context: problem title/short identifier and a factual status such as `Ответ ещё не отправлен`, `Открыта одна подсказка`, or `Ответ отправлен, но пока не проверен`. Pending assessment changes this status text within the same Home state and keeps the same primary action. Do not display the full statement on Home.

`Завершить тренировку` remains a secondary, explicit transition to Session summary. It does not silently turn a pending answer into correct, incorrect, or partial. Navigating to Home or Progress preserves unfinished practice; explicit finish ends the session and leads to its summary.

### 4. Recently completed session

This state assumes the learner has already seen or left Session summary, no work remains active, and a suitable new practice request is available.

```text
Что сейчас?

Можно начать новую тренировку.

[[ Начать тренировку          ]]

--------------------------------
Последняя тренировка

Одна задача решена
самостоятельно.
В одной задаче открыто решение.
Один ответ пока не проверен.

[ Посмотреть итоги ]
```

The primary action answers what to do now. The completed-session preview reports navigation/outcome facts separately: it does not call every opened problem solved, turn solution study into a solve, or classify a pending response. `Посмотреть итоги` remains secondary. If the learner has just ended a session and has not seen its summary, the accepted flow leads to Session summary first; Home does not replace that screen.

### 5. Practice recommended because something needs another look

This concrete scenario assumes previous success required a hint and a fresh suitable problem is available.

```text
Что сейчас?

Попробуй похожую идею
в новой задаче.

В прошлый раз получилось
с подсказкой. Новая задача поможет
попробовать ту же идею самому.

[[ Начать тренировку          ]]

--------------------------------
Недавняя работа
Задача решена с подсказкой.
[ Посмотреть итоги ]
```

This wording preserves the earlier success (`получилось`) and explains the missing observation as a new opportunity. It does not say the learner forgot, became weaker, lost prior progress, or must repeat the same problem. Other evidence-backed reasons may use the same pattern:

- `Попробуй эту идею в задаче с другим условием.`
- `Недавняя задача вызвала вопрос. Новая поможет спокойно проверить этот шаг ещё раз.`

Use only the reason supported for the selected practice. Never expose `reconfirmation`, `mastery`, `evidence`, attribution/confidence language, a score, or a “weakest skill” label to the learner.

### 6. No suitable problem currently available

```text
Что сейчас?

Сейчас нет подходящей задачи.
Можно посмотреть прогресс
или вернуться позже.

[[ Посмотреть прогресс        ]]

[ Завершить тренировку ]
```

This is an expected availability state, not a loading/error state. It does not blame the learner, show a technical retry, claim all work is mastered, or substitute an unrelated task. `Посмотреть прогресс` is the one useful primary action and reaches the same Progress destination as navigation. Repeating it in the content makes the state actionable; there is still only one destination and no Practice navigation item.

Show `Завершить тренировку` only when an active session/request exists and can be explicitly ended through Session summary. If no session exists, omit it and let “return later” require no button. If the request is resumable, explain that it can be continued later; do not invent polling or availability timing.

Recent work, when available, may remain below this region. It does not turn into a replacement recommendation.

### 7. Secondary content loading failure while practice remains available

```text
Что сейчас?

Попробуй новую задачу на поиск
всех подходящих вариантов.

[[ Начать тренировку          ]]

--------------------------------
Недавняя работа

Не удалось загрузить недавнюю
работу.
[ Повторить загрузку ]
```

The start action remains the only primary action because Practice is available. Retry belongs to the failed secondary region, remains secondary, and reloads only that region. Do not disable or move the start action, replace the page with an error, or imply that the recommendation failed.

If the main Home interaction itself cannot load, replace its action region with the concrete error `Не удалось подобрать задачу` and primary `Попробовать ещё раз`; keep available secondary content below. This blocking-error rule is an annotation, not an additional required full frame. Technical failure remains distinct from the non-error “no suitable problem” state.

## State precedence and minimal supporting content

When several conditions coexist, select the action in this order:

1. **Unfinished practice:** `Продолжить тренировку`.
2. **Main interaction blocked by a recoverable failure:** `Попробовать ещё раз`.
3. **Suitable new practice:** `Начать тренировку`, with an evidence-supported reason where available.
4. **No suitable problem:** `Посмотреть прогресс` as the available content action.

This ordering prevents a recent session, progress link, secondary loading failure, or new recommendation from competing with unfinished work. Home has one unfinished-practice state and one resume action, including after a visit to Progress. The existing unavailable-request variation still applies when there is no suitable next problem; it does not create another current-versus-paused distinction.

Supporting content earns space only when it answers one of these questions without requiring interpretation:

| Supporting content | Minimum useful form | Omit when |
| --- | --- | --- |
| Why this practice | One plain sentence tied to the available recommendation. | The reason is unavailable, speculative, or duplicates the button. |
| Unfinished-work context | Problem title/short identifier plus one factual status. | No unfinished practice exists. |
| Recent work | One session, up to a few distinct factual outcomes, and optional `Посмотреть итоги`. | First visit, no recent session, or loading failed. |
| Progress preview | A single evidence-grounded plain-language change when it helps orientation, plus `Мой прогресс`. | It would repeat recent work, require scores, list capabilities, or compete with the current action. |

A separate progress preview is optional and absent from the base frames because the recent-session fact already supplies enough context. This keeps detailed capability history, multiple areas, scope, and open questions in Progress.

## 320px stress review — material differences only

The same 16px gutters leave 288px. Keep the composition and state meanings. Let navigation, primary actions, and long Russian copy stack or grow; do not shrink labels, hide them behind icons, or introduce page-level horizontal scrolling.

### Unfinished-practice action and context

```text
[ Главная · сейчас ]
[ Мой прогресс ]

Главная

Что сейчас?

Тренировка не закончена
Можно продолжить
с того же места.

Числа из карточек

Ответ ещё не отправлен.
Черновик и открытые
подсказки сохранены.

[[ Продолжить тренировку    ]]

[ Завершить тренировку ]
```

The header stack is the safe variant if two targets and their spacing do not fit in one row. It may happen before or after 320px depending on actual text/zoom; this is not a fixed production breakpoint.

### Long recommendation and secondary failure

```text
Попробуй новую задачу
на поиск всех подходящих
вариантов.

[[ Начать тренировку        ]]

Недавняя работа
Не удалось загрузить
недавнюю работу.

[ Повторить загрузку ]
```

The primary label fits on one line here; it may wrap to two and increase height under enlarged text. The retry remains visibly inside the supporting region. Spacing and the single `[[...]]` marker preserve hierarchy without relying on color.

### No-suitable-task action

```text
Сейчас нет подходящей задачи.
Можно посмотреть прогресс
или вернуться позже.

[[ Посмотреть прогресс      ]]

[ Завершить тренировку ]
```

| Stress item | Material response at 320px | Acceptance check for rendered wireframes |
| --- | --- | --- |
| Navigation | Stack the two text destinations when needed. | Each is about 44px high, visible by keyboard focus, and the current destination is conveyed without color alone. |
| Primary action | Full available width; label wraps and control grows vertically. | Exactly one primary marker; no clipping or overlap at 200% text size. |
| Recommendation/reason | Wrap in normal flow; never truncate or line-clamp. | Plain language remains adjacent to its action. |
| Recent outcomes | Stack outcome sentences and the summary link. | No table, horizontal carousel, or compressed analytics. |
| Unfinished-practice context | Wrap title and status; retain one factual status. | `Продолжить тренировку` stays readable and reachable; finish remains secondary. |
| Secondary retry | Remains within the failed supporting region. | It cannot visually replace or disable the available Practice action. |

**Structural result:** every region has a wrap/stack path at 288px and no fixed-width content. This is an ASCII review, not proof of pixel fit, 44px geometry, keyboard behavior, or Russian text readability; those require rendered validation.

## Desktop adaptation

At a review width around 1280px, use a centered envelope around 960px. Keep the current-action region first in visual, reading, and keyboard order. A compact supporting region may sit beside it when both remain readable; it does not become a multi-card dashboard.

```text
  [ Главная · сейчас ]                              [ Мой прогресс ]
  -----------------------------------------------------------------

  Главная

  ┌────────────────────────────────┐  Недавняя работа
  │ Что сейчас?                   │  В прошлой тренировке:
  │                                │  одна задача решена
  │ Попробуй новую задачу          │  самостоятельно,
  │ на поиск всех подходящих       │  в одной открыто решение.
  │ вариантов.                     │
  │                                │  [ Посмотреть итоги ]
  │ [[ Начать тренировку ]]        │
  └────────────────────────────────┘
```

The outline communicates grouping only; it is not a final card component or border style. The action region remains wider and first. The supporting column holds one recent session and one link. Do not add capability grids, charts, percentages, streaks, filters, task selection, or multiple recommendation cards because space is available.

Unfinished-practice, first-visit, unavailable, and loading-failure states use the same substitutions as mobile. Unfinished practice always shows `Тренировка не закончена` and primary `Продолжить тренировку`, with the retained problem status and secondary finish action. A sparse first visit may remain a single bounded column rather than manufacture a second column. If content or zoom makes adjacent regions cramped, stack them in the mobile order. Tablet follows the same content-first rule and may remain stacked.

Desktop provides a shorter line count, clearer grouping, and optional adjacency for supporting context. It does not provide materially more information than mobile.

## Navigation and accessibility annotations

- Use only `Главная` and `Мой прогресс` as top-level destinations. Practice and Session summary remain contextual actions. Mark the current Home destination with text/semantics as well as any later visual treatment.
- Keyboard order is skip-to-content, Home, Progress, page heading, current explanation, primary action, then supporting content and its secondary controls. An adjacent desktop arrangement keeps this logical order.
- Every actionable label has a descriptive accessible name, visible focus, and a target of about 44 × 44px or larger. Long labels wrap; no icon replaces Start/Resume/Progress.
- Status copy and action precedence carry meaning without color. Unfinished practice, unavailable tasks, and errors are distinguishable in text.
- When a primary action begins requesting a problem, communicate `Подбираем задачу…` without moving focus or exposing a second primary action. If the request fails, announce the affected region and preserve unrelated content.
- A secondary loading failure is announced near that region and does not steal focus from the current action. Its retry returns focus to the refreshed heading/result or keeps focus on retry with an announced update; rendered testing should choose the clearest behavior.
- Leaving unfinished Practice for Home, directly or through Progress, shows the same unfinished-practice state. Activating `Продолжить тренировку` restores orientation in Practice without fabricating a new attempt.
- Validate at 320px, 360px, 200% text size, and desktop zoom to an effective narrow width. No fixed header or action region may cover focused content.

## Alternatives and consequences

| Choice | Alternatives | Recommendation and trade-off |
| --- | --- | --- |
| Supporting content | No context; one recent-work preview; analytics overview. | Use one compact preview when available. It helps orientation while keeping the current action dominant; detailed understanding requires opening Summary/Progress. |
| Desktop layout | Same narrow stack; action plus one adjacent support region; multi-column dashboard. | Allow one adjacent region when it fits. This uses width without changing product scope, but needs zoom/reading-order review. |
| No-suitable-task action | Arbitrary replacement task; automatic retry; Progress/return-later state. | Offer Progress and later return. The state stays honest, though it cannot immediately continue Practice. |

These recommendations define a reviewable information arrangement. They do not choose production components, breakpoints, routes, recommendation logic, or storage.

## Explicit answers and next wireframe order

1. **What should dominate Home?** The current-action region: a short answer to `Что сейчас?`, one reason/status, and one primary Start/Resume action.
2. **What supporting content is actually useful?** One recommendation reason, one factual unfinished-work status, and at most one compact recent-session preview. A progress preview is optional only when it adds a distinct supported change; detailed history stays in Progress.
3. **How should first visit differ from returning Home?** First visit replaces history and recommendation detail with a brief explanation plus immediate start. It adds no setup step or empty analytics.
4. **How should current versus paused practice differ?** They share one Home state: `Тренировка не закончена`, primary `Продолжить тренировку`, and secondary explicit finish. The current problem remains within Practice; leaving Practice makes the session resumable/paused without completing it. Draft, help, and pending-result details vary only the supporting status text.
5. **How should “Needs another look” be explained?** State the retained success and the new opportunity: for example, `В прошлый раз получилось с подсказкой. Новая задача поможет попробовать ту же идею самому.` Never claim forgetting or invalidate earlier work.
6. **What should Home show when no suitable problem exists?** A calm availability explanation, primary Progress path, optional session finish when applicable, retained recent work, and no unrelated substitute or technical retry.
7. **Does desktop need materially more information than mobile?** No. It may align one supporting preview beside the dominant action; content and state behavior remain the same.
8. **What should OT-003.4 wireframe next?** Session summary: correct/partial/skipped/solution-viewed/pending outcomes, help context, qualitative change, and Home/Progress continuation. Then Progress can reuse the accepted language and summary handoff without forcing Home to become an analytics view.

## Verification gaps and open questions

- Learner testing should verify that `Тренировка не закончена` and `Продолжить тренировку` clearly communicate resumption, and that `Завершить тренировку` is clearly secondary.
- The amount of recent-session detail is a hypothesis. Test whether the two or three factual outcome lines help orientation or distract from the primary action.
- The phrase `Посмотреть прогресс` as the primary available action when no task exists follows Foundations, but its duplication with top navigation should be tested for redundancy. No replacement task is justified.
- Actual recommendation reasons require trustworthy upstream context. When unavailable, the neutral ready wording is safer than generating a specific claim.
- ASCII frames cannot verify target geometry, text wrapping, focus appearance, announcements, zoom, or desktop reading order. Rendered validation remains required.

## Validation and completion

The original eight requested situations are covered by seven Home states through one base composition and state substitutions. OT-003.3-FIX merges current/paused Home variants into one unfinished-practice state with primary `Продолжить тренировку`. Prose, 360px/320px frames, desktop substitutions, and precedence use the same transition rule; this document contains no Mermaid diagram. No new interaction or hidden condition was introduced. The wireframes retain the other states, responsive foundations, navigation, and accessibility. Research-task separates accepted constraints from synthetic examples and testing gaps; architecture-task compares the layout alternatives without adopting implementation architecture; implement-task applies the approved clarification only.

Validation: `git diff --check` and an untracked-file whitespace check passed. Only `docs/03-ux/home-wireframes.md` was modified for this clarification; it remains untracked. No application, browser, assistive-technology, or learner tests were run.

**READY** — OT-003.3-FIX clarification prepared for review. No commit or publication performed.

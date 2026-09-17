# Progress Wireframes — v0.1

## Purpose and handoff context

- **Task ID:** OT-003.5.
- **Revision:** branch `docs/ot-003-wireframes`, base `3109990`; working tree clean before drafting.
- **Goal:** give a grade 5–6 learner an honest view of development over time.
- **Scope:** one responsive Progress overview, qualitative capability groups, bounded detail, seven state variations, Home and Session Summary boundaries, and accessibility.
- **Out of scope:** final visual style, production components, routes, DB/API, scoring formulas, charts, percentages, and mastery algorithms.
- **Inputs:** [Dashboard and Progress Flow](dashboard-progress-flow.md), [First Visit and Student Navigation Flow](first-visit-navigation-flow.md), [Wireframe Foundations](wireframe-foundations.md), [Home Wireframes](home-wireframes.md), [Practice Wireframes](practice-wireframes.md), [Session Summary Wireframes](session-summary-wireframes.md), [Learning Evidence](../02-research/learning-evidence-v0.1.md), [Mastery Model](../02-research/mastery-model-v0.1.md), [Recommendation Model](../02-research/recommendation-model-v0.1.md), [Review and Retention Model](../02-research/review-retention-model-v0.1.md), and [Skill Taxonomy](../02-research/skill-taxonomy-v0.1.md), with [candidate inventory](../02-research/candidate-skill-inventory.md) and [validation](../02-research/skill-taxonomy-validation.md) for taxonomy provenance.
- **Constraints:** Russian learner copy; Home and Progress are the two top-level destinations; 360px working frame and 320px stress review; no unsupported or permanent ability label.
- **Definition of Done:** seven required states, nine questions, mobile and desktop frames, accessibility, alternatives, and verification gaps are explicit; only this document is created; `git diff --check` passes.
- **Allowed actions:** create this document and run read-only checks. No commit or publication.
- **Status:** READY as a wireframe proposal for review; rendered and learner validation remain separate later needs.

## Observed facts and interpretation

The accepted UX flows make Home the place for the next useful action, Session Summary the record of one completed session, and Progress the broader qualitative picture. Progress must distinguish no observation, limited positive work, supported work, reliable work within its observed scope, and a justified question about current use. The research models preserve earlier positive work when later work differs. Elapsed time alone does not show forgetting. A correct final answer, task tag, hint request, skip, or viewed solution alone cannot establish use of every associated capability.

The taxonomy proposes Foundation capabilities, Reasoning capabilities, and contextual methods. This is a provisional analytical division based on problem paths, not evidence about actual learners or a child-facing curriculum. All example capability histories below are **synthetic layout fixtures**. They do not claim actual student performance or automatic assessment of proof work.

**Interpretation:** Progress should lead with named mathematical actions the learner has tried, then explain what is currently known within a small scope. A category describes the available work, not the child's fixed ability. A recent concern may coexist with earlier success; completed activity may coexist with no assessable capability conclusion.

## Recommendation: information structure

Use one vertical overview organized by qualitative meanings. A capability item has a learner-friendly action name and one short sentence about the observed scope or recent context. Mention material help only when it changes the claim. Give an optional `Показать пример` disclosure when a short example clarifies the claim. Do not show raw attempt counts, complete histories, internal diagnostics, or method scores.

There is **no visible Foundation / Reasoning split** in v0.1. The learner can scan `Переводить условие в выражение` beside `Проверять все возможные случаи` without learning taxonomy names. Internal capability identity remains traceable. A separate lightweight section was considered, but two academic headings add reading effort and may make one kind of work seem more advanced. Test a long mixed list before reconsidering.

Show groups in this order when present: `Стоит попробовать ещё раз`, `Получается в разных задачах`, `Уже получается`, `Начинаю разбираться`, `Ещё не пробовал`. Put a current question first so it is easy to find; the remaining order helps scanning and is not a sequence of levels. Omit empty groups. Do not number groups, show group totals, or imply that every learner moves through them in order. `Ещё не пробовал` means unexplored, not weak; `Начинаю разбираться` names useful early work, not failure. Positive groups describe observed work within scope, not permanent ability.

| Learner-facing group | Use only when | Boundary |
| --- | --- | --- |
| `Ещё не пробовал` | No observed attempt for this capability exists in the available history. | An invitation to explore, never a negative claim. Excludes pending, unassessable, and unattributable work. |
| `Начинаю разбираться` | Limited, attributable positive work exists, including meaningful supported completion. | Say what happened and when a hint materially helped. One success is not stable use. |
| `Уже получается` | Attributable independent success with this capability has been observed, but independent reuse across meaningful variation is not established. | Say what the learner did independently and in what kind of task; one success does not establish stable use. |
| `Получается в разных задачах` | Attributable independent success with the capability appears across meaningful variation in different problems. | Name the observed kinds of tasks; different titles or changed numbers alone do not establish this distinction. Never imply universal or permanent success. |
| `Стоит попробовать ещё раз` | A justified current gap or comparable attributable difficulty makes a fresh attempt useful after positive work. | Preserve what worked before, name the current question, and suggest a fresh problem as an opportunity. Time alone cannot trigger it. |

**Neutral no-conclusion condition, outside the group list:** `Пока рано сказать` is explanatory copy when relevant activity exists but assessment or connection to a capability does not support a responsible conclusion. Show it as a page-level message when no capability can be described, or as a note beside a known attempted capability in a mixed view. It is never a group heading, level, difficulty label, or position in the group order. State the actual limit, such as an answer awaiting checking. Work with no observed attempt belongs in `Ещё не пробовал` only when the available history supports that fact; missing data does not.

These group labels are editorial translations of evidence-bound meanings, not an ordered scale or mapping formula. A capability appears in one visible group at a time. The attention item states its prior success in the same row rather than duplicating it in a positive group. If the concern is unsubstantiated, retain the positive group and omit the attention label. Solution study is useful, but only separately attributable earlier or later work supports a capability claim.

### Item detail and actions

Minimum row: **action-oriented name + short group context**. Translate taxonomy wording for children without changing the mathematical obligation: for example, `Систематически перебирать случаи и обосновывать полноту` becomes `Проверять все возможные случаи`, with detail `Показать, почему ни один случай не пропущен`. A math content reviewer must check this copy; it is not a new taxonomy decision.

Use an **inline disclosure** labeled `Показать пример` / `Скрыть пример` only where a concrete example helps. It may contain one or two short cross-session examples, the meaningful help condition, and one question a fresh problem could answer. The collapsed row remains comprehensible. A separate detail page adds navigation for little information; always-expanded detail makes a long overview exhausting; no detail leaves qualified claims unexplained. The disclosure is not a complete attempt history.

Actions on Progress are secondary. The persistent `Главная` destination and final `На главную` return control are sufficient. Do not put `Начать тренировку` beside each capability: Home owns task selection and resumption, and a row does not guarantee that an appropriate task exists. A sentence may suggest a fresh problem, but it is explanatory, not a task picker.

### Notation

`[[ ... ]]` marks the single primary return action in a frame; `[ ... ]` marks navigation or secondary disclosure. Brackets are internal annotations, not styling. All text inside frames is learner-facing Russian. Review frames assume 16px side gutters: about 328px usable at 360px and 288px at 320px. Group headings are plain text, not tiny badges or color codes.

## 360px Progress

### Mixed progress — main overview

```text
[ Главная ] [ Мой прогресс · здесь ]
---------------------------------
Мой прогресс

Здесь видно, какие идеи ты уже
пробовал в задачах. Картина будет
меняться по мере новой работы.

Стоит попробовать ещё раз

Проверять все возможные случаи
Раньше ты смог найти все случаи.
В новой задаче один случай пока
остался без объяснения. Свежая
задача поможет проверить этот шаг.
[ Показать пример ]

Получается в разных задачах

Согласовывать несколько условий
Ты сам проверял все условия
в нескольких разных задачах.
[ Показать пример ]

Уже получается

Переводить условие в выражение
Ты уже сам перевёл условие
задачи в выражение.

Начинаю разбираться

Строить и проверять подходящий
пример
В одной задаче получилось с
подсказкой. Можно попробовать
похожую идею самому.
[ Показать пример ]

Ещё не пробовал

Доказывать, что что-то невозможно
Пока нет задач, где можно было
увидеть твоё решение такого типа.
[ Показать остальные темы ]

[[ На главную                 ]]
```

`Показать остальные темы` discloses more untried capability names only when the list is long; it is not a filter or task selector. No total, completion indicator, or comparison between groups appears.

### One expanded item

This replaces only the first row's disclosure area.

```text
Стоит попробовать ещё раз

Проверять все возможные случаи
Раньше ты смог найти все случаи.
В новой задаче один случай пока
остался без объяснения.
[ Скрыть пример ]

В прошлой тренировке ты объяснил,
почему других случаев нет.
В недавней задаче один случай
остался без объяснения.
Новая задача поможет спокойно
проверить этот шаг.
```

This is a short comparison across sessions, not a replay. It requires comparable tasks and attributable work. Without that basis, use narrower neutral wording such as `В другой задаче пока неясно, как проверить все случаи`.

## State variants

All variants reuse the header, page heading, group order, and final Home action. The frames show changed content rather than duplicating the full shell.

### 1. Little or no history

```text
Мой прогресс

Пока нет примеров твоей работы,
чтобы рассказать, что получается.
После задач здесь будет видно,
какие идеи ты пробовал.

Ещё не пробовал
Проверять все возможные случаи
Переводить условие в выражение
[ Показать остальные темы ]

[[ На главную ]]
```

If no capability inventory can be shown, omit its list. Home offers the first useful Practice action when available. No zero, blank chart, weak-area label, or compulsory setup appears.

### 2. Mixed progress

Use the full 360px frame. It distinguishes supported, independent, unknown, and current-question meanings without reproducing Session Summary's task rows.

### 3. Strong work across several capabilities

```text
Мой прогресс

Получается в разных задачах

Проверять все возможные случаи
Ты сам объяснял полноту в разных
задачах, которые мы видели.

Согласовывать несколько условий
Ты сам проверял несколько условий
в разных задачах.

Строить и проверять подходящий
пример
Ты находил пример и проверял
его условия в разных задачах.

Ещё не пробовал
Доказывать, что что-то невозможно

[[ На главную ]]
```

Scope stays explicit. Omit the untried group if no such capability is in the current inventory; do not manufacture challenge or remediation to fill space.

### 4. Another look after earlier success

```text
Мой прогресс

Стоит попробовать ещё раз

Проверять все возможные случаи
Раньше ты сам объяснил, почему
случаи не пропущены. В новой
задаче этот шаг пока не получился.
Свежая задача поможет разобраться,
как проверить его ещё раз.
[ Показать пример ]

[[ На главную ]]
```

When the only issue is a justified present-use gap, say `Раньше это получалось в таких задачах. Свежая задача поможет проверить, как ты используешь эту идею сейчас.` Do not present passage of time itself as a problem. A single later error is insufficient to assert an enduring difficulty. Earlier success remains visible in collapsed and expanded states.

### 5. Many unexplored capabilities

```text
Мой прогресс

Некоторые идеи ты ещё не пробовал.
Это нормально: к ним можно
вернуться в будущих задачах.

Ещё не пробовал
Переводить условие в выражение
Доказывать, что что-то невозможно
[ Показать остальные темы ]

[[ На главную ]]
```

`Показать остальные темы` reveals remaining names in place and changes to `Скрыть темы`. It does not hide a judgment or cap access. Avoid a count of missing capabilities, a completion bar, or a wall of names by default.

### 6. Progress data partially unavailable

```text
Мой прогресс

Часть прогресса сейчас недоступна.
То, что уже загрузилось, можно
посмотреть ниже.
[ Повторить загрузку ]

Уже получается
Согласовывать несколько условий
Ты уже сам проверил все условия
в задаче.

[[ На главную ]]
```

Retry belongs to the failed region and stays secondary while the overview remains usable. Do not infer `Ещё не пробовал` from missing data, present a partial view as complete, or erase visible claims. If the whole overview is unavailable, show `Не удалось загрузить прогресс. Попробуй ещё раз.` with primary `Попробовать ещё раз` and secondary `На главную`. Retry loads the affected view; it does not alter Practice work.

### 7. Completed activity, no assessable capability history

```text
Мой прогресс

Ты уже занимался, но пока рано
сказать, какие идеи получаются.
Некоторые ответы ещё не проверены,
а просмотр решения помогает
учиться, но не показывает, как ты
решишь новую задачу сам.

[[ На главную ]]
```

The paragraph is a page-level no-conclusion message, not a sixth group or an empty capability list. Mention only the actual cause: pending work, skips, solution study, a result not tied to a capability, or another concrete assessment limit. If a known capability has an attempt but no assessable conclusion, a note beside it may say `Пока рано сказать — ответ ещё не проверен`; it must not move to `Ещё не пробовал`. Meaningful attributable supported work belongs in its narrower positive group. Completed sessions alone do not create a capability claim.

## 320px stress-test

At 320px, about 288px remains for content. This structural stress frame uses long Russian names, a long group label, and expanded detail.

```text
[ Главная ]
[ Мой прогресс · здесь ]

Мой прогресс

Стоит попробовать ещё раз

Проверять все возможные
случаи и объяснять, почему
других нет
Раньше это получалось.
В новой задаче один случай
остался без объяснения.
[ Скрыть пример ]

В прошлой тренировке ты
объяснил, почему других
случаев нет. Свежая задача
поможет проверить этот шаг.

Получается в разных
задачах
Проверять несколько условий
Ты сам справлялся с этой идеей
в нескольких разных задачах.

Ещё не пробовал
Доказывать, что что-то
невозможно при данных
условиях
[ Показать остальные темы ]

[[ На главную          ]]
```

| Region | 320px acceptance check |
| --- | --- |
| Header | Text destinations may stack; each keeps an approximately 44px target and a non-color current indication. |
| Groups and names | Text wraps without truncation, tiny badges, fixed row heights, or horizontal scrolling. Name and explanation remain together. |
| Positive labels | `Получается в разных задачах` may wrap; its independent, varied-work explanation stays with the item. `Уже получается` requires only observed independent success and does not claim variation. |
| Disclosure | Wrapped label grows vertically; opening content pushes later groups down rather than overlaying them. |
| Untried list | Learner can reveal and hide every name by keyboard and touch; focus stays on the disclosure. |
| Return | `На главную` remains distinct from local disclosures and has an approximately 44px target. |

There is no horizontal table, carousel, fixed footer, or page-level overflow. At 200% text size and desktop zoom to an effective 320px width, groups reflow to one column. ASCII cannot prove pixel fit.

## Desktop adaptation

At a review width around 1280px, use a centered bounded envelope. A **single readable column** remains the default because group order matters. A second column could hold only a short introduction or selected inline detail when both remain readable; it must not split groups into parallel score columns or change reading order. Tablet can keep the mobile stack.

```text
 [ Главная ]                                  [ Мой прогресс · здесь ]
 -------------------------------------------------------------------

 Мой прогресс
 Здесь видно, какие идеи ты уже пробовал в задачах.

 Стоит попробовать ещё раз
 Проверять все возможные случаи
 Раньше ты смог найти все случаи. В новой задаче один шаг
 пока остался без объяснения. [ Показать пример ]

 Получается в разных задачах
 Согласовывать несколько условий
 Ты сам проверял все условия в нескольких разных задачах.

 Уже получается
 Переводить условие в выражение
 Ты уже сам перевёл условие задачи в выражение.

 Начинаю разбираться
 Строить и проверять подходящий пример
 В одной задаче получилось с подсказкой.

 Ещё не пробовал
 Доказывать, что что-то невозможно
 [ Показать остальные темы ]

 [[ На главную ]]
```

Desktop has the same information and actions as mobile, with no charts, metrics, filters, comparison tables, or task picker. If detail is ever placed beside the list, reading and keyboard order must still follow its selected item and reflow beneath it at zoom. This proposal keeps detail inline.

## Navigation and accessibility

- Use one page heading `Мой прогресс`, semantic group headings, and capability lists. A status sentence remains associated with its capability for visual readers and screen readers.
- Provide `К содержимому`, visible focus, keyboard operation, and order: header → introduction → groups and disclosures → final Home action. Mark current Progress in text and programmatically, not by color alone.
- Inline disclosure exposes expanded/collapsed state and controls its content. Its accessible name includes the capability when repeated `Показать пример` labels would be ambiguous. Focus stays on it; revealed content follows in reading order. The untried-list disclosure behaves likewise.
- Every status is readable as text. A screen reader should hear the bounded claim with the name, such as `Проверять все возможные случаи. Раньше это получалось; свежая задача поможет проверить один шаг.`
- Background updates do not move focus or announce every reclassification. On deliberate reload, announce the changed region or error once and keep the learner oriented.
- Test long Russian names, headings, disclosures, and errors at 320px/360px, 200% text size, increased text spacing, and desktop zoom. Do not clip words or conceal focus. Approximately 44px targets apply to navigation, disclosures, retry, and return.

## Alternatives and consequences

| Choice | Alternatives | Recommendation and trade-off |
| --- | --- | --- |
| Dominant content | Chronological task history; aggregate dashboard; capability groups | Capability groups answer what the learner can understand now. This needs careful attribution and child-friendly names, but avoids repeating Summary or manufacturing a score. |
| Foundation / Reasoning | Mixed grouped list; lightweight separate sections | Use one list. It avoids academic headings; a long list may become harder to scan, so test before adding sections. |
| Detail | None; inline disclosure; separate detail state | Inline detail gives context on demand with little navigation. Show it only when a real explanatory example exists. |
| Practice action | Per-capability buttons; Progress task picker; Home return with contextual cues | Keep Home return and optional non-clickable cue. It preserves task-selection boundaries but adds one navigation step. |
| Current question | Hide prior success; duplicate item in two groups; one qualified item | One qualified item avoids contradictory duplicates and keeps earlier success explicit. Test that attention is not heard as failure. |

These are reviewable UX information choices, not implementation architecture or a capability-state algorithm. A later product decision must define how trustworthy learner work reaches this view.

## Explicit answers

1. **What should dominate Progress?** Named capabilities with honest, bounded qualitative claims. Recent examples support claims on demand.
2. **What Russian group labels work best?** `Стоит попробовать ещё раз`, `Получается в разных задачах`, `Уже получается`, `Начинаю разбираться`, and `Ещё не пробовал`. `Пока рано сказать` is separate neutral explanatory copy when activity exists but no responsible conclusion is available. Later learner testing must check comprehension.
3. **Should Foundation and Reasoning be separated?** No for v0.1. Both describe actions; the analytical boundary is provisional. Reconsider if a long list causes scanning trouble.
4. **How much detail is useful?** One short example or cross-session comparison, help context when it changes meaning, and one next question. Omit detail when it repeats the row.
5. **How should another look preserve success?** State what worked before in the collapsed row, then explain the specific current question and how a fresh problem could clarify it.
6. **What should no history say?** `Пока нет примеров твоей работы, чтобы рассказать, что получается. После задач здесь будет видно, какие идеи ты пробовал.` Home remains the path to practice.
7. **Should Progress contain direct practice actions?** No per-capability action in v0.1. Home owns Start/Resume and suitable task availability.
8. **Does desktop need more information?** No. It needs only comfortable line length and spacing; group content and inline detail are the same.
9. **What should OT-003.6 review before Figma?** Perform a repository-based cross-screen responsive, UX, and semantic consistency review of Home → Practice → Session Summary → Progress. Check navigation, action hierarchy, terminology, 320px/360px requirements on paper, accessibility requirements, and duplicated or contradictory states. Confirm that independent success differs from independent use in meaningfully different problems, and that `Пока рано сказать` remains outside the ordered groups. This is a documentation review, not rendered or learner testing.

## UX risks, open questions, and verification gaps

- No learner-performance dataset or usability study establishes that these labels are understood as intended. Real grade 5–6 comprehension testing is a separate later validation need.
- `Ещё не пробовал` is accurate only with no relevant observed attempt. Missing, pending, or ambiguous work needs `Пока рано сказать` or a partial-data message.
- Child-friendly names can oversimplify a mathematical obligation. `Проверять все возможные случаи` must preserve the need to explain completeness in its detail; math-content expert review is a separate later validation need.
- Attention after success requires comparable attributable work or a justified present-use gap. A single opaque error, stale timestamp, solution study, or task tag is insufficient.
- Unknown inventory size may make the page long. Test disclosure discoverability and whether a mixed list eventually needs lightweight sections.
- ASCII cannot verify real reflow, 44px geometry, focus, screen-reader announcements, or child comprehension. Browser/device checks and assistive-technology testing are separate later validation needs; OT-003.6 checks that the requirements and paper wireframes are consistent.

## Validation and completion

Research-task's fact / interpretation / recommendation boundary and architecture-task's alternatives and consequences are applied within this one authorized UX document. OT-003.5-FIX replaces the ambiguous positive wording with independently observed success versus independently observed use across meaningful variation, removes the no-conclusion condition from the group list, and limits OT-003.6 to a repository review. It preserves accepted navigation and model semantics without adopting a technical architecture. All seven states and nine questions are covered. `git diff --check` passed; a separate check of this untracked file reported no whitespace errors. Local links resolve and Markdown code fences are balanced. No learner, browser, or assistive-technology testing has been performed by this documentation task.

**READY** — OT-003.5 Progress wireframes prepared for review. No commit or publication.

# Wireframe Foundations — v0.1

## Purpose and handoff context

- **Task ID:** OT-003.1.
- **Revision:** branch `docs/ot-003-wireframes`, inspected HEAD and base `9bbb7cd`; working tree clean before drafting.
- **Goal:** define wireframe foundations for the responsive Olympiad Trainer MVP.
- **Scope:** screen/state inventory, navigation, responsive layout, action hierarchy, accessibility, Russian learner copy, and low-fidelity notation.
- **Out of scope:** final visual style, colors/branding, production or Figma components, routes/API/DB, animation, parent/admin UI, assessment implementation, and new product behavior.
- **Inputs:** [Project vision](../00-project/project-vision.md), [Core Practice Flow](core-practice-flow.md), [Dashboard and Progress Flow](dashboard-progress-flow.md), [First Visit and Student Navigation Flow](first-visit-navigation-flow.md), and the OT-003.1 assignment.
- **Constraints:** preserve accepted flows; English documentation and Russian learner-facing copy; mobile first, including 320px and 360px; one obvious primary action per actionable state; no horizontal page overflow.
- **Definition of Done:** minimum screen families and state variations are mapped to actions; mobile/tablet/desktop behavior and accessibility are explicit; all eight task questions are answered; only this file is created; `git diff --check` passes.
- **Allowed actions:** inspect repository evidence, create this document, and run read-only validation. No commit or publication.
- **Status:** READY as a wireframe-foundation proposal for review. Layout recommendations remain proposals; accepted flow behavior remains the boundary.

## Observed fact

The four source documents establish the following constraints:

| Source | Constraint carried into wireframes |
| --- | --- |
| Project vision: primary user and MVP | Grades 5–6; independent olympiad practice and useful progress after a session. |
| Core Practice Flow: problem states and support | Retry, progressive hints, explicit solution reveal, skipped work, and pending assessment have distinct meanings. Correctness and navigation completion do not establish independent solving. |
| Core Practice Flow: session states and resumption | Pausing preserves the same work; finishing leads to a session summary. Reload/resume retains answer, attempt, hint, exposure, and pending context. |
| Dashboard and Progress Flow: content models | Home presents the current action and concise recent work; Progress explains qualitative learning history. Unknown areas are neutral. |
| First Visit and Student Navigation Flow: navigation | Home and Progress are the only top-level destinations. Practice and Session summary are contextual. First visit has a brief explanation and immediate start, without required setup. |

These are repository constraints, not results from device or learner testing. The assignment adds responsive and accessibility requirements. No external usability or accessibility compliance claim is made here.

## Interpretation

The concrete layout problem is to keep a potentially long mathematical statement, a usable answer area, and the next action understandable on a narrow phone, while preserving the same learning context on larger screens. Treating each hint or outcome as a separate page would duplicate structure and could separate feedback from the answer that produced it.

Four screen families are sufficient. State changes replace or extend named regions within a family. Hint exposure and assessment status can coexist; they must not become mutually exclusive screen categories that erase earlier work.

## Recommendation: screen inventory

Use four base layouts: **Home**, **Practice**, **Session summary**, and **Progress**. Their learner headings are respectively `Главная`, `Тренировка`, `Итоги тренировки`, and `Мой прогресс`. English names below identify design artifacts only.

| Screen family and required variation | Content that changes | Primary action | Secondary actions and continuity |
| --- | --- | --- | --- |
| Home — first visit | Brief explanation: `Решай олимпиадные задачи. Если понадобится помощь, можно открыть подсказку или посмотреть решение.` No recent-work placeholder or setup form. | `Начать тренировку` | `Мой прогресс` remains available; explanation needs no dismissal. |
| Home — returning learner | One useful practice reason, concise recent session result, and only justified current practice needs. | `Начать тренировку` | View Progress or the recent session summary. Do not display speculative needs. |
| Home — paused session | Identify the unfinished session and its latest context, including pending assessment or previously opened help. | `Продолжить тренировку` | Progress remains accessible. Resumption restores the episode. |
| Home — current problem | Identify the open problem; give it precedence over starting new work. | `Вернуться к задаче` | Progress remains accessible. Returning does not create an attempt. |
| Practice — untouched problem / answer being entered | Full statement and diagram, answer instructions, labeled response controls. A draft is a variation of this layout. | `Проверить` | `Подсказка`, `Пропустить задачу`, global navigation, and `Завершить тренировку`. Eligibility for solution reveal follows the accepted flow. |
| Practice — incorrect answer | Retain answer and statement; show `Пока неверно. Попробуй ещё раз.` Add a more specific explanation only when supported. | `Попробовать ещё раз` | Activating retry returns focus to the preserved answer for editing; the primary action then becomes `Проверить`. Hints, skip, eligible solution reveal, and leaving stay secondary. |
| Practice — hint opened | Add the requested hint in the support region; preserve the current response and any prior feedback. | The underlying state keeps its primary action: `Проверить` while entering an answer, or `Попробовать ещё раз` after incorrect feedback. | `Следующая подсказка` where available; earlier hints remain accessible. Opening a hint does not require a new full-screen layout. |
| Practice — awaiting assessment | Retain the submitted response; show `Ответ пока не проверен. Можно вернуться к нему позже.` Do not promise an assessment time. | `На главную` — pauses the session for later resumption. | Waiting requires no action. `Продолжить без проверки`, explicit `Посмотреть решение`, and `Завершить тренировку` remain available as secondary actions. Continuing leaves the submission unclassified. |
| Practice — solution exposed | Keep the problem and earlier result; expand the solution in the support region with `Решение открыто`. | `Следующая задача` | Read/reconstruct at the learner's pace or finish/pause. No automatic advance or independent-solve label for work after exposure. |
| Session summary | Per-problem outcomes and help context, supported qualitative changes, and unresolved/pending work. | `На главную` | `Мой прогресс`. A new session is started from Home; the summary does not select a problem. |
| Progress | Qualitative descriptions, their scope, recent work, and justified open questions. | `На главную` | Home restores the appropriate start/resume/return action. Progress provides no competing task picker. |

Home's first, returning, paused, and current variants share one action region. Active/paused work replaces the start action; it does not add a second primary button. First-visit and returning-history details may vary independently from task availability.

### Additional variations required to complete the flow

These are annotated changes to the four layouts, not extra destinations or a full copy of every frame.

| Variation | Placement and learner-facing meaning | Action rule |
| --- | --- | --- |
| Practice — correct answer | Feedback: `Верно.` Include relevant help context without overstating reasoning. | Primary `Следующая задача`; solution comparison, when offered, and session finish remain secondary. |
| Practice — partially correct | Feedback states only assessed valid progress, for example `Часть ответа верна. Проверь оставшуюся часть.` Use wording appropriate to the actual response. | Primary `Попробовать ещё раз` returns to revision; support and leaving remain secondary. |
| Practice — invalid answer format | Explain the required format beside the input, with an example only for the actual answer type. Preserve entered work. | Keep `Проверить` as the primary action after correction. A format issue is not incorrect mathematics. |
| Practice — checking | Keep submitted work and show `Проверяем ответ…` in the feedback region. | Retain the primary action position in its busy state; prevent repeat submission. Do not invent another primary action just to fill the waiting interval. |
| Practice — all available hints opened | Support region: `Все подсказки открыты. Можно попробовать ещё раз или посмотреть решение.` | Underlying attempt/retry action stays primary; solution reveal stays secondary and explicit. |
| Practice — skipped | A compact outcome annotation, `Задача пропущена`, may accompany the transition; no dedicated skip page is needed. | If navigation waits for a separate continuation, primary `Следующая задача`; finishing remains secondary. No solved/failed label follows from skipping alone. |
| Home or Practice — requesting a problem | Show `Подбираем задачу…` near the initiating action and retain session context. | The initiating primary action is busy. Pause/return and explicit finish remain available for an active request. |
| Home — no appropriate task available | Replace the practice invitation with `Сейчас нет подходящей задачи. Можно вернуться позже.` Preserve recent work if present. | Primary `Мой прогресс`, including its neutral empty variation when needed. Pause/finish options remain secondary where a session/request exists. No substitute task or automatic retry loop. |
| Practice — no next task available | Replace the next-task region with the same unavailable explanation while retaining the session record. | Primary `На главную` preserves a resumable request; secondary `Завершить тренировку` leads to its summary. Do not silently finish from the layout alone. |
| Progress — no usable progress yet | `Пока мало примеров твоей работы, чтобы рассказать о прогрессе.` If only pending work exists, say `Ответы пока не проверены. Когда появятся результаты, здесь можно будет их посмотреть.` Assessment does not automatically establish a capability conclusion. | Primary `На главную`. Do not show zero percentages, empty charts, or a deficit label. |
| Home — no recent work or unfinished session | Omit the corresponding region; the first-visit/start variation already covers this condition. | No separate empty screen or resume action. |
| Session summary — pending work or no assessed results | Describe actual work, for example `Ответ пока не проверен` or `В этой тренировке ещё нет проверенных ответов.` An ended request with no attempts must not fabricate a problem outcome. | Primary `На главную`; Progress is secondary. |
| Recoverable loading error | In the affected region, use `Не удалось загрузить. Попробуй ещё раз.` Retain available content and entered work. Distinguish this from absence of suitable tasks. | Make `Попробовать ещё раз` primary only when the failure blocks the screen's main interaction. If only secondary content fails, keep retry secondary; for example, failed recent Home history must not compete with `Начать тренировку` when practice is available. Never use a generic retry to resubmit an answer whose assessment is pending. |
| Opened problem or essential diagram unavailable | Explain `Задача сейчас недоступна` or `Не удалось загрузить рисунок к задаче`. Keep prior work; do not present an incomplete problem as solvable. | If loading can safely be retried, primary `Попробовать ещё раз`; otherwise `На главную`. Finish remains available for the session. Unavailability alone is no assessed outcome or skip. |

For combinations, preserve all context and choose the primary action for the current interaction. A blocking load error takes precedence over an unavailable answer interaction; awaiting assessment takes precedence over a previous hint; solution exposure changes the continuation action without deleting a pre-exposure submission. Mark combinations explicitly instead of drawing the full Cartesian product.

## Global navigation and shells

### Mobile

Use a compact, in-flow header with two text destinations: `Главная` and `Мой прогресс`. Keep them directly visible rather than inside a menu. Show the current destination through a text/shape distinction and an accessible current-state indication, not color alone. At 320px, allow header identity and navigation to occupy separate rows; labels may wrap with adequate touch area.

Place the screen heading and content immediately below. Practice uses the same small header and a contextual `Тренировка` heading; neither Practice nor Session summary gets a third navigation item. No destination is falsely marked current while in a contextual screen. The header scrolls with the page. There is no fixed bottom navigation or fixed action bar in the initial foundation.

Following `Главная` or `Мой прогресс` from active Practice leaves the session resumable. The nearby session-control explanation is `К этой задаче можно вернуться позже.` Explicit `Завершить тренировку` remains a separate secondary action leading to Session summary. Navigation must not reset work or imply completion.

### Desktop

Use the same two labeled destinations in a horizontal header, with identity and navigation on one row when they fit. Center the main content beneath it. Do not introduce a permanent sidebar, additional destinations, a Practice dashboard, or hover-only actions.

Practice remains a single reading column. Home may place concise recent work beside the current action on sufficiently wide screens; Progress may align the explanation and supporting recent work in adjacent regions. These are optional arrangements of the same content, with main content first in reading and keyboard order. They collapse if text or zoom makes either region cramped. Session summary remains an ordered outcome list.

## Responsive foundations

Use 320px, 360px, approximately 768px, and approximately 1280px as review frames, not fixed device categories or production breakpoints. A layout changes when content no longer fits comfortably. Tablet portrait uses the mobile reading structure with more surrounding space; tablet landscape may use the desktop Home/Progress arrangement only if both regions remain readable.

| Concern | Mobile: 320px / 360px | Tablet | Desktop |
| --- | --- | --- | --- |
| Navigation | Two visible text links, with wrapping or a separate header row. No icon-only substitution. | Same links; a single row if it fits. | Same destinations in a compact horizontal header. |
| Content width | Full available width with an initial 16px gutter per side: 288px / 328px usable. Avoid nested padding that consumes answer width. | Center a readable column; do not stretch prose to fill the display. | Start wireframes with a reading column around 640–720px for Practice. Home/Progress may use a wider envelope around 960px when an adjacent region helps. These are review dimensions, not final style tokens. |
| Statements | Full text in normal page flow, wrapping naturally. No line clamp, collapsed condition, or internally scrolling statement box. | Same order and full statement. | Maintain a readable text measure; do not use the spare width for extra metrics. |
| Images/diagrams | Fit within the statement region without crop or distortion. Offer an explicit enlargement action if labels become too small. | More room for the figure, with the same access to enlargement. | Preserve the relationship between condition and figure; enlargement remains available when necessary. |
| Answer controls | Labels above controls; stack multiple fields/options; allow multiline responses and labels. Controls fit the region. | Keep labels and help close; arrange related small fields together only when meaning stays clear. | Bounded answer region in the same column; additional width never implies a different answer type. |
| Primary actions | One full-width primary button in the relevant action region; long labels wrap and increase height. | Same action and location; width may be bounded. | Same state-dependent action, aligned with its response or outcome. No remote action in a sidebar. |
| Hints and feedback | Inline, with wrapping text and natural height; no overlay covering the statement or input. | Same sequence. | Same sequence in Practice; avoid moving help away from the answer merely because width exists. |
| Progress content | Stacked descriptions with scope and supporting context; no wide comparison table. | Same structure with more space. | Optional adjacent supporting history; the qualitative description remains first. No dense analytics added. |

### Long statements, mathematics, and diagrams

Preserve mathematical meaning when wrapping: retain paragraph/list structure, keep a figure adjacent to its reference, and break expressions only at meaningful boundaries. Unusually long links or non-mathematical tokens may wrap; do not break an expression arbitrarily to force it into a line. Use a separate math block when needed. For an indivisible wide expression, annotate a bounded, keyboard-accessible local horizontal scroll region; the page itself must never overflow horizontally.

Images retain aspect ratio and all required labels. Use a caption and Russian alternative text that describe the given information without adding a solution hint. A complex diagram may need a longer text description; alt text such as `Рисунок к задаче` alone is insufficient. Determine the equivalent description from the actual content, preserving relevant spatial relationships and avoiding inferred facts.

When fitting makes details unreadable, show `Увеличить рисунок`. Its focused enlarged view must support keyboard-operable zoom/pan controls, have a named return action `Вернуться к задаче`, and restore the prior reading/focus position. This is a local inspection state, not a new destination. It must not require pinch or drag alone. Local panning may be needed within this view; page overflow remains prohibited.

Do not promise that the complete statement and answer fit above the fold. Vertical reading is expected. Avoid sticky regions in the first wireframes: they would compete with the problem and the mobile keyboard. If later usability work demonstrates a need for one, it must be tested with keyboard, zoom, long labels, and focus visibility before adoption.

### Answer-type coverage

The answer region is not assumed to be a single number field. Annotate the response requirement for each example: exact answer, several values, construction, or justification. For several values, show how completeness and entry format are explained. For construction/justification, reserve suitable response space and use the pending variation when safe assessment is unavailable. These annotations do not choose a production editor or promise automatic grading. Answer controls and their instructions must be reviewed against a real permitted content example in later wireframes.

## Practice hierarchy and action visibility

Use this stable reading order at every width:

1. **Problem context:** compact session position, source context where available, and useful purpose. `Задача 2` means position in this session, if known; it is not the official task number or a difficulty label. Do not invent a total such as ten required problems or a completion percentage.
2. **Statement and diagram:** the largest and most prominent content region, containing every condition necessary to attempt the task.
3. **Answer interaction:** task-specific instructions, labeled response controls, and the current submit/retry action.
4. **Feedback:** immediately after the response/action, referring to that response. Pending assessment, format errors, and assessed mathematical outcomes remain distinct.
5. **Hint/support actions and opened content:** `Подсказка`, then `Следующая подсказка` as appropriate. Keep previous hints readable; expose full solution only through the learner's explicit choice. Skip and eligible solution reveal remain secondary.
6. **Continuation and session controls:** `Следующая задача` once continuation is appropriate, and secondary `Завершить тренировку`. Global navigation allows pausing and later return.

The numbered order describes structure, not six equally prominent boxes. Empty feedback/support regions take no large placeholder space. After correct feedback or solution study, the continuation action becomes primary and replaces the submit/retry emphasis. Do not show two primary actions at once. The solution may be long; its continuation is immediately after the solution, without an unrelated intervening section or forced dwell time.

“Immediately visible” means visible in the relevant interaction region without opening a menu, hovering, or dismissing an overlay; it cannot mean every control is always in a 320px viewport. Home's current primary action follows its brief explanation before recent history. Answer instructions and `Проверить` stay adjacent to the answer; retry stays adjacent to the response and its feedback; pending options stay beside the pending message; continuation stays with the completed outcome. Hint, skip, eligible solution reveal, and session finish are plainly labeled secondary controls, not hidden in an overflow menu. Long content may require vertical scrolling.

Opening help must make the requested content discoverable without obscuring the answer; annotate the focus/announcement behavior and a secondary `Вернуться к ответу` return link when help is long. Submitting or retrying must not jump the learner back to the top of a long statement. No dashboard metrics, topic-selection sidebar, streak, or unrelated recommendation competes with the problem.

## Shared content and language patterns

Keep navigation labels, region order, action meanings, response preservation, and outcome wording consistent across widths. A width change changes arrangement, never assessment, help eligibility, or the meaning of completing a session. Keep visible copy simple, calm, concrete, and suitable for grades 5–6. Prefer a named action over `Продолжить` when the destination would be unclear.

| Meaning to communicate | Russian copy example | Boundary |
| --- | --- | --- |
| New practice purpose | `Попробуй знакомую идею в новой задаче.` | Show only when this reason applies to the selected work. |
| No usable conclusion for an area | `Пока мало примеров` | Explain whether work is absent, pending, or insufficient; never call the area weak. |
| Starting to use an idea | `Уже получается в некоторых задачах` | Include a concrete scope/example; do not imply broad independence. |
| More supported use | `Получается всё чаще в знакомых задачах` | Use only when repeated relevant work supports it; mention help when material. |
| Reliable use in observed scope | `Хорошо получается в таких задачах` | Describe the scope and retained history; avoid permanent ability labels. |
| A justified open practice need | `Стоит попробовать ещё в другой задаче` | Explain the actual reason; do not infer forgetting from time. |
| Correct result without meaningful help | `Решено самостоятельно` | Use only when the recorded work supports independence; otherwise use the narrower `Ответ верный`. |
| Correct result with material help | `Решено с подсказкой` | Retain a positive outcome and the support context; no penalty language. |
| Solution study | `Решение просмотрено` | Does not stand in for an independent solve. |
| Unresolved answer skipped | `Задача пропущена` | Does not imply incorrectness or loss of progress. |
| Pending submission followed by solution study | `Ответ пока не проверен. После отправки открыто решение.` | Preserve both facts; later reproduction cannot replace the earlier submission. |

These are illustrative translations of accepted meanings, not new scoring rules or automatic labels. Qualitative Progress descriptions need an explanation and supporting example where available. Preserve the difference between no usable work, limited positive work, and an observed difficulty; a concern may coexist with earlier success.

Keep `mastery`, `evidence`, `attribution`, `reconfirmation`, `confidence model`, and their technical translations in internal notes only. Do not show percentages, raw model states, capability tags as conclusions, recommendation scores, punitive messages, or claims that time erased progress. Do not invent example learner achievements or mathematical correctness; mark any illustrative history as synthetic in the internal annotation.

## Accessibility foundations

- Use a practical minimum touch target of about **44 × 44px** for buttons, navigation, hint controls, and image inspection; allow larger targets for wrapped Russian labels. Secondary styling must not mean a smaller or harder-to-use target.
- Every control works with a keyboard, has a descriptive accessible name, and shows visible focus. Reading and focus order follow the visual/content sequence. Include a keyboard skip-to-content entry labeled `К содержимому`.
- Start wireframe typography assumptions around 16–18px for statement/body/input text with comfortable line spacing around 1.5. These are readability review assumptions, not a selected font or visual identity. Never shrink body text to make a long statement fit.
- Provide persistent input labels and format instructions; placeholders alone are insufficient. Associate errors with the affected response and explain how to correct a format problem.
- Pair every result/current-navigation/disabled-state indication with text or another non-color cue. Correct, incorrect, partial, pending, and unavailable must remain understandable in an unstyled wireframe.
- Annotate accessible announcements for checking, feedback, and newly opened hints. Preserve focus on submission unless a deliberate transition requires moving it; retry focuses the response control. Do not repeatedly announce background updates or steal focus when assessment arrives later.
- Require Russian alt text for meaningful images and an equivalent description for complex diagrams. Decorative images, if ever present, carry no problem information. Test enlargement and return using keyboard alone.
- Allow labels, headings, feedback, and navigation to wrap and grow vertically. Never truncate a condition or action with an ellipsis. Check long Russian words, several lines of button text, enlarged text, and text spacing changes.
- Review at 320px and 360px with the on-screen keyboard visible, and with text enlarged to 200%. Check desktop zoom until the effective content width reaches 320px. Controls, focus, and error messages must remain reachable without page-level horizontal scrolling or overlapping regions.

These foundations specify acceptance checks for later artifacts; this document cannot establish keyboard, screen-reader, zoom, or rendering compliance by itself.

## Wireframe conventions

Use plain outlined regions, text, and simple image placeholders. No branding, color system, polished components, or animation specification is needed.

| Convention | Meaning and example |
| --- | --- |
| Artifact title outside the frame | English screen, state, and review width: `Practice — Incorrect answer — 320px`. Use complete names rather than opaque screen codes. |
| Named page regions | English labels outside the learner surface: `Global navigation`, `Problem context`, `Statement and diagram`, `Answer interaction`, `Feedback`, `Hints and solution`, `Continuation and session controls`. |
| Learner copy | Russian text inside the frame. Mark it as `UI copy` in accompanying notes when its role is ambiguous. Do not use English placeholder copy as a student-facing label. |
| Primary action | Annotate one control `[PRIMARY]`, such as `[PRIMARY] Проверить`. The marker is internal, not visible UI. A busy variation retains its position and is labeled internally as unavailable during checking. |
| Secondary action | Annotate `[SECONDARY] Подсказка`, `[SECONDARY] Пропустить задачу`, or a labeled navigation link. Do not imply a lower touch-target requirement. |
| State annotation | Outside the frame, record trigger, changed regions, retained context, selected primary action, and destination/result. Example: `Incorrect assessment; preserve answer and opened hints; retry focuses answer; no new attempt until submit`. |
| Responsive annotation | Record what stacks, wraps, widens, or stays identical at each review width. Separate frames are needed only when arrangement materially changes. |
| Content fixture | Mark statement/diagram dimensions and response type. Use a permitted sample or descriptive placeholder; record whether a fixture is synthetic. Never bulk-copy copyrighted tasks for layout convenience. |
| Accessibility annotation | Record reading/focus order, announcements, image description, keyboard behavior, and enlargement/return behavior where relevant. |
| Local detail variation | Show only the changed feedback/support/action region alongside the base frame, with a reference to its full screen name. Include full-frame examples when long text changes layout. |

Each screen family needs a 320px stress review and a 360px working frame. Add a tablet frame or annotation and a desktop frame showing actual differences. Do not reproduce every state at every width: review unchanged structure by annotation, but explicitly test long Russian labels, long statements, large diagrams, and pending/help combinations at the narrowest width.

## Alternatives, trade-offs, and consequences

| Decision area | Alternatives considered | Recommendation and consequence |
| --- | --- | --- |
| Mobile navigation | Visible in-flow text links; fixed bottom navigation; menu containing both links. | Visible header links make two destinations explicit with little structure. They scroll out of view on long tasks; vertical return is acceptable initially. A fixed bar consumes keyboard/reading space; a menu adds a step for only two destinations. |
| Desktop Practice | Single reading column; statement and interaction in adjacent columns. | One column preserves statement → answer → feedback order and handles long diagrams without a new reading pattern. It requires more vertical scrolling; test this trade-off before considering a split layout. |
| State representation | Separate page/frame for every outcome; one base layout plus annotated region variations. | Four base layouts with variations retain context and reduce duplication. Full-frame stress examples are still necessary when expanded hints/solutions change page length. |

These choices define a reviewable responsive information structure. They do not adopt production architecture. Human review of this proposal and actual wireframes precedes any dependent implementation.

## Explicit answers and OT-003.2 handoff

1. **What screens/state variants are actually needed?** Four screen families with the inventory above. Draw first/returning/paused/current Home; untouched/incorrect/hint/pending/solution Practice; Session summary; Progress. Add correct, partial, checking, invalid-format, skipped, exhausted-help, empty, unavailable, and recoverable-error variations as changed regions rather than new destinations.
2. **What shell/navigation should mobile use?** A compact in-flow header with visible `Главная` and `Мой прогресс`, followed by one vertical content column. Practice and summary stay contextual.
3. **What shell/navigation should desktop use?** The same two-link horizontal header and centered bounded content. Practice keeps one reading column; Home/Progress may use adjacent supporting content where it fits.
4. **What stays consistent across all screens?** Navigation names and meanings, one primary action when actionable, Russian copy, readable region order, accessible controls, and truthful treatment of work, help, pending responses, and progress.
5. **What changes materially between mobile and desktop?** Header wrapping, gutters/content measure, button width, and optional Home/Progress adjacency. The problem flow, content, available actions, and assessment meanings remain the same. Tablet adapts by fit.
6. **How should long statements and diagrams behave?** Full statement in normal vertical flow; intact figures fit the content width and offer accessible enlargement when needed. Only genuinely indivisible content may scroll locally; the page never overflows horizontally.
7. **Which actions must remain immediately visible?** Home's start/resume/return action, the response's submit/retry action, pending-state options, and outcome continuation appear directly in their relevant regions. Hint, skip, eligible solution reveal, and session controls remain visible secondary actions. No requirement forces every action above a long statement's fold.
8. **What should OT-003.2 wireframe first?** Start with **Practice — untouched problem / answer entry** at 360px, stress it at 320px using a long Russian statement and labeled diagram, then verify the same structure at tablet and desktop widths. Add incorrect → retry → hint → answer and correct → next variations; add pending → pause/resume and solution-exposed → next before expanding to Home, summary, and Progress. This tests the most constrained learning surface first without designing new behavior.

## Verification gaps and open questions

- Readability of the proposed widths, 44px controls, Russian labels, and long help content requires rendered wireframes and learner testing. The dimensions are starting assumptions, not measured usability results.
- Actual answer formats, assessment availability, and complex-diagram descriptions need content-specific review. Wireframes must not imply that every construction or proof is automatically checked.
- The accepted Core Practice Flow leaves pre-attempt solution reveal conditional on a later product choice and acknowledgement. Keep it annotated as conditional; do not make it universally available or prescribe a retry/hint count in these foundations.
- Test whether learners distinguish `Продолжить тренировку`, `Вернуться к задаче`, `Продолжить без проверки`, and `Завершить тренировку`. Pending-state wording and the primary pause action need particular attention.
- The amount of recent work on Home and supporting detail in Progress needs usability validation. Include only enough to explain the current action or conclusion; there is no new fixed quota here.
- No operational recovery timing, assessment promise, automatic session-ending policy, or new recommendation rule is established by an unavailable-state layout.

## Self-review and completion

Coverage was checked against the four input documents and OT-003.1: four screen families with all requested variations; two top-level destinations; 320/360px, tablet, and desktop behavior; six-level Practice hierarchy; Russian action/copy examples; empty/error/pending distinctions; accessibility; notation; alternatives; and all eight explicit answers. Research-task separates repository facts from interpretation and recommendation; architecture-task makes layout alternatives and their consequences reviewable within this document's authorized scope.

Validation: `git diff --check` and an untracked-file whitespace check passed. Only `docs/03-ux/wireframe-foundations.md` was created. No rendered wireframes, learner tests, browser checks, assistive-technology checks, or application tests were performed; this task produces documentation only.

**READY** — OT-003.1 wireframe foundations prepared for review; no commit, final design, or implementation authorization follows from this status.

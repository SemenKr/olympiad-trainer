# Learning Path v1 — UX contract

Status: adopted scope, implemented on the feature branch; not yet deployed.

## Learner flow

Home → guided Pack or Choose Practice → existing Practice → explicit Finish → factual Summary → next guided Pack. Returning learners can resume unfinished work before any new choice. Adaptive suggestions remain ahead of Path; fresh learners still start core Practice. Path is optional and every Pack is available through free choice.

The editorial sequence is A → J → H → L → D → G → E → I → C → B → F → K. It describes navigation through varied practice, not increasing difficulty, prerequisite achievement or readiness.

## Surfaces and wording

- **Home:** one primary action following the adopted precedence. A returning learner sees `Продолжить путь` and the earliest Pack without a marker. If all are recorded, offer `Выбрать тренировку`. Review and other destinations stay secondary.
- **Choose Practice:** guided ordered cards followed by the complete registry-order free-choice list. Each card shows position, real name, short content orientation and `Есть завершённая тренировка`, `Следующий ориентир` or `Можно выбрать`. No locks. J/K/L titles omit technical prefixes.
- **Summary:** task facts precede Journey rewards and next actions. Only Pack mode with a durable marker offers the next Path entry; other modes and unknown markers retain Home. Navigation does not change outcomes. All-recorded Pack Summary offers free choice.
- **Progress:** capability evidence remains in its own section. Path shows distinct Packs with recorded Finish and the optional next entry; Journey keeps XP/levels/badges in its own card. Path markers and Journey levels mean different things.

Copy explicitly explains that old trainings may lack markers. `Сохранённые завершения` counts distinct Packs with persisted Finish, including skips and early Finish, not solved tasks. Never label an entry mastered, weak, harder/easier, locked or ready. All-recorded state makes no claim of completing Grade 5.

## States and accessibility

The guide announces loading and read errors, offers Retry, and never replaces failure with zero markers. The static free-choice list remains available during guide loading/failure. Home preserves Resume, adaptive and fresh core actions when Path alone fails; returning guided states offer Retry/free choice. Progress preserves verified evidence/Journey and gives Path its own Retry/free-choice surface; Summary degrades to Home if optional Path information fails.

Cards use a semantic ordered list; state is expressed in text as well as styling. Pack links have distinct accessible names. Controls have at least 44px targets, visible keyboard focus and forced-color borders. No reward animation is added.

Chooser is one column below 768px, two at 768px and three at 1200px. Progress preserves evidence-first mobile DOM order followed by Path, Journey, destinations and history; desktop places separate Path/Journey cards beside evidence. Existing shells and tokens are reused. Free-choice anchors remain present regardless of unfinished Practice, and existing Pack entry guards preserve the draft.

This extension reuses the adopted UX v1 visual system referenced by Home/Chooser and Summary/Progress documents. It does not claim a new Figma approval or exact new Figma frames.

## Learner Validation

Continue Learner Validation v0 in parallel and record the exact tested build. Observe whether learners choose and return independently, understand markers as finished episodes rather than solved topics, discover free choice, and distinguish Path from Journey XP/levels. Do not force mathematical mistakes or infer instructional effectiveness. Prioritize critical and recurring consequential findings using the existing research protocol.

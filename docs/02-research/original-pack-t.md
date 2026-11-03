# Original Pack T — authoring dossier

Content candidate, 2026-11-03. This dossier contains protected teaching/authoring material in the repository, outside `public/`; it is not served as a learner asset. The owner authorized public distribution within Olympiad Trainer and its public GitHub repository as recorded below. Deployment and PR merge remain separate decisions.

Three distinct Grade 5 mathematics problems were composed for this task with Codex assistance, without copying a particular third-party statement, diagram or solution. The mathematical ideas are familiar; worldwide originality, an open content license and independent human verification are not asserted. Pack T has its own owner distribution decision below; Pack S's approval is not its basis. Independent human mathematics, age suitability and originality certification remain unrecorded.

| Problem | Interpretation (project, not official metadata) | Answer | Audit |
| --- | --- | --- | --- |
| `original-linked-code` — Код из трёх цифр | Constraints and uniqueness | 462 | Let units be one part: hundreds two, tens three. Six parts total 12. Check all distinct digits 1–6. Exhaustive digit search must find exactly 462. |
| `original-signal-flags` — Сигнальные флажки | Complete enumeration without duplication | 12 | Split by the white flag's position: 2, 2, 4, 2, 2. Exhaustively enumerate the multiset with no equal neighbours. Reversals remain distinct when the sequences differ. |
| `original-two-color-pairs` — Пары двух цветов | Worst case, guarantee and minimality | 7 | Without two colours each occurring twice, at most 4+1+1=6 tokens are possible. Four red, one blue and one green attain that bound. All bounded colour-count vectors of size 7 meet the target. |

Authoritative statements, assessment keys, three progressive hints and complete explanations live once in `src/modules/practice/server/problems/original-*.ts` for these IDs. The exact ordered Pack tuple is linked code → signal flags → two-colour pairs. Tasks do not supply new adaptive capability/evidence mappings; checking a numeric answer does not verify the learner's explanation.

Source facts: original project candidates; mathematics, Grade 5. They are **not VSOSh tasks** and have no official year, stage, region, task number or official solution. Provenance records authorship assistance, the scoped owner distribution approval and the limits of independent review, rather than inventing source references or certification.

## Exact owner distribution approval — 2026-11-03

Evidence: the owner's instruction “Finalize and publish Pack T through GitHub PR”, dated 2026-11-03. Exact approval:

> Public distribution of the three original Pack T problems, including statements, hints, solutions and related materials, is authorized for Olympiad Trainer and its public GitHub repository. No open license or independent originality certification is implied.

This covers `original-linked-code`, `original-signal-flags` and `original-two-color-pairs` in the ordered `pack-t` tuple above, including the owner's two preceding editorial corrections: the explicit 2 × 2 flags explanation and the seventh-draw “at least two” clarification. Statements, answers, hints and all content identities otherwise remain unchanged. Authorship assistance remains disclosed as “Оригинальные материалы проекта Olympiad Trainer, подготовленные с помощью Codex.”

The decision permits the requested GitHub PR publication; it does not certify independent human mathematics, Grade 5 suitability or originality, grant an open license, clear A–R content rights, authorize deployment/public application access changes, or authorize merging the PR. Reassess changed content or distribution outside the approved scope separately.

Review and release checklist:

- [ ] Human independently verifies all answers, uniqueness/completeness/minimality, hints and explanations against the exact modules.
- [ ] Human reviews Russian wording and Grade 5 suitability; the full enumeration and two-sided guarantee proof need actual learner validation.
- [x] Owner explicitly authorizes distribution of the exact three tasks and related materials within the scope recorded above; no independent originality certification is inferred.
- [ ] Release acceptance covers migrated storage, strict Finish and original-content access boundaries. Registration in this local branch is not a public access policy.

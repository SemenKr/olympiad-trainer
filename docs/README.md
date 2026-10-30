# Документация Olympiad Trainer

- [00-project](00-project/) — описание проекта и [видение продукта](00-project/project-vision.md).
- [02-research](02-research/) — исследование задач ВсОШ, навыков, learning evidence, recommendation/review моделей и [Learner Validation v0](02-research/learner-validation-v0.md).
- [03-ux](03-ux/) — пользовательские сценарии и актуальные UX-контракты, включая [Finish & Encouragement UX v0](03-ux/finish-encouragement-v0.md).
- [04-architecture](04-architecture/) — принятые domain/architecture контракты, включая Durable Practice History, Knowledge Support, [Practice Journey v1](04-architecture/practice-journey-v1.md), Review / Reconfirmation и Olympiad Simulation.
- [05-development](05-development/) — процесс разработки и Agent System.

Learning Path v1: [архитектурный контракт](04-architecture/learning-path-v1.md), [UX-контракт](03-ux/learning-path-v1.md). Merged в `main` (PR #72, `979887b`); статус конкретного деплоя проверяется отдельно.

Adaptive Practice v1: [принятый контракт следующей полезной задачи](04-architecture/adaptive-practice-v1.md) — три существующих носителя, объяснимый детерминированный выбор, фактические Finish-маркеры и совместимость со старой историей. Заменяет правила выбора adaptive v0; результат не является оценкой знаний.

Adaptive v1 release: [expand–migrate–contract procedure](05-development/adaptive-v1-expand-release.md) and [Stage A evidence](05-development/adaptive-v1-stage-a-evidence.md).

Olympiad Foundations: [исследовательский прототип v0.1](02-research/olympiad-foundations-prototype-v0.1.md) и [карточки примеров](02-research/olympiad-foundations-learner-cards-v0.1.md). Кандидат для проверки понятности подхода; не принятая учебная программа или production-функция.

Следующее наблюдение за новичком: [полевой лист LV-03](02-research/learner-validation-lv03-field-sheet.md) для печати и краткой записи по действующим протоколам.

Learner Identity & Recovery v1: [принятый архитектурный и продуктовый контракт](04-architecture/learner-identity-recovery-v1.md) и [production runbook](05-development/recovery-production-runbook.md). Recovery v1 выпущен в controlled canonical-host production; конфигурация и результаты релиза: [production runbook](05-development/recovery-production-runbook.md#current-production-release-record).

Content authoring: [Content Pipeline v1](05-development/content-pipeline-v1.md).

M2 local integration: [scalability and canonical lifecycle acceptance](05-development/m2-integration-scalability-acceptance.md).

Public attribution and rights gates: [Content Sources & Attribution v1](05-development/content-sources-attribution-v1.md).

Grade 5 curriculum research v1 (proposal, not adopted): [all-60 coverage matrix](02-research/grade5-curriculum-coverage-v1.md), [gap analysis and official evidence](02-research/grade5-curriculum-gap-analysis-v1.md), [prioritized roadmap and release gates](00-project/grade5-curriculum-roadmap-v1.md).

Visual Reasoning v1 (local Pack S integration; human release gates open): [three problems, SVG prototypes and learner criteria](02-research/visual-reasoning-v1.md), [adopted technical direction](04-architecture/original-content-visual-slice-v1.md), [implementation evidence and release gates](05-development/visual-reasoning-v1-implementation.md).

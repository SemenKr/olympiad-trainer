# Olympiad Trainer

## Что это

Веб-приложение для системной подготовки школьников к олимпиадам.

Первая специализация: математика и подготовка к ВсОШ.

Продукт должен помогать ученику самостоятельно находить решение, а не просто показывать правильный ответ.

## Основной пользователь

Первая версия ориентирована на ученика 5–6 класса.

В дальнейшем:

* другие классы;
* другие этапы ВсОШ;
* другие олимпиады;
* другие предметы;
* родительский профиль.

## Основной learning loop

Рекомендация задачи
→ самостоятельная попытка
→ проверка
→ повторная попытка
→ progressive hints
→ разбор
→ похожая задача
→ сохранение результата
→ обновление прогресса
→ следующая задача.

## Ключевая бизнес-логика

* progressive hints;
* история попыток;
* оценка самостоятельности;
* mastery по навыкам;
* weak-topic detection;
* review queue;
* adaptive difficulty;
* подбор следующей задачи;
* режим пробной ВсОШ.

## Completed milestone: Fullstack MVP Deployed

Статус: завершён.

Первый fullstack milestone подтверждён в production:

> Ученик проходит тренировку, сохраняет проверенные свидетельства рассуждения в PostgreSQL и видит выведенный из них прогресс после перезагрузки или в новой вкладке.

Текущее состояние продукта:

* математика, 5 класс;
* 3 production-задачи и 2 вида ответа;
* Progress на основе проверенных свидетельств по двум возможностям;
* anonymous learner persistence в PostgreSQL.

## Completed milestone: Adaptive Practice v0 — Next Useful Problem

Статус: завершён и проверен в production.

Этот выпущенный этап добавил отдельный адаптивный эпизод переноса для `brothers-ages-products`. Следующий этап расширяет его вторым явным путём для `parrots-guaranteed-colors`.

## Completed milestone: Adaptive Practice v1 — Two-Capability Transfer

Статус: завершён.

Этап сохранил фиксированное ядро из 3 задач и добавил второй явный путь переноса для `parrots-guaranteed-colors`, наряду с `brothers-ages-products`.

## Completed milestone: Home Adaptive Availability

Статус: завершён.

Домашний экран показывает доступность адаптивной тренировки на основе learner-safe серверных фактов; он не представляет это как mastery или выведенный прогресс.

## Текущий этап: Durable Practice History v0

Зафиксировать bounded серверную проекцию завершённой тренировки при успешном Finish: одну запись на эпизод, с идемпотентностью через Finish receipt и атомарной записью. Хранить последние 50 эпизодов и читать последние 10; не переносить локальные Summary в историю. Последний Summary остаётся в браузере. Эта история не содержит ответов или черновиков и не выводит mastery, progress или рекомендации. Полный контракт: [Durable Practice History v0](../04-architecture/durable-practice-history-v0.md).

## Не входит в ранний MVP

* AI-генерация задач;
* AI как основной механизм проверки;
* Telegram;
* социальные функции;
* рейтинги;
* сложная gamification;
* отдельный backend;
* Redux/Zustand без необходимости;
* ML-рекомендации.

## Техническая цель

Portfolio-quality fullstack проект:

* Next.js;
* TypeScript;
* PostgreSQL;
* чистая domain logic;
* Server Components;
* минимальные Client Components;
* forms/validation;
* auth/roles;
* responsive UI;
* accessibility;
* loading/error/empty states;
* unit/integration/e2e tests;
* CI/CD;
* deployment.

## Принцип разработки

Вертикальные итерации:

Problem в БД
→ получение
→ UI
→ ответ
→ Attempt
→ feedback
→ progress.

Не создавать архитектурные слои без конкретной необходимости.

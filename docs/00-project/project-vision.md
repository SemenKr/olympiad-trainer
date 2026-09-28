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

## Следующий этап: Adaptive Practice v1 — Two-Capability Transfer

Добавить один содержательный путь переноса для существующей возможности `Как гарантировать результат`, сохранив фиксированное ядро из 3 задач и поддержав два явных пути адаптивной рекомендации. В эту цель не входят recommendation score, generic ranking engine, mastery score или система адаптивной сложности.

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

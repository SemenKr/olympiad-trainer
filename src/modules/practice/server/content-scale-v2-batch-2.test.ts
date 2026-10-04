import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("../../simulation/server/assistance-guard", () => ({
  requireSimulationAssistanceAllowed: vi.fn(async () => {}),
}));

import { submitPracticeAnswer } from "../../../app/practice/actions";
import {
  CORE_EPISODE_PROBLEM_IDS,
  EXPLORATION_EPISODE_PROBLEM_ID,
  PRACTICE_PACKS,
  TRANSFER_EPISODE_PROBLEM_IDS,
} from "../application/completed-practice-episode";
import { getPracticeProgressContribution } from "../application/practice-progress-evidence";
import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  startPractice,
} from "../application/practice-state";
import {
  getLearnerSafePackProblems,
  getLearnerSafePracticeProblem,
  getProblemDefinition,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
} from "./problem-catalog";

// Independently reviewed Content Scale v2 — Batch 2 contract.
const batch = [
  {
    id: "chocolate-promotion-price",
    title: "Цена шоколадки",
    statement:
      "В магазине все шоколадки одного вида имеют одинаковую обычную цену. При покупке нескольких шоколадок четвёртая, восьмая, двенадцатая и так далее стоят по 70 рублей каждая, а остальные — по обычной цене. За 10 шоколадок Маша заплатила 1020 рублей. Сколько рублей стоит одна шоколадка без акции?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2024/25",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 1,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/tasks-math-5-prigl-msk-24-25.pdf",
        page: 1,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/sol-math-5-prigl-msk-24-25.pdf",
        page: 1,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "110",
    },
    hints: [
      "Среди десяти шоколадок отдели те, которые продаются по акции, от остальных.",
      "По 70 рублей стоят четвёртая и восьмая шоколадки. Вычти их стоимость из всей покупки.",
      "После вычитания стоимости двух акционных шоколадок останется стоимость восьми одинаковых шоколадок по обычной цене.",
    ],
    solution:
      "Из десяти шоколадок две стоят по 70 рублей, а восемь — по обычной цене. На две акционные потрачено 2 · 70 = 140 рублей. Остальные стоят вместе 1020 − 140 = 880 рублей. Поэтому обычная цена равна 880 : 8 = 110 рублей. Проверка: 8 · 110 + 2 · 70 = 1020. Ответ: 110.",
  },
  {
    id: "school-lesson-teacher-count",
    title: "Сколько учителей?",
    statement:
      "В школе 1200 учеников. За один учебный день каждый посещает ровно 5 уроков. На каждом уроке присутствует ровно 30 учеников, и каждый урок ведёт один учитель. Каждый учитель за этот день проводит ровно 4 урока. Сколько учителей работает в школе?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2024/25",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 5,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/tasks-math-5-sch-msk-24-25.pdf",
        page: 2,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/sol-math-5-sch-msk-24-25.pdf",
        page: 3,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "50",
    },
    hints: [
      "Сначала посчитай все посещения уроков за день. Один ученик создаёт несколько посещений.",
      "Раздели число посещений на 30: так ты найдёшь число проведённых уроков, а не число учителей.",
      "Всего получается 1200 · 5 = 6000 посещений. На каждого учителя приходится 4 урока по 30 посещений.",
    ],
    solution:
      "За день ученики создают 1200 · 5 = 6000 посещений уроков. На одном уроке 30 учеников, поэтому проводится 6000 : 30 = 200 уроков. Каждый учитель ведёт 4 урока, значит учителей 200 : 4 = 50. Проверка: 50 · 4 · 30 = 6000. Ответ: 50.",
  },
  {
    id: "soldier-figures-guarantee",
    title: "Лучники и мечники",
    statement:
      "У Ильи 16 игрушечных фигурок двух видов: лучники и мечники. Какую бы тройку фигурок он ни отдал брату, среди оставшихся мечников будет больше, чем лучников. Если вместо этого он отдаст половину всех мечников, то лучников останется больше, чем мечников. Сколько лучников у Ильи?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2023/24",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 4,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
        page: 1,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
        page: 3,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "6",
    },
    hints: [
      "Первое условие должно выполняться даже тогда, когда Илья отдаёт трёх мечников.",
      "После отдачи трёх мечников их всё ещё больше, чем лучников. Используй общее количество 16, чтобы ограничить число лучников сверху.",
      "Лучников не больше 6. Проверь, какое из чисел от 0 до 6 позволяет оставить половину мечников и получить больше лучников, чем оставшихся мечников.",
    ],
    solution:
      "Пусть лучников a, тогда мечников 16 − a. Мечников не может быть меньше трёх: тогда можно отдать всех мечников и дополнить тройку лучниками, и первое условие нарушится. Значит, тройку мечников отдать можно. После этого 13 − a > a, откуда a < 6,5 и a ≤ 6. Второе условие означает a > (16 − a) : 2, то есть 3a > 16 и a ≥ 6. Поэтому a = 6, а мечников 10. Проверка: если отдать трёх мечников, останется 7 мечников против 6 лучников; любая другая тройка ещё выгоднее для мечников. Если отдать половину мечников, останется 5 мечников против 6 лучников. Ответ: 6.",
  },
  {
    id: "apple-harvest-assignments",
    title: "Урожай яблок",
    statement:
      "Алёна, Боря, Вера и Полина собрали яблоки. Каждый из них собрал одно из четырёх разных количеств: 11, 17, 19 или 24 яблока. Все четыре количества использованы по одному разу; кто сколько собрал, пока неизвестно. Известно, что 11 яблок собрала одна из девочек, Алёна собрала больше Бори, а сумма яблок Алёны и Веры делится на 3. Выбери все верные утверждения о том, сколько яблок они собрали.",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2020/21",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 4,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/tasks-math-5-prigl-msk-20-21.pdf",
        page: 2,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/ans-math-5-prigl-msk-20-21.pdf",
        page: 2,
      },
    },
    assessment: {
      kind: "multiple-choice-set",
      instruction: "Выбери все верные утверждения.",
      options: [
        {
          id: "alena-19",
          label: "Алёна собрала 19 яблок",
        },
        {
          id: "borya-11",
          label: "Боря собрал 11 яблок",
        },
        {
          id: "vera-11",
          label: "Вера собрала 11 яблок",
        },
        {
          id: "polina-24",
          label: "Полина собрала 24 яблока",
        },
        {
          id: "alena-24",
          label: "Алёна собрала 24 яблока",
        },
        {
          id: "vera-17",
          label: "Вера собрала 17 яблок",
        },
      ],
      expectedOptionIds: ["alena-19", "vera-11", "polina-24"],
    },
    hints: [
      "Найди пары разных чисел из 11, 17, 19 и 24, сумма которых делится на 3.",
      "Алёна не могла собрать 11 яблок: тогда она не собрала бы больше Бори. Если бы у неё было 17, у Бори было бы 11, но 11 собрала девочка.",
      "Алёна не могла собрать 24: ни одно из трёх других чисел вместе с 24 не даёт сумму, кратную 3. Определи оставшееся количество Алёны и затем Веры.",
    ],
    solution:
      "Боря не собрал 11, потому что это количество собрала девочка. Алёна собрала больше Бори, поэтому у неё не 11. Если бы у Алёны было 17, у Бори должно было бы быть 11 — невозможно. У Алёны не 24, поскольку суммы 24 + 11, 24 + 17 и 24 + 19 не делятся на 3. Поэтому Алёна собрала 19, а Боря — 17. Из оставшихся чисел только 11 даёт с 19 сумму, кратную 3: 19 + 11 = 30. Значит, Вера собрала 11, Полина — 24. Верны утверждения про 19 яблок Алёны, 11 яблок Веры и 24 яблока Полины.",
  },
  {
    id: "liar-council-maximum",
    title: "Заседание на острове",
    statement:
      "На заседание пришли 50 жителей острова: рыцари всегда говорят правду, а лжецы всегда лгут. Лжецов было k, где k не меньше 4. Каждый лжец сделал одно заявление. Первый сказал, что рыцарей меньше, чем лжецов; второй — что их поровну. Третий сказал, что рыцарей на 1 больше, четвёртый — на 2 больше, и так далее: k-й сказал, что рыцарей на k − 2 больше, чем лжецов. Какое наибольшее значение k возможно?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2023/24",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 8,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
        page: 2,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
        page: 7,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "17",
    },
    hints: [
      "Все перечисленные заявления ложны. Что следует из ложности первого и второго заявления?",
      "Рыцарей больше, чем лжецов. Их превышение не может равняться ни одному числу от 1 до k − 2.",
      "Значит, рыцарей хотя бы на k − 1 больше, чем лжецов. Сравни минимальное общее число жителей с 50 и обязательно проверь достижимость границы.",
    ],
    solution:
      "Первый лжец соврал, поэтому рыцарей не меньше, чем лжецов. Второй тоже соврал, поэтому их не поровну: рыцарей больше. Остальные лжецы исключили превышения 1, 2, …, k − 2. Значит, рыцарей минимум k + (k − 1) = 2k − 1. Вместе с k лжецами это минимум 3k − 1 человек. Поэтому 3k − 1 ≤ 50, откуда k ≤ 17. Граница достижима: при 17 лжецах и 33 рыцарях рыцарей на 16 больше. Ни одно заявление о меньшем числе, равенстве или превышении от 1 до 15 не верно. Все 17 лжецов действительно солгали. Ответ: 17.",
  },
  {
    id: "central-coin-column",
    title: "Монеты в среднем столбце",
    statement:
      "В клетки доски 7 × 7 разложили 234 монеты. В клетке может быть любое неотрицательное целое число монет. В любых четырёх подряд идущих клетках одной строки или одного столбца лежит ровно 19 монет. Сколько монет находится в четвёртом столбце?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2023/24",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 7,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
        page: 2,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
        page: 6,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "32",
    },
    hints: [
      "Сумма верхних четырёх клеток среднего столбца равна 19, как и сумма нижних четырёх. При сложении этих сумм центральная клетка посчитана дважды.",
      "Найди число монет в центре двойным подсчётом. Каждый квадрат 4 × 4 в углу доски содержит 4 · 19 монет. Рассмотри сумму по четырём таким квадратам.",
      "Пусть в центре c монет. Тогда средняя строка и средний столбец содержат по 38 − c монет. В сумме четырёх угловых квадратов клетки вне этих линий посчитаны один раз, остальные клетки линий — два раза, а центр — четыре раза.",
    ],
    solution:
      "Обозначим число монет в центральной клетке через c. Верхние четыре клетки среднего столбца содержат 19 монет, нижние четыре — ещё 19, а центр попал в обе суммы. Поэтому весь средний столбец содержит 38 − c монет. Так же вся средняя строка содержит 38 − c.\n\nВозьмём четыре квадрата 4 × 4, каждый примыкает к своему углу доски. В каждом из них четыре отрезка строки по четыре клетки, поэтому 4 · 19 = 76 монет. Общая сумма по квадратам — 4 · 76 = 304. Каждая клетка вне средней строки и среднего столбца вошла в один квадрат. Клетки этих линий, кроме центра, вошли в два квадрата, а центр — во все четыре. Поэтому 304 получается из всех 234 монет, если добавить ещё по одному среднему столбцу и средней строке, а затем ещё одну центральную клетку: 304 = 234 + (38 − c) + (38 − c) + c = 310 − c. Отсюда c = 6. В среднем столбце 38 − 6 = 32 монеты.\n\nТакая расстановка действительно существует. Повторяй по строкам и столбцам блок из четырёх строк:\n\n14, 0, 0, 5;\n0, 14, 0, 5;\n0, 0, 16, 3;\n5, 5, 3, 6.\n\nОставь первые семь строк и столбцов повторённой таблицы. В каждой строке и каждом столбце блока сумма 19, поэтому любые четыре подряд идущие клетки дают 19. В доске 7 × 7 числа 14, 14 и 16 из первых трёх диагональных клеток блока встречаются по четыре раза; числа 5, 5 и 3 в четвёртых строке и столбце дают ещё 52 монеты; центральная клетка даёт 6. Всего 4 · (14 + 14 + 16) + 52 + 6 = 234. Ответ: 32.",
  },
  {
    id: "five-fridays-calendar",
    title: "Пять пятниц",
    statement:
      "В календарном месяце было ровно пять пятниц. При этом ни первый, ни последний день месяца не был пятницей. Какой день недели пришёлся на 12-е число? Выбери подходящий вариант.",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2021/22",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 1,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf",
        page: 4,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf",
        page: 8,
      },
    },
    assessment: {
      kind: "multiple-choice-set",
      instruction: "Выбери подходящий вариант.",
      options: [
        {
          id: "monday",
          label: "Понедельник",
        },
        {
          id: "tuesday",
          label: "Вторник",
        },
        {
          id: "wednesday",
          label: "Среда",
        },
        {
          id: "thursday",
          label: "Четверг",
        },
        {
          id: "friday",
          label: "Пятница",
        },
        {
          id: "saturday",
          label: "Суббота",
        },
        {
          id: "sunday",
          label: "Воскресенье",
        },
      ],
      expectedOptionIds: ["monday"],
    },
    hints: [
      "Если первая пятница приходится на число f, то пятая будет на 28 дней позже. В месяце не бывает больше 31 дня.",
      "Первая пятница не может быть 1-го числа. Если она 3-го, пятая приходится на 31-е и становится последним днём месяца.",
      "Остаётся первая пятница 2-го числа. Выпиши ближайшие пятницы и отсчитай от них до 12-го числа.",
    ],
    solution:
      "Пусть первая пятница месяца имеет число f. Тогда пятая пятница — f + 28. Так как в месяце не больше 31 дня, f ≤ 3. f = 1 исключено: первый день не пятница. При f = 3 пятая пятница была бы 31-го числа, в последний день месяца, что тоже запрещено. Значит, f = 2. Пятницы идут 2, 9, 16, 23 и 30-го; месяц должен иметь 31 день, чтобы 30-е не было последним. После пятницы 9-го идут суббота 10-го, воскресенье 11-го, понедельник 12-го. Ответ: понедельник.",
  },
  {
    id: "circular-table-seat-count",
    title: "Места за круглым столом",
    statement:
      "Люди сидят на равных расстояниях друг от друга по окружности круглого стола. Их места пронумерованы по часовой стрелке подряд: 1, 2, 3 и так далее. Расстояние по прямой от места 31 до места 7 равно расстоянию по прямой от места 31 до места 14. Сколько всего людей сидит за столом?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2021/22",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 2,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf",
        page: 4,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf",
        page: 8,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "41",
    },
    hints: [
      "На окружности два разных места, равноудалённых от одного места, расположены симметрично относительно него.",
      "От места 31 до места 14 против часовой стрелки — 17 промежутков между соседними местами. Столько же промежутков должно быть от 31 до 7 в другую сторону.",
      "На пути по часовой стрелке от 31 до 7 сначала идут места 32, 33 и так далее, затем 1, 2, …, 7. Учти промежуток от последнего номера до 1.",
    ],
    solution:
      "Равные прямые расстояния — равные хорды окружности. Значит, места 7 и 14 симметричны относительно места 31: от 31 до 14 против часовой стрелки столько же промежутков, сколько от 31 до 7 по часовой. От 31 до 14 — 31 − 14 = 17 промежутков. Если всего мест N, то от 31 до 7 по часовой стрелке N − 31 + 7 = N − 24 промежутка. Получаем N − 24 = 17, поэтому N = 41. Проверка: от 31 до 41 — 10 промежутков, от 41 через 1 до 7 — ещё 7. Ответ: 41.",
  },
  {
    id: "balanced-six-groups",
    title: "Шесть групп кружка",
    statement:
      "Участников математического кружка распределили в шесть групп так, что размеры любых двух групп отличаются не больше чем на одного человека. Ровно в четырёх группах оказалось по 13 участников. Какое общее количество участников могло быть? Выбери все подходящие числа.",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2021/22",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 5,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf",
        page: 5,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf",
        page: 10,
      },
    },
    assessment: {
      kind: "multiple-choice-set",
      instruction: "Выбери все подходящие числа.",
      options: [
        {
          id: "total-74",
          label: "74",
        },
        {
          id: "total-76",
          label: "76",
        },
        {
          id: "total-77",
          label: "77",
        },
        {
          id: "total-78",
          label: "78",
        },
        {
          id: "total-79",
          label: "79",
        },
        {
          id: "total-80",
          label: "80",
        },
        {
          id: "total-82",
          label: "82",
        },
      ],
      expectedOptionIds: ["total-76", "total-80"],
    },
    hints: [
      "В каждой из двух оставшихся групп не 13 участников: групп такого размера ровно четыре.",
      "Размер каждой оставшейся группы отличается от 13 не больше чем на один, поэтому это 12 или 14.",
      "Можно ли одновременно иметь группу из 12 и группу из 14 участников? После ответа посчитай суммы для двух оставшихся случаев.",
    ],
    solution:
      "Четыре группы содержат 4 · 13 = 52 участника. В каждой из двух остальных групп либо 12, либо 14 человек: 13 запрещено словом «ровно», а другие размеры отличаются от 13 больше чем на один. Группы из 12 и 14 одновременно невозможны, потому что отличаются на два. Поэтому возможны только два варианта: 52 + 12 + 12 = 76 или 52 + 14 + 14 = 80. Оба достижимы: размеры 13,13,13,13,12,12 и 13,13,13,13,14,14 удовлетворяют всем условиям. Ответ: 76 и 80.",
  },
] as const;

describe("Content Scale v2 — Batch 2", () => {
  it("resolves 42 distinct production Grade-5 problems with twelve ordinary Packs", () => {
    const ids = [
      ...CORE_EPISODE_PROBLEM_IDS,
      ...TRANSFER_EPISODE_PROBLEM_IDS,
      EXPLORATION_EPISODE_PROBLEM_ID,
      ...PRACTICE_PACKS.flatMap((pack) => pack.problemIds),
    ];
    expect(PRACTICE_PACKS).toHaveLength(12);
    expect(ids).toHaveLength(42);
    expect(new Set(ids).size).toBe(42);
    for (const id of ids) {
      expect(getProblemDefinition(id)).toMatchObject({
        id,
        grade: 5,
        subject: "mathematics",
      });
    }
    const problems = getLearnerSafePackProblems();
    expect(
      PRACTICE_PACKS.slice(9, 12).flatMap((pack) => pack.problemIds),
    ).toEqual(batch.map((item) => item.id));
    for (const pack of PRACTICE_PACKS) {
      expect(problems[pack.id]).toEqual(
        pack.problemIds.map(getLearnerSafePracticeProblem),
      );
    }
  });

  it.each(batch)(
    "preserves the accepted content and server-only boundary for $id",
    (item) => {
      const definition = getProblemDefinition(item.id);
      const learner = getLearnerSafePracticeProblem(item.id);
      expect(definition).toEqual({
        id: item.id,
        grade: 5,
        subject: "mathematics",
        title: item.title,
        statement: item.statement,
        provenance: item.provenance,
        assessment: item.assessment,
        hints: item.hints.map((text, index) => ({
          id: `${item.id}-${["focus", "strategy", "next-step"][index]}`,
          level: ["focus", "strategy", "next-step"][index],
          text,
        })),
        solution: {
          id: `${item.id}-full-solution`,
          kind: "training-adaptation",
          text: item.solution,
        },
      });
      expect(learner).toEqual({
        problemId: item.id,
        title: item.title,
        statement: item.statement,
        response:
          item.assessment.kind === "multiple-choice-set"
            ? {
                kind: "multiple-choice-set",
                instruction: item.assessment.instruction,
                options: item.assessment.options,
              }
            : { kind: "short-numeric" },
        hints: definition.hints.map((hint) => ({
          hintId: hint.id,
          level: hint.level,
        })),
        solution: { solutionId: definition.solution.id },
      });
      for (const hint of definition.hints) {
        expect(getRevealedPracticeHint(item.id, hint.id)).toEqual({
          hintId: hint.id,
          level: hint.level,
          text: hint.text,
        });
      }
      expect(
        getRevealedPracticeSolution(item.id, definition.solution.id),
      ).toEqual({ solutionId: definition.solution.id, text: item.solution });
      expect(() => getRevealedPracticeHint(item.id, "unknown-hint")).toThrow();
      expect(() =>
        getRevealedPracticeSolution(item.id, "unknown-solution"),
      ).toThrow();
      const serialized = JSON.stringify(learner);
      for (const field of [
        "assessment",
        "provenance",
        "expectedAnswer",
        "expectedOptionIds",
        "reasoningCheckpoint",
        "adaptiveFacts",
        "prerequisites",
      ]) {
        expect(learner).not.toHaveProperty(field);
      }
      for (const text of [...item.hints, item.solution]) {
        expect(serialized).not.toContain(JSON.stringify(text).slice(1, -1));
      }
    },
  );

  it.each(batch)(
    "checks $id through the existing server action without capability contributions",
    async (item) => {
      const answer =
        item.assessment.kind === "multiple-choice-set"
          ? [...item.assessment.expectedOptionIds].reverse()
          : item.assessment.expectedAnswer;
      const checked = await submitPracticeAnswer(item.id, answer);
      expect(checked.status).toBe("correct");
      const summary = getPracticeSummary(
        finishPractice(recordAnswerResult(startPractice(), checked)),
      );
      expect(
        getPracticeProgressContribution({
          problemId: item.id,
          summary,
        }),
      ).toBeNull();
      expect(getProblemDefinition(item.id)).not.toHaveProperty(
        "reasoningCheckpoint",
      );
      expect(getProblemDefinition(item.id)).not.toHaveProperty("adaptiveFacts");
      if (item.assessment.kind === "nonnegative-integer") {
        expect(
          (
            await submitPracticeAnswer(
              item.id,
              String(Number(item.assessment.expectedAnswer) + 1),
            )
          ).status,
        ).toBe("incorrect");
      }
    },
  );

  it("exposes exactly six approved apple statements and rejects a Markdown separator as an answer", async () => {
    const learner = getLearnerSafePracticeProblem("apple-harvest-assignments");
    expect(learner.response).toMatchObject({
      kind: "multiple-choice-set",
      options: [
        { id: "alena-19", label: "Алёна собрала 19 яблок" },
        { id: "borya-11", label: "Боря собрал 11 яблок" },
        { id: "vera-11", label: "Вера собрала 11 яблок" },
        { id: "polina-24", label: "Полина собрала 24 яблока" },
        { id: "alena-24", label: "Алёна собрала 24 яблока" },
        { id: "vera-17", label: "Вера собрала 17 яблок" },
      ],
    });
    expect(
      (await submitPracticeAnswer("apple-harvest-assignments", ["---"])).status,
    ).toBe("invalid");
    expect(
      (
        await submitPracticeAnswer("apple-harvest-assignments", [
          "alena-19",
          "vera-11",
          "polina-24",
          "---",
        ])
      ).status,
    ).toBe("invalid");
  });

  it.each(
    batch.filter((item) => item.assessment.kind === "multiple-choice-set"),
  )(
    "requires the exact set of stable, unique option IDs for $id",
    async (item) => {
      if (item.assessment.kind !== "multiple-choice-set")
        throw new Error("Expected set assessment");
      const known = item.assessment.options.map((option) => option.id);
      const expected: readonly string[] = item.assessment.expectedOptionIds;
      expect(new Set(known).size).toBe(known.length);
      // Exhaust all possible selections: only the independently reviewed exact answer set passes.
      for (let mask = 1; mask < 2 ** known.length; mask++) {
        const selected = known.filter((_, index) => mask & (1 << index));
        const exact =
          selected.length === expected.length &&
          selected.every((id) => expected.includes(id));
        expect((await submitPracticeAnswer(item.id, selected)).status).toBe(
          exact ? "correct" : "incorrect",
        );
      }
      for (const invalid of [
        [],
        [expected[0], expected[0]],
        [...expected, "unknown-option"],
        expected.join(","),
      ]) {
        expect((await submitPracticeAnswer(item.id, invalid)).status).toBe(
          "invalid",
        );
      }
    },
  );
});

// Reproduce the finite checks/construction from the independent mathematical
// review. These support the contract; primary-source review remains separate.
describe("Batch 2 mathematical regression checks", () => {
  it("finds the unique soldier count under every possible three-figure gift", async () => {
    const possible = [];
    for (let archers = 0; archers <= 16; archers++) {
      const swordsmen = 16 - archers;
      const gifts = [0, 1, 2, 3].filter(
        (givenArchers) =>
          givenArchers <= archers && 3 - givenArchers <= swordsmen,
      );
      if (
        gifts.every(
          (givenArchers) =>
            swordsmen - (3 - givenArchers) > archers - givenArchers,
        ) &&
        swordsmen % 2 === 0 &&
        archers > swordsmen / 2
      )
        possible.push(archers);
    }
    expect(possible).toEqual([6]);
    expect(
      (
        await submitPracticeAnswer(
          "soldier-figures-guarantee",
          String(possible[0]),
        )
      ).status,
    ).toBe("correct");
  });

  it("finds the apple assignment without assigning names to the initial quantity list", async () => {
    const quantities = [11, 17, 19, 24];
    const assignments = [];
    for (const alena of quantities)
      for (const borya of quantities)
        for (const vera of quantities)
          for (const polina of quantities) {
            if (
              new Set([alena, borya, vera, polina]).size === 4 &&
              borya !== 11 &&
              alena > borya &&
              (alena + vera) % 3 === 0
            )
              assignments.push([alena, borya, vera, polina]);
          }
    expect(assignments).toEqual([[19, 17, 11, 24]]);
    const [alena, , vera, polina] = assignments[0];
    expect(
      (
        await submitPracticeAnswer("apple-harvest-assignments", [
          `alena-${alena}`,
          `vera-${vera}`,
          `polina-${polina}`,
        ])
      ).status,
    ).toBe("correct");
  });

  it("checks each liar statement and the maximum feasible council", async () => {
    const possible = [];
    for (let liars = 4; liars <= 50; liars++) {
      const knights = 50 - liars;
      const statements = [knights < liars, knights === liars];
      for (let difference = 1; difference <= liars - 2; difference++)
        statements.push(knights === liars + difference);
      if (statements.every((value) => !value)) possible.push(liars);
    }
    expect(Math.max(...possible)).toBe(17);
    expect(
      (
        await submitPracticeAnswer(
          "liar-council-maximum",
          String(Math.max(...possible)),
        )
      ).status,
    ).toBe("correct");
  });

  it("verifies the coin construction satisfies every sliding constraint and the total", async () => {
    const block = [
      [14, 0, 0, 5],
      [0, 14, 0, 5],
      [0, 0, 16, 3],
      [5, 5, 3, 6],
    ];
    const grid = Array.from({ length: 7 }, (_, row) =>
      Array.from({ length: 7 }, (_, column) => block[row % 4][column % 4]),
    );
    for (let line = 0; line < 7; line++)
      for (let start = 0; start < 4; start++) {
        expect(
          grid[line]
            .slice(start, start + 4)
            .reduce((sum, count) => sum + count, 0),
        ).toBe(19);
        expect(
          grid.slice(start, start + 4).reduce((sum, row) => sum + row[line], 0),
        ).toBe(19);
      }
    expect(grid.flat().reduce((sum, count) => sum + count, 0)).toBe(234);
    const middle = grid.reduce((sum, row) => sum + row[3], 0);
    expect(middle).toBe(32);
    expect(
      (await submitPracticeAnswer("central-coin-column", String(middle)))
        .status,
    ).toBe("correct");
  });

  it("exhausts possible month lengths and weekday starts", async () => {
    const weekdays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const twelfths = new Set<string>();
    for (const length of [28, 29, 30, 31])
      for (let first = 0; first < 7; first++) {
        const days = Array.from({ length }, (_, date) => (first + date) % 7);
        if (
          days.filter((day) => day === 4).length === 5 &&
          days[0] !== 4 &&
          days[length - 1] !== 4
        )
          twelfths.add(weekdays[days[11]]);
      }
    expect([...twelfths]).toEqual(["monday"]);
    expect(
      (await submitPracticeAnswer("five-fridays-calendar", [...twelfths]))
        .status,
    ).toBe("correct");
  });

  it("checks equal-chord cyclic symmetry independently of the narrative solution", async () => {
    const possible = [];
    // Symmetry implies N divides (31 - 7) + (31 - 14) = 41,
    // so a valid N is at most 41 and must accommodate seat 31.
    for (let seats = 31; seats <= 41; seats++) {
      if ((31 - 7 + (31 - 14)) % seats === 0) possible.push(seats);
    }
    expect(possible).toEqual([41]);
    expect(
      (
        await submitPracticeAnswer(
          "circular-table-seat-count",
          String(possible[0]),
        )
      ).status,
    ).toBe("correct");
  });

  it("exhausts the remaining group sizes under both strict count and difference constraints", async () => {
    const totals = new Set<number>();
    for (let first = 1; first <= 26; first++)
      for (let second = 1; second <= 26; second++) {
        const sizes = [13, 13, 13, 13, first, second];
        if (
          sizes.filter((size) => size === 13).length === 4 &&
          Math.max(...sizes) - Math.min(...sizes) <= 1
        )
          totals.add(sizes.reduce((sum, size) => sum + size, 0));
      }
    expect([...totals]).toEqual([76, 80]);
    expect(
      (
        await submitPracticeAnswer(
          "balanced-six-groups",
          [...totals].map((total) => `total-${total}`),
        )
      ).status,
    ).toBe("correct");
  });
});

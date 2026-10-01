import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

// Accepted Content Scale v2 — Batch 1 content contract.
const batch = [
  {
    id: "nonadjacent-row-seating",
    title: "Рассадка без соседей",
    statement:
      "В аудитории 16 рядов. В первом ряду 10 мест, во втором — 11, в третьем — 12 и так далее, в последнем — 25 мест. Участников рассадили так, что никакие два участника не сидят на соседних местах в одном ряду. Какое наибольшее количество участников можно так рассадить?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2024/25",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 3,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/tasks-math-5-prigl-msk-24-25.pdf",
        page: 1,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/sol-math-5-prigl-msk-24-25.pdf",
        page: 2,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "144",
    },
    hints: [
      "Сначала реши задачу для одного ряда: сколько человек максимум можно посадить в ряд из n мест, если два соседних места нельзя занимать одновременно?",
      "Разбей места на пары: 1–2, 3–4 и так далее. Из каждой пары можно занять не больше одного места. Если мест нечётное, в конце останется ещё одно место.",
      "Для рядов от 10 до 25 получаются максимумы 5, 6, 6, 7, 7, …, 12, 12, 13. Сложи их и проверь, что такая рассадка действительно возможна, например на местах с нечётными номерами.",
    ],
    solution:
      "В ряду из 10 мест можно посадить не больше 5 человек: разобьём места на пары 1–2, 3–4, …, 9–10, и в каждой паре можно занять не больше одного места.\n\nАналогично в ряду из n мест максимум получается, если занимать места 1, 3, 5, … .\n\nДля рядов от 10 до 25 максимумы равны:\n\n5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13.\n\nИх сумма равна 144.\n\nТакая рассадка достижима: в каждом ряду можно занять все места с нечётными номерами.\n\nОтвет: 144.",
  },
  {
    id: "eighteen-piece-pie-cuts",
    title: "18 кусков пирога",
    statement:
      "Пекарь испёк большой прямоугольный пирог. Каждый разрез он делает по прямой от одного края пирога до противоположного, параллельно одной из сторон пирога. Какое наименьшее число разрезов нужно сделать, чтобы получить ровно 18 прямоугольных частей?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2024/25",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 4,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/tasks-math-5-prigl-msk-24-25.pdf",
        page: 1,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/sol-math-5-prigl-msk-24-25.pdf",
        page: 3,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "7",
    },
    hints: [
      "После всех вертикальных и горизонтальных разрезов куски образуют прямоугольную сетку.",
      "Если получилось a столбцов и b строк, то частей будет a · b = 18. Сколько разрезов нужно для a столбцов и b строк?",
      "Проверь разложения 18 = 1 · 18, 2 · 9 и 3 · 6. Для каждого случая посчитай (a − 1) + (b − 1).",
    ],
    solution:
      "Если получилось a столбцов и b строк, частей будет a · b = 18, а разрезов:\n\n(a − 1) + (b − 1).\n\nВозможные разложения 18:\n\n1 · 18: нужно 17 разрезов;\n\n2 · 9: нужно 1 + 8 = 9 разрезов;\n\n3 · 6: нужно 2 + 5 = 7 разрезов.\n\nЗначит, меньше всего — 7.\n\nИ это достижимо: двумя разрезами получить 3 столбца и пятью — 6 строк.\n\nОтвет: 7.",
  },
  {
    id: "multiples-prefix-count",
    title: "Числа на доске",
    statement:
      "Учитель выписал на доску несколько подряд идущих натуральных чисел, начиная с 1. Ровно 17 из них делятся на 3, а ровно 3 из них делятся на 13. Сколько чисел выписал учитель?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2023/24",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 3,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
        page: 1,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
        page: 2,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "51",
    },
    hints: [
      "Если записано ровно 17 чисел, кратных 3, то 17-е кратное 3 уже попало на доску, а 18-е — ещё нет.",
      "Получай границы для последнего записанного числа отдельно из условия про 3 и отдельно из условия про 13.",
      "17-е кратное 3 равно 51, а 18-е — 54. Третье кратное 13 равно 39, а четвёртое — 52.",
    ],
    solution:
      "Из условия про делимость на 3:\n\n51 ≤ N < 54,\n\nпоэтому N равно 51, 52 или 53.\n\nИз условия про 13:\n\nтретье кратное — 39, а четвёртое — 52, поэтому:\n\n39 ≤ N < 52.\n\nЕдинственное значение, удовлетворяющее обоим условиям, — 51.\n\nОтвет: 51.",
  },
  {
    id: "rabbit-carrot-shortfall",
    title: "Морковь для кроликов",
    statement:
      "На ферме живут 630 кроликов. Фермер дал им морковь из расчёта 3 кг на 70 кроликов, а нужно было давать 7 кг на 90 кроликов. Сколько килограммов моркови нужно добавить, чтобы общее количество соответствовало правильной норме?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2023/24",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 1,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
        page: 1,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
        page: 1,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "22",
    },
    hints: [
      "Отдельно найди, сколько моркови фермер уже дал всем 630 кроликам и сколько должен был дать по правильной норме.",
      "630 делится и на 70, и на 90. Найди количество групп кроликов для каждой нормы.",
      "По первой норме получается 630 : 70 = 9 групп, то есть 27 кг. По правильной — 630 : 90 = 7 групп, то есть 49 кг.",
    ],
    solution:
      "Уже выдано:\n\n(630 : 70) · 3 = 9 · 3 = 27 кг.\n\nПо правильной норме нужно:\n\n(630 : 90) · 7 = 7 · 7 = 49 кг.\n\nНужно добавить:\n\n49 − 27 = 22 кг.\n\nОтвет: 22.",
  },
  {
    id: "grade-average-fives",
    title: "Средний балл",
    statement:
      "У Ирины в журнале стоят три тройки и две двойки. После этого она стала получать только пятёрки. Какое наименьшее количество пятёрок ей нужно получить, чтобы средний балл стал ровно 4?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2020/21",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 3,
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
      kind: "nonnegative-integer",
      expectedAnswer: "7",
    },
    hints: [
      "Средний балл 4 означает, что общая сумма всех оценок должна быть в 4 раза больше количества оценок.",
      "Сейчас у Ирины 5 оценок с общей суммой 13. Сравни эту сумму с той, которая нужна пяти оценкам для среднего балла 4.",
      "Для пяти оценок до среднего 4 не хватает 20 − 13 = 7 баллов. Каждая новая пятёрка по сравнению с новой «средней четвёркой» уменьшает этот недостаток ровно на 1.",
    ],
    solution:
      "Сейчас у Ирины 5 оценок:\n\n3 + 3 + 3 + 2 + 2 = 13.\n\nЕсли бы средний балл этих пяти оценок уже был 4, их сумма была бы:\n\n5 · 4 = 20.\n\nНе хватает 7 баллов.\n\nКаждая новая пятёрка одновременно добавляет новую оценку и увеличивает нужную для среднего 4 сумму на 4. Поэтому пятёрка уменьшает недостаток ровно на:\n\n5 − 4 = 1.\n\nЧтобы убрать недостаток 7, нужно 7 пятёрок.\n\nПроверка: оценок станет 12, сумма:\n\n13 + 7 · 5 = 48,\n\nа:\n\n48 : 12 = 4.\n\nОтвет: 7.",
  },
  {
    id: "magic-forest-coin-difference",
    title: "Монеты на деревьях",
    statement:
      "В волшебном лесу на некоторых деревьях растут монеты. Деревьев без монет в 2 раза больше, чем деревьев, на которых растут по 3 монеты. На трёх деревьях растут по 2 монеты, на четырёх деревьях — по 4 монеты, а больше 4 монет ни на одном дереве не растёт.\n\nНа сколько общее число монет больше числа деревьев?",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2020/21",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 5,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/tasks-math-5-prigl-msk-20-21.pdf",
        page: 2,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/ans-math-5-prigl-msk-20-21.pdf",
        page: 3,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "15",
    },
    hints: [
      "Сравнивай не два неизвестных итога, а вклад каждого дерева в разность «монеты − одно дерево».",
      "Дерево без монет даёт вклад −1; с одной монетой — 0; с двумя — +1; с тремя — +2; с четырьмя — +3.",
      "Если деревьев с тремя монетами x, то деревьев без монет 2x. Их вклады +2x и −2x взаимно уничтожаются.",
    ],
    solution:
      "Посчитаем вклад каждого дерева в разность:\n\nчисло монет − число деревьев.\n\nДерево:\n\nбез монет даёт −1;\n\nс одной монетой — 0;\n\nс двумя — +1;\n\nс тремя — +2;\n\nс четырьмя — +3.\n\nПусть деревьев с тремя монетами x. Тогда деревьев без монет 2x.\n\nИх общий вклад:\n\nx · 2 − 2x · 1 = 0.\n\nДеревья с одной монетой тоже ничего не меняют.\n\nТри дерева с двумя монетами дают:\n\n3 · 1 = 3,\n\nа четыре дерева с четырьмя монетами:\n\n4 · 3 = 12.\n\nПоэтому разность равна:\n\n3 + 12 = 15.\n\nОтвет: 15.",
  },
  {
    id: "four-houses-distance-cases",
    title: "Четыре дома",
    statement:
      "Дома Андрея, Бори, Вовы и Глеба расположены на одной прямой улице в некотором порядке. Расстояние между домами Андрея и Бори равно 600 м, и расстояние между домами Вовы и Глеба тоже равно 600 м.\n\nРасстояние между домами Андрея и Глеба в 3 раза больше расстояния между домами Бори и Вовы.\n\nКакие значения могло иметь расстояние между домами Андрея и Глеба? Выбери все подходящие варианты.",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2020/21",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 5,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/tasks-math-4-11-sch-msk-20-21.pdf",
        page: 5,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/ans-math-4-11-sch-msk-20-21.pdf",
        page: 10,
      },
    },
    assessment: {
      kind: "multiple-choice-set",
      instruction: "Выбери все подходящие варианты.",
      options: [
        {
          id: "distance-600",
          label: "600 м",
        },
        {
          id: "distance-900",
          label: "900 м",
        },
        {
          id: "distance-1200",
          label: "1200 м",
        },
        {
          id: "distance-1800",
          label: "1800 м",
        },
        {
          id: "distance-2400",
          label: "2400 м",
        },
      ],
      expectedOptionIds: ["distance-900", "distance-1800"],
    },
    hints: [
      "Можно считать, что дом Андрея находится левее дома Бори. Сначала выясни, в каком порядке относительно друг друга могут находиться дома Вовы и Глеба.",
      "Если Глеб находился бы левее Вовы на 600 м, расстояния АГ и БВ оказались бы равны, а по условию одно должно быть в 3 раза больше другого.",
      "Остаются два существенных порядка: А–Б–В–Г и А–В–Б–Г. Обозначь расстояние БВ через x и используй АБ = ВГ = 600.",
    ],
    solution:
      "Можно считать, что Андрей живёт левее Бори.\n\nИз условия следует, что Вова должен находиться левее Глеба; противоположное направление дало бы АГ = БВ.\n\nПервый случай: А–Б–В–Г.\n\nПусть БВ = x. Тогда:\n\nАГ = 600 + x + 600.\n\nПо условию:\n\n1200 + x = 3x,\n\nпоэтому:\n\nx = 600,\n\nа:\n\nАГ = 1800.\n\nВторой случай: А–В–Б–Г.\n\nЗдесь БВ = x, а крайние части равны 600 − x. Поэтому:\n\nАГ = (600 − x) + x + (600 − x) = 1200 − x.\n\nПолучаем:\n\n1200 − x = 3x,\n\nx = 300,\n\nАГ = 900.\n\nОстальные взаимные порядки дают АГ ≤ БВ и условию АГ = 3 · БВ не удовлетворяют.\n\nОтвет: 900 м и 1800 м.",
  },
  {
    id: "ivanov-older-brother-count",
    title: "Старший брат",
    statement:
      "В многодетной семье Ивановых нет близнецов. Каждый ребёнок сказал: «У меня есть старший брат».\n\nОказалось, что правду сказали ровно 6 детей. Мальчиков в семье на 4 больше, чем девочек.\n\nКакие из чисел 4, 6, 8, 10, 12, 14 могли быть общим числом детей? Выбери все подходящие варианты.",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2022/23",
      stage: "school",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 8,
      variant: 1,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
        page: 13,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
        page: 13,
      },
    },
    assessment: {
      kind: "multiple-choice-set",
      instruction: "Выбери все подходящие варианты.",
      options: [
        {
          id: "children-4",
          label: "4",
        },
        {
          id: "children-6",
          label: "6",
        },
        {
          id: "children-8",
          label: "8",
        },
        {
          id: "children-10",
          label: "10",
        },
        {
          id: "children-12",
          label: "12",
        },
        {
          id: "children-14",
          label: "14",
        },
      ],
      expectedOptionIds: ["children-8", "children-10"],
    },
    hints: [
      "Пусть мальчиков x. Тогда девочек x − 4. Самый старший мальчик не имеет старшего брата, а остальные x − 1 мальчиков точно имеют.",
      "Используй число правдивых ответов, чтобы сначала отбросить слишком большое и слишком маленькое x.",
      "Если x ≥ 8, уже как минимум 7 мальчиков говорят правду. Если x ≤ 5, даже вместе со всеми девочками правду могут сказать не больше пяти детей. Остаются x = 6 и x = 7.",
    ],
    solution:
      "Пусть в семье x мальчиков. Девочек тогда x − 4.\n\nСамый старший мальчик не имеет старшего брата. Все остальные x − 1 мальчиков старшего брата имеют и говорят правду.\n\nЕсли x ≥ 8, уже как минимум 7 мальчиков говорят правду — слишком много.\n\nЕсли x ≤ 5, девочек не больше одной, поэтому правдивых ответов может быть не больше:\n\n(x − 1) + (x − 4) = 2x − 5 ≤ 5.\n\nЗначит, остаются x = 6 и x = 7.\n\nПри x = 6 девочек 2, всего детей 8. Это возможно, например если самый старший ребёнок — девочка, затем идёт самый старший мальчик, а вторая девочка младше него. Тогда правду говорят пять младших мальчиков и одна девочка.\n\nПри x = 7 девочек 3, всего детей 10. Это возможно, если все три девочки старше всех мальчиков: тогда правду говорят ровно шесть мальчиков.\n\nОтвет: 8 и 10.",
  },
  {
    id: "cube-red-face-sums",
    title: "Числа на гранях куба",
    statement:
      "У куба три грани покрасили в красный цвет, а три — в белый. На каждой грани написано некоторое число.\n\nДля каждой красной грани сложили числа, написанные на четырёх соседних с ней гранях. Получились три суммы: 33, 36 и 39.\n\nНайди сумму всех шести чисел, написанных на гранях куба.",
    provenance: {
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2024/25",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 8,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/tasks-math-5-prigl-msk-24-25.pdf",
        page: 2,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/sol-math-5-prigl-msk-24-25.pdf",
        page: 9,
      },
    },
    assessment: {
      kind: "nonnegative-integer",
      expectedAnswer: "54",
    },
    hints: [
      "Сначала выясни, как расположены три красные грани. Могут ли среди них быть две противоположные?",
      "У двух противоположных граней одни и те же четыре соседние грани. Тогда суммы для них были бы одинаковыми, но 33, 36 и 39 различны.",
      "Значит, три красные грани имеют общую вершину. Сложи 33 + 36 + 39 и посчитай, сколько раз число на каждой из шести граней попадёт в эту общую сумму.",
    ],
    solution:
      "Если бы две красные грани были противоположными, у них были бы одни и те же четыре соседние грани. Их суммы тогда совпали бы.\n\nНо 33, 36 и 39 различны. Значит, противоположных красных граней нет.\n\nПоэтому три красные грани имеют общую вершину: выбрана по одной грани из каждой пары противоположных.\n\nКаждая грань куба соседствует ровно с двумя из этих трёх красных граней.\n\nПоэтому в сумме:\n\n33 + 36 + 39 = 108\n\nкаждое из шести написанных чисел посчитано ровно два раза.\n\nСледовательно, сумма всех чисел:\n\n108 : 2 = 54.\n\nОтвет: 54.",
  },
] as const;

describe("Content Scale v2 — Batch 1", () => {
  it("resolves 33 distinct production Grade-5 problems with nine ordinary Packs", () => {
    const historicalPacks = PRACTICE_PACKS.slice(0, 9);
    const ids = [
      ...CORE_EPISODE_PROBLEM_IDS,
      ...TRANSFER_EPISODE_PROBLEM_IDS,
      EXPLORATION_EPISODE_PROBLEM_ID,
      ...historicalPacks.flatMap((pack) => pack.problemIds),
    ];
    expect(historicalPacks).toHaveLength(9);
    expect(ids).toHaveLength(33);
    expect(new Set(ids).size).toBe(33);
    for (const id of ids) {
      expect(getProblemDefinition(id)).toMatchObject({
        id,
        grade: 5,
        subject: "mathematics",
      });
    }
    const problems = getLearnerSafePackProblems();
    expect(
      PRACTICE_PACKS.slice(6, 9).flatMap((pack) => pack.problemIds),
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
                instruction: "Выбери все подходящие варианты.",
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
      // Exhaust all possible selections: only the accepted two-answer set passes.
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

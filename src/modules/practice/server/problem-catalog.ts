import "server-only";

import type {
  LearnerSafePracticeProblem,
  RevealedPracticeHint,
  RevealedPracticeSolution,
  RevealedReasoningCheckpoint,
} from "../application/practice-problem-presentation";
import type { ReasoningCheckpointOptionId } from "../application/reasoning-checkpoint";
import {
  PACK_A_PROBLEM_IDS,
  PACK_B_PROBLEM_IDS,
  PACK_C_PROBLEM_IDS,
  PRACTICE_PACKS,
  type PackId,
} from "../application/completed-practice-episode";

type SourceReference = Readonly<{
  reference: "I" | "IS";
  url: string;
  page: number;
}>;

type ProblemProvenance = Readonly<{
  olympiad: "Всероссийская олимпиада школьников";
  subject: "mathematics";
  academicYear:
    "2025/26" | "2024/25" | "2023/24" | "2022/23" | "2021/22" | "2020/21";
  stage: "invitational" | "school";
  region: "Moscow";
  sourceArchive: "vos.olimpiada.ru";
  grade: 5;
  problemNumber: number;
  variant?: 1;
  originalSource: SourceReference;
  officialSolution: SourceReference;
}>;

type FocusHintDefinition = Readonly<{
  id: string;
  level: "focus";
  text: string;
}>;

type StrategyHintDefinition = Readonly<{
  id: string;
  level: "strategy";
  text: string;
}>;

type NextStepHintDefinition = Readonly<{
  id: string;
  level: "next-step";
  text: string;
}>;

type TrainingSolutionDefinition = Readonly<{
  id: string;
  kind: "training-adaptation";
  text: string;
}>;

type ReasoningCheckpointDefinition = Readonly<{
  id: string;
  heading: string;
  question: string;
  options: readonly Readonly<{
    id: ReasoningCheckpointOptionId;
    text: string;
  }>[];
  correctOptionId: ReasoningCheckpointOptionId;
}>;

export type ProblemDefinition = Readonly<{
  id: string;
  grade: 5;
  subject: "mathematics";
  title: string;
  statement: string;
  provenance: ProblemProvenance;
  assessment:
    | Readonly<{ kind: "nonnegative-integer"; expectedAnswer: string }>
    | Readonly<{
        kind: "multiple-choice-set";
        instruction?: string;
        options: readonly Readonly<{ id: string; label: string }>[];
        expectedOptionIds: readonly string[];
      }>;
  hints: readonly [
    FocusHintDefinition,
    StrategyHintDefinition,
    NextStepHintDefinition,
  ];
  solution: TrainingSolutionDefinition;
  reasoningCheckpoint?: ReasoningCheckpointDefinition;
}>;

export const CURRENT_PRACTICE_PROBLEM_ID = "coinciding-seats";
export const PRACTICE_SESSION_PROBLEM_IDS = [
  CURRENT_PRACTICE_PROBLEM_ID,
  "guaranteed-sock-pair",
  "table-impossible-sums",
] as const;
export { PACK_A_PROBLEM_IDS, PACK_B_PROBLEM_IDS, PACK_C_PROBLEM_IDS };

const coincidingSeatsProblem = {
  id: CURRENT_PRACTICE_PROBLEM_ID,
  grade: 5,
  subject: "mathematics",
  title: "Совпадающие места",
  statement:
    "В зале 102 места, пронумерованных от 1 до 102. Для одной группы отмечают каждое второе место, а для другой — каждое третье. Сколько мест окажутся отмечены для обеих групп?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 1,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 1,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "17",
  },
  hints: [
    {
      id: "coinciding-seats-focus-simultaneous-rules",
      level: "focus",
      text: "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.",
    },
    {
      id: "coinciding-seats-strategy-repeat-interval",
      level: "strategy",
      text: "Подумай, через сколько мест отметки по обоим правилам снова совпадут.",
    },
    {
      id: "coinciding-seats-next-step-list-common-seats",
      level: "next-step",
      text: "Выпиши первые несколько мест, которые отмечены по обоим правилам. Затем продолжай тот же шаг, пока номер места не превысит 102.",
    },
  ],
  solution: {
    id: "coinciding-seats-full-solution",
    kind: "training-adaptation",
    text: "Подходят места, номер которых делится и на 2, и на 3. Такие места идут через 6: 6, 12, 18, …, 102. Число 102 равно 6 × 17, значит, совпадающих мест 17. Ответ: 17.",
  },
} as const satisfies ProblemDefinition;

const guaranteedSockPairProblem = {
  id: "guaranteed-sock-pair",
  grade: 5,
  subject: "mathematics",
  title: "Носки в пакете",
  statement:
    "В пакете лежат 4 красных, 3 синих и 5 жёлтых носков. Ровно три из них дырявые. Какое наименьшее число носков нужно достать не глядя, чтобы среди вынутых наверняка нашлись два целых носка одного цвета?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 4,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 4,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "7",
  },
  hints: [
    {
      id: "guaranteed-sock-pair-focus-guarantee",
      level: "focus",
      text: "Обрати внимание на слово «наверняка»: нужная пара должна получиться при любом возможном наборе вынутых носков.",
    },
    {
      id: "guaranteed-sock-pair-strategy-worst-case",
      level: "strategy",
      text: "Рассмотри самый неудачный случай: сколько носков можно вынуть и всё ещё остаться без двух целых носков одного цвета?",
    },
    {
      id: "guaranteed-sock-pair-next-step-bound-without-pair",
      level: "next-step",
      text: "Если нужной пары нет, целых носков каждого цвета может быть не больше одного. Учти ещё три дырявых носка и проверь, можно ли такой предельный набор действительно составить.",
    },
  ],
  solution: {
    id: "guaranteed-sock-pair-full-solution",
    kind: "training-adaptation",
    text: "Шесть носков ещё недостаточно: можно вынуть по два носка каждого цвета, причём по одному носку каждого цвета окажется дырявым. Тогда целых носков одного цвета будет не больше одного. Теперь рассмотрим семь вынутых носков. Если бы среди них не было двух целых носков одного цвета, то целых носков было бы не больше трёх — по одному каждого цвета. Дырявых носков всего три, значит, всего можно было бы вынуть не больше шести носков. Противоречие. Поэтому семь носков гарантируют нужную пару, а шесть — нет. Ответ: 7.",
  },
  reasoningCheckpoint: {
    id: "guaranteed-sock-pair-guarantee-argument",
    heading: "Проверь рассуждение",
    question: "Почему 7 носков уже гарантируют нужную пару?",
    options: [
      {
        id: "A",
        text: "Если нужной пары нет, целых носков каждого цвета может быть не больше одного. Значит, целых носков не больше 3, а вместе с тремя дырявыми можно вынуть не больше 6.",
      },
      {
        id: "B",
        text: "Среди любых 7 носков обязательно найдутся два носка одного цвета.",
      },
      {
        id: "C",
        text: "Дырявых носков всего три, значит остальные четыре обязательно будут одного цвета.",
      },
    ],
    correctOptionId: "A",
  },
} as const satisfies ProblemDefinition;

const tableImpossibleSumsProblem = {
  id: "table-impossible-sums",
  grade: 5,
  subject: "mathematics",
  title: "Невозможные суммы",
  statement:
    "Петя заполнил таблицу 4 × 5 числами от 1 до 5. В каждой строке все пять чисел различны, и в каждом столбце числа тоже не повторяются. Затем он сложил все числа из первого и последнего столбцов. Какие из сумм он не сможет получить? Выбери все подходящие варианты: 20, 21, 23, 25, 26.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 5,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 7,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      { id: "sum-20", label: "20" },
      { id: "sum-21", label: "21" },
      { id: "sum-23", label: "23" },
      { id: "sum-25", label: "25" },
      { id: "sum-26", label: "26" },
    ],
    expectedOptionIds: ["sum-20"],
  },
  hints: [
    {
      id: "table-impossible-sums-focus-constraints",
      level: "focus",
      text: "Обрати внимание: в каждой строке стоят все числа от 1 до 5 по одному разу. Ограничения строк и столбцов нужно учитывать вместе.",
    },
    {
      id: "table-impossible-sums-strategy-minimum",
      level: "strategy",
      text: "Начни с самой маленькой из предложенных сумм. Подумай, какие четыре разных числа должны стоять в каждом крайнем столбце, чтобы получить её.",
    },
    {
      id: "table-impossible-sums-next-step-fives",
      level: "next-step",
      text: "Если в обоих крайних столбцах нет числа 5, все четыре пятёрки должны оказаться в трёх средних столбцах. Проверь, возможно ли это без повторения числа в одном столбце.",
    },
  ],
  solution: {
    id: "table-impossible-sums-full-solution",
    kind: "training-adaptation",
    text: "Минимальная сумма чисел в одном столбце равна 10. Поэтому сумма 20 возможна только тогда, когда и первый, и последний столбцы содержат числа 1, 2, 3, 4 и не содержат 5. Но в каждой из четырёх строк есть одна пятёрка. Значит, все четыре пятёрки пришлось бы разместить в трёх средних столбцах. Тогда в одном из этих столбцов пятёрка повторилась бы, что запрещено. Поэтому сумму 20 получить нельзя. Остальные предложенные суммы получить можно. Например, строки 1 2 3 4 5; 2 3 4 5 1; 3 4 5 1 2; 4 5 1 2 3 дают суммы столбцов 10, 14, 13, 12, 11. Переставляя столбцы, можно получить суммы крайних столбцов 21, 23, 25 и 26. Ответ: 20.",
  },
  reasoningCheckpoint: {
    id: "table-impossible-sums-impossibility-argument",
    heading: "Проверь рассуждение",
    question:
      "Если сумма крайних столбцов равна 20, в них нет пятёрок. Что завершает доказательство невозможности?",
    options: [
      {
        id: "A",
        text: "В каждой из четырёх строк есть одна пятёрка. Все четыре пятёрки должны оказаться в трёх средних столбцах, поэтому в каком-то столбце пятёрка повторится, а это запрещено.",
      },
      {
        id: "B",
        text: "Раз в крайних столбцах нет пятёрок, сумма каждого среднего столбца обязательно равна 14.",
      },
      {
        id: "C",
        text: "Первый и последний столбцы содержат одинаковый набор чисел, а два столбца с одинаковым набором запрещены.",
      },
    ],
    correctOptionId: "A",
  },
} as const satisfies ProblemDefinition;

export const ADAPTIVE_TRANSFER_PROBLEM_ID = "brothers-ages-products" as const;
export const PARROTS_TRANSFER_PROBLEM_ID = "parrots-guaranteed-colors" as const;
export const ENUMERATION_EXPLORATION_PROBLEM_ID =
  "pages-without-digit-one" as const;

const brothersAgesProductsProblem = {
  id: ADAPTIVE_TRANSFER_PROBLEM_ID,
  grade: 5,
  subject: "mathematics",
  title: "Возраст братьев",
  statement:
    "У трёх братьев разные натуральные возраста. Сейчас произведение их возрастов равно 18, а через год оно будет равно 60. Сколько лет сейчас среднему брату?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2024/25",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/tasks-math-5-sch-msk-24-25.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/sol-math-5-sch-msk-24-25.pdf",
      page: 1,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "2" },
  hints: [
    {
      id: "brothers-ages-products-focus-distinct-products",
      level: "focus",
      text: "Учти одновременно два условия: возраста братьев разные и их произведение сейчас равно 18.",
    },
    {
      id: "brothers-ages-products-strategy-youngest",
      level: "strategy",
      text: "Сначала попробуй ограничить возраст младшего. Что произойдёт с самым маленьким возможным произведением, если ему хотя бы 2 года?",
    },
    {
      id: "brothers-ages-products-next-step-bound",
      level: "next-step",
      text: "Если младшему хотя бы 2 года, три разных возраста не меньше 2, 3 и 4, а 2 × 3 × 4 = 24 > 18. После этого останется проверить подходящие пары множителей 18 по условию про следующий год.",
    },
  ],
  solution: {
    id: "brothers-ages-products-full-solution",
    kind: "training-adaptation",
    text: "Если младшему хотя бы 2 года, то три разных возраста не меньше 2, 3 и 4, поэтому их произведение не меньше 24, а должно быть 18. Значит, младшему 1 год. Произведение возрастов двух других братьев равно 18: возможны пары 2 и 9 либо 3 и 6. Через год для пары 2 и 9 получаем 2 × 3 × 10 = 60, а для пары 3 и 6 — 2 × 4 × 7 = 56. Значит, среднему брату сейчас 2 года. Ответ: 2.",
  },
  reasoningCheckpoint: {
    id: "brothers-ages-products-youngest-lower-bound",
    heading: "Проверь рассуждение",
    question:
      "Какое рассуждение доказывает, что младшему брату не может быть 2 года или больше?",
    options: [
      {
        id: "A",
        text: "Тогда три разных натуральных возраста были бы не меньше 2, 3 и 4. Их произведение было бы не меньше 24, но по условию оно равно 18.",
      },
      {
        id: "B",
        text: "Тогда произведение возрастов обязательно делилось бы на 24.",
      },
      {
        id: "C",
        text: "Тогда через год произведение возрастов обязательно было бы больше 60.",
      },
    ],
    correctOptionId: "A",
  },
} as const satisfies ProblemDefinition;

const parrotsGuaranteedColorsProblem = {
  id: PARROTS_TRANSFER_PROBLEM_ID,
  grade: 5,
  subject: "mathematics",
  title: "Попугаи в зоопарке",
  statement:
    "В зоопарке живут красные, жёлтые и зелёные попугаи, причём каждого цвета есть хотя бы один. Среди любых 10 попугаев обязательно найдётся красный, а среди любых 12 — жёлтый. Какое наибольшее число попугаев может быть в зоопарке?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/tasks-math-5-prigl-msk-20-21.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/ans-math-5-prigl-msk-20-21.pdf",
      page: 4,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "19" },
  hints: [
    {
      id: "parrots-guaranteed-colors-focus-worst-group",
      level: "focus",
      text: "Условия про «любые 10» и «любые 12» должны выполняться даже для самой неудачной выбранной группы.",
    },
    {
      id: "parrots-guaranteed-colors-strategy-complements",
      level: "strategy",
      text: "Посмотри отдельно на попугаев, которые не красные, и на тех, которые не жёлтые. Сколько их может быть максимум?",
    },
    {
      id: "parrots-guaranteed-colors-next-step-overlap",
      level: "next-step",
      text: "Не-красных может быть не больше 9, а не-жёлтых — не больше 11. Сложи эти две границы и учти, что каждый зелёный попугай попал в обе группы.",
    },
  ],
  solution: {
    id: "parrots-guaranteed-colors-full-solution",
    kind: "training-adaptation",
    text: "Если бы не-красных было хотя бы 10, можно было бы выбрать 10 попугаев без красного. Поэтому не-красных не больше 9. Так же не-жёлтых не больше 11. При сложении этих двух количеств каждый красный и жёлтый учитывается один раз, а каждый зелёный — дважды. Значит, общее число попугаев плюс число зелёных не больше 20. Зелёный есть хотя бы один, поэтому всего попугаев не больше 19. Этот предел достигается: 10 красных, 8 жёлтых и 1 зелёный. Не-красных тогда 9, не-жёлтых 11, так что оба условия выполняются. Ответ: 19.",
  },
  reasoningCheckpoint: {
    id: "parrots-guaranteed-colors-guarantee-argument",
    heading: "Проверь рассуждение",
    question:
      "Почему набор из 10 красных, 8 жёлтых и 1 зелёного попугая действительно выполняет оба условия задачи?",
    options: [
      {
        id: "A",
        text: "Не-красных всего 9, поэтому среди любых 10 есть красный. Не-жёлтых всего 11, поэтому среди любых 12 есть жёлтый.",
      },
      {
        id: "B",
        text: "Красных больше, чем жёлтых, а жёлтых больше, чем зелёных, поэтому оба условия выполняются.",
      },
      {
        id: "C",
        text: "Всего попугаев 19, а 19 больше 10 и 12, поэтому в любой выбранной группе обязательно есть нужные цвета.",
      },
    ],
    correctOptionId: "A",
  },
} as const satisfies ProblemDefinition;

const pagesWithoutDigitOneProblem = {
  id: ENUMERATION_EXPLORATION_PROBLEM_ID,
  grade: 5,
  subject: "mathematics",
  title: "Страницы без цифры 1",
  statement:
    "У Оли тетрадь на 100 страниц. Она нумерует страницы по порядку, но пропускает все числа, в записи которых есть цифра 1. Поэтому первая страница получает номер 2, вторая — 3, …, восьмая — 9, девятая — 20. Какой номер будет у 100-й страницы?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2024/25",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 4,
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
  assessment: { kind: "nonnegative-integer", expectedAnswer: "232" },
  hints: [
    {
      id: "pages-without-digit-one-focus-count",
      level: "focus",
      text: "Важно не просто найти число без цифры 1, а убедиться, что перед ним находится ровно 99 допустимых номеров.",
    },
    {
      id: "pages-without-digit-one-strategy-blocks",
      level: "strategy",
      text: "Разбей подходящие номера на непересекающиеся блоки: сначала однозначные, затем двузначные, затем числа по сотням и десяткам. В каждом блоке посчитай все номера без цифры 1.",
    },
    {
      id: "pages-without-digit-one-next-step-count",
      level: "next-step",
      text: "До 99 есть 80 допустимых номеров. Все числа от 100 до 199 пропускаются. Затем отдельно посчитай подходящие числа от 200 до 209 и от 220 до 229 — после этих блоков останется найти ещё два допустимых номера.",
    },
  ],
  solution: {
    id: "pages-without-digit-one-full-solution",
    kind: "training-adaptation",
    text: "Номера 2–9 дают 8 подходящих чисел. Двузначных чисел без цифры 1: 8 × 9 = 72. Значит, до 99 включительно есть 80 допустимых номеров. Числа 100–199 не подходят. Среди 200–209 подходит 9 чисел (кроме 201), всего 89. Числа 210–219 не подходят. Среди 220–229 подходит ещё 9 чисел (кроме 221), всего 98. Число 230 — 99-й допустимый номер, 231 не подходит, а 232 — 100-й. Ответ: 232.",
  },
  reasoningCheckpoint: {
    id: "pages-without-digit-one-complete-enumeration",
    heading: "Проверь рассуждение",
    question:
      "Какой способ действительно доказывает, что найденный номер — именно 100-й подходящий, а в подсчёте ничего не пропущено и не посчитано дважды?",
    options: [
      {
        id: "A",
        text: "Разделить числа на непересекающиеся блоки, в каждом блоке посчитать все числа без цифры 1 и отдельно проверить, что пропущенные промежутки целиком содержат цифру 1.",
      },
      {
        id: "B",
        text: "Проверить несколько первых подходящих номеров и несколько номеров рядом с найденным ответом.",
      },
      {
        id: "C",
        text: "Проверить только, что найденное число не содержит цифру 1, а предыдущее неподходящее число содержит.",
      },
    ],
    correctOptionId: "A",
  },
} as const satisfies ProblemDefinition;

const granddaughtersFirstProblem = {
  id: PACK_A_PROBLEM_IDS[0],
  grade: 5,
  subject: "mathematics",
  title: "Кто пришёл первым?",
  statement:
    "Пять внучек — Аня, Белла, Валя, Галя и Даша — пришли навестить бабушку. Аня пришла позже Беллы. Валя пришла раньше Гали и Даши. Известно также, что Валя не была первой. Кто пришёл первым?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 3,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 2,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    instruction: "Выбери один вариант.",
    options: [
      { id: "anya", label: "Аня" },
      { id: "bella", label: "Белла" },
      { id: "valya", label: "Валя" },
      { id: "galya", label: "Галя" },
      { id: "dasha", label: "Даша" },
    ],
    expectedOptionIds: ["bella"],
  },
  hints: [
    {
      id: "granddaughters-first-focus",
      level: "focus",
      text: "Начни с тех, кто точно не мог прийти первым.",
    },
    {
      id: "granddaughters-first-strategy",
      level: "strategy",
      text: "Используй каждое условие как причину исключить кандидата.",
    },
    {
      id: "granddaughters-first-next-step",
      level: "next-step",
      text: "Аня позже Беллы, поэтому Аня не первая. Галя и Даша позже Вали, поэтому они тоже не первые. Валя по условию не первая. Кто остаётся?",
    },
  ],
  solution: {
    id: "granddaughters-first-full-solution",
    kind: "training-adaptation",
    text: "Аня не могла быть первой, потому что пришла позже Беллы. Галя и Даша не могли быть первыми, потому что Валя пришла раньше каждой из них. Валя по условию тоже не была первой. Остаётся только Белла. Ответ: Белла.",
  },
} as const satisfies ProblemDefinition;

const cutoutAreaRatioProblem = {
  id: PACK_A_PROBLEM_IDS[1],
  grade: 5,
  subject: "mathematics",
  title: "Вырезанная фигура",
  statement:
    "Серая фигура состоит из 5 одинаковых больших квадратов. Из неё вырезали фигуру, состоящую из 5 одинаковых маленьких квадратов. Сторона каждого маленького квадрата в 2 раза меньше стороны большого. Площадь вырезанной части равна 46. Найди площадь оставшейся части.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 4,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 3,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 3,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "138" },
  hints: [
    {
      id: "cutout-area-ratio-focus",
      level: "focus",
      text: "Если сторона квадрата уменьшается в 2 раза, подумай, во сколько раз уменьшается его площадь.",
    },
    {
      id: "cutout-area-ratio-strategy",
      level: "strategy",
      text: "Сравни площадь одного маленького квадрата с площадью одного большого. Затем учти, что и тех и других по пять.",
    },
    {
      id: "cutout-area-ratio-next-step",
      level: "next-step",
      text: "Площадь маленького квадрата составляет 1/4 площади большого. Значит, вся вырезанная часть составляет 1/4 исходной площади, а оставшаяся — 3/4.",
    },
  ],
  solution: {
    id: "cutout-area-ratio-full-solution",
    kind: "training-adaptation",
    text: "Если сторона маленького квадрата в 2 раза меньше, его площадь в 4 раза меньше площади большого квадрата. Больших и маленьких квадратов одинаковое количество — по 5, поэтому площадь вырезанной части составляет четверть площади исходной фигуры. Значит, оставшаяся часть в 3 раза больше вырезанной: 46 × 3 = 138. Ответ: 138.",
  },
} as const satisfies ProblemDefinition;

const dominoPlacementsProblem = {
  id: PACK_A_PROBLEM_IDS[2],
  grade: 5,
  subject: "mathematics",
  title: "Сколько прямоугольников?",
  statement:
    "Из клетчатого прямоугольника 10 × n можно по линиям сетки вырезать горизонтальный или вертикальный прямоугольник 1 × 2 ровно 275 способами. Чему равно n?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 7,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
      page: 5,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 6,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "15" },
  hints: [
    {
      id: "domino-placements-focus",
      level: "focus",
      text: "Прямоугольник 1 × 2 можно расположить двумя способами: горизонтально и вертикально. Посчитай их отдельно.",
    },
    {
      id: "domino-placements-strategy",
      level: "strategy",
      text: "Если считать, что есть 10 столбцов и n строк, сколько горизонтальных положений есть в одной строке? А сколько вертикальных — в одном столбце?",
    },
    {
      id: "domino-placements-next-step",
      level: "next-step",
      text: "Горизонтальных способов: 9n. Вертикальных: 10(n − 1). Их сумма равна 275.",
    },
  ],
  solution: {
    id: "domino-placements-full-solution",
    kind: "training-adaptation",
    text: "В каждой из n строк горизонтальный прямоугольник 1 × 2 можно поставить в 9 положениях, поэтому горизонтальных способов 9n. В каждом из 10 столбцов вертикальных положений n − 1, поэтому их 10(n − 1). Получаем 9n + 10(n − 1) = 275. Тогда 19n − 10 = 275, 19n = 285, n = 15. Ответ: 15.",
  },
} as const satisfies ProblemDefinition;

const truckCarSameArrivalProblem = {
  id: PACK_B_PROBLEM_IDS[0],
  grade: 5,
  subject: "mathematics",
  title: "Одновременно в город",
  statement:
    "Из деревни в город с постоянной скоростью выехал грузовик. Когда он проехал 42 км, из деревни по той же дороге с постоянной скоростью выехал автомобиль. Когда автомобиль проехал 30 км, грузовик находился в 65 км от деревни. Грузовик и автомобиль приехали в город одновременно. Каково расстояние от деревни до города?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2024/25",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 7,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/tasks-math-5-sch-msk-24-25.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/sol-math-5-sch-msk-24-25.pdf",
      page: 4,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "180" },
  hints: [
    {
      id: "truck-car-same-arrival-focus",
      level: "focus",
      text: "Сравни, сколько грузовик и автомобиль проехали за один и тот же промежуток времени после старта автомобиля.",
    },
    {
      id: "truck-car-same-arrival-strategy",
      level: "strategy",
      text: "Пока автомобиль проехал 30 км, грузовик проехал от отметки 42 км до отметки 65 км. Найди, насколько за это время уменьшилось расстояние между ними.",
    },
    {
      id: "truck-car-same-arrival-next-step",
      level: "next-step",
      text: "Грузовик проехал 23 км, а автомобиль — 30 км, поэтому расстояние между ними уменьшилось на 7 км. В момент старта автомобиля грузовик был впереди на 42 км.",
    },
  ],
  solution: {
    id: "truck-car-same-arrival-full-solution",
    kind: "training-adaptation",
    text: "За одно и то же время после старта автомобиля грузовик проехал 65 − 42 = 23 км, а автомобиль — 30 км. Значит, за такой промежуток автомобиль сокращает отставание на 30 − 23 = 7 км. В момент старта автомобиля грузовик был впереди на 42 км, поэтому до встречи нужно 42 / 7 = 6 таких промежутков. За них автомобиль проедет 30 × 6 = 180 км. Так как они приехали в город одновременно, расстояние от деревни до города равно 180 км. Ответ: 180.",
  },
} as const satisfies ProblemDefinition;

const knightsAllOrNoneProblem = {
  id: PACK_B_PROBLEM_IDS[1],
  grade: 5,
  subject: "mathematics",
  title: "Рыцари и лжецы",
  statement:
    "Путешественник встретил на острове 5 жителей. Каждый из них либо рыцарь, который всегда говорит правду, либо лжец, который всегда лжёт. Каждый из пяти сказал: «По крайней мере один из нас — рыцарь». Сколько рыцарей могло быть среди этих пяти жителей? Выбери все возможные варианты.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2024/25",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/tasks-math-5-prigl-msk-24-25.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/sol-math-5-prigl-msk-24-25.pdf",
      page: 3,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      { id: "count-0", label: "0" },
      { id: "count-1", label: "1" },
      { id: "count-2", label: "2" },
      { id: "count-3", label: "3" },
      { id: "count-4", label: "4" },
      { id: "count-5", label: "5" },
    ],
    expectedOptionIds: ["count-0", "count-5"],
  },
  hints: [
    {
      id: "knights-all-or-none-focus",
      level: "focus",
      text: "Все пять жителей произнесли одну и ту же фразу. Значит, её истинность должна согласовываться с типом каждого говорящего.",
    },
    {
      id: "knights-all-or-none-strategy",
      level: "strategy",
      text: "Разбери два случая: среди них есть хотя бы один рыцарь или рыцарей нет совсем.",
    },
    {
      id: "knights-all-or-none-next-step",
      level: "next-step",
      text: "Если хотя бы один рыцарь есть, общая фраза истинна. Может ли тогда её произнести лжец? А если рыцарей нет, эта фраза ложна.",
    },
  ],
  solution: {
    id: "knights-all-or-none-full-solution",
    kind: "training-adaptation",
    text: "Если среди жителей есть хотя бы один рыцарь, фраза «По крайней мере один из нас — рыцарь» истинна. Тогда каждый, кто её произнёс, говорит правду, поэтому все пять жителей — рыцари. Получаем 5 рыцарей. Если же рыцарей нет, фраза ложна, поэтому все пять лжецов могут её произнести. Получаем 0 рыцарей. Других вариантов нет. Ответ: 0 или 5.",
  },
} as const satisfies ProblemDefinition;

const boastfulFishermanStreakProblem = {
  id: PACK_B_PROBLEM_IDS[2],
  grade: 5,
  subject: "mathematics",
  title: "Хвастливый рыбак",
  statement:
    "Хвастливый рыбак каждый день говорит: «Сегодня я поймал пескарей больше, чем позавчера, но меньше, чем 9 дней назад». Какое наибольшее число дней подряд он может говорить правду?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/tasks-math-5-prigl-msk-20-21.pdf",
      page: 3,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/ans-math-5-prigl-msk-20-21.pdf",
      page: 5,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "8" },
  hints: [
    {
      id: "boastful-fisherman-streak-focus",
      level: "focus",
      text: "Условие «больше, чем позавчера» связывает дни через два шага. Попробуй проследить отдельно две цепочки дней.",
    },
    {
      id: "boastful-fisherman-streak-strategy",
      level: "strategy",
      text: "Чтобы доказать верхнюю границу, предположи, что рыбак говорил правду 9 дней подряд, и обозначь эти дни с 3-го по 11-й.",
    },
    {
      id: "boastful-fisherman-streak-next-step",
      level: "next-step",
      text: "Из условия про позавчера сравни 10-й день с 8-м, 6-м, 4-м и 2-м, а 11-й — с 9-м, 7-м, 5-м, 3-м и 1-м. Затем используй условие про 9 дней назад.",
    },
  ],
  solution: {
    id: "boastful-fisherman-streak-full-solution",
    kind: "training-adaptation",
    text: "Восемь правдивых дней возможны, например, при уловах по дням: 20, 20, 20, 20, 20, 20, 20, 6, 1, 7, 2, 8, 3, 9, 4, 10, 5. Предположим, что рыбак говорил правду 9 дней подряд — с 3-го по 11-й. Тогда улов в 10-й день больше, чем в 8-й, 6-й, 4-й и 2-й, а в 11-й меньше, чем во 2-й. Значит, улов в 11-й день меньше, чем в 10-й. Но улов в 11-й день больше, чем в 9-й, 7-й, 5-й, 3-й и 1-й, а в 10-й меньше, чем в 1-й. Значит, улов в 10-й день меньше, чем в 11-й. Противоречие: 9 правдивых дней подряд невозможны, а 8 возможны. Ответ: 8.",
  },
} as const satisfies ProblemDefinition;

const largestValidEightDigitProblem = {
  id: PACK_C_PROBLEM_IDS[0],
  grade: 5,
  subject: "mathematics",
  title: "Самое большое число",
  statement:
    "Найди наибольшее восьмизначное число, которое удовлетворяет двум условиям: любые три подряд идущие цифры различны; произведение любых трёх подряд идущих цифр делится на 20.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2023/24",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
      page: 3,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "98598598" },
  hints: [
    {
      id: "largest-valid-eight-digit-focus",
      level: "focus",
      text: "Чтобы получить самое большое число, выбирай цифры слева направо: сначала максимально возможную первую, затем вторую и так далее.",
    },
    {
      id: "largest-valid-eight-digit-strategy",
      level: "strategy",
      text: "Начни с 9 и 8. Теперь подбери максимально возможную третью цифру так, чтобы 9 · 8 · третья цифра делилось на 20 и все три цифры были различны.",
    },
    {
      id: "largest-valid-eight-digit-next-step",
      level: "next-step",
      text: "После 9, 8 максимальная третья цифра — 5. Затем снова рассматривай каждую новую тройку: 8, 5, ?; затем 5, ?, ?.",
    },
  ],
  solution: {
    id: "largest-valid-eight-digit-full-solution",
    kind: "training-adaptation",
    text: "Выбираем цифры слева направо, каждый раз берём наибольшую допустимую. Первая цифра — 9. Вторая должна отличаться от неё, поэтому берём 8. После 98 следующая цифра должна дать произведение 9 × 8 × цифра, кратное 20. Для этого нужна цифра 0 или 5; наибольшая — 5. Получили 985. После 85 выбираем 9: это самая большая цифра, она отличается от 8 и 5, а произведение 8 × 5 × 9 = 360 делится на 20. После 59 произведение 5 × 9 × следующая цифра должно делиться на 20. Множитель 5 уже есть, а 9 нечётно, поэтому следующая цифра должна делиться на 4. Из цифр 0, 4, 8 выбираем наибольшую — 8; она отличается от 5 и 9. После 98 снова выбираем наибольшую допустимую цифру 5. Повторяя те же шаги, после 85 дописываем 9, а после 59 — 8. Получаем 98598598. Каждая тройка — перестановка цифр 9, 8, 5; они различны, а их произведение 360 делится на 20. Значит, всё число удовлетворяет условиям. Любое большее восьмизначное число должно иметь большую цифру на первом месте, где оно отличается от 98598598. Но все предыдущие цифры тогда совпадают, а на этом месте мы уже выбрали наибольшую цифру, допустимую при этих предыдущих цифрах и условиях задачи. Поэтому большего подходящего числа нет. Ответ: 98598598.",
  },
} as const satisfies ProblemDefinition;

const threeNumbersDigitSumsProblem = {
  id: PACK_C_PROBLEM_IDS[1],
  grade: 5,
  subject: "mathematics",
  title: "Три загадочных числа",
  statement:
    "На доске написано одно трёхзначное число и два двузначных. Сумма чисел, в записи которых есть цифра 7, равна 208. Сумма чисел, в записи которых есть цифра 3, равна 76. Найди сумму всех трёх чисел.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/tasks-math-5-prigl-msk-21-22.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/sol-math-3-10-prigl-msk-21-22.pdf",
      page: 11,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "247" },
  hints: [
    {
      id: "three-numbers-digit-sums-focus",
      level: "focus",
      text: "Сначала разберись с суммой 76. Может ли в неё входить трёхзначное число?",
    },
    {
      id: "three-numbers-digit-sums-strategy",
      level: "strategy",
      text: "Если два двузначных числа дают 76 и оба содержат цифру 3, подумай, какое из них может одновременно содержать и цифру 7.",
    },
    {
      id: "three-numbers-digit-sums-next-step",
      level: "next-step",
      text: "Двузначное число, в котором есть и 3, и 7, — это либо 37, либо 73. Проверь оба варианта с суммой 76.",
    },
  ],
  solution: {
    id: "three-numbers-digit-sums-full-solution",
    kind: "training-adaptation",
    text: "Обозначим трёхзначное число A, а двузначные — B и C. В сумму 76 трёхзначное число не входит, поэтому B + C = 76 и оба содержат цифру 3. Сумма 208 содержит A и ровно одно из B и C: без A она меньше 208, а с обоими A = 132, где нет цифры 7. Пусть это B. Тогда B содержит 3 и 7, то есть B = 37 или 73. При B = 73 число C = 3 не двузначное. Значит, B = 37, C = 39, A = 208 − 37 = 171. Сумма 171 + 37 + 39 = 247. Ответ: 247.",
  },
} as const satisfies ProblemDefinition;

const mountainPlainFlightsProblem = {
  id: PACK_C_PROBLEM_IDS[2],
  grade: 5,
  subject: "mathematics",
  title: "Рейсы между городами",
  statement:
    "В стране 100 городов: 30 находятся в горной части страны, а 70 — в равнинной. В течение трёх лет каждый год все города разбивали на 50 пар и между городами каждой пары открывали новый авиарейс. Через три года оказалось, что из 150 открытых рейсов ровно 21 соединяет два горных города. Сколько рейсов соединяет два равнинных города?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/tasks-math-5-prigl-msk-21-22.pdf",
      page: 3,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/sol-math-3-10-prigl-msk-21-22.pdf",
      page: 13,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "81" },
  hints: [
    {
      id: "mountain-plain-flights-focus",
      level: "focus",
      text: "Попробуй считать не сами рейсы, а их концы: каждый рейс соединяет два города.",
    },
    {
      id: "mountain-plain-flights-strategy",
      level: "strategy",
      text: "За три года каждый город оказался участником ровно трёх новых рейсов. Сколько концов рейсов приходится на 30 горных городов?",
    },
    {
      id: "mountain-plain-flights-next-step",
      level: "next-step",
      text: "У горных городов 30 · 3 = 90 концов рейсов. Рейсы между двумя горными городами используют по два таких конца.",
    },
  ],
  solution: {
    id: "mountain-plain-flights-full-solution",
    kind: "training-adaptation",
    text: "За три года у горных городов 30 × 3 = 90 концов рейсов. 21 рейс между горными городами занимает 42 конца. Остаётся 90 − 42 = 48 концов, значит, есть 48 рейсов между горными и равнинными городами. У равнинных городов 70 × 3 = 210 концов; 48 заняты смешанными рейсами. На рейсы между равнинными городами остаётся 210 − 48 = 162 конца, то есть 162 / 2 = 81 рейс. Ответ: 81.",
  },
} as const satisfies ProblemDefinition;

const exactCoinPaymentsProblem = {
  id: "exact-coin-payments",
  grade: 5,
  subject: "mathematics",
  title: "Пирожок без сдачи",
  statement:
    "У Дениса есть много десятирублёвых, двухрублёвых и однорублёвых монет. Монет каждого вида больше 20. Сколькими способами Денис может заплатить без сдачи за пирожок стоимостью 16 рублей? Использовать монеты каждого вида необязательно.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2022/23",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
      page: 10,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
      page: 10,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "13" },
  hints: [
    {
      id: "exact-coin-payments-focus",
      level: "focus",
      text: "Раздели все способы на два непересекающихся случая: десятирублёвая монета используется или не используется.",
    },
    {
      id: "exact-coin-payments-strategy",
      level: "strategy",
      text: "Если 10 рублей уже набраны, остаётся получить 6 рублей монетами по 2 и 1. Без десятирублёвой монеты нужно набрать все 16 рублей этими двумя видами монет.",
    },
    {
      id: "exact-coin-payments-next-step",
      level: "next-step",
      text: "В первом случае двухрублёвых монет может быть от 0 до 3, а во втором — от 0 до 8. После выбора их количества число однорублёвых монет определяется однозначно.",
    },
  ],
  solution: {
    id: "exact-coin-payments-full-solution",
    kind: "training-adaptation",
    text: "Десятирублёвых монет может быть не больше одной. Если взять одну, останется набрать 6 рублей: двухрублёвых монет может быть 0, 1, 2 или 3, а число однорублёвых затем определяется однозначно. Это 4 способа. Если не брать десятирублёвую, для 16 рублей можно взять от 0 до 8 двухрублёвых монет — 9 способов. Случаи не пересекаются, поэтому всего 4 + 9 = 13 способов. Ответ: 13.",
  },
} as const satisfies ProblemDefinition;

const oddNeighborSugarCubesProblem = {
  id: "odd-neighbor-sugar-cubes",
  grade: 5,
  subject: "mathematics",
  title: "Кубики с нечётным числом соседей",
  statement:
    "Из 125 одинаковых кубиков сахара сложили большой куб 5 × 5 × 5. Соседями считаются маленькие кубики, имеющие общую грань. Пончик съел все кубики, у которых нечётное число соседей. Сколько кубиков он съел?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2023/24",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/prigl/math/tasks-math-5-prigl-msk-23-24.pdf",
      page: 11,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/prigl/math/sol-math-5-prigl-msk-23-24.pdf",
      page: 7,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "62" },
  hints: [
    {
      id: "odd-neighbor-sugar-cubes-focus",
      level: "focus",
      text: "Число соседей зависит от положения кубика: внутри большого куба, на грани, на ребре или в вершине.",
    },
    {
      id: "odd-neighbor-sugar-cubes-strategy",
      level: "strategy",
      text: "Разбей все маленькие кубики на эти четыре непересекающихся типа и определи число соседей для каждого типа.",
    },
    {
      id: "odd-neighbor-sugar-cubes-next-step",
      level: "next-step",
      text: "Внутренний кубик имеет 6 соседей, кубик на грани вне рёбер — 5, на ребре вне вершин — 4, а в вершине — 3. Нужны только типы с нечётным числом соседей.",
    },
  ],
  solution: {
    id: "odd-neighbor-sugar-cubes-full-solution",
    kind: "training-adaptation",
    text: "Внутренние кубики имеют по 6 соседей, а кубики на рёбрах вне вершин — по 4, поэтому они не подходят. У кубиков внутри каждой грани по 5 соседей: на шести гранях их 6 × 3 × 3 = 54. В каждой из 8 вершин кубик имеет по 3 соседа. Оба числа нечётны, значит, Пончик съел 54 + 8 = 62 кубика. Ответ: 62.",
  },
} as const satisfies ProblemDefinition;

const lastStudentFriendsProblem = {
  id: "last-student-friends",
  grade: 5,
  subject: "mathematics",
  title: "Сколько друзей у последнего?",
  statement:
    "В классе 31 ученик. У трёх из них ровно по 3 друга, у следующих трёх — по 6, у следующих трёх — по 9, и так далее, вплоть до трёх учеников, у каждого из которых по 30 друзей. Сколько друзей у 31-го ученика? Дружба между людьми взаимна.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2022/23",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 7,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
      page: 11,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
      page: 12,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "15" },
  hints: [
    {
      id: "last-student-friends-focus",
      level: "focus",
      text: "Начни с трёх учеников, у каждого из которых по 30 друзей. С кем они обязаны дружить в классе из 31 человека?",
    },
    {
      id: "last-student-friends-strategy",
      level: "strategy",
      text: "Мысленно убери этих троих. У каждого оставшегося число друзей уменьшится на 3. Что тогда произойдёт с учениками, у которых сначала было по 3 друга?",
    },
    {
      id: "last-student-friends-next-step",
      level: "next-step",
      text: "После удаления трёх самых общительных и трёх учеников, оставшихся без друзей, возникает та же структура на 6 учеников меньше. Повтори такое сокращение несколько раз.",
    },
  ],
  solution: {
    id: "last-student-friends-full-solution",
    kind: "training-adaptation",
    text: "Трое учеников с 30 друзьями дружат со всеми, поэтому после их удаления число друзей каждого оставшегося уменьшается на 3. Ученики, имевшие по 3 друга, становятся изолированными; их тоже удаляем. Получается такая же задача, но учеников на 6 меньше, а положительные степени уменьшаются на 3. Повторяем это сокращение пять раз. Степень 31-го ученика x становится равной x − 15. В конце остаётся только он, без друзей, значит x − 15 = 0. Ответ: 15.",
  },
} as const satisfies ProblemDefinition;

const lineupSixHooligansProblem = {
  id: "lineup-six-hooligans",
  grade: 5,
  subject: "mathematics",
  title: "Правдивые и лжецы в шеренге",
  statement:
    "На уроке физкультуры в шеренгу встали 25 учеников. Каждый из них либо отличник, который всегда говорит правду, либо хулиган, который всегда врёт. Отличник Влад стоит на 13-м месте. Все остальные сказали: «Между мной и Владом ровно 6 хулиганов». Сколько хулиганов в шеренге?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2022/23",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
      page: 8,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf",
      page: 8,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "12" },
  hints: [
    {
      id: "lineup-six-hooligans-focus",
      level: "focus",
      text: "Сначала посмотри на учеников на местах с 7-го по 12-е. Между каждым из них и Владом физически находится меньше шести человек.",
    },
    {
      id: "lineup-six-hooligans-strategy",
      level: "strategy",
      text: "Их утверждение не может быть правдой. Определи их тип, а затем проверь, что говорит ученик на 6-м месте.",
    },
    {
      id: "lineup-six-hooligans-next-step",
      level: "next-step",
      text: "Места 7–12 занимают шесть хулиганов. Поэтому между учеником №6 и Владом действительно ровно шесть хулиганов. После этого рассуждение продолжается к началу шеренги. Справа от Влада работает симметричный аргумент.",
    },
  ],
  solution: {
    id: "lineup-six-hooligans-full-solution",
    kind: "training-adaptation",
    text: "Между Владом и каждым учеником на местах 7–12 меньше шести человек, поэтому их высказывания ложны: все шестеро — хулиганы. Между учеником №6 и Владом как раз эти шесть хулиганов, значит, ученик №6 говорит правду. То же верно для мест 1–5: между каждым из них и Владом по-прежнему ровно шесть хулиганов, так что они отличники. Симметрично справа от Влада хулиганы стоят на местах 14–19, а ученики 20–25 говорят правду. Всего хулиганов 6 + 6 = 12. Ответ: 12.",
  },
} as const satisfies ProblemDefinition;

const twoTrueJournalistsProblem = {
  id: "two-true-journalists",
  grade: 5,
  subject: "mathematics",
  title: "Два правдивых журналиста",
  statement:
    "Три журналиста спорят о том, сколько шайб забила сборная Германии. Первый: «Больше 10, но меньше 17». Второй: «Больше 11, но меньше 18». Третий: «Число шайб нечётное». Известно, что правы ровно два журналиста. Какие из чисел 10, 11, 12, 13, 14, 15, 16, 17, 18 могли быть числом забитых шайб? Выбери все подходящие варианты.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 7,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf",
      page: 6,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf",
      page: 11,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    instruction: "Выбери все подходящие варианты.",
    options: [
      { id: "goals-10", label: "10" },
      { id: "goals-11", label: "11" },
      { id: "goals-12", label: "12" },
      { id: "goals-13", label: "13" },
      { id: "goals-14", label: "14" },
      { id: "goals-15", label: "15" },
      { id: "goals-16", label: "16" },
      { id: "goals-17", label: "17" },
      { id: "goals-18", label: "18" },
    ],
    expectedOptionIds: [
      "goals-11",
      "goals-12",
      "goals-14",
      "goals-16",
      "goals-17",
    ],
  },
  hints: [
    {
      id: "two-true-journalists-focus",
      level: "focus",
      text: "Разбей числа по границам 10, 11, 17 и 18. Отдельно учитывай чётность.",
    },
    {
      id: "two-true-journalists-strategy",
      level: "strategy",
      text: "Сначала проверь граничные значения 11 и 17. Затем рассмотри все числа от 12 до 16 вместе.",
    },
    {
      id: "two-true-journalists-next-step",
      level: "next-step",
      text: "Для чисел от 12 до 16 первые два утверждения истинны одновременно. Чтобы истинных утверждений осталось ровно два, третье должно быть ложным.",
    },
  ],
  solution: {
    id: "two-true-journalists-full-solution",
    kind: "training-adaptation",
    text: "При 11 шайбах истинны первое и третье утверждения. Для чисел от 12 до 16 первые два утверждения истинны, поэтому третье должно быть ложным: подходят только чётные 12, 14 и 16. При 17 шайбах истинны второе и третье утверждения. Для 10 и 18 правдивых высказываний меньше двух, а для 13 и 15 их три. Ответ: 11, 12, 14, 16, 17.",
  },
} as const satisfies ProblemDefinition;

const neighborComparisonCodesProblem = {
  id: "neighbor-comparison-codes",
  grade: 5,
  subject: "mathematics",
  title: "Код соседних цифр",
  statement:
    "Катя записала десятизначное число, в котором все цифры различны. Затем каждую цифру она заменила количеством соседних с ней цифр, которые меньше неё. Какие последовательности могли получиться? Выбери все подходящие варианты.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2023/24",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/prigl/math/tasks-math-5-prigl-msk-23-24.pdf",
      page: 13,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/prigl/math/sol-math-5-prigl-msk-23-24.pdf",
      page: 8,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    instruction: "Выбери все подходящие варианты.",
    options: [
      { id: "code-0112102011", label: "0112102011" },
      { id: "code-1021021020", label: "1021021020" },
      { id: "code-1101111111", label: "1101111111" },
      { id: "code-1201201020", label: "1201201020" },
    ],
    expectedOptionIds: [
      "code-0112102011",
      "code-1021021020",
      "code-1101111111",
    ],
  },
  hints: [
    {
      id: "neighbor-comparison-codes-focus",
      level: "focus",
      text: "У крайней цифры только один сосед, а у внутренней — два. Код 2 означает, что оба соседа меньше текущей цифры.",
    },
    {
      id: "neighbor-comparison-codes-strategy",
      level: "strategy",
      text: "Сначала проверь последовательность, начинающуюся с 120. Первые два символа уже задают два сравнения первой и второй цифр.",
    },
    {
      id: "neighbor-comparison-codes-next-step",
      level: "next-step",
      text: "Начальная 1 требует, чтобы первая цифра была больше второй. Следующая 2 требует, чтобы вторая цифра была больше обоих соседей, в том числе первой. Получается противоречие.",
    },
  ],
  solution: {
    id: "neighbor-comparison-codes-full-solution",
    kind: "training-adaptation",
    text: "Код 1201201020 невозможен: первая 1 требует, чтобы первая цифра была больше второй, а следующая 2 — чтобы вторая была больше первой и третьей. Это противоречие. Для остальных последовательностей есть примеры: 2679108345 даёт 0112102011, 5496382170 даёт 1021021020, 9801234567 даёт 1101111111. Эти числа десятизначные, и все их цифры различны. Значит, подходят ровно первые три варианта.",
  },
} as const satisfies ProblemDefinition;

const fivePilesStonesProblem = {
  id: "five-piles-stones",
  grade: 5,
  subject: "mathematics",
  title: "Пять кучек камней",
  statement:
    "Камни разложили в пять кучек. В пятой кучке в 6 раз больше камней, чем в третьей. Во второй в 2 раза больше камней, чем в третьей и пятой вместе. В первой в 3 раза меньше камней, чем в пятой, и на 10 меньше, чем в четвёртой. В четвёртой в 2 раза меньше камней, чем во второй. Сколько всего камней в пяти кучках?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf",
      page: 5,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf",
      page: 11,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "60" },
  hints: [
    {
      id: "five-piles-stones-focus",
      level: "focus",
      text: "Возьми количество камней в третьей кучке за одну условную часть.",
    },
    {
      id: "five-piles-stones-strategy",
      level: "strategy",
      text: "Вырази через эту часть пятую, затем вторую, первую и четвёртую кучки.",
    },
    {
      id: "five-piles-stones-next-step",
      level: "next-step",
      text: "Если в третьей кучке x камней, то в пятой 6x, во второй 14x, в первой 2x, а в четвёртой 7x. Используй условие о разнице 10 между первой и четвёртой.",
    },
  ],
  solution: {
    id: "five-piles-stones-full-solution",
    kind: "training-adaptation",
    text: "Пусть в третьей кучке x камней. Тогда в пятой 6x, во второй 2(x + 6x) = 14x, в первой 6x / 3 = 2x, а в четвёртой 14x / 2 = 7x. Четвёртая превышает первую на 10 камней, значит 7x − 2x = 5x = 10 и x = 2. В кучках соответственно 4, 28, 2, 14 и 12 камней. Их сумма равна 60. Ответ: 60.",
  },
} as const satisfies ProblemDefinition;

const untouchedMatchstickFiguresProblem = {
  id: "untouched-matchstick-figures",
  grade: 5,
  subject: "mathematics",
  title: "Нетронутые фигурки",
  statement:
    "Из спичек сложены 12 отдельных фигурок: 3 треугольника, 4 квадрата и 5 пятиугольников. У фигур нет общих сторон. Петя и Вася по очереди забирают по одной спичке. Каждый делает 5 ходов, первым ходит Петя. Вася хочет, чтобы нетронутых фигур осталось как можно меньше, а Петя — как можно больше. Сколько нетронутых фигур останется, если оба действуют наилучшим образом?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 1,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/tasks-math-5-prigl-msk-22-23.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/sol-math-5-prigl-msk-22-23.pdf",
      page: 1,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "6" },
  hints: [
    {
      id: "untouched-matchstick-figures-focus",
      level: "focus",
      text: "Фигура перестаёт быть нетронутой после первой же взятой из неё спички. Поэтому считай прежде всего число затронутых фигур, а не число спичек.",
    },
    {
      id: "untouched-matchstick-figures-strategy",
      level: "strategy",
      text: "После первого хода Петя может стараться брать спички только из уже затронутых фигур. Вася, наоборот, на каждом своём ходу может выбирать новую фигуру.",
    },
    {
      id: "untouched-matchstick-figures-next-step",
      level: "next-step",
      text: "После первого хода Петя берёт спичку из любой уже затронутой фигуры, в которой ещё есть спички. Если Вася начинает новую фигуру, в ней остаются спички для следующего хода Пети. Поэтому Петя вынужден начать новую фигуру только после хода Васи в уже затронутой фигуре. Сравни число таких ходов с числом новых фигур Васи.",
    },
  ],
  solution: {
    id: "untouched-matchstick-figures-full-solution",
    kind: "training-adaptation",
    text: "Первым ходом Петя затрагивает одну фигуру. После этого он берёт спичку из любой уже затронутой фигуры, в которой ещё есть спички, если такая фигура существует. Если Вася начинает новую фигуру, после его хода в ней остаётся не меньше двух спичек: изначально в каждой фигуре их не меньше трёх. Поэтому следующим ходом Петя может взять спичку из уже затронутой фигуры. Начать новую фигуру после своего первого хода Петя вынужден только сразу после хода Васи в уже затронутой фигуре, когда во всех затронутых фигурах спички закончились. Пусть за пять ходов Вася начал k новых фигур. Тогда остальные 5 − k его ходов были в уже затронутых фигурах. Петя начинает не больше 1 + (5 − k) фигур, а вместе они затрагивают не больше k + 1 + (5 − k) = 6 фигур. Значит, Петя гарантирует не меньше шести нетронутых фигур. С другой стороны, Вася может на каждом из пяти ходов выбирать ещё нетронутую фигуру. Если такая фигура есть, он затрагивает её; если нет, уже затронуты все 12 фигур. Поэтому вместе с первой фигурой Пети Вася гарантирует не меньше 6 затронутых фигур. При наилучшей игре затронуты ровно 6 из 12, а нетронуты 12 − 6 = 6 фигур. Ответ: 6.",
  },
} as const satisfies ProblemDefinition;

const mountainNumbersOver77777Problem = {
  id: "mountain-numbers-over-77777",
  grade: 5,
  subject: "mathematics",
  title: "Сколько чисел-горок?",
  statement:
    "Пятизначное число называется горкой, если первые три его цифры идут в порядке строгого возрастания, а последние три — в порядке строгого убывания. Например, 13760 и 28932 — горки, а 78821 и 86521 — нет. Сколько существует горок, которые больше 77777?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/tasks-math-5-prigl-msk-22-23.pdf",
      page: 16,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/sol-math-5-prigl-msk-22-23.pdf",
      page: 17,
    },
  },
  assessment: { kind: "nonnegative-integer", expectedAnswer: "36" },
  hints: [
    {
      id: "mountain-numbers-over-77777-focus",
      level: "focus",
      text: "Сначала найди первые три цифры. Чтобы число было больше 77777, его первая цифра должна быть не меньше 7, но после неё ещё нужны две строго большие цифры.",
    },
    {
      id: "mountain-numbers-over-77777-strategy",
      level: "strategy",
      text: "Проверь, может ли первая цифра быть 8 или 9. После этого станет ясно, какие три первые цифры вынуждены стоять в числе.",
    },
    {
      id: "mountain-numbers-over-77777-next-step",
      level: "next-step",
      text: "Начало обязательно равно 789. Для двух последних мест нужно выбрать две разные цифры из 0–8 и расположить их в убывающем порядке.",
    },
  ],
  solution: {
    id: "mountain-numbers-over-77777-full-solution",
    kind: "training-adaptation",
    text: "Первая цифра должна быть не меньше 7, иначе число меньше 77777. Если она равна 8 или 9, для двух строго больших цифр места уже нет. Значит, начало вынужденно равно 789. Последние две цифры должны быть меньше 9 и идти в порядке строгого убывания. Выбираем любые две различные цифры из 0–8; для каждой пары подходит ровно один порядок. Таких пар C(9, 2) = 36 (то же число даёт сумма 1 + 2 + ⋯ + 8). Ответ: 36.",
  },
} as const satisfies ProblemDefinition;

const nonadjacentRowSeatingProblem = {
  id: "nonadjacent-row-seating",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "nonadjacent-row-seating-focus",
      level: "focus",
      text: "Сначала реши задачу для одного ряда: сколько человек максимум можно посадить в ряд из n мест, если два соседних места нельзя занимать одновременно?",
    },
    {
      id: "nonadjacent-row-seating-strategy",
      level: "strategy",
      text: "Разбей места на пары: 1–2, 3–4 и так далее. Из каждой пары можно занять не больше одного места. Если мест нечётное, в конце останется ещё одно место.",
    },
    {
      id: "nonadjacent-row-seating-next-step",
      level: "next-step",
      text: "Для рядов от 10 до 25 получаются максимумы 5, 6, 6, 7, 7, …, 12, 12, 13. Сложи их и проверь, что такая рассадка действительно возможна, например на местах с нечётными номерами.",
    },
  ],
  solution: {
    id: "nonadjacent-row-seating-full-solution",
    kind: "training-adaptation",
    text: "В ряду из 10 мест можно посадить не больше 5 человек: разобьём места на пары 1–2, 3–4, …, 9–10, и в каждой паре можно занять не больше одного места.\n\nАналогично в ряду из n мест максимум получается, если занимать места 1, 3, 5, … .\n\nДля рядов от 10 до 25 максимумы равны:\n\n5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13.\n\nИх сумма равна 144.\n\nТакая рассадка достижима: в каждом ряду можно занять все места с нечётными номерами.\n\nОтвет: 144.",
  },
} as const satisfies ProblemDefinition;

const eighteenPiecePieCutsProblem = {
  id: "eighteen-piece-pie-cuts",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "eighteen-piece-pie-cuts-focus",
      level: "focus",
      text: "После всех вертикальных и горизонтальных разрезов куски образуют прямоугольную сетку.",
    },
    {
      id: "eighteen-piece-pie-cuts-strategy",
      level: "strategy",
      text: "Если получилось a столбцов и b строк, то частей будет a · b = 18. Сколько разрезов нужно для a столбцов и b строк?",
    },
    {
      id: "eighteen-piece-pie-cuts-next-step",
      level: "next-step",
      text: "Проверь разложения 18 = 1 · 18, 2 · 9 и 3 · 6. Для каждого случая посчитай (a − 1) + (b − 1).",
    },
  ],
  solution: {
    id: "eighteen-piece-pie-cuts-full-solution",
    kind: "training-adaptation",
    text: "Если получилось a столбцов и b строк, частей будет a · b = 18, а разрезов:\n\n(a − 1) + (b − 1).\n\nВозможные разложения 18:\n\n1 · 18: нужно 17 разрезов;\n\n2 · 9: нужно 1 + 8 = 9 разрезов;\n\n3 · 6: нужно 2 + 5 = 7 разрезов.\n\nЗначит, меньше всего — 7.\n\nИ это достижимо: двумя разрезами получить 3 столбца и пятью — 6 строк.\n\nОтвет: 7.",
  },
} as const satisfies ProblemDefinition;

const multiplesPrefixCountProblem = {
  id: "multiples-prefix-count",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "multiples-prefix-count-focus",
      level: "focus",
      text: "Если записано ровно 17 чисел, кратных 3, то 17-е кратное 3 уже попало на доску, а 18-е — ещё нет.",
    },
    {
      id: "multiples-prefix-count-strategy",
      level: "strategy",
      text: "Получай границы для последнего записанного числа отдельно из условия про 3 и отдельно из условия про 13.",
    },
    {
      id: "multiples-prefix-count-next-step",
      level: "next-step",
      text: "17-е кратное 3 равно 51, а 18-е — 54. Третье кратное 13 равно 39, а четвёртое — 52.",
    },
  ],
  solution: {
    id: "multiples-prefix-count-full-solution",
    kind: "training-adaptation",
    text: "Из условия про делимость на 3:\n\n51 ≤ N < 54,\n\nпоэтому N равно 51, 52 или 53.\n\nИз условия про 13:\n\nтретье кратное — 39, а четвёртое — 52, поэтому:\n\n39 ≤ N < 52.\n\nЕдинственное значение, удовлетворяющее обоим условиям, — 51.\n\nОтвет: 51.",
  },
} as const satisfies ProblemDefinition;

const rabbitCarrotShortfallProblem = {
  id: "rabbit-carrot-shortfall",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "rabbit-carrot-shortfall-focus",
      level: "focus",
      text: "Отдельно найди, сколько моркови фермер уже дал всем 630 кроликам и сколько должен был дать по правильной норме.",
    },
    {
      id: "rabbit-carrot-shortfall-strategy",
      level: "strategy",
      text: "630 делится и на 70, и на 90. Найди количество групп кроликов для каждой нормы.",
    },
    {
      id: "rabbit-carrot-shortfall-next-step",
      level: "next-step",
      text: "По первой норме получается 630 : 70 = 9 групп, то есть 27 кг. По правильной — 630 : 90 = 7 групп, то есть 49 кг.",
    },
  ],
  solution: {
    id: "rabbit-carrot-shortfall-full-solution",
    kind: "training-adaptation",
    text: "Уже выдано:\n\n(630 : 70) · 3 = 9 · 3 = 27 кг.\n\nПо правильной норме нужно:\n\n(630 : 90) · 7 = 7 · 7 = 49 кг.\n\nНужно добавить:\n\n49 − 27 = 22 кг.\n\nОтвет: 22.",
  },
} as const satisfies ProblemDefinition;

const gradeAverageFivesProblem = {
  id: "grade-average-fives",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "grade-average-fives-focus",
      level: "focus",
      text: "Средний балл 4 означает, что общая сумма всех оценок должна быть в 4 раза больше количества оценок.",
    },
    {
      id: "grade-average-fives-strategy",
      level: "strategy",
      text: "Сейчас у Ирины 5 оценок с общей суммой 13. Сравни эту сумму с той, которая нужна пяти оценкам для среднего балла 4.",
    },
    {
      id: "grade-average-fives-next-step",
      level: "next-step",
      text: "Для пяти оценок до среднего 4 не хватает 20 − 13 = 7 баллов. Каждая новая пятёрка по сравнению с новой «средней четвёркой» уменьшает этот недостаток ровно на 1.",
    },
  ],
  solution: {
    id: "grade-average-fives-full-solution",
    kind: "training-adaptation",
    text: "Сейчас у Ирины 5 оценок:\n\n3 + 3 + 3 + 2 + 2 = 13.\n\nЕсли бы средний балл этих пяти оценок уже был 4, их сумма была бы:\n\n5 · 4 = 20.\n\nНе хватает 7 баллов.\n\nКаждая новая пятёрка одновременно добавляет новую оценку и увеличивает нужную для среднего 4 сумму на 4. Поэтому пятёрка уменьшает недостаток ровно на:\n\n5 − 4 = 1.\n\nЧтобы убрать недостаток 7, нужно 7 пятёрок.\n\nПроверка: оценок станет 12, сумма:\n\n13 + 7 · 5 = 48,\n\nа:\n\n48 : 12 = 4.\n\nОтвет: 7.",
  },
} as const satisfies ProblemDefinition;

const magicForestCoinDifferenceProblem = {
  id: "magic-forest-coin-difference",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "magic-forest-coin-difference-focus",
      level: "focus",
      text: "Сравнивай не два неизвестных итога, а вклад каждого дерева в разность «монеты − одно дерево».",
    },
    {
      id: "magic-forest-coin-difference-strategy",
      level: "strategy",
      text: "Дерево без монет даёт вклад −1; с одной монетой — 0; с двумя — +1; с тремя — +2; с четырьмя — +3.",
    },
    {
      id: "magic-forest-coin-difference-next-step",
      level: "next-step",
      text: "Если деревьев с тремя монетами x, то деревьев без монет 2x. Их вклады +2x и −2x взаимно уничтожаются.",
    },
  ],
  solution: {
    id: "magic-forest-coin-difference-full-solution",
    kind: "training-adaptation",
    text: "Посчитаем вклад каждого дерева в разность:\n\nчисло монет − число деревьев.\n\nДерево:\n\nбез монет даёт −1;\n\nс одной монетой — 0;\n\nс двумя — +1;\n\nс тремя — +2;\n\nс четырьмя — +3.\n\nПусть деревьев с тремя монетами x. Тогда деревьев без монет 2x.\n\nИх общий вклад:\n\nx · 2 − 2x · 1 = 0.\n\nДеревья с одной монетой тоже ничего не меняют.\n\nТри дерева с двумя монетами дают:\n\n3 · 1 = 3,\n\nа четыре дерева с четырьмя монетами:\n\n4 · 3 = 12.\n\nПоэтому разность равна:\n\n3 + 12 = 15.\n\nОтвет: 15.",
  },
} as const satisfies ProblemDefinition;

const fourHousesDistanceCasesProblem = {
  id: "four-houses-distance-cases",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "four-houses-distance-cases-focus",
      level: "focus",
      text: "Можно считать, что дом Андрея находится левее дома Бори. Сначала выясни, в каком порядке относительно друг друга могут находиться дома Вовы и Глеба.",
    },
    {
      id: "four-houses-distance-cases-strategy",
      level: "strategy",
      text: "Если Глеб находился бы левее Вовы на 600 м, расстояния АГ и БВ оказались бы равны, а по условию одно должно быть в 3 раза больше другого.",
    },
    {
      id: "four-houses-distance-cases-next-step",
      level: "next-step",
      text: "Остаются два существенных порядка: А–Б–В–Г и А–В–Б–Г. Обозначь расстояние БВ через x и используй АБ = ВГ = 600.",
    },
  ],
  solution: {
    id: "four-houses-distance-cases-full-solution",
    kind: "training-adaptation",
    text: "Можно считать, что Андрей живёт левее Бори.\n\nИз условия следует, что Вова должен находиться левее Глеба; противоположное направление дало бы АГ = БВ.\n\nПервый случай: А–Б–В–Г.\n\nПусть БВ = x. Тогда:\n\nАГ = 600 + x + 600.\n\nПо условию:\n\n1200 + x = 3x,\n\nпоэтому:\n\nx = 600,\n\nа:\n\nАГ = 1800.\n\nВторой случай: А–В–Б–Г.\n\nЗдесь БВ = x, а крайние части равны 600 − x. Поэтому:\n\nАГ = (600 − x) + x + (600 − x) = 1200 − x.\n\nПолучаем:\n\n1200 − x = 3x,\n\nx = 300,\n\nАГ = 900.\n\nОстальные взаимные порядки дают АГ ≤ БВ и условию АГ = 3 · БВ не удовлетворяют.\n\nОтвет: 900 м и 1800 м.",
  },
} as const satisfies ProblemDefinition;

const ivanovOlderBrotherCountProblem = {
  id: "ivanov-older-brother-count",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "ivanov-older-brother-count-focus",
      level: "focus",
      text: "Пусть мальчиков x. Тогда девочек x − 4. Самый старший мальчик не имеет старшего брата, а остальные x − 1 мальчиков точно имеют.",
    },
    {
      id: "ivanov-older-brother-count-strategy",
      level: "strategy",
      text: "Используй число правдивых ответов, чтобы сначала отбросить слишком большое и слишком маленькое x.",
    },
    {
      id: "ivanov-older-brother-count-next-step",
      level: "next-step",
      text: "Если x ≥ 8, уже как минимум 7 мальчиков говорят правду. Если x ≤ 5, даже вместе со всеми девочками правду могут сказать не больше пяти детей. Остаются x = 6 и x = 7.",
    },
  ],
  solution: {
    id: "ivanov-older-brother-count-full-solution",
    kind: "training-adaptation",
    text: "Пусть в семье x мальчиков. Девочек тогда x − 4.\n\nСамый старший мальчик не имеет старшего брата. Все остальные x − 1 мальчиков старшего брата имеют и говорят правду.\n\nЕсли x ≥ 8, уже как минимум 7 мальчиков говорят правду — слишком много.\n\nЕсли x ≤ 5, девочек не больше одной, поэтому правдивых ответов может быть не больше:\n\n(x − 1) + (x − 4) = 2x − 5 ≤ 5.\n\nЗначит, остаются x = 6 и x = 7.\n\nПри x = 6 девочек 2, всего детей 8. Это возможно, например если самый старший ребёнок — девочка, затем идёт самый старший мальчик, а вторая девочка младше него. Тогда правду говорят пять младших мальчиков и одна девочка.\n\nПри x = 7 девочек 3, всего детей 10. Это возможно, если все три девочки старше всех мальчиков: тогда правду говорят ровно шесть мальчиков.\n\nОтвет: 8 и 10.",
  },
} as const satisfies ProblemDefinition;

const cubeRedFaceSumsProblem = {
  id: "cube-red-face-sums",
  grade: 5,
  subject: "mathematics",
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
    {
      id: "cube-red-face-sums-focus",
      level: "focus",
      text: "Сначала выясни, как расположены три красные грани. Могут ли среди них быть две противоположные?",
    },
    {
      id: "cube-red-face-sums-strategy",
      level: "strategy",
      text: "У двух противоположных граней одни и те же четыре соседние грани. Тогда суммы для них были бы одинаковыми, но 33, 36 и 39 различны.",
    },
    {
      id: "cube-red-face-sums-next-step",
      level: "next-step",
      text: "Значит, три красные грани имеют общую вершину. Сложи 33 + 36 + 39 и посчитай, сколько раз число на каждой из шести граней попадёт в эту общую сумму.",
    },
  ],
  solution: {
    id: "cube-red-face-sums-full-solution",
    kind: "training-adaptation",
    text: "Если бы две красные грани были противоположными, у них были бы одни и те же четыре соседние грани. Их суммы тогда совпали бы.\n\nНо 33, 36 и 39 различны. Значит, противоположных красных граней нет.\n\nПоэтому три красные грани имеют общую вершину: выбрана по одной грани из каждой пары противоположных.\n\nКаждая грань куба соседствует ровно с двумя из этих трёх красных граней.\n\nПоэтому в сумме:\n\n33 + 36 + 39 = 108\n\nкаждое из шести написанных чисел посчитано ровно два раза.\n\nСледовательно, сумма всех чисел:\n\n108 : 2 = 54.\n\nОтвет: 54.",
  },
} as const satisfies ProblemDefinition;

const problemCatalog: Readonly<Record<string, ProblemDefinition>> = {
  [coincidingSeatsProblem.id]: coincidingSeatsProblem,
  [guaranteedSockPairProblem.id]: guaranteedSockPairProblem,
  [tableImpossibleSumsProblem.id]: tableImpossibleSumsProblem,
  [brothersAgesProductsProblem.id]: brothersAgesProductsProblem,
  [parrotsGuaranteedColorsProblem.id]: parrotsGuaranteedColorsProblem,
  [pagesWithoutDigitOneProblem.id]: pagesWithoutDigitOneProblem,
  [granddaughtersFirstProblem.id]: granddaughtersFirstProblem,
  [cutoutAreaRatioProblem.id]: cutoutAreaRatioProblem,
  [dominoPlacementsProblem.id]: dominoPlacementsProblem,
  [truckCarSameArrivalProblem.id]: truckCarSameArrivalProblem,
  [knightsAllOrNoneProblem.id]: knightsAllOrNoneProblem,
  [boastfulFishermanStreakProblem.id]: boastfulFishermanStreakProblem,
  [largestValidEightDigitProblem.id]: largestValidEightDigitProblem,
  [threeNumbersDigitSumsProblem.id]: threeNumbersDigitSumsProblem,
  [mountainPlainFlightsProblem.id]: mountainPlainFlightsProblem,
  [exactCoinPaymentsProblem.id]: exactCoinPaymentsProblem,
  [oddNeighborSugarCubesProblem.id]: oddNeighborSugarCubesProblem,
  [lastStudentFriendsProblem.id]: lastStudentFriendsProblem,
  [lineupSixHooligansProblem.id]: lineupSixHooligansProblem,
  [twoTrueJournalistsProblem.id]: twoTrueJournalistsProblem,
  [neighborComparisonCodesProblem.id]: neighborComparisonCodesProblem,
  [fivePilesStonesProblem.id]: fivePilesStonesProblem,
  [untouchedMatchstickFiguresProblem.id]: untouchedMatchstickFiguresProblem,
  [mountainNumbersOver77777Problem.id]: mountainNumbersOver77777Problem,
  [nonadjacentRowSeatingProblem.id]: nonadjacentRowSeatingProblem,
  [eighteenPiecePieCutsProblem.id]: eighteenPiecePieCutsProblem,
  [multiplesPrefixCountProblem.id]: multiplesPrefixCountProblem,
  [rabbitCarrotShortfallProblem.id]: rabbitCarrotShortfallProblem,
  [gradeAverageFivesProblem.id]: gradeAverageFivesProblem,
  [magicForestCoinDifferenceProblem.id]: magicForestCoinDifferenceProblem,
  [fourHousesDistanceCasesProblem.id]: fourHousesDistanceCasesProblem,
  [ivanovOlderBrotherCountProblem.id]: ivanovOlderBrotherCountProblem,
  [cubeRedFaceSumsProblem.id]: cubeRedFaceSumsProblem,
};

export function getProblemDefinition(problemId: string): ProblemDefinition {
  if (!Object.prototype.hasOwnProperty.call(problemCatalog, problemId)) {
    throw new Error(`Unknown practice problem: ${problemId}`);
  }

  const problem = problemCatalog[problemId];

  if (!problem) {
    throw new Error(`Unknown practice problem: ${problemId}`);
  }

  return problem;
}

export function getLearnerSafePracticeProblem(
  problemId: string,
): LearnerSafePracticeProblem {
  const problem = getProblemDefinition(problemId);
  const [focusHint, strategyHint, nextStepHint] = problem.hints;

  return {
    problemId: problem.id,
    title: problem.title,
    statement: problem.statement,
    response:
      problem.assessment.kind === "multiple-choice-set"
        ? {
            kind: "multiple-choice-set",
            ...(problem.assessment.instruction
              ? { instruction: problem.assessment.instruction }
              : {}),
            options: problem.assessment.options.map(({ id, label }) => ({
              id,
              label,
            })),
          }
        : { kind: "short-numeric" },
    hints: [
      { hintId: focusHint.id, level: focusHint.level },
      { hintId: strategyHint.id, level: strategyHint.level },
      { hintId: nextStepHint.id, level: nextStepHint.level },
    ],
    solution: { solutionId: problem.solution.id },
    ...(problem.reasoningCheckpoint
      ? {
          reasoningCheckpoint: { checkpointId: problem.reasoningCheckpoint.id },
        }
      : {}),
  };
}

export function getLearnerSafePackProblems(): Readonly<
  Record<
    PackId,
    readonly [
      LearnerSafePracticeProblem,
      LearnerSafePracticeProblem,
      LearnerSafePracticeProblem,
    ]
  >
> {
  const packs: Partial<
    Record<
      PackId,
      readonly [
        LearnerSafePracticeProblem,
        LearnerSafePracticeProblem,
        LearnerSafePracticeProblem,
      ]
    >
  > = {};
  for (const pack of PRACTICE_PACKS) {
    packs[pack.id] = [
      getLearnerSafePracticeProblem(pack.problemIds[0]),
      getLearnerSafePracticeProblem(pack.problemIds[1]),
      getLearnerSafePracticeProblem(pack.problemIds[2]),
    ];
  }
  return packs as Record<
    PackId,
    readonly [
      LearnerSafePracticeProblem,
      LearnerSafePracticeProblem,
      LearnerSafePracticeProblem,
    ]
  >;
}

function getReasoningCheckpointDefinition(
  problemId: string,
  checkpointId: string,
): ReasoningCheckpointDefinition {
  const checkpoint = getProblemDefinition(problemId).reasoningCheckpoint;
  if (!checkpoint || checkpoint.id !== checkpointId) {
    throw new Error(`Unknown reasoning checkpoint: ${checkpointId}`);
  }
  return checkpoint;
}

export function getRevealedReasoningCheckpoint(
  problemId: string,
  checkpointId: string,
): RevealedReasoningCheckpoint {
  const checkpoint = getReasoningCheckpointDefinition(problemId, checkpointId);
  return {
    checkpointId: checkpoint.id,
    heading: checkpoint.heading,
    question: checkpoint.question,
    options: checkpoint.options.map(({ id, text }) => ({ id, text })),
  };
}

export function assessReasoningCheckpointOption(
  problemId: string,
  checkpointId: string,
  selectedOptionId: string,
): { outcome: "correct" | "incorrect" } {
  const checkpoint = getReasoningCheckpointDefinition(problemId, checkpointId);
  if (!checkpoint.options.some((option) => option.id === selectedOptionId)) {
    throw new Error(`Unknown reasoning option: ${selectedOptionId}`);
  }
  return {
    outcome:
      checkpoint.correctOptionId === selectedOptionId ? "correct" : "incorrect",
  };
}

export function getRevealedPracticeHint(
  problemId: string,
  hintId: string,
): RevealedPracticeHint {
  const problem = getProblemDefinition(problemId);
  const hint = problem.hints.find((candidate) => candidate.id === hintId);

  if (!hint) {
    throw new Error(`Unknown hint for practice problem: ${hintId}`);
  }

  return { hintId: hint.id, level: hint.level, text: hint.text };
}

export function getRevealedPracticeSolution(
  problemId: string,
  solutionId: string,
): RevealedPracticeSolution {
  const problem = getProblemDefinition(problemId);

  if (problem.solution.id !== solutionId) {
    throw new Error(`Unknown solution for practice problem: ${solutionId}`);
  }

  return { solutionId: problem.solution.id, text: problem.solution.text };
}

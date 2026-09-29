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
} from "../application/completed-practice-episode";

type SourceReference = Readonly<{
  reference: "I" | "IS";
  url: string;
  page: number;
}>;

type ProblemProvenance = Readonly<{
  olympiad: "Всероссийская олимпиада школьников";
  subject: "mathematics";
  academicYear: "2025/26" | "2024/25" | "2020/21";
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
export { PACK_A_PROBLEM_IDS, PACK_B_PROBLEM_IDS };

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

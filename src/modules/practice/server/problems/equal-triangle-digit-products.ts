import type { ProblemDefinition } from "../problem-catalog";

export const equalTriangleDigitProductsProblem = {
  id: "equal-triangle-digit-products",
  grade: 5,
  subject: "mathematics",
  title: "Три равных произведения",
  statement:
    "Шесть кружков подписаны так: 1, А, Б, В, Г, Д. В пяти буквенных кружках надо написать разные цифры, отличные от 1. Произведения цифр в тройках (1, А, Б), (А, В, Г) и (Б, Г, Д) должны совпасть. В каждом варианте перечислены цифры в порядке А, Б, В, Г, Д. Выбери все подходящие варианты.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2025/26",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/school/math/tasks-math-5-sch-msk-25-26.pdf",
      page: 7,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/school/math/sol-math-5-sch-msk-25-26.pdf",
      page: 9,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "first",
        label: "6, 8, 4, 2, 3",
      },
      {
        id: "second",
        label: "8, 6, 3, 2, 4",
      },
      {
        id: "third",
        label: "6, 8, 3, 2, 4",
      },
      {
        id: "fourth",
        label: "8, 6, 2, 3, 4",
      },
      {
        id: "fifth",
        label: "4, 8, 2, 0, 3",
      },
    ],
    expectedOptionIds: ["first", "second"],
  },
  hints: [
    {
      id: "equal-triangle-digit-products-hint-focus",
      level: "focus",
      text: "Может ли ноль стоять в каком-то кружке? Проверь, есть ли кружок, общий для всех трёх произведений.",
    },
    {
      id: "equal-triangle-digit-products-hint-strategy",
      level: "strategy",
      text: "В первом и втором произведениях повторяется множитель А. Сравни оставшиеся множители. Аналогично сравни первое и третье.",
    },
    {
      id: "equal-triangle-digit-products-hint-next-step",
      level: "next-step",
      text: "Умножения В · Г и Г · Д должны давать две разные цифры от 2 до 9. Что произойдёт, если взять Г не меньше 3?",
    },
  ],
  solution: {
    id: "equal-triangle-digit-products-full-solution",
    kind: "training-adaptation",
    text: "Если где-то есть ноль, нулём становится хотя бы одно произведение. Но ни один кружок не входит сразу во все три тройки. Поскольку цифры различны, второго нуля нет и хотя бы одно произведение останется положительным.\n\nСравнивая ненулевые произведения с общим множителем, получаем Б = В · Г и А = Г · Д. После исключения нуля все пять цифр — от 2 до 9.\n\nЕсли Г = 3, то В и Д различны и ни одна из них не равна 3. Среди цифр меньше 4 им подходит только 2, поэтому хотя бы одна из них не меньше 4. Тогда одно из произведений В · Г и Г · Д не меньше 3 · 4 = 12.\n\nЕсли Г ≥ 4, то хотя бы одна из двух разных цифр В и Д не меньше 3: обе не могут быть равны 2. Поэтому одно из произведений не меньше 4 · 3 = 12. В обоих случаях это произведение не может быть цифрой.\n\nОстаётся Г = 2. Тогда В и Д не могут быть больше 4: удвоенная цифра 5 или больше даст число не меньше 10. Поскольку В и Д различны и не равны 2, это 3 и 4 в каком-то порядке. Их удвоения равны 6 и 8. Получаем ровно две записи: (6, 8, 4, 2, 3) и (8, 6, 3, 2, 4). В обеих все три произведения равны 48.",
  },
} as const satisfies ProblemDefinition;

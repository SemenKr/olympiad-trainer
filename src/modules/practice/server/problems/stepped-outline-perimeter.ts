import type { ProblemDefinition } from "../problem-catalog";

export const steppedOutlinePerimeterProblem = {
  id: "stepped-outline-perimeter",
  grade: 5,
  subject: "mathematics",
  title: "Периметр со ступеньками",
  statement:
    "У фигуры все стороны горизонтальные или вертикальные. Нижняя сторона имеет длину 10. Если идти по контуру от её левого конца вверх, а потом по верхним ступенькам к правому концу, горизонтальные отрезки идут только вправо. По пути есть два подъёма неизвестной длины и три спуска длиной 1, 3 и 5. Найди периметр фигуры.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/tasks-math-5-prigl-msk-26-27.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/sol-math-5-prigl-msk-26-27.pdf",
      page: 3,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "38",
  },
  hints: [
    {
      id: "stepped-outline-perimeter-hint-focus",
      level: "focus",
      text: "Представь путь вокруг фигуры. На сколько вправо ты переместишься от левого конца нижней стороны до правого?",
    },
    {
      id: "stepped-outline-perimeter-hint-strategy",
      level: "strategy",
      text: "Отдельно сложи горизонтальные и вертикальные отрезки. В начале и конце пути высота одна и та же.",
    },
    {
      id: "stepped-outline-perimeter-hint-next-step",
      level: "next-step",
      text: "Если суммарный спуск равен 1 + 3 + 5, какой должна быть сумма подъёмов, чтобы вернуться на исходную высоту?",
    },
  ],
  solution: {
    id: "stepped-outline-perimeter-full-solution",
    kind: "training-adaptation",
    text: "На верхних ступеньках каждый горизонтальный отрезок идёт вправо и вместе они проходят ширину 10. Нижняя сторона даёт ещё 10, всего горизонтальных отрезков на 20. В вертикальном направлении путь возвращается на исходную высоту, поэтому сумма подъёмов равна сумме спусков. Спуски дают 1 + 3 + 5 = 9, подъёмы тоже 9. Поэтому периметр равен 20 + 9 + 9 = 38. Знать длины подъёмов по отдельности не нужно.",
  },
} as const satisfies ProblemDefinition;

import type { ProblemDefinition } from "../problem-catalog";

export const squareColumnsPerimeterProblem = {
  id: "square-columns-perimeter",
  grade: 5,
  subject: "mathematics",
  title: "Семь квадратов и периметр",
  statement:
    "Прямоугольник без промежутков составлен из трёх столбцов одинаковой высоты. В левом столбце стоят друг над другом четыре одинаковых квадрата, средний столбец — один квадрат, а в правом стоят друг над другом два одинаковых квадрата. Площадь прямоугольника равна 2268. Найди его периметр.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2023/24",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
      page: 4,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "198",
  },
  hints: [
    {
      id: "square-columns-perimeter-focus",
      level: "focus",
      text: "Сколько сторон маленького квадрата укладывается в общую высоту?",
    },
    {
      id: "square-columns-perimeter-strategy",
      level: "strategy",
      text: "Возьми сторону левого квадрата за одну мерку. Найди ширину каждого столбца в таких мерках.",
    },
    {
      id: "square-columns-perimeter-next-step",
      level: "next-step",
      text: "Из 28 равных квадратов получается всё поле. Как найти площадь одного, а затем его сторону?",
    },
  ],
  solution: {
    id: "square-columns-perimeter-full-solution",
    kind: "training-adaptation",
    text: "Если сторона левого квадрата — одна мерка, высота равна четырём меркам. Тогда ширина среднего столбца — четыре мерки, а правого — две. Общая ширина равна 1 + 4 + 2 = 7 меркам.\n\nРазбив весь прямоугольник на маленькие квадраты, получим 4 · 7 = 28 квадратов, каждый площадью 2268 : 28 = 81. Сторона квадрата равна 9, поскольку 9 · 9 = 81. Поэтому стороны прямоугольника равны 36 и 63, а периметр равен 2 · (36 + 63) = 198.",
  },
} as const satisfies ProblemDefinition;

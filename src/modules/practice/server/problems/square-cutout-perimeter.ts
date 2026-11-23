import type { ProblemDefinition } from "../problem-catalog";

export const squareCutoutPerimeterProblem = {
  id: "square-cutout-perimeter",
  grade: 5,
  subject: "mathematics",
  title: "Что изменится у контура?",
  statement:
    "У квадрата со стороной 10 вырезали три части. Из левого нижнего угла удалили прямоугольник, из правого нижнего угла — квадрат. Каждый из этих вырезов лежал вдоль двух сторон исходного квадрата. Из середины верхней стороны вырезали квадрат со стороной 2: только одна его сторона лежала на краю исходного квадрата. Вырезы не соприкасаются.\n\nНайди периметр оставшейся фигуры.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/tasks-math-5-prigl-msk-20-21.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/ans-math-5-prigl-msk-20-21.pdf",
      page: 2,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "44",
  },
  hints: [
    {
      id: "square-cutout-perimeter-hint-focus",
      level: "focus",
      text: "Периметр — длина границы. Какие отрезки границы исчезли и какие появились при вырезе в углу?",
    },
    {
      id: "square-cutout-perimeter-hint-strategy",
      level: "strategy",
      text: "Сравни два исчезнувших отрезка у угла с двумя новыми отрезками. Что изменилось в длине границы?",
    },
    {
      id: "square-cutout-perimeter-hint-next-step",
      level: "next-step",
      text: "Для верхнего выреза убери один отрезок длиной 2 и посчитай длину трёх новых отрезков.",
    },
  ],
  solution: {
    id: "square-cutout-perimeter-full-solution",
    kind: "training-adaptation",
    text: "Исходный квадрат имеет периметр 4 × 10 = 40.\n\nКогда из угла убирают прямоугольник, с внешней границы исчезают две его соседние стороны. Их заменяют две противоположные стороны прямоугольника той же длины. Периметр не меняется. Квадрат — частный случай прямоугольника, поэтому второй угловой вырез тоже сохраняет периметр.\n\nВ середине верхнего края отрезок длиной 2 заменяют три стороны маленького квадрата. Длина границы увеличивается на 6 − 2 = 4. Поскольку части не соприкасаются, эти изменения можно считать отдельно. Ответ: 40 + 4 = 44.",
  },
} as const satisfies ProblemDefinition;

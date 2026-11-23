import type { ProblemDefinition } from "../problem-catalog";

export const twoOutlinesRectangleAreaProblem = {
  id: "two-outlines-rectangle-area",
  grade: 5,
  subject: "mathematics",
  title: "Площадь по двум контурам",
  statement:
    "Есть шесть одинаковых прямоугольников. Три из них стоят рядом длинными сторонами друг к другу и образуют большой прямоугольник с периметром 52 см. Три других образуют букву П: два поставлены вертикально, а третий лежит горизонтально между ними у верхнего края. Он касается каждого вертикального прямоугольника всей своей короткой стороной. Периметр этой фигуры 92 см. Найди площадь одного маленького прямоугольника в квадратных сантиметрах.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2024/25",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
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
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "56",
  },
  hints: [
    {
      id: "two-outlines-rectangle-area-focus",
      level: "focus",
      text: "Какие стороны маленьких прямоугольников оказываются внутри фигур?",
    },
    {
      id: "two-outlines-rectangle-area-strategy",
      level: "strategy",
      text: "Обозначь длинную и короткую стороны и запиши, из каких отрезков получается каждый периметр.",
    },
    {
      id: "two-outlines-rectangle-area-next-step",
      level: "next-step",
      text: "Сложи два периметра. Как выразить через сумму длинной и короткой сторон то, что получилось?",
    },
  ],
  solution: {
    id: "two-outlines-rectangle-area-full-solution",
    kind: "training-adaptation",
    text: "Пусть длинная сторона равна a, короткая — b. У первого большого прямоугольника стороны a и 3b, поэтому a + 3b = 26. Для буквы П сложим периметры трёх частей: 6a + 6b. Два общих края длины b посчитаны по два раза, поэтому наружный периметр 6a + 2b. Значит, 3a + b = 46.\n\nСложим равенства: 4a + 4b = 72, то есть a + b = 18. Сравнивая с a + 3b = 26, получим 2b = 8, откуда b = 4 и a = 14. Подстановка даёт оба исходных периметра. Площадь равна 14 · 4 = 56 см².",
  },
} as const satisfies ProblemDefinition;

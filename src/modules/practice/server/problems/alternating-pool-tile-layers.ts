import type { ProblemDefinition } from "../problem-catalog";

export const alternatingPoolTileLayersProblem = {
  id: "alternating-pool-tile-layers",
  grade: 5,
  subject: "mathematics",
  title: "Уголки на дне бассейна",
  statement:
    "Дно квадратного бассейна выложили 900 квадратными плитками. От левого верхнего угла узор растёт квадратами: первая плитка зелёная, затем по нижней и правой стороне добавляют белый уголок, получая квадрат 2 × 2. Следующий добавленный уголок зелёный и даёт квадрат 3 × 3. Так продолжают до края бассейна, чередуя цвета уголков. На сколько белых плиток больше, чем зелёных?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 7,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf",
      page: 8,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf",
      page: 11,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "30",
  },
  hints: [
    {
      id: "alternating-pool-tile-layers-hint-focus",
      level: "focus",
      text: "Сначала выясни, сколько плиток уложено вдоль одной стороны бассейна.",
    },
    {
      id: "alternating-pool-tile-layers-hint-strategy",
      level: "strategy",
      text: "Посчитай плитки в первых четырёх уголках, включая одиночную зелёную плитку. Как меняется размер уголка?",
    },
    {
      id: "alternating-pool-tile-layers-hint-next-step",
      level: "next-step",
      text: "Объедини очередной зелёный уголок со следующим белым. Сравни числа плиток в такой паре.",
    },
  ],
  solution: {
    id: "alternating-pool-tile-layers-full-solution",
    kind: "training-adaptation",
    text: "Так как 30 · 30 = 900, по каждой стороне уложено 30 плиток. При переходе от квадрата со стороной k − 1 к квадрату со стороной k добавляются k плиток в нижнем ряду и k − 1 в правом столбце: угловая плитка уже учтена в ряду. Размеры уголков идут так: 1, 3, 5, 7 и дальше с шагом 2. В каждой паре «зелёный, следующий белый» ровно на 2 белых плитки больше. Всего 30 уголков, то есть 15 пар. Разность равна 15 · 2 = 30 плиток.",
  },
} as const satisfies ProblemDefinition;

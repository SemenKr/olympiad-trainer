import type { ProblemDefinition } from "../problem-catalog";

export const raisedCellTilingsProblem = {
  id: "raised-cell-tilings",
  grade: 5,
  subject: "mathematics",
  title: "Какие фигурки подходят?",
  statement:
    "Поле состоит из прямоугольника шириной 5 и высотой 3 клетки. Над средней клеткой его верхнего ряда есть ещё одна клетка. Для каждого варианта попробуй покрыть всё поле четырьмя копиями одной фигурки без перекрытий. Копии можно поворачивать и отражать. Отметь все подходящие виды фигурок.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2024/25",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
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
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "tee",
        label: "Т: три клетки в ряд и одна над средней",
      },
      {
        id: "square",
        label: "Квадрат 2 × 2",
      },
      {
        id: "zigzag",
        label: "Зигзаг: два ряда по две клетки со сдвигом на одну клетку",
      },
      {
        id: "ell",
        label: "Г: три клетки в ряд и одна над крайней",
      },
      {
        id: "bar",
        label: "Полоса из четырёх клеток",
      },
    ],
    expectedOptionIds: ["tee", "ell"],
  },
  hints: [
    {
      id: "raised-cell-tilings-focus",
      level: "focus",
      text: "Начни с выступающей клетки. Какая у неё есть соседняя клетка?",
    },
    {
      id: "raised-cell-tilings-strategy",
      level: "strategy",
      text: "Проверь, какие положения каждого вида фигурки вообще могут занять выступ. Положения слева и справа удобно сравнить отражением.",
    },
    {
      id: "raised-cell-tilings-next-step",
      level: "next-step",
      text: "Для зигзага после закрытия выступа посмотри на две клетки у ближайшего края. Для подходящих фигурок попробуй раскрасить четыре копии разными числами.",
    },
  ],
  solution: {
    id: "raised-cell-tilings-full-solution",
    kind: "training-adaptation",
    text: "Квадратом выступ занять нельзя: в его строке нет второй клетки. Полоса из четырёх клеток может закрыть выступ только вертикально посередине, но тогда остаются два прямоугольника 2 × 3, где полосы не помещаются.\n\nУ зигзага при покрытии выступа есть два зеркальных положения. Например, он занимает выступ, клетки в столбцах 3 и 4 первого ряда и клетку в столбце 4 второго ряда. Клетки в столбце 5 первых двух рядов теперь соединяются с остальным полем только через нижний ряд. Чтобы их закрыть, понадобятся три клетки в столбце 5 подряд, а у зигзага таких нет. Второе положение даёт ту же преграду слева.\n\nДля Т и Г есть покрытия. Запишем четыре ряда сверху вниз, где точка — место вне поля, а одинаковые цифры обозначают одну фигурку. Для Т: «..2..», «12224», «11344», «13334». Для Г: «..3..», «12333», «12224», «11444». В каждой записи четыре связные фигурки нужного вида без перекрытий.",
  },
} as const satisfies ProblemDefinition;

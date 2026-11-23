import type { ProblemDefinition } from "../problem-catalog";

export const nestedCornerTilingsProblem = {
  id: "nested-corner-tilings",
  grade: 5,
  subject: "mathematics",
  title: "Три уголка и клетка",
  statement:
    "Квадрат 4 × 4 нужно разрезать по клеткам на три уголка и одну отдельную клетку. Уголок состоит из двух полосок шириной в одну клетку, сходящихся под прямым углом и имеющих общую угловую клетку. У большого уголка длина каждой полоски 4 клетки, у среднего — 3, у малого — 2.\n\nСколько разных разбиений можно получить? Два рисунка разбиения считаются одинаковыми, если они отделяют одни и те же клетки в одни и те же части. Не отождествляй разные рисунки, даже если один получается из другого поворотом или отражением целого квадрата.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 7,
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
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "64",
  },
  hints: [
    {
      id: "nested-corner-tilings-hint-focus",
      level: "focus",
      text: "Две полоски большого уголка занимают по четыре клетки. Где может находиться их общая клетка?",
    },
    {
      id: "nested-corner-tilings-hint-strategy",
      level: "strategy",
      text: "Мысленно убери большой уголок. Как выглядит оставшаяся фигура и где в ней может лежать средний уголок?",
    },
    {
      id: "nested-corner-tilings-hint-next-step",
      level: "next-step",
      text: "Для каждого положения большого уголка посчитай, сколько вариантов даёт средний и сколько — малый. Как соединить эти количества?",
    },
  ],
  solution: {
    id: "nested-corner-tilings-full-solution",
    kind: "training-adaptation",
    text: "Полоска из четырёх клеток занимает целую строку или целый столбец. Чтобы обе такие полоски большого уголка сходились своими концами, их общая клетка должна быть в одном из четырёх углов доски. Как только этот угол выбран, весь большой уголок определён.\n\nПосле его удаления остаётся квадрат 3 × 3. По той же причине средний уголок может начинаться в любом из четырёх углов этого квадрата. Он оставляет квадрат 2 × 2, а малый уголок в нём занимает три клетки и оставляет одну. Эту клетку можно выбрать четырьмя способами.\n\nВсего 4 × 4 × 4 = 64. В любом разбиении уголки различимы по размеру, поэтому из разбиения можно однозначно восстановить три выбора. Повторов при подсчёте нет.",
  },
} as const satisfies ProblemDefinition;

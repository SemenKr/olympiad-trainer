import type { ProblemDefinition } from "../problem-catalog";

export const streetCrossingCoverageProblem = {
  id: "street-crossing-coverage",
  grade: 5,
  subject: "mathematics",
  title: "Три поста",
  statement:
    "В городе 11 перекрёстков, обозначенных буквами от A до K. По каждой из восьми прямых улиц идут такие перекрёстки:\n\nГоризонтальные улицы: A–B–C–D, E–F–G, H–I–J–K.\nВертикальные улицы: A–E–H, B–F–I, D–G–J.\nНаклонные улицы: H–F–C, C–G–K.\n\nНужно поставить трёх полицейских на три разных перекрёстка так, чтобы на каждой улице оказался хотя бы один полицейский. Выбери все три перекрёстка.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 3,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf",
      page: 4,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf",
      page: 9,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    instruction: "Выбери три перекрёстка.",
    options: [
      {
        id: "crossing-a",
        label: "A",
      },
      {
        id: "crossing-b",
        label: "B",
      },
      {
        id: "crossing-c",
        label: "C",
      },
      {
        id: "crossing-d",
        label: "D",
      },
      {
        id: "crossing-e",
        label: "E",
      },
      {
        id: "crossing-f",
        label: "F",
      },
      {
        id: "crossing-g",
        label: "G",
      },
      {
        id: "crossing-h",
        label: "H",
      },
      {
        id: "crossing-i",
        label: "I",
      },
      {
        id: "crossing-j",
        label: "J",
      },
      {
        id: "crossing-k",
        label: "K",
      },
    ],
    expectedOptionIds: ["crossing-b", "crossing-g", "crossing-h"],
  },
  hints: [
    {
      id: "street-crossing-coverage-hint-focus",
      level: "focus",
      text: "Сначала сравни три вертикальные улицы. Есть ли у них хотя бы один общий перекрёсток?",
    },
    {
      id: "street-crossing-coverage-hint-strategy",
      level: "strategy",
      text: "На каждую вертикальную улицу нужен свой полицейский. Вычеркни перекрёстки, которых нет ни на одной из этих улиц.",
    },
    {
      id: "street-crossing-coverage-hint-next-step",
      level: "next-step",
      text: "Посмотри, какой из оставшихся перекрёстков лежит на улице C–G–K. После выбора проверь улицу H–F–C и три горизонтальные улицы.",
    },
  ],
  solution: {
    id: "street-crossing-coverage-full-solution",
    kind: "training-adaptation",
    text: "Вертикальные улицы A–E–H, B–F–I и D–G–J не пересекаются. Трёх полицейских хватит только на то, чтобы поставить на каждую из них по одному. Поэтому на C и K никого не будет: эти перекрёстки не лежат на вертикальных улицах.\n\nНа наклонной улице C–G–K остаётся только G. Этот пост уже закрывает среднюю горизонтальную улицу E–F–G. Две другие горизонтальные улицы не пересекаются с ней и друг с другом, поэтому свободные посты должны стоять на верхней и нижней улицах. Значит, на F полицейского не будет. На второй наклонной улице H–F–C остаётся H.\n\nПост на H закрывает нижнюю горизонтальную и левую вертикальную улицы. Верхняя горизонтальная и средняя вертикальная ещё без поста. Они встречаются только в B. Проверка: G, H и B вместе лежат на всех восьми улицах. Каждый выбор был вынужден, поэтому других троек нет.",
  },
} as const satisfies ProblemDefinition;

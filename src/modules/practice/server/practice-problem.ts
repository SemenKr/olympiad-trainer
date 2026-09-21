import "server-only";

export const practiceProblem = {
  title: "Совпадающие места",
  statement:
    "В зале 102 места, пронумерованных от 1 до 102. Для одной группы отмечают каждое второе место, а для другой — каждое третье. Сколько мест окажутся отмечены для обеих групп?",
  focusHint: {
    id: "coinciding-seats-focus-simultaneous-rules",
    level: "focus",
    text: "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.",
  },
} as const;

const expectedAnswer = "17";

export function getPracticeExpectedAnswer(): string {
  return expectedAnswer;
}

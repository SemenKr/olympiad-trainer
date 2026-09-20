import "server-only";

export const practiceProblem = {
  title: "Совпадающие места",
  statement:
    "В зале 102 места, пронумерованных от 1 до 102. Для одной группы отмечают каждое второе место, а для другой — каждое третье. Сколько мест окажутся отмечены для обеих групп?",
} as const;

const expectedAnswer = "17";

export function getPracticeExpectedAnswer(): string {
  return expectedAnswer;
}

import { describe, expect, it } from "vitest";

import { checkNonnegativeIntegerAnswer } from "./numeric-answer";
import { checkMultipleChoiceSetAnswer } from "./multiple-choice-set-answer";

const options = ["sum-20", "sum-21", "sum-23", "sum-25", "sum-26"];

describe("multiple-choice-set checker", () => {
  it("accepts an exact set independently of order", () => {
    expect(
      checkMultipleChoiceSetAnswer(["sum-25", "sum-20"], options, [
        "sum-20",
        "sum-25",
      ]),
    ).toEqual({
      status: "correct",
      normalizedAnswer: '["sum-20","sum-25"]',
    });
    expect(
      checkMultipleChoiceSetAnswer(["sum-20", "sum-21"], options, ["sum-20"]),
    ).toMatchObject({ status: "incorrect" });
  });

  it.each([[], ["sum-20", "sum-20"], ["unknown"], "sum-20", null])(
    "rejects invalid selection %j without counting an attempt",
    (selection) => {
      expect(
        checkMultipleChoiceSetAnswer(selection, options, ["sum-20"]),
      ).toEqual({ status: "invalid" });
    },
  );

  it("keeps the numeric checker unchanged", () => {
    expect(checkNonnegativeIntegerAnswer("17", "17")).toEqual({
      status: "correct",
      normalizedAnswer: "17",
    });
    expect(checkNonnegativeIntegerAnswer("17,0", "17")).toEqual({
      status: "invalid",
    });
  });
});

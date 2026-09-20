import { describe, expect, it } from "vitest";

import { checkNonnegativeIntegerAnswer } from "./numeric-answer";

describe("checkNonnegativeIntegerAnswer", () => {
  it.each([
    ["17", "correct", "17"],
    ["  17\n", "correct", "17"],
    ["00017", "correct", "17"],
    ["000", "incorrect", "0"],
    ["18", "incorrect", "18"],
  ] as const)("checks valid input %j", (input, status, normalizedAnswer) => {
    expect(checkNonnegativeIntegerAnswer(input, "17")).toEqual({
      status,
      normalizedAnswer,
    });
  });

  it.each(["", " \t\n", "+17", "-17", "17.0", "1.7e1", "17 holes", "17abc"])(
    "rejects invalid input %j",
    (input) => {
      expect(checkNonnegativeIntegerAnswer(input, "17")).toEqual({
        status: "invalid",
      });
    },
  );

  it("accepts zero as the expected answer", () => {
    expect(checkNonnegativeIntegerAnswer("000", "0")).toEqual({
      status: "correct",
      normalizedAnswer: "0",
    });
  });

  it("compares integers beyond JavaScript's safe-number range exactly", () => {
    expect(
      checkNonnegativeIntegerAnswer("09007199254740993", "9007199254740993"),
    ).toEqual({
      status: "correct",
      normalizedAnswer: "9007199254740993",
    });
  });

  it.each(["", "00", "017", "+17", "-17", "17.0", "1e2", "17 holes", " 17 "])(
    "rejects noncanonical expected answer %j",
    (expectedAnswer) => {
      expect(() => checkNonnegativeIntegerAnswer("17", expectedAnswer)).toThrow(
        "Expected answer must be a canonical nonnegative integer",
      );
    },
  );

  it("rejects a noncanonical expected answer even when submitted input is invalid", () => {
    expect(() => checkNonnegativeIntegerAnswer("", "017")).toThrow(
      "Expected answer must be a canonical nonnegative integer",
    );
  });
});

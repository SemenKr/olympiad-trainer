import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { practiceProblem } from "./practice-problem";

describe("practice problem hints", () => {
  it("keeps the reviewed focus hint unchanged", () => {
    expect(practiceProblem.focusHint).toEqual({
      id: "coinciding-seats-focus-simultaneous-rules",
      level: "focus",
      text: "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.",
    });
  });

  it("defines one explicit strategy hint without revealing the period or answer", () => {
    expect(practiceProblem.strategyHint).toEqual({
      id: "coinciding-seats-strategy-repeat-interval",
      level: "strategy",
      text: "Подумай, через сколько мест отметки по обоим правилам снова совпадут.",
    });
    expect(practiceProblem.strategyHint.text).not.toMatch(/6|17/);
    expect(
      Object.keys(practiceProblem).filter((key) => /hint/i.test(key)),
    ).toEqual(["focusHint", "strategyHint"]);
  });
});

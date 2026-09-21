import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createShortNumericAnswerState } from "./short-numeric-answer-state";
import { ShortNumericAnswer } from "./short-numeric-answer";

function renderAnswer() {
  return renderToStaticMarkup(
    <ShortNumericAnswer
      onAnswerChange={() => undefined}
      onSubmit={() => undefined}
      state={createShortNumericAnswerState()}
    />,
  );
}

describe("ShortNumericAnswer accessibility structure", () => {
  it("mounts live regions outside the busy form before feedback occurs", () => {
    const markup = renderAnswer();
    const formEnd = markup.indexOf("</form>");

    expect(formEnd).toBeGreaterThan(-1);
    expect(markup.indexOf('role="status"')).toBeGreaterThan(formEnd);
    expect(markup.indexOf('role="alert"')).toBeGreaterThan(formEnd);
    expect(markup).not.toContain("Проверяем ответ");
    expect(markup).not.toContain("Верно");
  });

  it("associates a focusable submit control with the answer form", () => {
    const markup = renderAnswer();
    const formId = markup.match(/<form[^>]* id="([^"]+)"/)?.[1];

    expect(formId).toBeDefined();
    expect(markup).toContain(`form="${formId}"`);
    expect(markup).not.toContain(" disabled");
  });
});

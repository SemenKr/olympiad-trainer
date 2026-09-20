import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ShortNumericAnswer } from "./short-numeric-answer";

vi.mock("@/app/practice/actions", () => ({
  submitPracticeAnswer: vi.fn(),
}));

describe("ShortNumericAnswer accessibility structure", () => {
  it("mounts live regions outside the busy form before feedback occurs", () => {
    const markup = renderToStaticMarkup(<ShortNumericAnswer />);
    const formEnd = markup.indexOf("</form>");

    expect(formEnd).toBeGreaterThan(-1);
    expect(markup.indexOf('role="status"')).toBeGreaterThan(formEnd);
    expect(markup.indexOf('role="alert"')).toBeGreaterThan(formEnd);
    expect(markup).not.toContain("Проверяем ответ");
    expect(markup).not.toContain("Верно");
  });

  it("associates a focusable submit control with the answer form", () => {
    const markup = renderToStaticMarkup(<ShortNumericAnswer />);
    const formId = markup.match(/<form[^>]* id="([^"]+)"/)?.[1];

    expect(formId).toBeDefined();
    expect(markup).toContain(`form="${formId}"`);
    expect(markup).not.toContain(" disabled");
  });
});

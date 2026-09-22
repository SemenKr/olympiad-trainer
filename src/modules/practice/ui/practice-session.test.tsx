import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/practice/actions", () => ({
  revealPracticeHint: vi.fn(),
  submitPracticeAnswer: vi.fn(),
}));

import { PracticeHintRevealError } from "./practice-session";

describe("PracticeSession hint reveal error", () => {
  it("renders a visible, accessibly announced retry message", () => {
    const markup = renderToStaticMarkup(<PracticeHintRevealError />);

    expect(markup).toContain('role="alert"');
    expect(markup).toContain('aria-atomic="true"');
    expect(markup).toContain("Не удалось открыть подсказку. Попробуй ещё раз.");
  });
});

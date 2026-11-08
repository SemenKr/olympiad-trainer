import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("../modules/practice/ui/practice-session", () => ({
  PracticeSession: () => null,
}));
vi.mock("../modules/practice/server/problem-catalog", () => ({
  getLearnerSafePackProblems: vi.fn(),
}));
vi.mock("../modules/practice/server/content-access", () => ({
  BETA_PACKS: {},
  BETA_PROBLEM_IDS: [],
}));

import { BetaHome } from "./beta-practice";
import styles from "./page.module.scss";

describe("original beta entry", () => {
  it("gives Start a primary target and separates the existing secondary destinations", () => {
    const markup = renderToStaticMarkup(<BetaHome />);
    expect(markup).toContain(`class="${styles.home}"`);
    expect(markup).toContain(`class="${styles.primary}" href="/practice"`);
    expect(markup).toContain('aria-label="Другие действия"');
    expect(
      markup.match(new RegExp(`class="${styles.secondary}"`, "g")),
    ).toHaveLength(3);
    for (const href of ["/practice/choose", "/progress", "/restore"])
      expect(markup).toContain(`href="${href}"`);
    expect(markup).not.toContain('href="/simulation"');
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  PRACTICE_PACKS,
  packHref,
} from "../../../modules/practice/application/completed-practice-episode";
import ChoosePracticePage from "./page";

describe("Choose Practice", () => {
  it("lists every registry Pack once in registry order with its existing route", () => {
    const markup = renderToStaticMarkup(<ChoosePracticePage />);
    expect(markup.match(/<article /g)).toHaveLength(PRACTICE_PACKS.length);
    let lastPosition = -1;
    for (const pack of PRACTICE_PACKS) {
      const position = markup.indexOf(`id="${pack.id}-title"`);
      expect(position).toBeGreaterThan(lastPosition);
      lastPosition = position;
      expect(markup).toContain(pack.name);
      expect(markup).toContain(
        `href="${packHref(pack.id).replaceAll("&", "&amp;")}"`,
      );
      expect(markup).toContain(`aria-label="Начать набор «${pack.name}»"`);
    }
    expect(markup).toContain("не заменяет следующий шаг с Главной");
    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("/simulation");
    expect(markup).not.toContain("/practice/transfer");
  });
});

// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProblemMedia } from "./problem-media";
import type { LearnerSafeProblemMedia } from "../application/problem-media";

const media: LearnerSafeProblemMedia = {
  kind: "diagram",
  src: "/problem-media/test-only/diagram.svg",
  width: 600,
  height: 400,
  title: "Рисунок к условию",
  caption: "Обозначения из условия.",
  alt: "Отрезок с обозначенными концами A и B.",
  enlarge: true,
};
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ProblemMedia", () => {
  it("enables enlargement when the image completed before hydration", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      true,
    );
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(
      600,
    );
    await act(async () => root.render(<ProblemMedia media={media} />));
    expect(container.querySelector("button")?.disabled).toBe(false);
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
  it("shows caption and descriptive alt, then enlarges in a named dialog with focus return", async () => {
    await act(async () => root.render(<ProblemMedia media={media} />));
    const image = container.querySelector("img")!;
    expect(image.alt).toBe(media.alt);
    expect(image.getAttribute("width")).toBe("600");
    expect(container.querySelector("figcaption")?.textContent).toBe(
      media.caption,
    );
    const opener = container.querySelector("button")!;
    expect(opener.disabled).toBe(true);
    await act(async () => image.dispatchEvent(new Event("load")));
    expect(opener.disabled).toBe(false);
    const dialog = container.querySelector("dialog")!;
    dialog.showModal = vi.fn(() => {
      dialog.open = true;
    });
    dialog.close = vi.fn(() => {
      dialog.open = false;
      dialog.dispatchEvent(new Event("close"));
    });
    await act(async () => opener.click());
    expect(dialog.showModal).toHaveBeenCalled();
    expect(
      document.getElementById(dialog.getAttribute("aria-labelledby")!)
        ?.textContent,
    ).toBe(media.title);
    await act(async () => dialog.querySelector("button")!.click());
    expect(dialog.close).toHaveBeenCalled();
    expect(document.activeElement).toBe(opener);
  });

  it("announces load failure and prevents opening a broken image", async () => {
    await act(async () => root.render(<ProblemMedia media={media} />));
    await act(async () =>
      container.querySelector("img")!.dispatchEvent(new Event("error")),
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "Не удалось загрузить",
    );
    expect(container.querySelector("button")?.disabled).toBe(true);
    expect(container.querySelector("img")?.hidden).toBe(true);
  });

  it("does not offer enlargement when authoring says the preview is sufficient", async () => {
    await act(async () =>
      root.render(<ProblemMedia media={{ ...media, enlarge: false }} />),
    );
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("dialog")).toBeNull();
  });
});

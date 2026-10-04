// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TaskShell } from "./task-shell";

describe("Practice shell flow", () => {
  it("keeps statement/media, answer/feedback, then learning support in DOM order", () => {
    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(
      <TaskShell
        backAction="Home"
        finishAction="Finish"
        header={<h1>Problem</h1>}
        answerRail={
          <>
            <input aria-label="Answer" />
            <p role="status">Feedback</p>
          </>
        }
        learningSupport={
          <>
            <h2>Hint</h2>
            <p>Reasoning</p>
          </>
        }
      >
        <p>Statement</p>
        <figure>Media</figure>
      </TaskShell>,
    );
    const rail = container.querySelector('[aria-label="Ответ на задачу"]')!;
    const support = container.querySelector(
      '[aria-label="Помощь к этой задаче"]',
    )!;
    expect(rail.textContent).not.toContain("Reasoning");
    expect(
      rail.compareDocumentPosition(support) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      container.querySelector("figure")!.compareDocumentPosition(rail) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/practice/actions", () => ({
  verifyPersistedReasoningCheckpointObservation: vi.fn(),
}));

import { LatestCompletedSummaryContent } from "./latest-completed-summary";

describe("latest completed Summary route", () => {
  it("shows a safe Home link when the snapshot is missing or invalid", () => {
    const markup = renderToStaticMarkup(
      <LatestCompletedSummaryContent results={null} />,
    );

    expect(markup).toContain("Итоги тренировки недоступны");
    expect(markup).toContain("На главную");
    expect(markup).toContain('href="/"');
    expect(markup).not.toContain("Тренировка завершена");
  });

  it("reuses factual SessionSummary for a valid early Finish", () => {
    const markup = renderToStaticMarkup(
      <LatestCompletedSummaryContent
        results={[
          {
            problemId: "coinciding-seats",
            problemTitle: "Совпадающие места",
            summary: {
              outcome: "no-valid-submissions",
              validSubmissionCount: 0,
              hintExposures: [],
              solutionExposure: null,
            },
          },
        ]}
      />,
    );

    expect(markup).toContain("Тренировка завершена");
    expect(markup).toContain("не было проверенного ответа");
    expect(markup).toContain("На главную");
  });
});

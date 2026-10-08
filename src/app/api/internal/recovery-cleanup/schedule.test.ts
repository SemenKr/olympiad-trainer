import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("recovery cleanup schedule", () => {
  it("runs four times daily with less than seven hours between Hobby timing windows", async () => {
    const config = JSON.parse(await readFile("vercel.json", "utf8")) as {
      crons: Array<{ path: string; schedule: string }>;
    };
    const cleanupSchedules = config.crons
      .filter(({ path }) => path === "/api/internal/recovery-cleanup")
      .map(({ schedule }) => schedule);

    expect(cleanupSchedules).toEqual([
      "0 0 * * *",
      "0 6 * * *",
      "0 12 * * *",
      "0 18 * * *",
    ]);

    const scheduledHours = cleanupSchedules.map((schedule) =>
      Number(schedule.split(" ")[1]),
    );
    const gaps = scheduledHours.map((hour, index) => {
      const next = scheduledHours[(index + 1) % scheduledHours.length];
      return (next - hour + 24) % 24;
    });
    // Each invocation can land anywhere in its scheduled hour. Adjacent
    // six-hour slots therefore have a worst-case separation under seven hours.
    expect(Math.max(...gaps)).toBe(6);
    expect(Math.max(...gaps) + 1).toBeLessThan(24);
  });
});

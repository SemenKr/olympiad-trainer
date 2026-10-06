import { describe, expect, it } from "vitest";
import { PRACTICE_PACKS } from "./completed-practice-episode";
import {
  LEARNING_PATH_V1,
  getLearningPathProjection,
  isLearningPathPackId,
} from "./learning-path";

describe("Learning Path v1", () => {
  it("covers every current Pack exactly once in the adopted editorial order", () => {
    expect(LEARNING_PATH_V1.map(({ packId }) => packId)).toEqual([
      "pack-a",
      "pack-j",
      "pack-h",
      "pack-l",
      "pack-d",
      "pack-g",
      "pack-e",
      "pack-i",
      "pack-c",
      "pack-b",
      "pack-f",
      "pack-k",
    ]);
    expect(new Set(LEARNING_PATH_V1.map(({ packId }) => packId)).size).toBe(
      PRACTICE_PACKS.length,
    );
    expect(LEARNING_PATH_V1).toHaveLength(PRACTICE_PACKS.length);
  });

  it("suggests the earliest entry without a recorded Pack Finish", () => {
    const projection = getLearningPathProjection(["pack-j", "pack-a"]);
    expect(projection.completedCount).toBe(2);
    expect(projection.nextPackId).toBe("pack-h");
    expect(projection.entries.find((entry) => entry.suggested)?.packId).toBe(
      "pack-h",
    );
  });

  it("does not count repeats twice and supports out-of-order completion", () => {
    const projection = getLearningPathProjection([
      "pack-k",
      "pack-a",
      "pack-k",
    ]);
    expect(projection.completedCount).toBe(2);
    expect(projection.nextPackId).toBe("pack-j");
  });

  it("has a factual all-recorded state without inventing completion of Grade 5", () => {
    const projection = getLearningPathProjection(
      LEARNING_PATH_V1.map(({ packId }) => packId),
    );
    expect(projection.completedCount).toBe(12);
    expect(projection.nextPackId).toBeNull();
    expect(projection.allRecorded).toBe(true);
    expect(projection.entries.every((entry) => entry.completed)).toBe(true);
  });

  it("validates only registered Learning Path Pack IDs", () => {
    expect(isLearningPathPackId("pack-a")).toBe(true);
    expect(isLearningPathPackId("pack-k")).toBe(true);
    expect(isLearningPathPackId("pack-z")).toBe(false);
    expect(isLearningPathPackId(null)).toBe(false);
  });
});

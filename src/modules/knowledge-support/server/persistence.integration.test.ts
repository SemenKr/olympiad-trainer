import {
  learnerContext,
  createTestLearner,
} from "../../../test/learner-fixture";
import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getProgressDb } from "../../practice/server/progress-db";
import {
  learners,
  practiceFinishReceipts,
  practiceCompletedEpisodes,
} from "../../practice/server/progress-schema";
import {
  importLegacyProgress,
  readLearnerProgress,
  readAdaptiveAvailability,
} from "../../practice/server/learner-progress-persistence";
import { knowledgeSupportAttempts as attempts } from "./schema";
import { persistSupportStep, readSupportObservation } from "./persistence";

const testUrl = process.env.DATABASE_TEST_URL;
beforeAll(() => {
  if (testUrl) process.env.DATABASE_URL = testUrl;
});

describe.skipIf(!testUrl)("PostgreSQL Knowledge Support", () => {
  it("serializes retries, rejects replacements, and changes no Progress/adaptive/history facts", async () => {
    const learnerId = await createTestLearner(
      createHash("sha256").update(randomUUID()).digest("hex"),
    );
    const sessionId = randomUUID();
    await importLegacyProgress(learnerContext(learnerId), null);
    const beforeProgress = await readLearnerProgress(learnerContext(learnerId));
    const beforeAdaptive = await readAdaptiveAvailability(
      learnerContext(learnerId),
    );
    const [beforeLearner] = await getProgressDb()
      .select()
      .from(learners)
      .where(eq(learners.id, learnerId));
    const where = and(
      eq(attempts.learnerId, learnerId),
      eq(attempts.practiceSessionId, sessionId),
    );
    try {
      expect(
        await readSupportObservation(learnerContext(learnerId), sessionId),
      ).toBeNull();
      const diagnostics = await Promise.all([
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "diagnostic",
          "B",
          true,
        ),
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "diagnostic",
          "B",
          true,
        ),
      ]);
      expect(diagnostics[0]).toEqual(diagnostics[1]);
      await expect(
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "diagnostic",
          "C",
          true,
        ),
      ).rejects.toThrow("conflicts");
      await expect(
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "micro-check",
          "A",
        ),
      ).rejects.toThrow("lesson first");
      await persistSupportStep(
        learnerContext(learnerId),
        sessionId,
        "lesson",
        null,
      );
      const micros = await Promise.all([
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "micro-check",
          "A",
        ),
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "micro-check",
          "A",
        ),
      ]);
      expect(micros[0]).toEqual(micros[1]);
      const [beforeRetry] = await getProgressDb()
        .select()
        .from(attempts)
        .where(where);
      await persistSupportStep(
        learnerContext(learnerId),
        sessionId,
        "diagnostic",
        "B",
        true,
      );
      await persistSupportStep(
        learnerContext(learnerId),
        sessionId,
        "lesson",
        null,
      );
      await persistSupportStep(
        learnerContext(learnerId),
        sessionId,
        "micro-check",
        "A",
      );
      await expect(
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "micro-check",
          "D",
        ),
      ).rejects.toThrow("conflicts");
      expect(
        await getProgressDb().select().from(attempts).where(where),
      ).toEqual([beforeRetry]);
      expect(
        await readSupportObservation(learnerContext(learnerId), sessionId),
      ).toEqual(micros[0]);
      expect(await readLearnerProgress(learnerContext(learnerId))).toEqual(
        beforeProgress,
      );
      expect(await readAdaptiveAvailability(learnerContext(learnerId))).toEqual(
        beforeAdaptive,
      );
      expect(
        await getProgressDb()
          .select()
          .from(learners)
          .where(eq(learners.id, learnerId)),
      ).toEqual([beforeLearner]);
      expect(
        await getProgressDb()
          .select()
          .from(practiceFinishReceipts)
          .where(eq(practiceFinishReceipts.learnerId, learnerId)),
      ).toEqual([]);
      expect(
        await getProgressDb()
          .select()
          .from(practiceCompletedEpisodes)
          .where(eq(practiceCompletedEpisodes.learnerId, learnerId)),
      ).toEqual([]);
      const otherId = await createTestLearner(
        createHash("sha256").update(randomUUID()).digest("hex"),
      );
      try {
        expect(
          await readSupportObservation(learnerContext(otherId), sessionId),
        ).toBeNull();
      } finally {
        await getProgressDb().delete(learners).where(eq(learners.id, otherId));
      }
    } finally {
      await getProgressDb()
        .delete(attempts)
        .where(eq(attempts.learnerId, learnerId));
      await getProgressDb().delete(learners).where(eq(learners.id, learnerId));
    }
  });
  it("blocks lesson and micro-check after a correct diagnostic", async () => {
    const learnerId = await createTestLearner(
      createHash("sha256").update(randomUUID()).digest("hex"),
    );
    const sessionId = randomUUID();
    try {
      await persistSupportStep(
        learnerContext(learnerId),
        sessionId,
        "diagnostic",
        "A",
        true,
      );
      await expect(
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "lesson",
          null,
        ),
      ).rejects.toThrow("incorrect diagnostic");
      await expect(
        persistSupportStep(
          learnerContext(learnerId),
          sessionId,
          "micro-check",
          "A",
        ),
      ).rejects.toThrow("incorrect diagnostic");
    } finally {
      await getProgressDb()
        .delete(attempts)
        .where(eq(attempts.learnerId, learnerId));
      await getProgressDb().delete(learners).where(eq(learners.id, learnerId));
    }
  });
});

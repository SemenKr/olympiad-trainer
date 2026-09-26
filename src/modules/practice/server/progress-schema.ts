import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey().defaultRandom(),
  anonymousTokenHash: text("anonymous_token_hash").notNull().unique(),
  guaranteeEvidence: jsonb("guarantee_evidence").notNull(),
  impossibilityEvidence: jsonb("impossibility_evidence").notNull(),
  legacyImportHash: text("legacy_import_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const practiceFinishReceipts = pgTable(
  "practice_finish_receipts",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id),
    sessionId: uuid("session_id").notNull(),
    contributionHash: text("contribution_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.learnerId, table.sessionId] })],
);

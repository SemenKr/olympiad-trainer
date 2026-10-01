import {
  boolean,
  index,
  integer,
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
  enumerationEvidence: jsonb("enumeration_evidence").notNull(),
  legacyImportHash: text("legacy_import_hash"),
  brothersAgesAttempted: boolean("brothers_ages_attempted")
    .notNull()
    .default(false),
  brothersAgesSolutionExposed: boolean("brothers_ages_solution_exposed")
    .notNull()
    .default(false),
  parrotsAttempted: boolean("parrots_attempted").notNull().default(false),
  parrotsSolutionExposed: boolean("parrots_solution_exposed")
    .notNull()
    .default(false),
  pagesAttempted: boolean("pages_attempted").notNull().default(false),
  pagesSolutionExposed: boolean("pages_solution_exposed")
    .notNull()
    .default(false),
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
    episodeMode: text("episode_mode").$type<
      "core" | "transfer" | "exploration" | "pack"
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.learnerId, table.sessionId] })],
);

export const practiceCompletedEpisodes = pgTable(
  "practice_completed_episodes",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id),
    sessionId: uuid("session_id").notNull(),
    mode: text("mode")
      .$type<"core" | "transfer" | "exploration" | "pack">()
      .notNull(),
    episodeFacts: jsonb("episode_facts").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.learnerId, table.sessionId] }),
    index("practice_completed_episodes_recent_idx").on(
      table.learnerId,
      table.completedAt.desc(),
      table.sessionId.desc(),
    ),
  ],
);

export const practiceJourneyAwards = pgTable(
  "practice_journey_awards",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id),
    sessionId: uuid("session_id").notNull(),
    earnedXp: integer("earned_xp").notNull(),
    totalXp: integer("total_xp").notNull(),
    newlyReachedMilestone: text("newly_reached_milestone").$type<
      "Первый шаг" | "50 XP практики" | "100 XP практики" | null
    >(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.learnerId, table.sessionId] })],
);

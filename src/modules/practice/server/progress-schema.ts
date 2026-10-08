import type { PackId } from "../application/completed-practice-episode";
import { sql } from "drizzle-orm";

import {
  boolean,
  check,
  bigint,
  index,
  uniqueIndex,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const learners = pgTable(
  "learners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    anonymousTokenHash: text("anonymous_token_hash").notNull().unique(),
    recoveryCodeHash: text("recovery_code_hash").unique(),
    recoveryEnabledAt: timestamp("recovery_enabled_at", { withTimezone: true }),
    credentialGeneration: bigint("credential_generation", { mode: "bigint" })
      .notNull()
      .default(BigInt(0)),
    browserCredentialExpiresAt: timestamp("browser_credential_expires_at", {
      withTimezone: true,
    }).notNull(),
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
  },
  (table) => [
    check(
      "learners_recovery_pair",
      sql`(${table.recoveryCodeHash} IS NULL) = (${table.recoveryEnabledAt} IS NULL)`,
    ),
    check(
      "learners_recovery_hash",
      sql`${table.recoveryCodeHash} IS NULL OR ${table.recoveryCodeHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "learners_credential_generation_check",
      sql`${table.credentialGeneration} >= 0`,
    ),
  ],
);

export const learnerCredentialChanges = pgTable(
  "learner_credential_changes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    kind: text("kind")
      .$type<"enrollment" | "replacement" | "recovery">()
      .notNull(),
    pendingSecretHash: text("pending_secret_hash").notNull().unique(),
    expectedGeneration: bigint("expected_generation", {
      mode: "bigint",
    }).notNull(),
    successorCodeHash: text("successor_code_hash").notNull().unique(),
    recoveryAuthorityHash: text("recovery_authority_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp() + interval '10 minutes'`),
  },
  (table) => [
    index("learner_credential_changes_learner_idx").on(table.learnerId),
    index("learner_credential_changes_expiry_idx").on(table.expiresAt),
    check(
      "learner_credential_changes_kind_check",
      sql`${table.kind} IN ('enrollment', 'replacement', 'recovery')`,
    ),
    check(
      "learner_credential_changes_expected_generation_check",
      sql`${table.expectedGeneration} >= 0`,
    ),
    check(
      "learner_credential_changes_pending_secret_hash_check",
      sql`${table.pendingSecretHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "learner_credential_changes_successor_code_hash_check",
      sql`${table.successorCodeHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "learner_credential_changes_recovery_authority_hash_check",
      sql`${table.recoveryAuthorityHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "learner_credential_changes_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "learner_credential_changes_check1",
      sql`(${table.kind} = 'recovery') = (${table.recoveryAuthorityHash} IS NOT NULL)`,
    ),
  ],
);

export const identityRateLimitBuckets = pgTable(
  "identity_rate_limit_buckets",
  {
    bucketKey: text("bucket_key").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    attempts: integer("attempts").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.bucketKey, table.windowStart] }),
    index("identity_rate_limit_buckets_expiry_idx").on(table.expiresAt),
    check(
      "identity_rate_limit_buckets_bucket_key_check",
      sql`${table.bucketKey} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "identity_rate_limit_buckets_attempts_check",
      sql`${table.attempts} > 0`,
    ),
    check(
      "identity_rate_limit_buckets_check",
      sql`${table.expiresAt} > ${table.windowStart}`,
    ),
  ],
);

export const practiceFinishReceipts = pgTable(
  "practice_finish_receipts",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id),
    sessionId: uuid("session_id").notNull(),
    contributionHash: text("contribution_hash").notNull(),
    episodeMode: text("episode_mode").$type<
      "core" | "transfer" | "exploration" | "pack" | "review"
    >(),
    packId: text("pack_id").$type<PackId>(),
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
      .$type<"core" | "transfer" | "exploration" | "pack" | "review">()
      .notNull(),
    reviewSourceSessionId: uuid("review_source_session_id"),
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

// Reservations survive bounded history and keep provenance server-owned.
export const practiceReviewAssignments = pgTable(
  "practice_review_assignments",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id),
    sessionId: uuid("session_id").notNull(),
    reviewSourceSessionId: uuid("review_source_session_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.learnerId, table.sessionId] }),
    uniqueIndex("practice_review_assignments_source_idx").on(
      table.learnerId,
      table.reviewSourceSessionId,
    ),
  ],
);

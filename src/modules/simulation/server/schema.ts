import {
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  text,
} from "drizzle-orm/pg-core";
import { learners } from "../../practice/server/progress-schema";
import type { SimulationDrafts } from "../domain/simulation";

// Deliberately separate from Practice receipts, episodes, evidence and XP.
export const simulationAttempts = pgTable("simulation_attempts", {
  learnerId: uuid("learner_id")
    .primaryKey()
    .references(() => learners.id),
  sessionId: uuid("session_id").notNull().unique(),
  revision: integer("revision").notNull(),
  drafts: jsonb("drafts").$type<SimulationDrafts>().notNull(),
  selectedIndex: integer("selected_index").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  finishReason: text("finish_reason").$type<"early" | "timeout">(),
});

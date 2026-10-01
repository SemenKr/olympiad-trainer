import {
  boolean,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { learners } from "../../practice/server/progress-schema";
import type { OptionId, Outcome } from "../domain/knowledge-support";

export const knowledgeSupportAttempts = pgTable(
  "knowledge_support_attempts",
  {
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id),
    practiceSessionId: uuid("practice_session_id").notNull(),
    carrierProblemId: text("carrier_problem_id").notNull(),
    topicId: text("topic_id").notNull(),
    diagnosticSelectedOptionId: text("diagnostic_selected_option_id")
      .$type<OptionId>()
      .notNull(),
    diagnosticOutcome: text("diagnostic_outcome").$type<Outcome>().notNull(),
    lessonOpened: boolean("lesson_opened").notNull().default(false),
    microCheckSelectedOptionId: text(
      "micro_check_selected_option_id",
    ).$type<OptionId>(),
    microCheckOutcome: text("micro_check_outcome").$type<Outcome>(),
    diagnosticCompletedAt: timestamp("diagnostic_completed_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lessonOpenedAt: timestamp("lesson_opened_at", { withTimezone: true }),
    microCheckCompletedAt: timestamp("micro_check_completed_at", {
      withTimezone: true,
    }),
  },
  (table) => [
    primaryKey({
      columns: [table.learnerId, table.practiceSessionId, table.topicId],
    }),
  ],
);

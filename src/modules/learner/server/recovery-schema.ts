import "server-only";

import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// A credential-only projection of the EXISTING learner row, not another table
// or identity. Ordinary learner queries retain their 0012 mapping so the disabled
// feature can deploy before the separately authorized production migration.
export const recoveryLearners = pgTable(
  "learners",
  {
    id: uuid("id").primaryKey(),
    anonymousTokenHash: text("anonymous_token_hash").notNull(),
    credentialGeneration: bigint("credential_generation", {
      mode: "bigint",
    }).notNull(),
    browserCredentialExpiresAt: timestamp("browser_credential_expires_at", {
      withTimezone: true,
    }).notNull(),
    recoveryCodeHash: text("recovery_code_hash").unique(),
    recoveryEnabledAt: timestamp("recovery_enabled_at", { withTimezone: true }),
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

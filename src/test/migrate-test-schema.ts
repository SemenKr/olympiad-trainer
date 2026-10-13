import { readFile } from "node:fs/promises";
import type { Client } from "pg";
import plan from "../../db/migration-plan.json";

// Fresh fixtures follow one supported history, never every mutually exclusive SQL file.
export async function migrateTestSchema(
  client: Client,
  options: {
    contract?: boolean;
    skipRecovery?: boolean;
    afterMigration?: (name: string) => Promise<void>;
  } = {},
) {
  await client.query("BEGIN");
  try {
    for (const name of [
      ...plan.base,
      ...plan.expansion,
      ...(options.contract ? [plan.contract] : []),
    ]) {
      if (
        options.skipRecovery &&
        name === "0013_learner_recovery_credentials.sql"
      )
        continue;
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      await options.afterMigration?.(name);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

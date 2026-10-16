import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { runtimeDatabaseUrl } from "./database-environment.mjs";

let database: ReturnType<typeof drizzle> | null = null;

export function getProgressDb() {
  if (database) return database;
  const connectionString = runtimeDatabaseUrl(process.env);
  const pool = new Pool({ connectionString, max: 5 });
  if (process.env.VERCEL) attachDatabasePool(pool);
  database = drizzle({ client: pool });
  return database;
}

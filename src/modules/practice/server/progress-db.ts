import "server-only";

import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let database: ReturnType<typeof drizzle> | null = null;

export function getProgressDb() {
  if (database) return database;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const pool = new Pool({ connectionString, max: 5 });
  if (process.env.VERCEL) attachDatabasePool(pool);
  database = drizzle({ client: pool });
  return database;
}

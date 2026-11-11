import { createHash, randomUUID } from "node:crypto";
import pg from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { migrateTestSchema } from "../../../test/migrate-test-schema";

vi.mock("server-only", () => ({}));
const fixture = vi.hoisted(() => ({
  pool: null as pg.Pool | null,
  schema: "",
  database: "",
  tryWrite: false,
}));
// Test-only transport remapping: exercise the route's real SQL in an isolated
// schema/database, never connect to the pinned Neon host. This is not TLS/binding proof.
vi.mock("./progress-db", () => ({
  getProgressDb: () => ({
    $client: {
      connect: async () => {
        const client = await fixture.pool!.connect();
        return {
          query: async (config: { text: string; query_timeout: number }) => {
            if (fixture.tryWrite && config.text.startsWith("SELECT"))
              await client.query(
                `INSERT INTO "${fixture.schema}".schema_migrations VALUES ('forbidden')`,
              );
            return client.query({
              ...config,
              text: config.text
                .replaceAll("public.", `${fixture.schema}.`)
                .replaceAll(
                  "table_schema = 'public'",
                  `table_schema = '${fixture.schema}'`,
                )
                .replace(
                  "current_database() = 'neondb'",
                  `current_database() = '${fixture.database.replaceAll("'", "''")}'`,
                ),
            });
          },
          release: (destroy: boolean) => client.release(destroy),
        };
      },
    },
  }),
}));
import { POST } from "../../../app/api/internal/db-binding/route";

const connectionString = process.env.DATABASE_TEST_URL;
const suite = connectionString ? describe : describe.skip;
const token = Buffer.alloc(32, 11).toString("base64url");
function request() {
  return new Request(
    "https://diagnostic-fixture.vercel.app/api/internal/db-binding",
    {
      method: "POST",
      headers: {
        host: "diagnostic-fixture.vercel.app",
        authorization: `Bearer ${token}`,
        "x-db-binding-deployment-id": "dpl_fixture",
      },
    },
  );
}
suite("Production diagnostic SQL on disposable PostgreSQL", () => {
  beforeAll(async () => {
    fixture.schema = `binding_${randomUUID().replaceAll("-", "")}`;
    fixture.pool = new pg.Pool({ connectionString, max: 2 });
    fixture.database = (
      await fixture.pool.query("SELECT current_database() AS name")
    ).rows[0].name;
  });
  beforeEach(async () => {
    fixture.tryWrite = false;
    const now = Date.now();
    for (const [key, value] of Object.entries({
      VERCEL: "1",
      VERCEL_ENV: "production",
      VERCEL_DEPLOYMENT_ID: "dpl_fixture",
      VERCEL_URL: "diagnostic-fixture.vercel.app",
      DATABASE_URL:
        "postgresql://fixture:fixture@ep-green-breeze-b83kwqyf.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require",
      PGPORT: "",
      PGOPTIONS: "",
      DB_BINDING_DIAGNOSTIC_ISSUED_AT: new Date(now - 1000).toISOString(),
      DB_BINDING_DIAGNOSTIC_EXPIRES_AT: new Date(now + 60000).toISOString(),
      DB_BINDING_DIAGNOSTIC_TOKEN_SHA256: createHash("sha256")
        .update(token)
        .digest("hex"),
    }))
      vi.stubEnv(key, value);
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
      await client.query(`CREATE SCHEMA "${fixture.schema}"`);
      await client.query(`SET search_path TO "${fixture.schema}"`);
      await client.query(
        "CREATE TABLE schema_migrations (name text PRIMARY KEY)",
      );
      await migrateTestSchema(client, {
        afterMigration: async (name) => {
          await client.query("INSERT INTO schema_migrations VALUES ($1)", [
            name,
          ]);
        },
      });
    } finally {
      await client.end();
    }
  });
  afterEach(async () => {
    vi.unstubAllEnvs();
    await fixture.pool!.query(
      `DROP SCHEMA IF EXISTS "${fixture.schema}" CASCADE`,
    );
  });
  afterAll(async () => {
    await fixture.pool?.end();
  });

  it("accepts the migrated 0023 expanded schema without leaving a transaction open", async () => {
    const result = await POST(request());
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      ok: true,
      targetMatches: true,
      databaseMatches: true,
      migrationsMatch: true,
      schemaMatches: true,
    });
    const client = await fixture.pool!.connect();
    try {
      expect(
        (await client.query("SHOW transaction_read_only")).rows[0]
          .transaction_read_only,
      ).toBe("off");
    } finally {
      client.release();
    }
  });
  it.each([
    "0022_original_visual_pack_receipts.sql",
    "0023_pack_id_format.sql",
  ])("rejects missing marker %s", async (name) => {
    await fixture.pool!.query(
      `DELETE FROM "${fixture.schema}".schema_migrations WHERE name = $1`,
      [name],
    );
    const result = await POST(request());
    expect(result.status).toBe(503);
    expect((await result.json()).migrationsMatch).toBe(false);
  });
  it("rejects an unexpected contract marker", async () => {
    await fixture.pool!.query(
      `INSERT INTO "${fixture.schema}".schema_migrations VALUES ('0017_adaptive_compat_contract.sql')`,
    );
    expect((await POST(request())).status).toBe(503);
  });
  it.each([
    "CHECK (pack_id IS NULL OR char_length(pack_id) <= 64)",
    "CHECK (pack_id IS NULL OR (char_length(pack_id) BETWEEN 6 AND 64 AND pack_id ~ '^pack-[a-z0-9]+(-[a-z0-9]+)*$')) NOT VALID",
  ])("rejects weakened or unvalidated constraint %s", async (constraint) => {
    await fixture.pool!.query(
      `ALTER TABLE "${fixture.schema}".practice_finish_receipts DROP CONSTRAINT practice_finish_receipts_pack_id_check, ADD CONSTRAINT practice_finish_receipts_pack_id_check ${constraint}`,
    );
    const result = await POST(request());
    expect(result.status).toBe(503);
    expect((await result.json()).schemaMatches).toBe(false);
  });
  it("rejects missing compatibility schema despite all migration markers", async () => {
    await fixture.pool!.query(
      `ALTER TABLE "${fixture.schema}".learners DROP COLUMN brothers_ages_attempted CASCADE`,
    );
    expect((await POST(request())).status).toBe(503);
  });
  it("enforces read-only SQL and destroys the failed transaction connection", async () => {
    fixture.tryWrite = true;
    expect((await POST(request())).status).toBe(503);
    const rows = await fixture.pool!.query(
      `SELECT name FROM "${fixture.schema}".schema_migrations WHERE name = 'forbidden'`,
    );
    expect(rows.rowCount).toBe(0);
    fixture.tryWrite = false;
    expect((await POST(request())).status).toBe(200);
  });
});

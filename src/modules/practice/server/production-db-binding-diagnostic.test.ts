import { createHash } from "node:crypto";
import { IncomingMessage } from "node:http";
import { Socket } from "node:net";
import { NodeNextRequest } from "next/dist/server/base-http/node.js";
import { NextRequestAdapter } from "next/dist/server/web/spec-extension/adapters/next-request.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const transport = vi.hoisted(() => ({
  pool: vi.fn(),
  connect: vi.fn(),
  query: vi.fn(),
  release: vi.fn(),
  attach: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@vercel/functions", () => ({ attachDatabasePool: transport.attach }));
vi.mock("pg", () => ({
  Pool: class {
    constructor(options: unknown) {
      transport.pool(options);
    }
    connect = transport.connect;
  },
}));

const hostname = "diagnostic-unique.vercel.app";
const token = Buffer.alloc(32, 7).toString("base64url");
const databaseUrl =
  "postgresql://fixture:fixture@ep-green-breeze-b83kwqyf-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require";
const failed = {
  ok: false,
  targetMatches: false,
  databaseMatches: false,
  migration0021Present: false,
};
const passed = {
  ok: true,
  targetMatches: true,
  databaseMatches: true,
  migration0021Present: true,
};
let route: typeof import("../../../app/api/internal/db-binding/route");

function request(
  options: {
    method?: string;
    host?: string;
    path?: string;
    authorization?: string;
    deployment?: string;
    body?: string;
  } = {},
) {
  const host = options.host ?? hostname;
  return new Request(
    `https://${host}${options.path ?? "/api/internal/db-binding"}`,
    {
      method: options.method ?? "POST",
      headers: {
        host,
        authorization: options.authorization ?? `Bearer ${token}`,
        "x-db-binding-deployment-id": options.deployment ?? "dpl_fixture",
      },
      body: options.body,
    },
  );
}

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-19T12:01:00Z"));
  for (const [key, value] of Object.entries({
    VERCEL: "1",
    VERCEL_ENV: "production",
    VERCEL_DEPLOYMENT_ID: "dpl_fixture",
    VERCEL_URL: hostname,
    DB_BINDING_DIAGNOSTIC_ISSUED_AT: "2026-10-19T12:00:00Z",
    DB_BINDING_DIAGNOSTIC_EXPIRES_AT: "2026-10-19T12:10:00Z",
    DB_BINDING_DIAGNOSTIC_TOKEN_SHA256: createHash("sha256")
      .update(token)
      .digest("hex"),
    DATABASE_URL: databaseUrl,
    PGPORT: "",
    PGOPTIONS: "",
  }))
    vi.stubEnv(key, value);
  transport.connect.mockResolvedValue({
    query: transport.query,
    release: transport.release,
  });
  transport.query.mockResolvedValue({
    rows: [
      { read_only: true, database_matches: true, migration_0021_present: true },
    ],
  });
  route = await import("../../../app/api/internal/db-binding/route");
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("Production binding route through the actual app selector and pool (mock PostgreSQL transport)", () => {
  it("accepts a genuine Next-adapted zero-byte POST stream", async () => {
    const socket = new Socket();
    const incoming = new IncomingMessage(socket);
    const plain = request();
    incoming.method = "POST";
    incoming.url = plain.url;
    incoming.headers = Object.fromEntries(plain.headers);
    incoming.push(null);
    try {
      const adapted = NextRequestAdapter.fromNodeNextRequest(
        new NodeNextRequest(incoming),
        new AbortController().signal,
      );
      expect(adapted.body).not.toBeNull();
      expect((await route.POST(adapted)).status).toBe(200);
      expect(transport.pool).toHaveBeenCalledOnce();
    } finally {
      socket.destroy();
    }
  });

  function streamRequest(body: ReadableStream<Uint8Array>) {
    const plain = request();
    const init = {
      method: "POST",
      headers: plain.headers,
      body,
      duplex: "half",
    };
    return new Request(plain.url, init);
  }

  it("rejects body bytes even when Content-Length claims zero", async () => {
    const req = streamRequest(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array([1]));
          controller.close();
        },
      }),
    );
    req.headers.set("content-length", "0");
    expect((await route.POST(req)).status).toBe(404);
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it("bounds unfinished bodies even when their cancellation never resolves", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const req = streamRequest(new ReadableStream({ cancel }));
    const pending = route.POST(req);
    await vi.advanceTimersByTimeAsync(250);
    expect((await pending).status).toBe(404);
    expect(cancel).toHaveBeenCalledOnce();
    expect(req.body?.locked).toBe(false);
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it("fails closed on a body stream error without exposing it", async () => {
    const req = streamRequest(
      new ReadableStream({
        start(controller) {
          controller.error(new Error("sensitive detail"));
        },
      }),
    );
    const result = await route.POST(req);
    expect(result.status).toBe(404);
    expect(await result.json()).toEqual(failed);
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it("denies Preview before even inspecting an empty stream", async () => {
    const req = streamRequest(
      new ReadableStream({
        start(controller) {
          controller.close();
        },
      }),
    );
    const read = vi.spyOn(req.body!, "getReader");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await route.POST(req)).status).toBe(404);
    expect(read).not.toHaveBeenCalled();
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it("uses the application's selected connection and bounds a read-only transaction", async () => {
    const result = await route.POST(request());
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual(passed);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(transport.pool).toHaveBeenCalledWith({
      connectionString: databaseUrl,
      max: 5,
    });
    expect(transport.attach).toHaveBeenCalledOnce();
    const queries = transport.query.mock.calls.map(([query]) => query);
    expect(queries.map((query) => query.text)).toEqual([
      "BEGIN READ ONLY",
      "SET LOCAL statement_timeout = '2s'",
      "SET LOCAL lock_timeout = '500ms'",
      "SET LOCAL idle_in_transaction_session_timeout = '3s'",
      expect.stringContaining("current_database() = 'neondb'"),
      "ROLLBACK",
    ]);
    expect(queries[4].text).toContain(
      "0021_content_expansion_batch_2_pack_receipts.sql",
    );
    expect(queries[4].text).not.toMatch(/learner|INSERT|UPDATE|DELETE|COMMIT/i);
    expect(queries.every((query) => query.query_timeout === 2500)).toBe(true);
    expect(transport.release).toHaveBeenCalledExactlyOnceWith(false);
  });

  it.each(["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "DELETE"] as const)(
    "denies %s without connecting",
    async (method) => {
      expect((await route[method]()).status).toBe(405);
      expect(transport.pool).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["VERCEL", ""],
    ["VERCEL_ENV", "preview"],
    ["VERCEL_DEPLOYMENT_ID", ""],
    ["VERCEL_URL", "wrong.vercel.app"],
    ["DB_BINDING_DIAGNOSTIC_TOKEN_SHA256", ""],
    ["DB_BINDING_DIAGNOSTIC_TOKEN_SHA256", "0".repeat(64)],
    ["DB_BINDING_DIAGNOSTIC_ISSUED_AT", "invalid"],
    ["DB_BINDING_DIAGNOSTIC_ISSUED_AT", "2026-10-19T12:02:00Z"],
    ["DB_BINDING_DIAGNOSTIC_EXPIRES_AT", "2026-10-19T12:01:00Z"],
    ["DB_BINDING_DIAGNOSTIC_EXPIRES_AT", "2026-10-19T12:11:00Z"],
  ])("fails closed for %s=%s before pool construction", async (key, value) => {
    vi.stubEnv(key, value);
    const result = await route.POST(request());
    expect(result.status).toBe(404);
    expect(await result.json()).toEqual(failed);
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it.each([
    { authorization: "Bearer invalid" },
    { deployment: "dpl_other" },
    { host: "alias.vercel.app" },
    { path: "/api/internal/db-binding?probe=1" },
    { body: "ignored" },
  ])("rejects request mismatch %j before connecting", async (options) => {
    expect((await route.POST(request(options))).status).toBe(404);
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it.each([
    databaseUrl.replace("ep-green-breeze", "ep-other"),
    databaseUrl.replace("/neondb", "/other"),
    databaseUrl.replace("sslmode=require", "sslmode=disable"),
    `${databaseUrl}&sslmode=disable`,
    `${databaseUrl}&channel_binding=require&channel_binding=disable`,
    `${databaseUrl}&options=-csearch_path=other`,
    `${databaseUrl}&dbname=other`,
    `${databaseUrl}&host=other`,
    databaseUrl.replace("/neondb", ":5433/neondb"),
  ])(
    "rejects target/driver overrides before constructing the application pool",
    async (url) => {
      vi.stubEnv("DATABASE_URL", url);
      const result = await route.POST(request());
      expect(result.status).toBe(503);
      expect(await result.json()).toEqual(failed);
      expect(transport.pool).not.toHaveBeenCalled();
    },
  );

  it("checks installed pg's inherited port before the application can construct its pool", async () => {
    vi.stubEnv("PGPORT", "5433");
    // Exercise the installed driver parser, not the mocked transport, without connecting.
    const pg = await vi.importActual<typeof import("pg")>("pg");
    const client = new pg.Client({ connectionString: databaseUrl });
    expect(client.port).toBe(5433);
    const result = await route.POST(request());
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual(failed);
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it("rejects inherited PGOPTIONS before constructing its pool", async () => {
    vi.stubEnv("PGOPTIONS", "-c search_path=other");
    const pg = await vi.importActual<typeof import("pg")>("pg");
    const client = new pg.Client({ connectionString: databaseUrl });
    expect(client).toHaveProperty(
      "connectionParameters.options",
      "-c search_path=other",
    );
    const result = await route.POST(request());
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual(failed);
    expect(transport.pool).not.toHaveBeenCalled();
  });

  it.each([
    { port: "5432", explicit: false },
    { port: "5433", explicit: true },
  ])(
    "accepts only a driver-effective port5432: %j",
    async ({ port, explicit }) => {
      vi.stubEnv("PGPORT", port);
      const selected = explicit
        ? databaseUrl.replace("/neondb", ":5432/neondb")
        : databaseUrl;
      vi.stubEnv("DATABASE_URL", selected);
      const pg = await vi.importActual<typeof import("pg")>("pg");
      const client = new pg.Client({ connectionString: selected });
      expect(client.port).toBe(5432);
      expect((await route.POST(request())).status).toBe(200);
    },
  );

  it.each(["read_only", "database_matches", "migration_0021_present"])(
    "requires strict true for %s",
    async (key) => {
      transport.query.mockResolvedValue({
        rows: [
          {
            read_only: true,
            database_matches: true,
            migration_0021_present: true,
            [key]: false,
          },
        ],
      });
      const result = await route.POST(request());
      expect(result.status).toBe(503);
      const body = await result.json();
      expect(body.ok).toBe(false);
      expect(
        Object.values(body).every((value) => typeof value === "boolean"),
      ).toBe(true);
      expect(transport.release).toHaveBeenCalledExactlyOnceWith(false);
    },
  );

  it.each([0, 1, 2, 3, 4, 5])(
    "destroys uncertain transaction state on query %i failure without logging details",
    async (index) => {
      const log = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      transport.query.mockReset();
      for (let i = 0; i < index; i++)
        transport.query.mockResolvedValueOnce({ rows: [] });
      transport.query.mockRejectedValueOnce(
        new Error("sensitive connection and row details"),
      );
      const result = await route.POST(request());
      expect(result.status).toBe(503);
      expect(await result.json()).toEqual(failed);
      expect(transport.release).toHaveBeenCalledExactlyOnceWith(true);
      expect(log).not.toHaveBeenCalled();
      log.mockRestore();
    },
  );

  it("bounds acquisition and destroys a late client", async () => {
    let resolveClient!: (client: unknown) => void;
    transport.connect.mockReturnValue(
      new Promise((resolve) => {
        resolveClient = resolve;
      }),
    );
    const pending = route.POST(request());
    await vi.advanceTimersByTimeAsync(2000);
    expect((await pending).status).toBe(503);
    resolveClient({ release: transport.release });
    await Promise.resolve();
    expect(transport.release).toHaveBeenCalledExactlyOnceWith(true);
    expect(transport.query).not.toHaveBeenCalled();
  });
});

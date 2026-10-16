import { describe, expect, it } from "vitest";
import { runtimeDatabaseUrl } from "./database-environment.mjs";

const production = "postgresql://owner:secret@prod-pooler.example.net/neondb";
const preview = "postgresql://owner:secret@preview.example.net/neondb";

describe("runtime database environment", () => {
  it("uses the configured local or production database", () => {
    expect(runtimeDatabaseUrl({ DATABASE_URL: production })).toBe(production);
    expect(
      runtimeDatabaseUrl({
        VERCEL_ENV: "production",
        DATABASE_URL: production,
      }),
    ).toBe(production);
  });

  it("requires a dedicated Preview URL and never falls back to the shared URL", () => {
    expect(() =>
      runtimeDatabaseUrl({
        VERCEL_ENV: "preview",
        PREVIEW_DATABASE_URL: preview,
      }),
    ).toThrow("PRODUCTION_DATABASE_HOST is required");
    expect(() =>
      runtimeDatabaseUrl({
        VERCEL_ENV: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
      }),
    ).toThrow("PREVIEW_DATABASE_URL is required");
    expect(
      runtimeDatabaseUrl({
        VERCEL_ENV: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
        PREVIEW_DATABASE_URL: preview,
      }),
    ).toBe(preview);
  });

  it("rejects direct and pooled URLs for the same endpoint", () => {
    expect(() =>
      runtimeDatabaseUrl({
        VERCEL_ENV: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
        PREVIEW_DATABASE_URL:
          "postgresql://preview:other@prod.example.net/other",
      }),
    ).toThrow("distinct Neon endpoint");
    expect(() =>
      runtimeDatabaseUrl({
        VERCEL_ENV: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
        PREVIEW_DATABASE_URL:
          "postgresql://preview:other@prod.example.net./other",
      }),
    ).toThrow("distinct Neon endpoint");
  });

  it("rejects malformed URLs without exposing credential material", () => {
    expect(() =>
      runtimeDatabaseUrl({
        VERCEL_ENV: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
        PREVIEW_DATABASE_URL: "secret",
      }),
    ).toThrow("must be a PostgreSQL URL");
  });

  it("rejects driver query parameters that can override the URL endpoint", () => {
    for (const override of [
      "host=prod.example.net",
      "port=5433",
      "connectionString=postgresql%3A%2F%2Fowner%40prod.example.net%2Fneondb",
    ]) {
      expect(() =>
        runtimeDatabaseUrl({
          VERCEL_ENV: "preview",
          PRODUCTION_DATABASE_HOST: "prod.example.net",
          PREVIEW_DATABASE_URL: `${preview}?${override}`,
        }),
      ).toThrow("may not override its connection target");
    }
  });
});

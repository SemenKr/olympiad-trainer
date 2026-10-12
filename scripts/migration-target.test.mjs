import { describe, expect, it } from "vitest";
import { migrationTarget } from "./migration-target.mjs";

const local = "postgresql://owner:secret@127.0.0.1:5432/test";
const production = "postgresql://owner:secret@prod.example.net/neondb";
const preview = "postgresql://owner:secret@preview.example.net/neondb";

describe("migration target boundary", () => {
  it("allows the default target only on loopback", () => {
    expect(migrationTarget({ DATABASE_MIGRATION_URL: local }).target).toBe(
      "local",
    );
    expect(() =>
      migrationTarget({ DATABASE_MIGRATION_URL: production }),
    ).toThrow("loopback");
  });

  it("uses a separate direct Preview URL", () => {
    expect(() =>
      migrationTarget({
        MIGRATION_TARGET: "preview",
        PREVIEW_DATABASE_MIGRATION_URL: preview,
      }),
    ).toThrow("PRODUCTION_DATABASE_HOST is required");
    expect(
      migrationTarget({
        MIGRATION_TARGET: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
        PREVIEW_DATABASE_MIGRATION_URL: preview,
      }).connectionString,
    ).toBe(preview);
    expect(() =>
      migrationTarget({
        MIGRATION_TARGET: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
        PREVIEW_DATABASE_MIGRATION_URL: production,
      }),
    ).toThrow("distinct Neon endpoint");
    expect(() =>
      migrationTarget({
        MIGRATION_TARGET: "preview",
        PRODUCTION_DATABASE_HOST: "prod.example.net",
        PREVIEW_DATABASE_MIGRATION_URL:
          "postgresql://owner:secret@prod.example.net./neondb",
      }),
    ).toThrow("distinct Neon endpoint");
  });

  it("requires an exact production target and release evidence", () => {
    const env = {
      MIGRATION_TARGET: "production",
      DATABASE_MIGRATION_URL: production,
      PRODUCTION_DATABASE_HOST: "prod.example.net",
      PRODUCTION_DATABASE_NAME: "neondb",
    };
    expect(() => migrationTarget(env, { requireReleaseGate: true })).toThrow(
      "evidence IDs",
    );
    expect(
      migrationTarget(
        {
          ...env,
          RELEASE_RECOVERY_POINT_ID: "snapshot-1",
          RELEASE_WRITER_DENY_ID: "rule-1",
        },
        { requireReleaseGate: true },
      ).target,
    ).toBe("production");
    expect(() =>
      migrationTarget({
        ...env,
        PRODUCTION_DATABASE_HOST: "other.example.net",
      }),
    ).toThrow("does not match");
  });

  it("rejects driver query parameters that can override the migration endpoint", () => {
    for (const override of [
      "host=prod.example.net",
      "port=5433",
      "connectionString=postgresql%3A%2F%2Fowner%40prod.example.net%2Fneondb",
    ]) {
      expect(() =>
        migrationTarget({
          MIGRATION_TARGET: "preview",
          PRODUCTION_DATABASE_HOST: "prod.example.net",
          PREVIEW_DATABASE_MIGRATION_URL: `${preview}?${override}`,
        }),
      ).toThrow("may not override its connection target");
    }
  });
});

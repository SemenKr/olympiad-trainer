import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  settings: undefined as Record<string, unknown> | undefined,
  row: null as null | Record<string, unknown>,
  inserts: 0,
}));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      state.cookie === undefined ? undefined : { value: state.cookie },
    set: (_name: string, value: string, settings: Record<string, unknown>) => {
      state.cookie = value;
      state.settings = settings;
    },
  }),
}));
vi.mock("./progress-db", () => ({ getProgressDb: () => db }));
const queries = {
  select: () => ({
    from: () => ({
      where: () => {
        const rows = state.row
          ? [
              {
                ...state.row,
                learnerId: state.row.id,
                generation: state.row.credentialGeneration,
                valid:
                  (state.row.browserCredentialExpiresAt as Date).getTime() >
                  Date.now(),
              },
            ]
          : [];
        return Object.assign(Promise.resolve(rows), { for: async () => rows });
      },
    }),
  }),
  insert: () => ({
    values: async (row: Record<string, unknown>) => {
      state.inserts++;
      state.row = {
        id: "existing-learner",
        credentialGeneration: BigInt(0),
        ...row,
      };
    },
  }),
};
const db = {
  ...queries,
  transaction: async <T>(
    operation: (tx: typeof queries) => Promise<T>,
  ): Promise<T> => operation(queries),
};
import {
  initializeAnonymousLearner,
  resolveLearnerFromCookie,
  resolveExpectedLearnerFromCookie,
} from "./learner-identity";

beforeEach(() => {
  state.cookie = undefined;
  state.row = null;
  state.inserts = 0;
  state.settings = undefined;
});
describe("explicit anonymous identity boundary", () => {
  it("local context alone cannot authenticate; cookie and exact expected owner/generation are required", async () => {
    const expected = {
      learnerId: "00000000-0000-4000-8000-000000000001",
      generation: "0",
    };
    await expect(resolveExpectedLearnerFromCookie(expected)).rejects.toThrow(
      "identity is unavailable",
    );
    await initializeAnonymousLearner();
    state.row!.id = expected.learnerId;
    expect((await resolveExpectedLearnerFromCookie(expected)).learnerId).toBe(
      expected.learnerId,
    );
    await expect(
      resolveExpectedLearnerFromCookie({ ...expected, generation: "1" }),
    ).rejects.toThrow("identity is unavailable");
    await expect(
      resolveExpectedLearnerFromCookie({
        ...expected,
        learnerId: "00000000-0000-4000-8000-000000000002",
      }),
    ).rejects.toThrow("identity is unavailable");
    state.row!.credentialGeneration = BigInt(1);
    await expect(resolveExpectedLearnerFromCookie(expected)).rejects.toThrow(
      "identity is unavailable",
    );
    state.cookie = undefined;
    await expect(resolveExpectedLearnerFromCookie(expected)).rejects.toThrow(
      "identity is unavailable",
    );
    expect(state.inserts).toBe(1);
  });
  it("initializes once explicitly and resolves the same UUID without another insert", async () => {
    await initializeAnonymousLearner();
    const first = await resolveLearnerFromCookie();
    expect(first.learnerId).toBe("existing-learner");
    expect(first.tokenHash).toBe(
      createHash("sha256").update(state.cookie!).digest("hex"),
    );
    expect(state.cookie).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(state.settings).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 63072000,
    });
    await initializeAnonymousLearner();
    expect(await resolveLearnerFromCookie()).toEqual(first);
    expect(state.inserts).toBe(1);
  });
  it.each([undefined, "", "chosen-learner-id", "A".repeat(43)])(
    "normal resolution rejects missing/malformed/unknown %s without creation",
    async (cookie) => {
      state.cookie = cookie;
      await expect(resolveLearnerFromCookie()).rejects.toThrow(
        "identity is unavailable",
      );
      expect(state.inserts).toBe(0);
      expect(state.cookie).toBe(cookie);
    },
  );
  it.each(["", "invalid", "A".repeat(43)])(
    "explicit initialization cannot replace an existing invalid credential %s",
    async (cookie) => {
      state.cookie = cookie;
      await expect(initializeAnonymousLearner()).rejects.toThrow(
        "identity is unavailable",
      );
      expect(state.inserts).toBe(0);
      expect(state.cookie).toBe(cookie);
    },
  );
  it("rejects expired and rotated credentials without replacing them", async () => {
    await initializeAnonymousLearner();
    state.row!.browserCredentialExpiresAt = new Date(0);
    await expect(resolveLearnerFromCookie()).rejects.toThrow(
      "identity is unavailable",
    );
    state.row!.browserCredentialExpiresAt = new Date(Date.now() + 10000);
    state.row!.anonymousTokenHash = "rotated";
    await expect(resolveLearnerFromCookie()).rejects.toThrow(
      "identity is unavailable",
    );
    expect(state.inserts).toBe(1);
  });
});

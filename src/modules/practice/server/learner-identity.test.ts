import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieState = vi.hoisted(() => ({
  value: undefined as string | undefined,
  settings: undefined as Record<string, unknown> | undefined,
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => (cookieState.value ? { value: cookieState.value } : undefined),
    set: (_name: string, value: string, settings: Record<string, unknown>) => {
      cookieState.value = value;
      cookieState.settings = settings;
    },
  }),
}));
vi.mock("./learner-progress-persistence", () => ({
  findOrCreateLearner: vi.fn(async (hash: string) => hash),
}));

import { findOrCreateLearner } from "./learner-progress-persistence";
import { resolveLearnerFromCookie } from "./learner-identity";

beforeEach(() => {
  vi.clearAllMocks();
  cookieState.value = undefined;
  cookieState.settings = undefined;
});

describe("anonymous learner identity", () => {
  it("issues a high entropy private cookie and reuses the same hashed identity", async () => {
    const first = await resolveLearnerFromCookie();
    expect(cookieState.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cookieState.settings).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
    expect(first).not.toBe(cookieState.value);
    expect(await resolveLearnerFromCookie()).toBe(first);
    expect(findOrCreateLearner).toHaveBeenCalledTimes(2);
    expect(vi.mocked(findOrCreateLearner).mock.calls[0][0]).toBe(first);
  });

  it("replaces malformed cookies instead of treating them as learner IDs", async () => {
    cookieState.value = "chosen-learner-id";
    const id = await resolveLearnerFromCookie();
    expect(cookieState.value).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(id).not.toBe("chosen-learner-id");
  });
});

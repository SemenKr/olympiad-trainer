// Legacy ownership tests isolate the new IDB existence query; the native
// canonical rehearsal covers its real cross-context behavior.
vi.mock("./canonical-local-store", async (original) => ({
  ...(await original<typeof import("./canonical-local-store")>()),
  assertLegacyIdentityTransition: vi.fn(async () => {}),
}));
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { beforeEach, expect, it, vi } from "vitest";
import * as current from "./local-ownership";

// Both exact 5463382 and 2ccc420 use this identical Git blob. Keep frozen:
// a regression test must exercise the shipped guards, not an imitation.
function frozenModule(name: string, require?: (id: string) => unknown) {
  const source = readFileSync(
    new URL(`./__fixtures__/pre-v2-${name}.ts.txt`, import.meta.url),
    "utf8",
  );
  if (name === "local-ownership") {
    const hash = createHash("sha1")
      .update(`blob ${Buffer.byteLength(source)}\0`)
      .update(source)
      .digest("hex");
    expect(hash).toBe("601670dafeaff6fb4fed6861d46173b41df6e1d6");
  }
  const exports = {};
  runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    { exports, require, navigator, crypto },
  );
  return exports;
}
function oldTab() {
  const context = frozenModule("local-owner-context");
  return frozenModule("local-ownership", () => context) as typeof current;
}
const a = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "0",
};
const b = {
  learnerId: "00000000-0000-4000-8000-000000000002",
  generation: "0",
};
const keys = current.LEARNER_LOCAL_KEYS;
let store: Storage;
let data: Map<string, string>;
let held: Set<string>;
let locks: string[];
const bytes = () => [...data.entries()];
function seedLegacy() {
  store.setItem(
    current.LOCAL_OWNER_KEY,
    JSON.stringify({ owner: a, legacyOwner: a.learnerId }),
  );
  keys.forEach((key, i) =>
    store.setItem(
      current.ownerStorageKey(a, key),
      JSON.stringify({
        version: 1,
        owner: a,
        payload: `  {"slot":${i},"pending":"unchanged"}\n`,
      }),
    ),
  );
}
beforeEach(() => {
  current.suspendLocalLearner();
  data = new Map();
  held = new Set();
  locks = [];
  store = {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
  };
  vi.stubGlobal("navigator", {
    locks: {
      request: async (
        name: string,
        _options: unknown,
        callback: (lock: unknown) => unknown,
      ) => {
        locks.push(name);
        return callback(held.has(name) ? null : { name });
      },
    },
  });
});
it("fences every frozen-main/M1 read, write and removal, including empty slots after clearing", async () => {
  seedLegacy();
  const old = oldTab();
  await old.reconcileAuthenticatedLocalOwner(a, true, store);
  const stale = old.captureLearnerStorage();
  const originals = keys.map((key) => stale.getItem(key));
  await current.reconcileAuthenticatedLocalOwner(a, true, store);
  expect(locks.slice(-3)).toEqual([
    current.IDENTITY_LOCK,
    current.PRACTICE_LOCK,
    current.SIMULATION_LOCK,
  ]);
  const scoped = current.captureLearnerStorage();
  expect(keys.map((key) => scoped.getItem(key))).toEqual(originals);
  for (const clear of [false, true]) {
    if (clear) keys.forEach((key) => scoped.removeItem(key));
    const protectedBytes = bytes();
    for (const key of keys) {
      expect(() => stale.getItem(key)).toThrow();
      expect(() => stale.setItem(key, "old replacement")).toThrow();
      expect(() => stale.removeItem(key)).toThrow();
    }
    expect(() => stale.clear()).toThrow();
    expect(bytes()).toEqual(protectedBytes);
    await expect(
      oldTab().reconcileAuthenticatedLocalOwner(a, true, store),
    ).rejects.toThrow();
  }
  expect(scoped.length).toBe(0);
  expect(scoped.key(0)).toBeNull();
  expect(
    keys.every(
      (key) =>
        JSON.parse(store.getItem(current.ownerStorageKey(a, key))!).version ===
        2,
    ),
  ).toBe(true);
  current.suspendLocalLearner();
  await current.reconcileAuthenticatedLocalOwner(a, true, store);
  expect(current.captureLearnerStorage().length).toBe(0);
});
it.each([0, 1, 2, 3, 4, 5])(
  "resumes promotion after failure at slot %i without changing payload bytes",
  async (slot) => {
    seedLegacy();
    const original = keys.map(
      (key) =>
        JSON.parse(store.getItem(current.ownerStorageKey(a, key))!).payload,
    );
    const write = store.setItem;
    store.setItem = (key, value) => {
      if (key === current.ownerStorageKey(a, keys[slot])) throw Error("quota");
      write(key, value);
    };
    await expect(
      current.reconcileAuthenticatedLocalOwner(a, true, store),
    ).rejects.toThrow("quota");
    expect(() => current.captureLearnerStorage()).toThrow();
    if (slot > 0)
      await expect(
        oldTab().reconcileAuthenticatedLocalOwner(a, true, store),
      ).rejects.toThrow();
    const promoted = keys
      .slice(0, slot)
      .map((key) => store.getItem(current.ownerStorageKey(a, key)));
    store.setItem = write;
    await current.reconcileAuthenticatedLocalOwner(a, true, store);
    expect(
      keys.map((key) => current.captureLearnerStorage().getItem(key)),
    ).toEqual(original);
    expect(
      keys
        .slice(0, slot)
        .map((key) => store.getItem(current.ownerStorageKey(a, key))),
    ).toEqual(promoted);
  },
);
it("detects unconfirmed writes and missing protected slots without activating a lease", async () => {
  seedLegacy();
  const write = store.setItem;
  store.setItem = () => {};
  await expect(
    current.reconcileAuthenticatedLocalOwner(a, true, store),
  ).rejects.toThrow();
  expect(() => current.captureLearnerStorage()).toThrow();
  store.setItem = write;
  await current.reconcileAuthenticatedLocalOwner(a, true, store);
  const lease = current.captureLearnerStorage();
  data.delete(current.ownerStorageKey(a, keys[0]));
  expect(() => lease.getItem(keys[0])).toThrow();
  expect(() => lease.setItem(keys[0], "replacement")).toThrow();
});
it.each([
  current.IDENTITY_LOCK,
  current.PRACTICE_LOCK,
  current.SIMULATION_LOCK,
])("does not promote while %s is held", async (lock) => {
  seedLegacy();
  held.add(lock);
  const original = bytes();
  await expect(
    current.reconcileAuthenticatedLocalOwner(a, true, store),
  ).rejects.toThrow();
  expect(bytes()).toEqual(original);
  expect(() => current.captureLearnerStorage()).toThrow();
  held.clear();
  await current.reconcileAuthenticatedLocalOwner(a, true, store);
});
it.each([3, 0, "2"])(
  "preflights unsupported version %s without altering any slot",
  async (version) => {
    seedLegacy();
    store.setItem(
      current.ownerStorageKey(a, keys[5]),
      JSON.stringify({ version, owner: a, payload: "future" }),
    );
    const original = bytes();
    await expect(
      current.reconcileAuthenticatedLocalOwner(a, true, store),
    ).rejects.toThrow();
    expect(bytes()).toEqual(original);
  },
);
it.each([null, {}, 42])(
  "rejects malformed v1 payload %s without promoting",
  async (payload) => {
    seedLegacy();
    store.setItem(
      current.ownerStorageKey(a, keys[5]),
      JSON.stringify({ version: 1, owner: a, payload }),
    );
    const original = bytes();
    await expect(
      current.reconcileAuthenticatedLocalOwner(a, true, store),
    ).rejects.toThrow();
    expect(bytes()).toEqual(original);
  },
);
it("recovers the marker left by an old generation transition without downgrading envelopes", async () => {
  seedLegacy();
  const old = oldTab();
  await old.reconcileAuthenticatedLocalOwner(a, true, store);
  await current.reconcileAuthenticatedLocalOwner(a, true, store);
  const original = keys.map((key) =>
    current.captureLearnerStorage().getItem(key),
  );
  const target = { ...a, generation: "1" };
  await expect(
    old.transitionLocalIdentity(target, async () => target, store),
  ).rejects.toThrow();
  expect(store.getItem(current.IDENTITY_SWITCH_KEY)).not.toBeNull();
  await current.reconcileAuthenticatedLocalOwner(target, true, store);
  expect(store.getItem(current.IDENTITY_SWITCH_KEY)).toBeNull();
  expect(
    keys.map((key) => current.captureLearnerStorage().getItem(key)),
  ).toEqual(original);
  keys.forEach((key) =>
    expect(
      JSON.parse(store.getItem(current.ownerStorageKey(a, key))!),
    ).toMatchObject({ version: 2, owner: target }),
  );
});
it("old Start Fresh preserves the protected source and compatible recovery returns to it", async () => {
  seedLegacy();
  const old = oldTab();
  await old.reconcileAuthenticatedLocalOwner(a, true, store);
  await current.reconcileAuthenticatedLocalOwner(a, true, store);
  const original = keys.map((key) =>
    store.getItem(current.ownerStorageKey(a, key)),
  );
  await old.startFreshLocalIdentity(async () => b, store);
  expect(
    keys.map((key) => store.getItem(current.ownerStorageKey(a, key))),
  ).toEqual(original);
  current.suspendLocalLearner();
  await current.reconcileAuthenticatedLocalOwner(b, true, store);
  expect(current.captureLearnerStorage().length).toBe(0);
  await current.transitionRecoveredLocalIdentity(a, async () => a, store);
  expect(
    keys.map((key) => store.getItem(current.ownerStorageKey(a, key))),
  ).toEqual(original);
});
it("preserves unsupported envelopes during generation recovery and keeps its marker", async () => {
  await current.reconcileAuthenticatedLocalOwner(a, true, store);
  store.setItem(
    current.ownerStorageKey(a, keys[5]),
    JSON.stringify({ version: 3, owner: a, payload: "future" }),
  );
  const original = keys.map((key) =>
    store.getItem(current.ownerStorageKey(a, key)),
  );
  const target = { ...a, generation: "1" };
  await expect(
    current.transitionLocalIdentity(target, async () => target, store),
  ).rejects.toThrow();
  expect(
    keys.map((key) => store.getItem(current.ownerStorageKey(a, key))),
  ).toEqual(original);
  expect(store.getItem(current.IDENTITY_SWITCH_KEY)).not.toBeNull();
});
it.each([0, 1, 2, 3, 4, 5])(
  "resumes an interrupted empty namespace at slot %i",
  async (slot) => {
    const write = store.setItem;
    store.setItem = (key, value) => {
      if (key === current.ownerStorageKey(a, keys[slot])) throw Error("quota");
      write(key, value);
    };
    await expect(
      current.reconcileAuthenticatedLocalOwner(a, false, store),
    ).rejects.toThrow();
    expect(store.getItem(current.LOCAL_OWNER_KEY)).toBeNull();
    expect(() => current.captureLearnerStorage()).toThrow();
    store.setItem = write;
    await current.reconcileAuthenticatedLocalOwner(a, false, store);
    expect(current.captureLearnerStorage().length).toBe(0);
    keys.forEach((key) =>
      expect(
        JSON.parse(store.getItem(current.ownerStorageKey(a, key))!),
      ).toEqual({ version: 2, owner: a, payload: null }),
    );
  },
);
it.each([0, 1, 2, 3, 4, 5])(
  "resumes interrupted v2 generation rebinding at slot %i",
  async (slot) => {
    await current.reconcileAuthenticatedLocalOwner(a, false, store);
    current
      .captureLearnerStorage()
      .setItem(keys[4], "  immutable pending Finish\n");
    const target = { ...a, generation: "1" },
      write = store.setItem;
    store.setItem = (key, value) => {
      if (key === current.ownerStorageKey(a, keys[slot])) throw Error("quota");
      write(key, value);
    };
    await expect(
      current.transitionLocalIdentity(target, async () => target, store),
    ).rejects.toThrow();
    expect(() => current.captureLearnerStorage()).toThrow();
    expect(store.getItem(current.IDENTITY_SWITCH_KEY)).not.toBeNull();
    store.setItem = write;
    await current.reconcileAuthenticatedLocalOwner(target, true, store);
    expect(current.captureLearnerStorage().getItem(keys[4])).toBe(
      "  immutable pending Finish\n",
    );
    keys.forEach((key) =>
      expect(
        JSON.parse(store.getItem(current.ownerStorageKey(a, key))!),
      ).toMatchObject({ version: 2, owner: target }),
    );
  },
);
it("cannot promote without Web Locks", async () => {
  seedLegacy();
  const original = bytes();
  vi.stubGlobal("navigator", {});
  await expect(
    current.reconcileAuthenticatedLocalOwner(a, true, store),
  ).rejects.toThrow();
  expect(bytes()).toEqual(original);
  expect(() => current.captureLearnerStorage()).toThrow();
});
it("refuses a future cross-owner target without changing either namespace", async () => {
  await current.reconcileAuthenticatedLocalOwner(a, false, store);
  store.setItem(
    current.ownerStorageKey(b, keys[5]),
    JSON.stringify({ version: 3, owner: b, payload: "future target" }),
  );
  const owned = () => bytes().filter(([key]) => key.includes(":learner:"));
  const original = owned();
  await expect(
    current.transitionRecoveredLocalIdentity(b, async () => b, store),
  ).rejects.toThrow();
  expect(owned()).toEqual(original);
  expect(store.getItem(current.IDENTITY_SWITCH_KEY)).not.toBeNull();
});

import {
  isLocalLearnerOwner,
  sameLocalLearnerOwner,
  type LocalLearnerOwner,
} from "./local-owner-context";

export const CANONICAL_DB = "olympiad-trainer:learner-canonical-v1";
export const HANDOFF_KEY = "olympiad-trainer:canonical-handoff-v1";
const BINDING = "olympiad-trainer:local-owner-v1";
const SWITCH = "olympiad-trainer:identity-switch-v1";
const FRESH = "olympiad-trainer:start-fresh-v1";
export const CANONICAL_SLOTS = [
  "olympiad-trainer:practice-session",
  "olympiad-trainer:practice-latest-completed",
  "olympiad-trainer:progress-evidence-v0",
  "olympiad-trainer:practice-progress-finish-pending",
  "olympiad-trainer:practice-server-finish-request",
  "olympiad-trainer:simulation-pending-v0",
] as const;
type Slot = (typeof CANONICAL_SLOTS)[number];
type Source = { binding: string; envelopes: string[] };
export type CanonicalRecord = {
  version: 1;
  phase: "prepared" | "active";
  owner: LocalLearnerOwner;
  operationId: string;
  source: Source;
  payloads: Record<Slot, string | null>;
  revision: number;
  sessionId: string | null;
  operations: Record<string, string>;
};
export type PersistenceResult<T> =
  | { status: "ok"; value: T }
  | { status: "conflict" | "unavailable" | "handoff-required" };
export class CanonicalPersistenceError extends Error {
  constructor(
    public readonly status: "conflict" | "unavailable" | "handoff-required",
  ) {
    super(
      `Canonical learner persistence: ${status}. Saved bytes are preserved.`,
    );
    this.name = "CanonicalPersistenceError";
  }
}
function fail(status: "conflict" | "unavailable" | "handoff-required"): never {
  throw new CanonicalPersistenceError(status);
}
const physical = (owner: LocalLearnerOwner, key: string) =>
  `olympiad-trainer:learner:${owner.learnerId}:${key.slice("olympiad-trainer:".length)}`;
function source(storage: Storage, owner: LocalLearnerOwner): Source {
  if (storage.getItem(SWITCH) !== null || storage.getItem(FRESH) !== null)
    fail("conflict");
  const binding = storage.getItem(BINDING);
  if (!binding) fail("conflict");
  const parsed = JSON.parse(binding);
  if (
    !isLocalLearnerOwner(parsed?.owner) ||
    !sameLocalLearnerOwner(parsed.owner, owner) ||
    !(parsed.legacyOwner === null || typeof parsed.legacyOwner === "string")
  )
    fail("conflict");
  return {
    binding,
    envelopes: CANONICAL_SLOTS.map((k) => {
      const raw = storage.getItem(physical(owner, k));
      if (raw === null) fail("conflict");
      const envelope = JSON.parse(raw);
      if (
        envelope.version !== 2 ||
        !isLocalLearnerOwner(envelope.owner) ||
        !sameLocalLearnerOwner(envelope.owner, owner) ||
        !(envelope.payload === null || typeof envelope.payload === "string")
      )
        fail("conflict");
      return raw;
    }),
  };
}
const equal = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
function valid(value: unknown): asserts value is CanonicalRecord {
  const r = value as CanonicalRecord;
  if (
    !r ||
    r.version !== 1 ||
    !["prepared", "active"].includes(r.phase) ||
    !isLocalLearnerOwner(r.owner) ||
    typeof r.operationId !== "string" ||
    !r.operationId ||
    !Number.isSafeInteger(r.revision) ||
    r.revision < 0 ||
    !(r.sessionId === null || typeof r.sessionId === "string") ||
    !r.source ||
    typeof r.source.binding !== "string" ||
    !Array.isArray(r.source.envelopes) ||
    r.source.envelopes.length !== 6 ||
    !r.source.envelopes.every((x) => typeof x === "string") ||
    !r.payloads ||
    CANONICAL_SLOTS.some(
      (k) => !(r.payloads[k] === null || typeof r.payloads[k] === "string"),
    ) ||
    !r.operations ||
    typeof r.operations !== "object" ||
    Object.values(r.operations).some((x) => typeof x !== "string")
  )
    fail("unavailable");
  const binding = JSON.parse(r.source.binding);
  if (
    !isLocalLearnerOwner(binding?.owner) ||
    !sameLocalLearnerOwner(binding.owner, r.owner)
  )
    fail("unavailable");
  const originals = r.source.envelopes.map((raw) => {
    const envelope = JSON.parse(raw);
    if (
      envelope?.version !== 2 ||
      !isLocalLearnerOwner(envelope.owner) ||
      !sameLocalLearnerOwner(envelope.owner, r.owner) ||
      !(envelope.payload === null || typeof envelope.payload === "string")
    )
      fail("unavailable");
    return envelope.payload as string | null;
  });
  if (Array.isArray(r.operations)) fail("unavailable");
  if (
    r.phase === "prepared" &&
    (r.revision !== 0 ||
      r.sessionId !== null ||
      Object.keys(r.operations).length !== 0 ||
      CANONICAL_SLOTS.some((key, i) => r.payloads[key] !== originals[i]))
  )
    fail("unavailable");
  if (r.sessionId !== null) {
    const raw = r.payloads[CANONICAL_SLOTS[0]];
    if (
      raw === null ||
      JSON.parse(raw)?.sessionId !== r.sessionId ||
      !Object.hasOwn(r.operations, r.sessionId)
    )
      fail("unavailable");
  } else if (r.revision > 0 && r.payloads[CANONICAL_SLOTS[0]] !== null)
    fail("unavailable");
}
function witness(storage: Storage): string | null {
  const raw = storage.getItem(HANDOFF_KEY);
  if (raw === null) return null;
  const v = JSON.parse(raw);
  if (v?.version !== 1 || typeof v.operationId !== "string")
    fail("unavailable");
  return v.operationId;
}
async function open(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(CANONICAL_DB, 1);
    let settled = false;
    const timer = setTimeout(() => {
      settled = true;
      reject(new CanonicalPersistenceError("unavailable"));
    }, 2000);
    r.onupgradeneeded = () => {
      if (settled) r.transaction?.abort();
      else r.result.createObjectStore("learner");
    };
    r.onblocked = () => {
      settled = true;
      clearTimeout(timer);
      reject(new CanonicalPersistenceError("unavailable"));
    };
    r.onerror = () => {
      clearTimeout(timer);
      reject(new CanonicalPersistenceError("unavailable"));
    };
    r.onsuccess = () => {
      clearTimeout(timer);
      if (settled) {
        r.result.close();
        return;
      }
      r.result.onversionchange = () => r.result.close();
      resolve(r.result);
    };
  });
}
// No external await is permitted in this callback. Acknowledgement belongs to
// transaction completion, never request success. Each call uses one connection.
async function transaction<T>(
  factory: IDBFactory,
  operation: (record: CanonicalRecord | undefined) => {
    value: T;
    write?: CanonicalRecord;
  },
): Promise<T> {
  const db = await open(factory);
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction("learner", "readwrite", {
        durability: "strict",
      });
      const store = tx.objectStore("learner");
      let value: T;
      let error: unknown;
      const r = store.get("binding");
      r.onsuccess = () => {
        try {
          if (r.result !== undefined) valid(r.result);
          const result = operation(r.result);
          value = result.value;
          if (result.write) {
            valid(result.write);
            store.put(result.write, "binding");
          }
        } catch (caught) {
          error = caught;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(value);
      tx.onabort = () =>
        reject(error ?? new CanonicalPersistenceError("unavailable"));
      tx.onerror = () => {
        /* onabort is the only failure acknowledgement */
      };
    });
  } finally {
    db.close();
  }
}
async function outcome<T>(
  run: () => Promise<T>,
): Promise<PersistenceResult<T>> {
  try {
    return { status: "ok", value: await run() };
  } catch (e) {
    return {
      status: e instanceof CanonicalPersistenceError ? e.status : "unavailable",
    };
  }
}
export class CanonicalLocalStore {
  constructor(
    private readonly storage: Storage,
    private readonly factory: IDBFactory,
  ) {}
  private check(
    record: CanonicalRecord | undefined,
    owner: LocalLearnerOwner,
    active = true,
  ): CanonicalRecord {
    if (!record)
      fail(witness(this.storage) === null ? "handoff-required" : "unavailable");
    if (
      !sameLocalLearnerOwner(record.owner, owner) ||
      !equal(source(this.storage, owner), record.source)
    )
      fail("conflict");
    if (
      active &&
      (record.phase !== "active" ||
        witness(this.storage) !== record.operationId)
    )
      fail("handoff-required");
    return record;
  }
  read(owner: LocalLearnerOwner) {
    return outcome(() =>
      transaction(this.factory, (record) => ({
        value: this.check(record, owner),
      })),
    );
  }
  // Caller must hold the existing identity -> Practice -> Simulation barrier.
  // Confirmation is a user handoff, not a claim that frozen clients are fenced.
  migrate(owner: LocalLearnerOwner, confirmed: boolean) {
    return outcome(async () => {
      if (!confirmed) fail("handoff-required");
      if (!isLocalLearnerOwner(owner)) fail("conflict");
      const prepared = await transaction(this.factory, (record) => {
        if (record) return { value: this.check(record, owner, false) };
        if (witness(this.storage) !== null) fail("unavailable");
        const original = source(this.storage, owner);
        const payloads = Object.fromEntries(
          CANONICAL_SLOTS.map((key, i) => [
            key,
            JSON.parse(original.envelopes[i]).payload,
          ]),
        ) as Record<Slot, string | null>;
        const next: CanonicalRecord = {
          version: 1,
          phase: "prepared",
          owner,
          source: original,
          operationId: crypto.randomUUID(),
          payloads,
          revision: 0,
          sessionId: null,
          operations: {},
        };
        // Domain validation happens at the Practice boundary, never by inventing
        // session/completion facts from an opaque migrated payload.
        return { value: next, write: next };
      });
      const previous = witness(this.storage);
      if (previous !== null && previous !== prepared.operationId)
        fail("conflict");
      const raw = JSON.stringify({
        version: 1,
        operationId: prepared.operationId,
      });
      this.storage.setItem(HANDOFF_KEY, raw);
      if (this.storage.getItem(HANDOFF_KEY) !== raw) fail("unavailable");
      return transaction(this.factory, (record) => {
        const current = this.check(record, owner, false);
        if (current.operationId !== prepared.operationId) fail("conflict");
        const next = { ...current, phase: "active" as const };
        return { value: next, write: next };
      });
    });
  }
  mutate(
    owner: LocalLearnerOwner,
    expectedRevision: number,
    operation: (record: CanonicalRecord) => void,
  ) {
    return outcome(() =>
      transaction(this.factory, (record) => {
        const current = this.check(record, owner);
        if (
          current.revision !== expectedRevision ||
          current.revision === Number.MAX_SAFE_INTEGER
        )
          fail("conflict");
        const returned: unknown = operation(current);
        if (
          returned &&
          typeof (returned as { then?: unknown }).then === "function"
        )
          fail("unavailable");
        current.revision++;
        return { value: current, write: current };
      }),
    );
  }
}

type View = {
  client: CanonicalLocalStore;
  record: CanonicalRecord;
  storage: Storage;
};
const views = new WeakMap<Storage, View>();
let active: {
  client: CanonicalLocalStore;
  record: CanonicalRecord;
  storage: Storage;
} | null = null;
export function canonicalRequired(storage?: Storage) {
  const target =
    storage ?? (typeof window === "undefined" ? null : window.localStorage);
  return target?.getItem(HANDOFF_KEY) != null;
}
export function suspendCanonicalOwner() {
  active = null;
}
export async function prepareCanonicalOwner(
  owner: LocalLearnerOwner,
  storage: Storage = window.localStorage,
) {
  const client = new CanonicalLocalStore(storage, indexedDB);
  const result = await client.read(owner);
  if (result.status !== "ok")
    throw new CanonicalPersistenceError(result.status);
  active = { client, record: result.value, storage };
}
export async function confirmCanonicalHandoff(
  owner: LocalLearnerOwner,
  storage: Storage = window.localStorage,
) {
  const client = new CanonicalLocalStore(storage, indexedDB);
  const result = await client.migrate(owner, true);
  if (result.status !== "ok")
    throw new CanonicalPersistenceError(result.status);
  active = { client, record: result.value, storage };
}
export function captureCanonicalStorage(): Storage {
  if (!active) fail("unavailable");
  const context = active;
  const view: View = { ...context };
  const assert = () => {
    if (
      active !== context ||
      !equal(source(view.storage, view.record.owner), view.record.source) ||
      witness(view.storage) !== view.record.operationId
    )
      fail("conflict");
  };
  const storage: Storage = {
    get length() {
      assert();
      return CANONICAL_SLOTS.filter((k) => view.record.payloads[k] !== null)
        .length;
    },
    key(i) {
      assert();
      return (
        CANONICAL_SLOTS.filter((k) => view.record.payloads[k] !== null)[i] ??
        null
      );
    },
    getItem(k) {
      assert();
      if (!CANONICAL_SLOTS.includes(k as Slot)) fail("conflict");
      return view.record.payloads[k as Slot];
    },
    setItem() {
      fail("unavailable");
    },
    removeItem() {
      fail("unavailable");
    },
    clear() {
      fail("unavailable");
    },
  };
  views.set(storage, view);
  return storage;
}
export function isCanonicalStorage(storage: Storage) {
  return views.has(storage);
}
export async function refreshCanonicalStorage(storage: Storage) {
  const view = views.get(storage);
  if (!view) return;
  const result = await view.client.read(view.record.owner);
  if (result.status !== "ok")
    throw new CanonicalPersistenceError(result.status);
  // Calling getItem also verifies that this is still the active identity lease.
  storage.getItem(CANONICAL_SLOTS[0]);
  view.record = result.value;
}
export async function assertCanonicalStorageCurrent(storage: Storage) {
  const view = views.get(storage);
  if (!view) return;
  const result = await view.client.read(view.record.owner);
  if (result.status !== "ok")
    throw new CanonicalPersistenceError(result.status);
  storage.getItem(CANONICAL_SLOTS[0]);
  if (result.value.revision !== view.record.revision) fail("conflict");
}
export async function mutateCanonicalStorage<T>(
  storage: Storage,
  operation: (draft: Storage, record: CanonicalRecord) => T,
): Promise<T> {
  const view = views.get(storage);
  if (!view) fail("unavailable");
  storage.getItem(CANONICAL_SLOTS[0]);
  let value: T;
  const result = await view.client.mutate(
    view.record.owner,
    view.record.revision,
    (record) => {
      const draft: Storage = {
        get length() {
          return CANONICAL_SLOTS.filter((k) => record.payloads[k] !== null)
            .length;
        },
        key(i) {
          return (
            CANONICAL_SLOTS.filter((k) => record.payloads[k] !== null)[i] ??
            null
          );
        },
        getItem(k) {
          if (!CANONICAL_SLOTS.includes(k as Slot)) fail("conflict");
          return record.payloads[k as Slot];
        },
        setItem(k, v) {
          if (!CANONICAL_SLOTS.includes(k as Slot)) fail("conflict");
          record.payloads[k as Slot] = v;
        },
        removeItem(k) {
          if (!CANONICAL_SLOTS.includes(k as Slot)) fail("conflict");
          record.payloads[k as Slot] = null;
        },
        clear() {
          fail("conflict");
        },
      };
      value = operation(draft, record);
      if (value && typeof (value as { then?: unknown }).then === "function")
        fail("unavailable");
    },
  );
  if (result.status !== "ok")
    throw new CanonicalPersistenceError(result.status);
  storage.getItem(CANONICAL_SLOTS[0]);
  view.record = result.value;
  if (active && sameLocalLearnerOwner(active.record.owner, result.value.owner))
    active.record = result.value;
  return value!;
}

// Restore bypasses the learner gate. A stale localStorage view must not let a
// current client acknowledge an identity switch over an existing IDB binding.
export async function assertLegacyIdentityTransition(storage: Storage) {
  if (canonicalRequired(storage)) fail("conflict");
  if (typeof indexedDB === "undefined") fail("unavailable");
  const exists = await transaction(indexedDB, (record) => ({
    value: record !== undefined,
  }));
  if (exists || canonicalRequired(storage)) fail("conflict");
}

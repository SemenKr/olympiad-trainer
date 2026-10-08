import {
  isLocalLearnerOwner,
  sameLocalLearnerOwner,
  type LocalLearnerOwner,
} from "./local-owner-context";

export const IDENTITY_LOCK = "olympiad-trainer:identity-initialization";
export const PRACTICE_LOCK = "olympiad-trainer:practice-session-mutation";
export const SIMULATION_LOCK = "olympiad-trainer:simulation-editor";
export const LOCAL_OWNER_KEY = "olympiad-trainer:local-owner-v1";
export const IDENTITY_SWITCH_KEY = "olympiad-trainer:identity-switch-v1";
export const LEARNER_LOCAL_KEYS = [
  "olympiad-trainer:practice-session",
  "olympiad-trainer:practice-latest-completed",
  "olympiad-trainer:progress-evidence-v0",
  "olympiad-trainer:practice-progress-finish-pending",
  "olympiad-trainer:practice-server-finish-request",
  "olympiad-trainer:simulation-pending-v0",
] as const;

type Binding = { owner: LocalLearnerOwner; legacyOwner: string | null };
type SwitchMarker = {
  operationId: string;
  source: LocalLearnerOwner | null;
  target: LocalLearnerOwner;
};
type BoundSwitchMarker = SwitchMarker & { source: LocalLearnerOwner };
let active: {
  owner: LocalLearnerOwner;
  store: Storage;
  bindingRaw: string;
} | null = null;
export const LOCAL_IDENTITY_EVENT = "olympiad-trainer:local-identity-change";

function fail(): never {
  throw new Error(
    "Local learner ownership unavailable. Preserve saved work and reload.",
  );
}
function confirmedWrite(store: Storage, key: string, raw: string) {
  store.setItem(key, raw);
  if (store.getItem(key) !== raw) fail();
}
function readBinding(store: Storage): Binding | null {
  const raw = store.getItem(LOCAL_OWNER_KEY);
  if (raw === null) return null;
  const value = JSON.parse(raw) as Binding;
  if (
    !isLocalLearnerOwner(value?.owner) ||
    !(value.legacyOwner === null || typeof value.legacyOwner === "string")
  )
    fail();
  return value;
}
export function ownerStorageKey(owner: LocalLearnerOwner, key: string) {
  if (!LEARNER_LOCAL_KEYS.includes(key as (typeof LEARNER_LOCAL_KEYS)[number]))
    fail();
  return `olympiad-trainer:learner:${owner.learnerId}:${key.slice("olympiad-trainer:".length)}`;
}
function envelope(owner: LocalLearnerOwner, payload: string) {
  return JSON.stringify({ version: 1, owner, payload });
}
function readEnvelope(raw: string, owner: LocalLearnerOwner) {
  const value = JSON.parse(raw);
  if (
    value?.version !== 1 ||
    !isLocalLearnerOwner(value.owner) ||
    !sameLocalLearnerOwner(value.owner, owner) ||
    typeof value.payload !== "string"
  )
    fail();
  return value.payload as string;
}
function validateNamespace(store: Storage, owner: LocalLearnerOwner) {
  for (const key of LEARNER_LOCAL_KEYS) {
    const raw = store.getItem(ownerStorageKey(owner, key));
    if (raw !== null) readEnvelope(raw, owner);
  }
}
export function suspendLocalLearner(notify = false) {
  active = null;
  if (notify && typeof window !== "undefined")
    window.dispatchEvent(new Event(LOCAL_IDENTITY_EVENT));
}
export function currentLocalLearnerOwner(): LocalLearnerOwner {
  if (!active) fail();
  if (
    active.store.getItem(IDENTITY_SWITCH_KEY) !== null ||
    active.store.getItem(LOCAL_OWNER_KEY) !== active.bindingRaw
  )
    fail();
  return active.owner;
}
export function captureLearnerStorage(): Storage {
  const owner = currentLocalLearnerOwner();
  const lease = active!;
  const assert = () => {
    if (
      active !== lease ||
      !sameLocalLearnerOwner(currentLocalLearnerOwner(), owner)
    )
      fail();
  };
  return {
    get length() {
      assert();
      return LEARNER_LOCAL_KEYS.filter(
        (key) => lease.store.getItem(ownerStorageKey(owner, key)) !== null,
      ).length;
    },
    key(index) {
      assert();
      return (
        LEARNER_LOCAL_KEYS.filter(
          (key) => lease.store.getItem(ownerStorageKey(owner, key)) !== null,
        )[index] ?? null
      );
    },
    getItem(key) {
      assert();
      const raw = lease.store.getItem(ownerStorageKey(owner, key));
      return raw === null ? null : readEnvelope(raw, owner);
    },
    setItem(key, payload) {
      assert();
      const previous = lease.store.getItem(ownerStorageKey(owner, key));
      if (previous !== null) readEnvelope(previous, owner);
      confirmedWrite(
        lease.store,
        ownerStorageKey(owner, key),
        envelope(owner, payload),
      );
    },
    removeItem(key) {
      assert();
      const namespaced = ownerStorageKey(owner, key);
      const previous = lease.store.getItem(namespaced);
      if (previous !== null) readEnvelope(previous, owner);
      lease.store.removeItem(namespaced);
      if (lease.store.getItem(namespaced) !== null) fail();
    },
    clear() {
      fail();
    },
  };
}
export function hasLocalLearnerBytes(store: Storage) {
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (
      key?.startsWith("olympiad-trainer:") ||
      key?.startsWith("olympiad-trainer-")
    )
      return true;
  }
  return false;
}

export async function requestForLocalOwner<T>(
  request: (owner: LocalLearnerOwner) => Promise<T>,
): Promise<T> {
  const storage = captureLearnerStorage();
  const owner = currentLocalLearnerOwner();
  const result = await request(owner);
  storage.getItem(LEARNER_LOCAL_KEYS[0]);
  return result;
}

// Exclusive transitions never queue behind or steal a live editor. All operations
// acquire identity first; Practice mutation then Simulation editor follows it.
export async function withIdentityBarrier<T>(
  operation: () => Promise<T>,
): Promise<T> {
  if (!navigator.locks?.request) fail();
  return navigator.locks.request(
    IDENTITY_LOCK,
    { ifAvailable: true },
    (identity) => {
      if (!identity) fail();
      return navigator.locks.request(
        PRACTICE_LOCK,
        { ifAvailable: true },
        (practice) => {
          if (!practice) fail();
          return navigator.locks.request(
            SIMULATION_LOCK,
            { ifAvailable: true },
            (simulation) => {
              if (!simulation) fail();
              return operation();
            },
          );
        },
      );
    },
  );
}

export async function withLocalIdentityRead<T>(
  operation: () => Promise<T> | T,
): Promise<T> {
  if (!navigator.locks?.request) fail();
  const owner = currentLocalLearnerOwner();
  return navigator.locks.request(IDENTITY_LOCK, { mode: "shared" }, () => {
    if (!sameLocalLearnerOwner(currentLocalLearnerOwner(), owner)) fail();
    return operation();
  });
}

function rewriteGeneration(
  store: Storage,
  source: LocalLearnerOwner,
  target: LocalLearnerOwner,
) {
  for (const key of LEARNER_LOCAL_KEYS) {
    const namespaced = ownerStorageKey(source, key);
    const raw = store.getItem(namespaced);
    if (raw === null) continue;
    const parsed = JSON.parse(raw);
    // Resume an interrupted generation update deterministically.
    const payload = readEnvelope(
      raw,
      sameLocalLearnerOwner(parsed.owner, target) ? target : source,
    );
    confirmedWrite(store, namespaced, envelope(target, payload));
  }
}

function completeSwitch(
  store: Storage,
  marker: BoundSwitchMarker,
  authenticated: LocalLearnerOwner,
  binding: Binding,
) {
  if (!sameLocalLearnerOwner(authenticated, marker.target)) fail();
  if (marker.source.learnerId === authenticated.learnerId) {
    if (BigInt(authenticated.generation) < BigInt(marker.source.generation))
      fail();
    rewriteGeneration(store, marker.source, authenticated);
  } else {
    // A previously visited target may have its own older-generation namespace.
    // Never read or reassign the source namespace to populate it.
    for (const key of LEARNER_LOCAL_KEYS) {
      const namespaced = ownerStorageKey(authenticated, key);
      const previous = store.getItem(namespaced);
      if (previous === null) continue;
      const value = JSON.parse(previous);
      if (
        !isLocalLearnerOwner(value?.owner) ||
        value.owner.learnerId !== authenticated.learnerId ||
        BigInt(value.owner.generation) > BigInt(authenticated.generation)
      )
        fail();
      confirmedWrite(
        store,
        namespaced,
        envelope(authenticated, readEnvelope(previous, value.owner)),
      );
    }
  }
  const raw = JSON.stringify({ ...binding, owner: authenticated });
  confirmedWrite(store, LOCAL_OWNER_KEY, raw);
  store.removeItem(IDENTITY_SWITCH_KEY);
  if (store.getItem(IDENTITY_SWITCH_KEY) !== null) fail();
  active = { owner: authenticated, store, bindingRaw: raw };
}

// Recovery can begin before this browser has an authenticated owner binding.
// Unlike ordinary initialization, this path never imports origin-wide legacy
// bytes. Only an existing namespace for the recovered learner can be rebound.
function completeRecoveredSwitch(
  store: Storage,
  marker: SwitchMarker,
  authenticated: LocalLearnerOwner,
  binding: Binding | null,
) {
  if (!sameLocalLearnerOwner(authenticated, marker.target)) fail();
  if (binding) {
    if (!marker.source || !sameLocalLearnerOwner(marker.source, binding.owner))
      fail();
    completeSwitch(store, marker as BoundSwitchMarker, authenticated, binding);
    return;
  }

  validateNamespace(store, authenticated);
  for (const key of LEARNER_LOCAL_KEYS) {
    const namespaced = ownerStorageKey(authenticated, key);
    const raw = store.getItem(namespaced);
    if (raw === null) continue;
    const value = JSON.parse(raw);
    if (
      !isLocalLearnerOwner(value?.owner) ||
      value.owner.learnerId !== authenticated.learnerId ||
      BigInt(value.owner.generation) > BigInt(authenticated.generation)
    )
      fail();
    confirmedWrite(
      store,
      namespaced,
      envelope(authenticated, readEnvelope(raw, value.owner)),
    );
  }
  const raw = JSON.stringify({ owner: authenticated, legacyOwner: null });
  confirmedWrite(store, LOCAL_OWNER_KEY, raw);
  store.removeItem(IDENTITY_SWITCH_KEY);
  if (store.getItem(IDENTITY_SWITCH_KEY) !== null) fail();
  active = { owner: authenticated, store, bindingRaw: raw };
}

// The caller must obtain this context from a no-side-effect authenticated read.
// Legacy originals remain quarantined; migration copies their exact bytes once.
export async function reconcileAuthenticatedLocalOwner(
  owner: LocalLearnerOwner,
  preexistingCredential: boolean,
  store: Storage = window.localStorage,
) {
  if (!isLocalLearnerOwner(owner)) fail();
  const binding = readBinding(store);
  const markerRaw = store.getItem(IDENTITY_SWITCH_KEY);
  if (
    markerRaw !== null ||
    (binding && !sameLocalLearnerOwner(binding.owner, owner))
  )
    suspendLocalLearner();
  if (
    binding &&
    sameLocalLearnerOwner(binding.owner, owner) &&
    markerRaw === null
  ) {
    try {
      validateNamespace(store, owner);
    } catch (error) {
      suspendLocalLearner();
      throw error;
    }
    active = { owner, store, bindingRaw: store.getItem(LOCAL_OWNER_KEY)! };
    return;
  }
  await withIdentityBarrier(async () => {
    const latest = readBinding(store);
    const markerBytes = store.getItem(IDENTITY_SWITCH_KEY);
    if (markerBytes !== null) {
      const marker = JSON.parse(markerBytes) as SwitchMarker;
      if (
        (!latest && marker?.source !== null) ||
        (latest && marker?.source === null) ||
        !(marker?.source === null || isLocalLearnerOwner(marker?.source)) ||
        !isLocalLearnerOwner(marker?.target) ||
        typeof marker.operationId !== "string"
      )
        fail();
      if (
        marker.source &&
        sameLocalLearnerOwner(owner, marker.source) &&
        !sameLocalLearnerOwner(marker.source, marker.target)
      )
        fail();
      if (marker.source === null) {
        completeRecoveredSwitch(store, marker, owner, latest);
        return;
      }
      completeSwitch(store, marker as BoundSwitchMarker, owner, latest!);
      return;
    }
    if (latest) {
      if (
        latest.owner.learnerId !== owner.learnerId ||
        BigInt(owner.generation) < BigInt(latest.owner.generation)
      )
        fail();
      const marker = {
        operationId: crypto.randomUUID(),
        source: latest.owner,
        target: owner,
      };
      confirmedWrite(store, IDENTITY_SWITCH_KEY, JSON.stringify(marker));
      active = null;
      completeSwitch(store, marker as BoundSwitchMarker, owner, latest);
      return;
    }
    const legacy = LEARNER_LOCAL_KEYS.map(
      (key) => [key, store.getItem(key)] as const,
    );
    validateNamespace(store, owner);
    if (!preexistingCredential && legacy.some(([, raw]) => raw !== null))
      fail();
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (
        key?.startsWith("olympiad-trainer:learner:") &&
        !key.startsWith(`olympiad-trainer:learner:${owner.learnerId}:`)
      )
        fail();
    }
    for (const [key, payload] of legacy) {
      if (payload !== null) {
        // An envelope in an old key is already bound, not eligible legacy data.
        try {
          const candidate = JSON.parse(payload);
          if (candidate?.version === 1 && "owner" in candidate) fail();
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.startsWith("Local learner")
          )
            throw error;
        }
        const namespaced = ownerStorageKey(owner, key);
        const expected = envelope(owner, payload);
        const previous = store.getItem(namespaced);
        if (previous !== null && previous !== expected) fail();
        confirmedWrite(store, namespaced, expected);
      }
    }
    const raw = JSON.stringify({
      owner,
      legacyOwner: preexistingCredential ? owner.learnerId : null,
    });
    confirmedWrite(store, LOCAL_OWNER_KEY, raw);
    active = { owner, store, bindingRaw: raw };
  });
}

// Foundation only: no recovery/credential endpoint is invoked here. The supplied
// acknowledgement cannot run until marker durability and all editor locks pass.
export async function transitionLocalIdentity(
  target: LocalLearnerOwner,
  acknowledge: () => Promise<LocalLearnerOwner>,
  store: Storage = window.localStorage,
) {
  if (!isLocalLearnerOwner(target)) fail();
  return withIdentityBarrier(async () => {
    const source = currentLocalLearnerOwner();
    const binding = readBinding(store);
    if (
      !binding ||
      (source.learnerId === target.learnerId &&
        BigInt(target.generation) < BigInt(source.generation))
    )
      fail();
    const marker = { operationId: crypto.randomUUID(), source, target };
    confirmedWrite(store, IDENTITY_SWITCH_KEY, JSON.stringify(marker));
    suspendLocalLearner(true);
    const authenticated = await acknowledge();
    completeSwitch(store, marker, authenticated, binding);
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event(LOCAL_IDENTITY_EVENT));
  });
}

// The recovery code and pending server context are authority for this transition.
// Local bytes only select whether a same-owner namespace may be rebound; they
// never select the target learner and legacy unowned keys are left untouched.
export async function transitionRecoveredLocalIdentity(
  target: LocalLearnerOwner,
  acknowledge: () => Promise<LocalLearnerOwner>,
  store: Storage = window.localStorage,
) {
  if (!isLocalLearnerOwner(target)) fail();
  if (active) return transitionLocalIdentity(target, acknowledge, store);
  return withIdentityBarrier(async () => {
    const binding = readBinding(store);
    const marker: SwitchMarker = {
      operationId: crypto.randomUUID(),
      source: binding?.owner ?? null,
      target,
    };
    confirmedWrite(store, IDENTITY_SWITCH_KEY, JSON.stringify(marker));
    suspendLocalLearner(true);
    const authenticated = await acknowledge();
    completeRecoveredSwitch(store, marker, authenticated, binding);
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event(LOCAL_IDENTITY_EVENT));
  });
}

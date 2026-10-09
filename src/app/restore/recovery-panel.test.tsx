// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const identity = vi.hoisted(() => ({ read: vi.fn() }));
const ownership = vi.hoisted(() => ({
  reconcile: vi.fn(),
  transition: vi.fn(),
  recover: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));
vi.mock("../identity/actions", () => ({
  readAuthenticatedLearnerContext: identity.read,
}));
vi.mock("../../modules/learner/local-ownership", () => ({
  reconcileAuthenticatedLocalOwner: ownership.reconcile,
  transitionLocalIdentity: ownership.transition,
  transitionRecoveredLocalIdentity: ownership.recover,
}));

import { RecoveryPanel } from "./recovery-panel";

const owner = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "1",
};
const successor = `OTR1-${"A".repeat(43)}`;
const original = `OTR1-${"A".repeat(42)}Q`;
let root: Root;
let container: HTMLDivElement;
let fetchMock: ReturnType<typeof vi.fn>;
let steps: Array<{
  action: string;
  body: Record<string, unknown>;
  status?: number;
}>;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  steps = [];
  fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    expect(url).toBe("/api/identity/credentials");
    expect(init.method).toBe("POST");
    expect(init.cache).toBe("no-store");
    const input = JSON.parse(String(init.body)) as { action: string };
    const next = steps.shift();
    expect(input.action).toBe(next?.action);
    return new Response(JSON.stringify(next?.body), {
      status: next?.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  identity.read.mockResolvedValue(owner);
  ownership.transition.mockImplementation(
    async (_target: unknown, acknowledge: () => Promise<unknown>) =>
      acknowledge(),
  );
  ownership.recover.mockImplementation(
    async (_target: unknown, acknowledge: () => Promise<unknown>) =>
      acknowledge(),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function render(enabled = true) {
  await act(async () => root.render(<RecoveryPanel enabled={enabled} />));
}

function button(label: string) {
  const match = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === label,
  );
  if (!match) throw new Error(`Missing button: ${label}`);
  return match;
}

async function click(label: string) {
  await act(async () => button(label).click());
}

function enter(inputId: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`#${inputId}`);
  if (!input) throw new Error(`Missing input: ${inputId}`);
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("Russian Recovery v1 panel", () => {
  it("enrolls through successor re-entry and the same-owner transition barrier", async () => {
    steps.push(
      {
        action: "status-authenticated",
        body: { ok: true, enabled: false },
      },
      {
        action: "enrollment",
        body: { ok: true, operationId: "op-1", code: successor },
      },
      {
        action: "context-authenticated",
        body: { ok: true, operationId: "op-1", target: owner },
      },
      { action: "confirm-authenticated", body: { ok: true } },
    );
    await render();
    await click("Сохранить доступ");
    expect(container.textContent).toContain(successor);
    expect(container.textContent).toContain("вне этого браузера");
    await act(async () => enter("recovery-confirmation", successor));
    await click("Подтвердить");
    expect(ownership.transition).toHaveBeenCalledOnce();
    expect(ownership.reconcile).toHaveBeenCalledWith(owner, true);
    expect(ownership.reconcile.mock.invocationCallOrder[0]).toBeLessThan(
      ownership.transition.mock.invocationCallOrder[0],
    );
    expect(ownership.recover).not.toHaveBeenCalled();
    expect(navigation.replace).toHaveBeenCalledWith("/progress");
    expect(steps).toHaveLength(0);
    expect(localStorage.length).toBe(0);
    expect(window.location.href).not.toContain(successor);
    expect(
      fetchMock.mock.calls.every(
        ([url]) => url === "/api/identity/credentials",
      ),
    ).toBe(true);
  });

  it("recovers a lost-cookie browser without creating a replacement learner", async () => {
    steps = [
      {
        action: "status-authenticated",
        status: 400,
        body: { ok: false, error: "unavailable" },
      },
      {
        action: "recovery",
        body: { ok: true, operationId: "op-2", code: successor },
      },
      {
        action: "context-recovery",
        body: { ok: true, operationId: "op-2", target: owner },
      },
      { action: "confirm-recovery", body: { ok: true } },
    ];
    await render();
    expect(container.textContent).toContain("Восстановить доступ");
    await act(async () => enter("recovery-code", original));
    await click("Продолжить");
    expect(container.textContent).toContain(successor);
    await act(async () => enter("recovery-confirmation", successor));
    await click("Подтвердить");
    expect(ownership.recover).toHaveBeenCalledOnce();
    expect(ownership.transition).not.toHaveBeenCalled();
    expect(identity.read).toHaveBeenCalledOnce();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Новый код заменил старый");
    expect(container.textContent).not.toContain(successor);
    expect(container.querySelector("input")).toBeNull();
    expect(document.activeElement).toBe(container.querySelector("h1"));
    await click("К истории");
    expect(navigation.replace).toHaveBeenCalledWith("/progress");
    expect(steps).toHaveLength(0);
    expect(localStorage.length).toBe(0);
    expect(window.location.href).not.toContain(original);
    expect(window.location.href).not.toContain(successor);
  });

  it("copying is only a step toward saving; replacement still requires the saved copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    steps.push(
      { action: "status-authenticated", body: { ok: true, enabled: true } },
      {
        action: "replacement",
        body: { ok: true, operationId: "op-4", code: successor },
      },
      {
        action: "context-authenticated",
        body: { ok: true, operationId: "op-4", target: owner },
      },
      { action: "confirm-authenticated", body: { ok: true } },
    );
    await render();
    expect(container.textContent).toContain("Восстановление настроено");
    expect(container.textContent).not.toContain("Код уже сохранён");
    await click("Заменить код");
    expect(container.querySelectorAll("ol li")).toHaveLength(3);
    expect(container.textContent).toContain("Код не нужно запоминать");
    await click("Скопировать код");
    expect(writeText).toHaveBeenCalledWith(successor);
    expect(container.querySelector("[role=status]")?.textContent).toContain(
      "Теперь сохрани",
    );
    expect(ownership.transition).not.toHaveBeenCalled();
    await act(async () => enter("recovery-confirmation", original));
    await click("Подтвердить");
    expect(container.querySelector("[role=alert]")).not.toBeNull();
    expect(document.activeElement).toBe(container.querySelector("h1"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    writeText.mockRejectedValueOnce(new Error("denied"));
    await click("Скопировать код");
    expect(container.querySelector("[role=status]")?.textContent).toContain(
      "Не удалось скопировать",
    );
    await act(async () => enter("recovery-confirmation", successor));
    await click("Подтвердить");
    expect(ownership.transition).toHaveBeenCalledOnce();
    expect(navigation.replace).toHaveBeenCalledWith("/progress");
    expect(steps).toHaveLength(0);
  });

  it("cancel leaves the old credential state alone and never confirms", async () => {
    steps.push(
      {
        action: "status-authenticated",
        body: { ok: true, enabled: false },
      },
      {
        action: "enrollment",
        body: { ok: true, operationId: "op-3", code: successor },
      },
      { action: "cancel", body: { ok: true } },
    );
    await render();
    await click("Сохранить доступ");
    await click("Отменить");
    expect(container.textContent).toContain("Настройки доступа не изменились.");
    expect(container.textContent).not.toContain(successor);
    expect(steps).toHaveLength(0);
    expect(ownership.transition).not.toHaveBeenCalled();
  });

  it("shows no Recovery controls while the explicit feature gate is disabled", async () => {
    await render(false);
    expect(container.textContent).toContain("сейчас недоступны");
    expect(container.textContent).not.toContain("Восстановить доступ");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

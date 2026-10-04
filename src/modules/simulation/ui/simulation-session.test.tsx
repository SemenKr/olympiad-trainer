// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../../../app/simulation/actions", () => ({
  readSimulation: vi.fn(),
  startSimulation: vi.fn(),
  saveSimulation: vi.fn(),
  finishSimulation: vi.fn(),
  readSimulationReferences: vi.fn(),
}));
import {
  readSimulation,
  startSimulation,
  saveSimulation,
  finishSimulation,
  readSimulationReferences,
} from "../../../app/simulation/actions";
import {
  newSimulation,
  updateSimulation,
  expireSimulation,
  SIMULATION_PROBLEM_IDS,
  type SimulationAttempt,
} from "../domain/simulation";
import { SimulationSession } from "./simulation-session";
import {
  storeSimulationDraft,
  SIMULATION_PENDING_KEY,
} from "./simulation-storage";
const id = "00000000-0000-4000-8000-000000000001";
const problems = SIMULATION_PROBLEM_IDS.map((problemId, index) => ({
  problemId,
  title: `Title ${index + 1}`,
  statement: `Statement ${index + 1}`,
  options: [],
}));
let server: SimulationAttempt | null;
let root: Root;
let host: HTMLDivElement;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({
    toFake: [
      "Date",
      "performance",
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
    ],
  });
  vi.setSystemTime(1000);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  localStorage.clear();
  server = null;
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: vi.fn((_name, _options, callback) =>
        callback({ name: "editor" }),
      ),
    },
  });
  vi.mocked(readSimulation).mockImplementation(async () => ({
    attempt: server ? expireSimulation(server, Date.now()) : null,
    serverNow: Date.now(),
  }));
  vi.mocked(startSimulation).mockImplementation(async () => ({
    attempt: (server ??= newSimulation(id, Date.now())),
    serverNow: Date.now(),
  }));
  vi.mocked(saveSimulation).mockImplementation(async (_id, revision, work) => {
    server = updateSimulation(
      server!,
      revision as number,
      work as SimulationAttempt,
      Date.now(),
      false,
      false,
    );
    return { attempt: server, serverNow: Date.now() };
  });
  vi.mocked(finishSimulation).mockImplementation(
    async (_id, revision, work, confirmed) => {
      server = updateSimulation(
        server!,
        revision as number,
        work as SimulationAttempt,
        Date.now(),
        true,
        confirmed === true,
      );
      return { attempt: server, serverNow: Date.now() };
    },
  );
  vi.mocked(readSimulationReferences).mockResolvedValue(
    SIMULATION_PROBLEM_IDS.map((problemId) => ({
      problemId,
      text: "PROTECTED REFERENCE",
    })),
  );
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function mount() {
  await act(async () => root.render(<SimulationSession problems={problems} />));
}
function button(label: string) {
  const control = [...host.querySelectorAll("button")].find((element) =>
    element.textContent?.includes(label),
  );
  if (!control) throw new Error(`Missing button: ${label}`);
  return control;
}
async function click(label: string) {
  await act(async () => button(label).click());
}
async function type(value: string) {
  const editor = host.querySelector("textarea")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(editor, value);
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function advance(ms: number) {
  await act(async () => vi.advanceTimersByTimeAsync(ms));
}

describe("student simulation flow", () => {
  it("starts explicitly, exposes all four tasks, persists reasoning and freely navigates", async () => {
    await mount();
    expect(startSimulation).not.toHaveBeenCalled();
    await click("Начать");
    expect(host.querySelector('[role="timer"]')?.textContent).toBe("45:00");
    expect(host.querySelectorAll("nav button")).toHaveLength(4);
    await type("my first reasoning");
    await advance(300);
    expect(server?.drafts[0]).toBe("my first reasoning");
    await click("Задача 4");
    await type("last reasoning");
    await click("Задача 1");
    expect(host.querySelector("textarea")?.value).toBe("my first reasoning");
    expect(localStorage.getItem(SIMULATION_PENDING_KEY)).toContain(
      "last reasoning",
    );
    expect(readSimulationReferences).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain("PROTECTED REFERENCE");
    expect(host.querySelector("textarea")?.labels?.[0].textContent).toBe(
      "Твой ответ и ход решения",
    );
  });
  it("reload/resume restores unsent drafts, selected task and elapsed time", async () => {
    server = newSimulation(id, 1000);
    storeSimulationDraft({
      ...server,
      drafts: ["", "local reasoning", "", ""],
      selectedIndex: 1,
    });
    vi.setSystemTime(61000);
    await mount();
    expect(host.querySelector("textarea")?.value).toBe("local reasoning");
    expect(host.querySelector('[aria-current="step"]')?.textContent).toContain(
      "Задача 2",
    );
    expect(host.querySelector('[role="timer"]')?.textContent).toBe("44:00");
    await advance(300);
    expect(server?.drafts[1]).toBe("local reasoning");
  });
  it("requires confirmation and lets the student cancel before immutable Finish", async () => {
    await mount();
    await click("Начать");
    await type("submitted proof");
    await advance(300);
    await click("Завершить раньше");
    expect(finishSimulation).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(button("Продолжить работу"));
    await click("Продолжить работу");
    expect(finishSimulation).not.toHaveBeenCalled();
    await click("Завершить раньше");
    await click("Да, завершить");
    expect(finishSimulation).toHaveBeenCalledWith(
      id,
      expect.any(Number),
      expect.objectContaining({ drafts: ["submitted proof", "", "", ""] }),
      true,
    );
    expect(host.querySelector("textarea")).toBeNull();
    expect(host.textContent).toContain("submitted proof");
    expect(document.activeElement?.textContent).toBe("Работа завершена");
    expect(host.textContent).toContain("PROTECTED REFERENCE");
  });
  it("timeout finishes without confirmation, freezes work and unlocks references", async () => {
    server = newSimulation(id, 1000);
    server = { ...server, drafts: ["saved proof", "", "", ""] };
    vi.setSystemTime(server.deadlineAt - 1000);
    await mount();
    await advance(1000);
    expect(server?.finishReason).toBe("timeout");
    expect(host.textContent).toContain("Время вышло — работа завершена");
    expect(host.textContent).toContain("saved proof");
    expect(host.querySelector("textarea")).toBeNull();
    expect(readSimulationReferences).toHaveBeenCalledWith(id);
  });
  it("keeps failed saves locally and provides a working retry", async () => {
    await mount();
    await click("Начать");
    vi.mocked(saveSimulation).mockRejectedValueOnce(new Error("offline"));
    await type("offline draft");
    await advance(300);
    expect(host.querySelector('[role="alert"]')?.textContent).toContain(
      "Не удалось сохранить",
    );
    expect(localStorage.getItem(SIMULATION_PENDING_KEY)).toContain(
      "offline draft",
    );
    await click("Повторить сохранение");
    expect(server?.drafts[0]).toBe("offline draft");
    expect(host.textContent).toContain("Все черновики сохранены");
  });
  it("recovers a lost save response with newer typing and completes confirmed Finish", async () => {
    await mount();
    await click("Начать");
    const save = vi.mocked(saveSimulation).getMockImplementation()!;
    vi.mocked(saveSimulation).mockImplementationOnce(async (...args) => {
      await save(...args);
      throw new Error("response lost after commit");
    });
    await type("first draft");
    await advance(300);
    expect(server?.drafts[0]).toBe("first draft");
    await type("newer reasoning");
    await click("Завершить раньше");
    await click("Да, завершить");
    await advance(300);
    expect(server?.finishedAt).not.toBeNull();
    expect(server?.drafts[0]).toBe("newer reasoning");
    expect(host.textContent).toContain("PROTECTED REFERENCE");
  });
  it("the visible timer uses elapsed monotonic time instead of the browser wall clock", async () => {
    await mount();
    await click("Начать");
    vi.setSystemTime(-60000);
    await advance(1000);
    expect(host.querySelector('[role="timer"]')?.textContent).toBe("44:59");
  });
  it("a second tab cannot bypass the editor lock by retrying restore", async () => {
    vi.mocked(navigator.locks.request).mockImplementation(
      async (_name, _options, callback) => callback!(null),
    );
    await mount();
    expect(host.textContent).toContain("другой вкладке");
    expect(readSimulation).not.toHaveBeenCalled();
    expect(host.querySelector("textarea")).toBeNull();
  });
});

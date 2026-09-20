import { describe, expect, it, vi } from "vitest";

import {
  createShortNumericAnswerState,
  editShortNumericAnswer,
  runShortNumericAnswerSubmission,
  type ShortNumericAnswerState,
} from "./short-numeric-answer-state";

function createGate() {
  return { current: false };
}

async function submit(
  state: ShortNumericAnswerState,
  result: "invalid" | "incorrect" | "correct",
) {
  return runShortNumericAnswerSubmission({
    state,
    gate: createGate(),
    submit: async () =>
      result === "invalid"
        ? { status: "invalid" }
        : { status: result, normalizedAnswer: state.rawAnswer },
    onPending: () => undefined,
  });
}

describe("short numeric answer interaction", () => {
  it("does not record invalid input as an attempt", async () => {
    const typing = editShortNumericAnswer(
      createShortNumericAnswerState(),
      "12,5",
    );
    const result = await submit(typing, "invalid");

    expect(result).toMatchObject({ status: "invalid", rawAnswer: "12,5" });
    expect(result?.practice.submissions).toEqual([]);
  });

  it("preserves an incorrect attempt while editing and retrying", async () => {
    const firstDraft = editShortNumericAnswer(
      createShortNumericAnswerState(),
      "16",
    );
    const incorrect = await submit(firstDraft, "incorrect");

    expect(incorrect?.practice.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
    ]);

    const retryDraft = editShortNumericAnswer(incorrect!, "17");

    expect(retryDraft.status).toBe("typing");
    expect(retryDraft.practice.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
    ]);

    const correct = await submit(retryDraft, "correct");

    expect(correct?.practice.submissions).toEqual([
      { answer: "16", outcome: "incorrect" },
      { answer: "17", outcome: "correct" },
    ]);
  });

  it("records a correct submission", async () => {
    const typing = editShortNumericAnswer(
      createShortNumericAnswerState(),
      "17",
    );
    const result = await submit(typing, "correct");

    expect(result).toMatchObject({ status: "correct", rawAnswer: "17" });
    expect(result?.practice.submissions).toEqual([
      { answer: "17", outcome: "correct" },
    ]);
  });

  it("shows system feedback without recording an attempt when the action rejects", async () => {
    const typing = editShortNumericAnswer(
      createShortNumericAnswerState(),
      "17",
    );
    const result = await runShortNumericAnswerSubmission({
      state: typing,
      gate: createGate(),
      submit: async () => {
        throw new Error("Action unavailable");
      },
      onPending: () => undefined,
    });

    expect(result).toMatchObject({ status: "system", rawAnswer: "17" });
    expect(result?.practice.submissions).toEqual([]);
  });

  it("enters loading immediately and ignores a duplicate submission", async () => {
    let resolveAction!: (value: {
      status: "incorrect";
      normalizedAnswer: string;
    }) => void;
    const action = vi.fn(
      () =>
        new Promise<{
          status: "incorrect";
          normalizedAnswer: string;
        }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const gate = createGate();
    const typing = editShortNumericAnswer(
      createShortNumericAnswerState(),
      "16",
    );
    let pendingState: ShortNumericAnswerState | null = null;

    const firstSubmission = runShortNumericAnswerSubmission({
      state: typing,
      gate,
      submit: action,
      onPending: (state) => {
        pendingState = state;
      },
    });

    expect(pendingState).toMatchObject({ status: "loading" });

    const duplicate = await runShortNumericAnswerSubmission({
      state: pendingState!,
      gate,
      submit: action,
      onPending: () => undefined,
    });

    expect(duplicate).toBeNull();
    expect(action).toHaveBeenCalledTimes(1);

    resolveAction({ status: "incorrect", normalizedAnswer: "16" });

    await expect(firstSubmission).resolves.toMatchObject({
      status: "incorrect",
    });
  });
});

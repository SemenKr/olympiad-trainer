"use client";

import { useEffect, useState } from "react";

import { LOCAL_IDENTITY_EVENT } from "../../../modules/learner/local-ownership";
import {
  readVerifiedPracticeSessionSnapshot,
  type UnfinishedPracticeSessionSnapshot,
} from "../../../modules/practice/ui/practice-session-storage";
import { LearningPathGuideLoader } from "../../../modules/practice/ui/learning-path";
import { verifyPersistedReasoningCheckpointObservation } from "../actions";

export function UnfinishedPracticeContext() {
  const [state, setState] = useState<
    | { status: "loading" | "error" }
    | { status: "ready"; snapshot: UnfinishedPracticeSessionSnapshot | null }
  >({ status: "loading" });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    let readId = 0;
    const read = async () => {
      const id = ++readId;
      setState({ status: "loading" });
      try {
        const { value } = await readVerifiedPracticeSessionSnapshot(
          verifyPersistedReasoningCheckpointObservation,
        );
        if (active && id === readId)
          setState({ status: "ready", snapshot: value });
      } catch {
        if (active && id === readId) setState({ status: "error" });
      }
    };
    const refresh = () => void read();
    queueMicrotask(() => {
      if (active) refresh();
    });
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(LOCAL_IDENTITY_EVENT, refresh);
    return () => {
      active = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(LOCAL_IDENTITY_EVENT, refresh);
    };
  }, [retry]);

  return (
    <LearningPathGuideLoader
      unfinished={state}
      retryUnfinished={() => setRetry((value) => value + 1)}
    />
  );
}

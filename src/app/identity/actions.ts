"use server";

import { cookies } from "next/headers";
import {
  LEARNER_COOKIE_NAME,
  initializeAnonymousLearner,
  resolveLearnerFromCookie,
} from "../../modules/practice/server/learner-identity";
import { LearnerIdentityUnavailable } from "../../modules/practice/server/learner-auth";
import type { LocalLearnerOwner } from "../../modules/learner/local-owner-context";

export async function readLearnerIdentityStatus(): Promise<
  "available" | "missing" | "unavailable"
> {
  if ((await cookies()).get(LEARNER_COOKIE_NAME) === undefined)
    return "missing";
  try {
    await resolveLearnerFromCookie();
    return "available";
  } catch (error) {
    if (error instanceof LearnerIdentityUnavailable) return "unavailable";
    throw error;
  }
}

export async function initializeFreshAnonymousLearner(): Promise<void> {
  await initializeAnonymousLearner();
}

export async function readAuthenticatedLearnerContext(): Promise<
  LocalLearnerOwner | "missing" | "unavailable"
> {
  if ((await cookies()).get(LEARNER_COOKIE_NAME) === undefined)
    return "missing";
  try {
    const context = await resolveLearnerFromCookie();
    return {
      learnerId: context.learnerId,
      generation: context.generation.toString(),
    };
  } catch (error) {
    if (error instanceof LearnerIdentityUnavailable) return "unavailable";
    throw error;
  }
}

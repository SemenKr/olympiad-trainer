import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { findOrCreateLearner } from "./learner-progress-persistence";

export const LEARNER_COOKIE_NAME = "olympiad-trainer-learner-v1";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export async function resolveLearnerFromCookie(): Promise<string> {
  const jar = await cookies();
  const stored = jar.get(LEARNER_COOKIE_NAME)?.value;
  const token =
    stored && TOKEN_PATTERN.test(stored)
      ? stored
      : randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const learnerId = await findOrCreateLearner(tokenHash);
  if (stored !== token) {
    jar.set(LEARNER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 2,
    });
  }
  return learnerId;
}

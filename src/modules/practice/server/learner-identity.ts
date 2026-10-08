import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getProgressDb } from "./progress-db";
import { learners } from "./progress-schema";
import { emptyGuaranteeProgressEvidence } from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";
import { emptyEnumerationProgressEvidence } from "../application/enumeration-progress-evidence";
import {
  isLocalLearnerOwner,
  type LocalLearnerOwner,
} from "../../learner/local-owner-context";
import {
  LearnerIdentityUnavailable,
  withAuthenticatedLearner,
  type AuthenticatedLearner,
} from "./learner-auth";

export const LEARNER_COOKIE_NAME = "olympiad-trainer-learner-v1";
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const LIFETIME_SECONDS = 60 * 60 * 24 * 365 * 2;

export async function resolveLearnerFromCookie(): Promise<AuthenticatedLearner> {
  const stored = (await cookies()).get(LEARNER_COOKIE_NAME)?.value;
  if (!stored || !TOKEN_PATTERN.test(stored))
    throw new LearnerIdentityUnavailable();
  const tokenHash = createHash("sha256").update(stored).digest("hex");
  const [row] = await getProgressDb()
    .select({
      learnerId: learners.id,
      generation: learners.credentialGeneration,
    })
    .from(learners)
    .where(eq(learners.anonymousTokenHash, tokenHash));
  if (!row) throw new LearnerIdentityUnavailable();
  const context = { ...row, tokenHash };
  return withAuthenticatedLearner(context, async () => context);
}

export async function resolveExpectedLearnerFromCookie(
  expected: LocalLearnerOwner,
): Promise<AuthenticatedLearner> {
  const authenticated = await resolveLearnerFromCookie();
  if (
    !isLocalLearnerOwner(expected) ||
    expected.learnerId !== authenticated.learnerId ||
    expected.generation !== authenticated.generation.toString()
  )
    throw new LearnerIdentityUnavailable();
  return authenticated;
}

// Called only by the explicit fresh-browser boundary, never by learning operations.
export async function initializeAnonymousLearner(): Promise<void> {
  const jar = await cookies();
  if (jar.get(LEARNER_COOKIE_NAME) !== undefined) {
    await resolveLearnerFromCookie();
    return;
  }
  const token = randomBytes(32).toString("base64url");
  await getProgressDb()
    .insert(learners)
    .values({
      anonymousTokenHash: createHash("sha256").update(token).digest("hex"),
      browserCredentialExpiresAt: new Date(
        Date.now() + LIFETIME_SECONDS * 1000,
      ),
      guaranteeEvidence: emptyGuaranteeProgressEvidence(),
      impossibilityEvidence: emptyImpossibilityProgressEvidence(),
      enumerationEvidence: emptyEnumerationProgressEvidence(),
    });
  jar.set(LEARNER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LIFETIME_SECONDS,
  });
}

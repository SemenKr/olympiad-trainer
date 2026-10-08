import "server-only";

import { createHash } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getProgressDb } from "../../practice/server/progress-db";
import {
  learnerCredentialChanges,
  learners,
} from "../../practice/server/progress-schema";
import {
  withAuthenticatedLearner,
  type AuthenticatedLearner,
} from "../../practice/server/learner-auth";
import {
  BROWSER_LIFETIME_SECONDS,
  generateBearerSecret,
  generateRecoveryCode,
  isPendingSecret,
  isRecoveryCode,
  pendingSecretHash,
  recoveryCodeHash,
} from "./recovery-secrets";
import { limitCredentialAttempts } from "./identity-rate-limit";
import { recoveryLearners } from "./recovery-schema";

type Kind = (typeof learnerCredentialChanges.$inferSelect)["kind"];
type Transaction = Parameters<
  Parameters<ReturnType<typeof getProgressDb>["transaction"]>[0]
>[0];

export class CredentialChangeUnavailable extends Error {
  constructor() {
    super("Credential change is unavailable.");
  }
}

// Caller already holds the shared learner-row lock through the Identity Boundary.
async function lockedCredentials(tx: Transaction, learnerId: string) {
  const [credentials] = await tx
    .select()
    .from(recoveryLearners)
    .where(eq(recoveryLearners.id, learnerId));
  if (!credentials) throw new CredentialChangeUnavailable();
  return credentials;
}

async function insertPending(
  tx: Transaction,
  learner: typeof recoveryLearners.$inferSelect,
  kind: Kind,
) {
  const [{ count }] = await tx
    .select({ count: sql<number>`count(*)::int` })
    .from(learnerCredentialChanges)
    .where(
      and(
        eq(learnerCredentialChanges.learnerId, learner.id),
        sql`${learnerCredentialChanges.expiresAt} > clock_timestamp()`,
      ),
    );
  if (count >= 3) throw new CredentialChangeUnavailable();
  const code = generateRecoveryCode();
  const secret = generateBearerSecret();
  const [pending] = await tx
    .insert(learnerCredentialChanges)
    .values({
      learnerId: learner.id,
      kind,
      pendingSecretHash: pendingSecretHash(secret),
      expectedGeneration: learner.credentialGeneration,
      successorCodeHash: recoveryCodeHash(code),
      recoveryAuthorityHash:
        kind === "recovery" ? learner.recoveryCodeHash : null,
      createdAt: sql`clock_timestamp()`,
      expiresAt: sql`clock_timestamp() + interval '10 minutes'`,
    })
    .returning({ operationId: learnerCredentialChanges.id });
  // Recovery start discloses no owner/history. Later UI must verify its saved
  // successor through pendingTransitionContext before entering the local barrier.
  return { ...pending, code, secret };
}

export async function startAuthenticatedCredentialChange(
  context: AuthenticatedLearner,
  kind: "enrollment" | "replacement",
) {
  await limitCredentialAttempts("authenticated-start", context.learnerId);
  return withAuthenticatedLearner(context, async (tx, learner) => {
    const credentials = await lockedCredentials(tx, learner.id);
    if ((kind === "enrollment") !== (credentials.recoveryCodeHash === null))
      throw new CredentialChangeUnavailable();
    return insertPending(tx, credentials, kind);
  });
}

export async function readRecoveryCredentialStatus(
  context: AuthenticatedLearner,
) {
  return withAuthenticatedLearner(context, async (tx, learner) => {
    const credentials = await lockedCredentials(tx, learner.id);
    return { enabled: credentials.recoveryCodeHash !== null };
  });
}

export async function startRecovery(code: string) {
  if (!isRecoveryCode(code)) throw new CredentialChangeUnavailable();
  const hash = recoveryCodeHash(code);
  await limitCredentialAttempts("recovery-start-code", hash);
  return getProgressDb().transaction(async (tx) => {
    const [learner] = await tx
      .select()
      .from(recoveryLearners)
      .where(eq(recoveryLearners.recoveryCodeHash, hash))
      .for("update");
    if (!learner) throw new CredentialChangeUnavailable();
    return insertPending(tx, learner, "recovery");
  });
}

async function findPending(secret: string) {
  if (!isPendingSecret(secret)) throw new CredentialChangeUnavailable();
  const [pending] = await getProgressDb()
    .select()
    .from(learnerCredentialChanges)
    .where(
      eq(learnerCredentialChanges.pendingSecretHash, pendingSecretHash(secret)),
    );
  if (!pending) throw new CredentialChangeUnavailable();
  return pending;
}

async function recheckPending(
  tx: Transaction,
  secret: string,
  code: string,
  learner: typeof recoveryLearners.$inferSelect,
  kind: Kind,
) {
  const [pending] = await tx
    .select()
    .from(learnerCredentialChanges)
    .where(
      and(
        eq(
          learnerCredentialChanges.pendingSecretHash,
          pendingSecretHash(secret),
        ),
        eq(learnerCredentialChanges.learnerId, learner.id),
        sql`${learnerCredentialChanges.expiresAt} > clock_timestamp()`,
      ),
    );
  if (
    !pending ||
    pending.kind !== kind ||
    pending.expectedGeneration !== learner.credentialGeneration ||
    pending.successorCodeHash !== recoveryCodeHash(code) ||
    (kind === "recovery" &&
      pending.recoveryAuthorityHash !== learner.recoveryCodeHash)
  )
    throw new CredentialChangeUnavailable();
  return pending;
}

async function applySuccessor(
  tx: Transaction,
  learner: typeof recoveryLearners.$inferSelect,
  pending: typeof learnerCredentialChanges.$inferSelect,
  token?: string,
) {
  await tx
    .update(recoveryLearners)
    .set({
      recoveryCodeHash: pending.successorCodeHash,
      recoveryEnabledAt: learner.recoveryEnabledAt ?? sql`clock_timestamp()`,
      credentialGeneration: learner.credentialGeneration + BigInt(1),
      ...(token
        ? {
            anonymousTokenHash: createHash("sha256")
              .update(token)
              .digest("hex"),
            browserCredentialExpiresAt: sql`clock_timestamp() + ${BROWSER_LIFETIME_SECONDS} * interval '1 second'`,
          }
        : {}),
    })
    .where(eq(recoveryLearners.id, learner.id));
  await tx
    .delete(learnerCredentialChanges)
    .where(eq(learnerCredentialChanges.learnerId, learner.id));
  return {
    learnerId: learner.id,
    generation: (learner.credentialGeneration + BigInt(1)).toString(),
  };
}

export async function confirmCredentialChange(
  secret: string,
  code: string,
  context?: AuthenticatedLearner,
) {
  if (!isRecoveryCode(code) || !isPendingSecret(secret))
    throw new CredentialChangeUnavailable();
  await limitCredentialAttempts("confirm-secret", pendingSecretHash(secret));
  const pending = await findPending(secret);
  await limitCredentialAttempts("confirm-learner", pending.learnerId);
  if (context && pending.kind === "recovery")
    throw new CredentialChangeUnavailable();
  if (pending.kind !== "recovery") {
    if (!context || context.learnerId !== pending.learnerId)
      throw new CredentialChangeUnavailable();
    return withAuthenticatedLearner(context, async (tx, learner) => {
      const credentials = await lockedCredentials(tx, learner.id);
      const current = await recheckPending(
        tx,
        secret,
        code,
        credentials,
        pending.kind,
      );
      return { owner: await applySuccessor(tx, credentials, current) };
    });
  }
  return getProgressDb().transaction(async (tx) => {
    const [learner] = await tx
      .select()
      .from(recoveryLearners)
      .where(eq(recoveryLearners.id, pending.learnerId))
      .for("update");
    if (!learner) throw new CredentialChangeUnavailable();
    const current = await recheckPending(tx, secret, code, learner, "recovery");
    const browserToken = generateBearerSecret();
    const owner = await applySuccessor(tx, learner, current, browserToken);
    return { owner, browserToken };
  });
}

// This narrow context is not learning authority. The caller must re-read normal
// browser identity after confirmation. Re-entry guards pending-cookie disclosure.
export async function pendingTransitionContext(
  secret: string,
  code: string,
  context?: AuthenticatedLearner,
) {
  if (!isRecoveryCode(code) || !isPendingSecret(secret))
    throw new CredentialChangeUnavailable();
  await limitCredentialAttempts("confirm-secret", pendingSecretHash(secret));
  const pending = await findPending(secret);
  await limitCredentialAttempts("confirm-learner", pending.learnerId);
  if (context && pending.kind === "recovery")
    throw new CredentialChangeUnavailable();
  const operation = async (tx: Transaction, learner: { id: string }) => {
    const credentials = await lockedCredentials(tx, learner.id);
    await recheckPending(tx, secret, code, credentials, pending.kind);
    return {
      operationId: pending.id,
      target: {
        learnerId: learner.id,
        generation: (credentials.credentialGeneration + BigInt(1)).toString(),
      },
    };
  };
  if (pending.kind !== "recovery") {
    if (!context || context.learnerId !== pending.learnerId)
      throw new CredentialChangeUnavailable();
    return withAuthenticatedLearner(context, operation);
  }
  return getProgressDb().transaction(async (tx) => {
    const [learner] = await tx
      .select()
      .from(learners)
      .where(eq(learners.id, pending.learnerId))
      .for("update");
    if (!learner) throw new CredentialChangeUnavailable();
    return operation(tx, learner);
  });
}

export async function cancelCredentialChange(secret: string) {
  const pending = await findPending(secret);
  await getProgressDb().transaction(async (tx) => {
    await tx
      .select({ id: learners.id })
      .from(learners)
      .where(eq(learners.id, pending.learnerId))
      .for("update");
    await tx
      .delete(learnerCredentialChanges)
      .where(
        eq(
          learnerCredentialChanges.pendingSecretHash,
          pendingSecretHash(secret),
        ),
      );
  });
}

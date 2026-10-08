ALTER TABLE learners
  ADD COLUMN recovery_code_hash text UNIQUE,
  ADD COLUMN recovery_enabled_at timestamptz,
  ADD CONSTRAINT learners_recovery_pair CHECK (
    (recovery_code_hash IS NULL) = (recovery_enabled_at IS NULL)
  ),
  ADD CONSTRAINT learners_recovery_hash CHECK (
    recovery_code_hash IS NULL OR recovery_code_hash ~ '^[0-9a-f]{64}$'
  );

-- Operational credentials only; deleting these rows cannot delete learning records.
CREATE TABLE learner_credential_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('enrollment', 'replacement', 'recovery')),
  pending_secret_hash text NOT NULL UNIQUE CHECK (pending_secret_hash ~ '^[0-9a-f]{64}$'),
  expected_generation bigint NOT NULL CHECK (expected_generation >= 0),
  successor_code_hash text NOT NULL UNIQUE CHECK (successor_code_hash ~ '^[0-9a-f]{64}$'),
  recovery_authority_hash text CHECK (recovery_authority_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL DEFAULT (clock_timestamp() + interval '10 minutes'),
  CHECK (expires_at > created_at),
  CHECK ((kind = 'recovery') = (recovery_authority_hash IS NOT NULL))
);
CREATE INDEX learner_credential_changes_learner_idx ON learner_credential_changes(learner_id);
CREATE INDEX learner_credential_changes_expiry_idx ON learner_credential_changes(expires_at);

CREATE TABLE identity_rate_limit_buckets (
  bucket_key text NOT NULL CHECK (bucket_key ~ '^[0-9a-f]{64}$'),
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  expires_at timestamptz NOT NULL CHECK (expires_at > window_start),
  PRIMARY KEY (bucket_key, window_start)
);
CREATE INDEX identity_rate_limit_buckets_expiry_idx ON identity_rate_limit_buckets(expires_at);

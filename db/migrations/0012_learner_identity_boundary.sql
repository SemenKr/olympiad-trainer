ALTER TABLE learners
  ADD COLUMN credential_generation bigint NOT NULL DEFAULT 0
    CHECK (credential_generation >= 0),
  ADD COLUMN browser_credential_expires_at timestamptz;

-- Preserve existing credentials and UUIDs. The original cookie expiry is unchanged.
UPDATE learners SET browser_credential_expires_at = CURRENT_TIMESTAMP + interval '730 days';

ALTER TABLE learners
  ALTER COLUMN browser_credential_expires_at SET NOT NULL;

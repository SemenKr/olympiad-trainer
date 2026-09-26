CREATE TABLE learners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_token_hash text NOT NULL UNIQUE,
  guarantee_evidence jsonb NOT NULL,
  impossibility_evidence jsonb NOT NULL,
  legacy_import_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE practice_finish_receipts (
  learner_id uuid NOT NULL REFERENCES learners(id),
  session_id uuid NOT NULL,
  contribution_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_id, session_id)
);

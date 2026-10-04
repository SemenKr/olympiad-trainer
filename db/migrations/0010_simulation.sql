CREATE TABLE simulation_attempts (
  learner_id uuid PRIMARY KEY REFERENCES learners(id),
  session_id uuid NOT NULL UNIQUE,
  revision integer NOT NULL CHECK (revision >= 0),
  drafts jsonb NOT NULL CHECK (jsonb_typeof(drafts) = 'array' AND jsonb_array_length(drafts) = 4),
  selected_index integer NOT NULL CHECK (selected_index BETWEEN 0 AND 3),
  started_at timestamptz NOT NULL,
  deadline_at timestamptz NOT NULL,
  finished_at timestamptz,
  finish_reason text CHECK (finish_reason IN ('early', 'timeout')),
  CHECK (deadline_at = started_at + interval '45 minutes'),
  CHECK ((finished_at IS NULL) = (finish_reason IS NULL))
);

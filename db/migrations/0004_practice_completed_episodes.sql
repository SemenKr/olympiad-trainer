CREATE TABLE practice_completed_episodes (
  learner_id uuid NOT NULL REFERENCES learners(id),
  session_id uuid NOT NULL,
  mode text NOT NULL CHECK (mode IN ('core', 'transfer')),
  episode_facts jsonb NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_id, session_id)
);

CREATE INDEX practice_completed_episodes_recent_idx
  ON practice_completed_episodes (learner_id, completed_at DESC, session_id DESC);

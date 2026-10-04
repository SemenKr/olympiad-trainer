ALTER TABLE practice_completed_episodes DROP CONSTRAINT practice_completed_episodes_mode_check;
ALTER TABLE practice_completed_episodes ADD CONSTRAINT practice_completed_episodes_mode_check
  CHECK (mode IN ('core', 'transfer', 'exploration', 'pack', 'review'));
ALTER TABLE practice_completed_episodes ADD COLUMN review_source_session_id uuid;
ALTER TABLE practice_completed_episodes ADD CONSTRAINT practice_review_provenance_check
  CHECK ((mode = 'review') = (review_source_session_id IS NOT NULL));
CREATE TABLE practice_review_assignments (
  learner_id uuid NOT NULL REFERENCES learners(id),
  session_id uuid NOT NULL,
  review_source_session_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_id, session_id),
  UNIQUE (learner_id, review_source_session_id),
  FOREIGN KEY (learner_id, review_source_session_id)
    REFERENCES practice_completed_episodes(learner_id, session_id)
);
CREATE UNIQUE INDEX practice_completed_review_source_idx
  ON practice_completed_episodes(learner_id, review_source_session_id)
  WHERE review_source_session_id IS NOT NULL;

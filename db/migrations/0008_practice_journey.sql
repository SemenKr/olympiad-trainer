CREATE TABLE practice_journey_awards (
  learner_id uuid NOT NULL REFERENCES learners(id),
  session_id uuid NOT NULL,
  earned_xp integer NOT NULL CHECK (earned_xp >= 0 AND earned_xp <= 30),
  total_xp integer NOT NULL CHECK (total_xp >= earned_xp),
  newly_reached_milestone text CHECK (
    newly_reached_milestone IS NULL OR
    newly_reached_milestone IN ('Первый шаг', '50 XP практики', '100 XP практики')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (learner_id, session_id)
);

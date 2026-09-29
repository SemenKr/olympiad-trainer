ALTER TABLE learners
  ADD COLUMN enumeration_evidence jsonb NOT NULL DEFAULT '{"version":1,"nextSequence":1,"latestCorrectWithoutHints":null,"latestCorrectWithHints":null,"latestIncorrect":null}'::jsonb,
  ADD COLUMN pages_attempted boolean NOT NULL DEFAULT false,
  ADD COLUMN pages_solution_exposed boolean NOT NULL DEFAULT false;

ALTER TABLE practice_completed_episodes
  DROP CONSTRAINT IF EXISTS practice_completed_episodes_mode_check;

ALTER TABLE practice_completed_episodes
  ADD CONSTRAINT practice_completed_episodes_mode_check
  CHECK (mode IN ('core', 'transfer', 'exploration'));

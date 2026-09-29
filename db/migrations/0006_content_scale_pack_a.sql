ALTER TABLE practice_completed_episodes
  DROP CONSTRAINT IF EXISTS practice_completed_episodes_mode_check;

ALTER TABLE practice_completed_episodes
  ADD CONSTRAINT practice_completed_episodes_mode_check
  CHECK (mode IN ('core', 'transfer', 'exploration', 'pack'));

ALTER TABLE practice_finish_receipts
  ADD COLUMN episode_mode text;

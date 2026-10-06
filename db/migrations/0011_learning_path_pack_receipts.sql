ALTER TABLE practice_finish_receipts
  ADD COLUMN pack_id text;

ALTER TABLE practice_finish_receipts
  ADD CONSTRAINT practice_finish_receipts_pack_id_mode_check
  CHECK (pack_id IS NULL OR (episode_mode IS NOT NULL AND episode_mode = 'pack'));

ALTER TABLE practice_finish_receipts
  ADD CONSTRAINT practice_finish_receipts_pack_id_check
  CHECK (pack_id IS NULL OR pack_id IN (
    'pack-a', 'pack-b', 'pack-c', 'pack-d', 'pack-e', 'pack-f',
    'pack-g', 'pack-h', 'pack-i', 'pack-j', 'pack-k', 'pack-l'
  ));

CREATE INDEX practice_finish_receipts_pack_idx
  ON practice_finish_receipts (learner_id, pack_id)
  WHERE pack_id IS NOT NULL;

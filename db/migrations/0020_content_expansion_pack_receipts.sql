ALTER TABLE practice_finish_receipts
  DROP CONSTRAINT practice_finish_receipts_pack_id_check,
  ADD CONSTRAINT practice_finish_receipts_pack_id_check
  CHECK (pack_id IS NULL OR pack_id IN (
    'pack-a', 'pack-b', 'pack-c', 'pack-d', 'pack-e', 'pack-f',
    'pack-g', 'pack-h', 'pack-i', 'pack-j', 'pack-k', 'pack-l',
    'pack-m', 'pack-n', 'pack-o'
  ));

-- Structural storage bound only. The server Finish writer still accepts only
-- registered Packs and verifies the ordered episode facts and learner owner.
ALTER TABLE practice_finish_receipts
  DROP CONSTRAINT practice_finish_receipts_pack_id_check,
  ADD CONSTRAINT practice_finish_receipts_pack_id_check
  CHECK (
    pack_id IS NULL OR
    (char_length(pack_id) BETWEEN 6 AND 64 AND
     pack_id ~ '^pack-[a-z0-9]+(-[a-z0-9]+)*$')
  );

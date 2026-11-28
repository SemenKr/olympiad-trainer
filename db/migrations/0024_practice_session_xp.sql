ALTER TABLE practice_journey_awards
  DROP CONSTRAINT practice_journey_awards_earned_xp_check,
  ADD CONSTRAINT practice_journey_awards_earned_xp_check
    CHECK (earned_xp >= 0 AND earned_xp <= 100);

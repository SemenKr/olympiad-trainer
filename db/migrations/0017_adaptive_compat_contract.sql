-- Run only after every legacy writer is retired and drained. Keep 0014 immutable.
LOCK TABLE learners, practice_completed_episodes IN SHARE ROW EXCLUSIVE MODE;

DO $contract$ DECLARE missing boolean; BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema=current_schema()
      AND table_name='learners' AND column_name IN (
      'brothers_ages_attempted','brothers_ages_solution_exposed',
      'parrots_attempted','parrots_solution_exposed',
      'pages_attempted','pages_solution_exposed')) = 6 THEN
  EXECUTE $coverage$SELECT EXISTS (SELECT 1 FROM learners l
    WHERE (l.brothers_ages_attempted OR l.brothers_ages_solution_exposed)
      AND NOT EXISTS (SELECT 1 FROM practice_adaptive_target_usage u
        WHERE u.learner_id=l.id AND u.problem_id='brothers-ages-products')
       OR (l.parrots_attempted OR l.parrots_solution_exposed)
      AND NOT EXISTS (SELECT 1 FROM practice_adaptive_target_usage u
        WHERE u.learner_id=l.id AND u.problem_id='parrots-guaranteed-colors')
       OR (l.pages_attempted OR l.pages_solution_exposed)
      AND NOT EXISTS (SELECT 1 FROM practice_adaptive_target_usage u
        WHERE u.learner_id=l.id AND u.problem_id='pages-without-digit-one'))$coverage$
    INTO missing;
  IF missing THEN RAISE EXCEPTION 'Legacy adaptive marker closure is missing'; END IF;
  END IF;
END $contract$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM practice_completed_episodes e
    JOIN practice_finish_receipts r USING (learner_id,session_id)
    WHERE (r.episode_mode IS NULL OR r.episode_mode=e.mode)
      AND ot_compat_valid_adaptive_episode(e.mode,e.episode_facts) IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM practice_adaptive_target_usage u
        WHERE u.learner_id=e.learner_id
          AND u.problem_id=ot_compat_valid_adaptive_episode(e.mode,e.episode_facts))
  ) THEN RAISE EXCEPTION 'Legacy adaptive episode closure is missing'; END IF;
END $$;

DROP TRIGGER IF EXISTS ot_compat_episode ON practice_completed_episodes;
DROP TRIGGER IF EXISTS ot_compat_learner ON learners;
DROP FUNCTION ot_compat_capture_episode();
DROP FUNCTION ot_compat_capture_learner();
DROP FUNCTION ot_compat_valid_adaptive_episode(text,jsonb);
DROP FUNCTION ot_compat_validate_evidence(jsonb,text);
DROP FUNCTION ot_compat_valid_checkpoint_fact(jsonb,text,text);
DROP FUNCTION ot_compat_safe_sequence(jsonb);
DROP FUNCTION ot_compat_exact_object(jsonb,text[]);
ALTER TABLE learners
  DROP COLUMN IF EXISTS brothers_ages_attempted,
  DROP COLUMN IF EXISTS brothers_ages_solution_exposed,
  DROP COLUMN IF EXISTS parrots_attempted,
  DROP COLUMN IF EXISTS parrots_solution_exposed,
  DROP COLUMN IF EXISTS pages_attempted,
  DROP COLUMN IF EXISTS pages_solution_exposed;

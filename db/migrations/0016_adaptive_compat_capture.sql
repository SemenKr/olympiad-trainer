-- Temporary bridge for old Finish writers. Drop after their credentials and deployments retire.
-- No old marker is inferred from new ledger closure.
CREATE FUNCTION ot_compat_exact_object(v jsonb, keys text[]) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
 SELECT COALESCE(jsonb_typeof(v) = 'object' AND v ?& keys AND v - keys = '{}'::jsonb, false)
$$;
CREATE FUNCTION ot_compat_safe_sequence(v jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
 IF jsonb_typeof(v) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
 RETURN (v::text)::numeric BETWEEN 1 AND 9007199254740991 AND trunc((v::text)::numeric) = (v::text)::numeric;
END $$;

-- Frozen v1/v2 checkpoint contracts, including canonical option assessment.
-- These five checkpoint definitions all use A; no answer data is returned to UI.
CREATE FUNCTION ot_compat_valid_checkpoint_fact(f jsonb, slot text, problem text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE checkpoint text; observation jsonb; hints jsonb;
BEGIN
 IF NOT ot_compat_exact_object(f, ARRAY['sequence','problemId','observation','hintLevelsExposedBeforeCheckpoint','solutionExposedBeforeCheckpoint'])
 OR NOT ot_compat_safe_sequence(f->'sequence') OR f->>'problemId' IS DISTINCT FROM problem
 OR f->'solutionExposedBeforeCheckpoint' IS DISTINCT FROM 'false'::jsonb THEN RETURN false; END IF;
 checkpoint := CASE problem
 WHEN 'guaranteed-sock-pair' THEN 'guaranteed-sock-pair-guarantee-argument'
 WHEN 'parrots-guaranteed-colors' THEN 'parrots-guaranteed-colors-guarantee-argument'
 WHEN 'table-impossible-sums' THEN 'table-impossible-sums-impossibility-argument'
 WHEN 'brothers-ages-products' THEN 'brothers-ages-products-youngest-lower-bound'
 WHEN 'pages-without-digit-one' THEN 'pages-without-digit-one-complete-enumeration' END;
 observation := f->'observation'; hints := f->'hintLevelsExposedBeforeCheckpoint';
 IF NOT ot_compat_exact_object(observation, ARRAY['checkpointId','selectedOptionId','outcome','validSubmissionCountAtSubmit'])
 OR observation->>'checkpointId' IS DISTINCT FROM checkpoint
 OR NOT ot_compat_safe_sequence(observation->'validSubmissionCountAtSubmit')
 OR NOT COALESCE(observation->>'selectedOptionId' IN ('A','B','C'), false)
 OR observation->>'outcome' IS DISTINCT FROM (CASE WHEN observation->>'selectedOptionId' = 'A' THEN 'correct' ELSE 'incorrect' END)
 OR hints NOT IN ('[]'::jsonb,'["focus"]'::jsonb,'["focus","strategy"]'::jsonb,'["focus","strategy","next-step"]'::jsonb) THEN RETURN false; END IF;
 RETURN CASE slot WHEN 'latestIncorrect' THEN observation->>'outcome' = 'incorrect'
 WHEN 'latestCorrectWithoutHints' THEN observation->>'outcome' = 'correct' AND hints = '[]'::jsonb
 WHEN 'latestCorrectWithHints' THEN observation->>'outcome' = 'correct' AND hints <> '[]'::jsonb ELSE false END;
END $$;

CREATE FUNCTION ot_compat_validate_evidence(v jsonb, bucket text) RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE
 slots text[] := ARRAY['latestCorrectWithoutHints','latestCorrectWithHints','latestIncorrect'];
 source text; target text; source_key text; target_key text; basis_key text;
 section jsonb; f jsonb; basis jsonb; reconstructed jsonb; slot text; problem text;
 sections jsonb[]; problems text[]; sequences numeric[] := '{}'; result text[] := '{}'; n numeric; i integer;
BEGIN
 IF NOT ot_compat_safe_sequence(v->'nextSequence') THEN RAISE EXCEPTION 'Invalid legacy evidence sequence'; END IF;
 CASE bucket
 WHEN 'guarantee' THEN source := 'guaranteed-sock-pair'; target := 'parrots-guaranteed-colors'; source_key := 'sock'; target_key := 'parrots'; basis_key := 'sockBasisForParrotsWithoutHints';
 WHEN 'impossibility' THEN source := 'table-impossible-sums'; target := 'brothers-ages-products'; source_key := 'table'; target_key := 'brothers'; basis_key := 'tableBasisForBrothersWithoutHints';
 WHEN 'enumeration' THEN target := 'pages-without-digit-one';
 ELSE RAISE EXCEPTION 'Unknown evidence bucket'; END CASE;
 IF v->'version' = '1'::jsonb THEN
   IF NOT ot_compat_exact_object(v, ARRAY['version','nextSequence'] || slots) THEN RAISE EXCEPTION 'Invalid legacy evidence shape'; END IF;
   sections := ARRAY[v]; problems := ARRAY[COALESCE(source,target)];
 ELSIF v->'version' = '2'::jsonb AND source IS NOT NULL THEN
   IF NOT ot_compat_exact_object(v, ARRAY['version','nextSequence',source_key,target_key,basis_key]) THEN RAISE EXCEPTION 'Invalid legacy evidence shape'; END IF;
   sections := ARRAY[v->source_key,v->target_key]; problems := ARRAY[source,target]; basis := v->basis_key;
   IF NOT ot_compat_exact_object(sections[1],slots) OR NOT ot_compat_exact_object(sections[2],slots) THEN RAISE EXCEPTION 'Invalid legacy evidence slots'; END IF;
 ELSE RAISE EXCEPTION 'Invalid legacy evidence version'; END IF;
 FOR i IN 1..array_length(sections,1) LOOP
   section := sections[i]; problem := problems[i];
   FOREACH slot IN ARRAY slots LOOP
     f := section->slot;
     IF f = 'null'::jsonb THEN CONTINUE; END IF;
     IF NOT ot_compat_valid_checkpoint_fact(f,slot,problem) THEN RAISE EXCEPTION 'Invalid legacy checkpoint fact'; END IF;
     n := (f->>'sequence')::numeric;
     IF n = ANY(sequences) OR n >= (v->>'nextSequence')::numeric THEN RAISE EXCEPTION 'Invalid legacy checkpoint ordering'; END IF;
     sequences := array_append(sequences,n);
     IF problem = target THEN result := array_append(result,target); END IF;
   END LOOP;
 END LOOP;
 IF basis IS NOT NULL AND basis <> 'null'::jsonb THEN
   IF NOT ot_compat_exact_object(basis,ARRAY['sequence','observation','hintLevelsExposedBeforeCheckpoint']) THEN RAISE EXCEPTION 'Invalid legacy basis'; END IF;
   reconstructed := basis || jsonb_build_object('problemId',source,'solutionExposedBeforeCheckpoint',false);
   IF NOT ot_compat_valid_checkpoint_fact(reconstructed,'latestCorrectWithoutHints',source)
     OR sections[2]->'latestCorrectWithoutHints' = 'null'::jsonb
     OR (basis->>'sequence')::numeric >= (sections[2]->'latestCorrectWithoutHints'->>'sequence')::numeric THEN RAISE EXCEPTION 'Invalid legacy basis ordering'; END IF;
   FOREACH slot IN ARRAY slots LOOP
     f := sections[1]->slot;
     IF f->'sequence' = basis->'sequence' AND f IS DISTINCT FROM reconstructed THEN RAISE EXCEPTION 'Contradictory legacy basis'; END IF;
     IF sections[2]->slot->'sequence' = basis->'sequence' THEN RAISE EXCEPTION 'Duplicate legacy basis sequence'; END IF;
   END LOOP;
 END IF;
 RETURN result;
END $$;

CREATE FUNCTION ot_compat_valid_adaptive_episode(mode text, facts jsonb)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  p jsonb;
  target text;
  submissions numeric;
  checkpoint_id text;
BEGIN
  IF jsonb_typeof(facts) IS DISTINCT FROM 'object' THEN RETURN NULL; END IF;
  IF mode IS NULL OR mode NOT IN ('transfer', 'exploration')
    OR NOT (facts ?& ARRAY['version', 'problems'])
    OR facts - ARRAY['version', 'problems'] <> '{}'::jsonb
    OR facts->'version' IS DISTINCT FROM '1'::jsonb
    OR jsonb_typeof(facts->'problems') IS DISTINCT FROM 'array' THEN RETURN NULL; END IF;
  IF jsonb_array_length(facts->'problems') <> 1 THEN RETURN NULL; END IF;
  p := facts->'problems'->0;
  IF jsonb_typeof(p) IS DISTINCT FROM 'object' THEN RETURN NULL; END IF;
  IF NOT (p ?& ARRAY['problemId', 'outcome', 'skipped', 'validSubmissionCount', 'hintLevelsExposed', 'solutionExposed', 'checkpoint'])
    OR p - ARRAY['problemId', 'outcome', 'skipped', 'validSubmissionCount', 'hintLevelsExposed', 'solutionExposed', 'checkpoint'] <> '{}'::jsonb
    OR jsonb_typeof(p->'problemId') IS DISTINCT FROM 'string'
    OR p->'skipped' NOT IN ('true'::jsonb, 'false'::jsonb)
    OR p->'solutionExposed' NOT IN ('true'::jsonb, 'false'::jsonb)
    OR jsonb_typeof(p->'validSubmissionCount') IS DISTINCT FROM 'number'
    OR p->'hintLevelsExposed' NOT IN ('[]'::jsonb, '["focus"]'::jsonb, '["focus","strategy"]'::jsonb, '["focus","strategy","next-step"]'::jsonb)
    THEN RETURN NULL; END IF;
  target := p->>'problemId';
  IF NOT ((mode = 'transfer' AND target IN ('brothers-ages-products', 'parrots-guaranteed-colors'))
    OR (mode = 'exploration' AND target = 'pages-without-digit-one')) THEN RETURN NULL; END IF;
  submissions := (p->>'validSubmissionCount')::numeric;
  IF submissions < 0 OR submissions > 9007199254740991 OR trunc(submissions) <> submissions
    OR (submissions = 0 AND p->'outcome' <> '"no-valid-submissions"'::jsonb)
    OR (submissions > 0 AND p->'outcome' NOT IN ('"incorrect-only"'::jsonb, '"eventually-correct"'::jsonb))
    OR (p->'skipped' = 'true'::jsonb AND (p->'outcome' = '"eventually-correct"'::jsonb OR p->'solutionExposed' = 'true'::jsonb OR p->'checkpoint' <> 'null'::jsonb))
    OR (p->'solutionExposed' = 'true'::jsonb AND (submissions = 0 OR p->'hintLevelsExposed' <> '["focus","strategy","next-step"]'::jsonb))
    THEN RETURN NULL; END IF;
  IF p->'checkpoint' <> 'null'::jsonb THEN
    IF jsonb_typeof(p->'checkpoint') IS DISTINCT FROM 'object' THEN RETURN NULL; END IF;
    checkpoint_id := CASE target
      WHEN 'brothers-ages-products' THEN 'brothers-ages-products-youngest-lower-bound'
      WHEN 'parrots-guaranteed-colors' THEN 'parrots-guaranteed-colors-guarantee-argument'
      WHEN 'pages-without-digit-one' THEN 'pages-without-digit-one-complete-enumeration' END;
    IF NOT ((p->'checkpoint') ?& ARRAY['checkpointId', 'outcome'])
      OR (p->'checkpoint') - ARRAY['checkpointId', 'outcome'] <> '{}'::jsonb
      OR p->'checkpoint'->'checkpointId' IS DISTINCT FROM to_jsonb(checkpoint_id)
      OR p->'checkpoint'->'outcome' NOT IN ('"correct"'::jsonb, '"incorrect"'::jsonb)
      OR p->'outcome' <> '"eventually-correct"'::jsonb
      OR p->'solutionExposed' = 'true'::jsonb THEN RETURN NULL; END IF;
  END IF;
  RETURN target;
END;
$$;


CREATE FUNCTION ot_compat_capture_learner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text;
BEGIN
  IF NEW.brothers_ages_attempted OR NEW.brothers_ages_solution_exposed THEN
    INSERT INTO practice_adaptive_target_usage(learner_id,problem_id) VALUES(NEW.id,'brothers-ages-products') ON CONFLICT DO NOTHING;
  END IF;
  IF NEW.parrots_attempted OR NEW.parrots_solution_exposed THEN
    INSERT INTO practice_adaptive_target_usage(learner_id,problem_id) VALUES(NEW.id,'parrots-guaranteed-colors') ON CONFLICT DO NOTHING;
  END IF;
  IF NEW.pages_attempted OR NEW.pages_solution_exposed THEN
    INSERT INTO practice_adaptive_target_usage(learner_id,problem_id) VALUES(NEW.id,'pages-without-digit-one') ON CONFLICT DO NOTHING;
  END IF;
  IF NEW.guarantee_evidence->'version' IN ('1'::jsonb,'2'::jsonb) THEN
    FOREACH target IN ARRAY ot_compat_validate_evidence(NEW.guarantee_evidence,'guarantee') LOOP
      INSERT INTO practice_adaptive_target_usage(learner_id,problem_id) VALUES(NEW.id,target) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  IF NEW.impossibility_evidence->'version' IN ('1'::jsonb,'2'::jsonb) THEN
    FOREACH target IN ARRAY ot_compat_validate_evidence(NEW.impossibility_evidence,'impossibility') LOOP
      INSERT INTO practice_adaptive_target_usage(learner_id,problem_id) VALUES(NEW.id,target) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  IF NEW.enumeration_evidence->'version' IN ('1'::jsonb,'2'::jsonb) THEN
    FOREACH target IN ARRAY ot_compat_validate_evidence(NEW.enumeration_evidence,'enumeration') LOOP
      INSERT INTO practice_adaptive_target_usage(learner_id,problem_id) VALUES(NEW.id,target) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;

DO $$ BEGIN
  IF (SELECT count(*) FROM information_schema.columns WHERE table_schema=current_schema()
      AND table_name='learners' AND column_name IN (
      'brothers_ages_attempted','brothers_ages_solution_exposed',
      'parrots_attempted','parrots_solution_exposed',
      'pages_attempted','pages_solution_exposed')) = 6 THEN
    EXECUTE 'CREATE TRIGGER ot_compat_learner AFTER INSERT OR UPDATE ON learners
      FOR EACH ROW EXECUTE FUNCTION ot_compat_capture_learner()';
  END IF;
END $$;

CREATE FUNCTION ot_compat_capture_episode() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target text;
BEGIN
  target := ot_compat_valid_adaptive_episode(NEW.mode,NEW.episode_facts);
  IF target IS NULL THEN RETURN NEW; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM practice_finish_receipts r
    WHERE r.learner_id=NEW.learner_id AND r.session_id=NEW.session_id
      AND (r.episode_mode IS NULL OR r.episode_mode=NEW.mode)
  ) THEN
    RAISE EXCEPTION 'Adaptive episode has no matching Finish receipt';
  END IF;
  INSERT INTO practice_adaptive_target_usage(learner_id,problem_id,source_session_id)
    VALUES(NEW.learner_id,target,NEW.session_id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER ot_compat_episode
  AFTER INSERT ON practice_completed_episodes
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION ot_compat_capture_episode();
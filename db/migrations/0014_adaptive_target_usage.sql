-- Closure facts are independent of prunable history and immutable replay receipts.
-- Execute through migrate-db.mjs on its single transaction/connection, after
-- draining old application writers. This is not a rolling-compatible migration.
CREATE TABLE practice_adaptive_target_usage (
 learner_id uuid NOT NULL REFERENCES learners(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 problem_id text NOT NULL CHECK (problem_id IN ('brothers-ages-products','parrots-guaranteed-colors','pages-without-digit-one')),
 source_session_id uuid,
 recorded_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (learner_id, problem_id),
 FOREIGN KEY (learner_id, source_session_id) REFERENCES practice_finish_receipts(learner_id, session_id) ON DELETE RESTRICT ON UPDATE RESTRICT
);
CREATE UNIQUE INDEX practice_adaptive_target_usage_source_idx ON practice_adaptive_target_usage(learner_id, source_session_id);

CREATE FUNCTION pg_temp.exact_object(v jsonb, keys text[]) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
 SELECT COALESCE(jsonb_typeof(v) = 'object' AND v ?& keys AND v - keys = '{}'::jsonb, false)
$$;
CREATE FUNCTION pg_temp.safe_sequence(v jsonb) RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
 IF jsonb_typeof(v) IS DISTINCT FROM 'number' THEN RETURN false; END IF;
 RETURN (v::text)::numeric BETWEEN 1 AND 9007199254740991 AND trunc((v::text)::numeric) = (v::text)::numeric;
END $$;

-- Frozen v1/v2 checkpoint contracts, including canonical option assessment.
-- These five checkpoint definitions all use A; no answer data is returned to UI.
CREATE FUNCTION pg_temp.valid_checkpoint_fact(f jsonb, slot text, problem text) RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE checkpoint text; observation jsonb; hints jsonb;
BEGIN
 IF NOT pg_temp.exact_object(f, ARRAY['sequence','problemId','observation','hintLevelsExposedBeforeCheckpoint','solutionExposedBeforeCheckpoint'])
 OR NOT pg_temp.safe_sequence(f->'sequence') OR f->>'problemId' IS DISTINCT FROM problem
 OR f->'solutionExposedBeforeCheckpoint' IS DISTINCT FROM 'false'::jsonb THEN RETURN false; END IF;
 checkpoint := CASE problem
 WHEN 'guaranteed-sock-pair' THEN 'guaranteed-sock-pair-guarantee-argument'
 WHEN 'parrots-guaranteed-colors' THEN 'parrots-guaranteed-colors-guarantee-argument'
 WHEN 'table-impossible-sums' THEN 'table-impossible-sums-impossibility-argument'
 WHEN 'brothers-ages-products' THEN 'brothers-ages-products-youngest-lower-bound'
 WHEN 'pages-without-digit-one' THEN 'pages-without-digit-one-complete-enumeration' END;
 observation := f->'observation'; hints := f->'hintLevelsExposedBeforeCheckpoint';
 IF NOT pg_temp.exact_object(observation, ARRAY['checkpointId','selectedOptionId','outcome','validSubmissionCountAtSubmit'])
 OR observation->>'checkpointId' IS DISTINCT FROM checkpoint
 OR NOT pg_temp.safe_sequence(observation->'validSubmissionCountAtSubmit')
 OR NOT COALESCE(observation->>'selectedOptionId' IN ('A','B','C'), false)
 OR observation->>'outcome' IS DISTINCT FROM (CASE WHEN observation->>'selectedOptionId' = 'A' THEN 'correct' ELSE 'incorrect' END)
 OR hints NOT IN ('[]'::jsonb,'["focus"]'::jsonb,'["focus","strategy"]'::jsonb,'["focus","strategy","next-step"]'::jsonb) THEN RETURN false; END IF;
 RETURN CASE slot WHEN 'latestIncorrect' THEN observation->>'outcome' = 'incorrect'
 WHEN 'latestCorrectWithoutHints' THEN observation->>'outcome' = 'correct' AND hints = '[]'::jsonb
 WHEN 'latestCorrectWithHints' THEN observation->>'outcome' = 'correct' AND hints <> '[]'::jsonb ELSE false END;
END $$;

CREATE FUNCTION pg_temp.validate_evidence(v jsonb, bucket text) RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE
 slots text[] := ARRAY['latestCorrectWithoutHints','latestCorrectWithHints','latestIncorrect'];
 source text; target text; source_key text; target_key text; basis_key text;
 section jsonb; f jsonb; basis jsonb; reconstructed jsonb; slot text; problem text;
 sections jsonb[]; problems text[]; sequences numeric[] := '{}'; result text[] := '{}'; n numeric; i integer;
BEGIN
 IF NOT pg_temp.safe_sequence(v->'nextSequence') THEN RAISE EXCEPTION 'Invalid legacy evidence sequence'; END IF;
 CASE bucket
 WHEN 'guarantee' THEN source := 'guaranteed-sock-pair'; target := 'parrots-guaranteed-colors'; source_key := 'sock'; target_key := 'parrots'; basis_key := 'sockBasisForParrotsWithoutHints';
 WHEN 'impossibility' THEN source := 'table-impossible-sums'; target := 'brothers-ages-products'; source_key := 'table'; target_key := 'brothers'; basis_key := 'tableBasisForBrothersWithoutHints';
 WHEN 'enumeration' THEN target := 'pages-without-digit-one';
 ELSE RAISE EXCEPTION 'Unknown evidence bucket'; END CASE;
 IF v->'version' = '1'::jsonb THEN
   IF NOT pg_temp.exact_object(v, ARRAY['version','nextSequence'] || slots) THEN RAISE EXCEPTION 'Invalid legacy evidence shape'; END IF;
   sections := ARRAY[v]; problems := ARRAY[COALESCE(source,target)];
 ELSIF v->'version' = '2'::jsonb AND source IS NOT NULL THEN
   IF NOT pg_temp.exact_object(v, ARRAY['version','nextSequence',source_key,target_key,basis_key]) THEN RAISE EXCEPTION 'Invalid legacy evidence shape'; END IF;
   sections := ARRAY[v->source_key,v->target_key]; problems := ARRAY[source,target]; basis := v->basis_key;
   IF NOT pg_temp.exact_object(sections[1],slots) OR NOT pg_temp.exact_object(sections[2],slots) THEN RAISE EXCEPTION 'Invalid legacy evidence slots'; END IF;
 ELSE RAISE EXCEPTION 'Invalid legacy evidence version'; END IF;
 FOR i IN 1..array_length(sections,1) LOOP
   section := sections[i]; problem := problems[i];
   FOREACH slot IN ARRAY slots LOOP
     f := section->slot;
     IF f = 'null'::jsonb THEN CONTINUE; END IF;
     IF NOT pg_temp.valid_checkpoint_fact(f,slot,problem) THEN RAISE EXCEPTION 'Invalid legacy checkpoint fact'; END IF;
     n := (f->>'sequence')::numeric;
     IF n = ANY(sequences) OR n >= (v->>'nextSequence')::numeric THEN RAISE EXCEPTION 'Invalid legacy checkpoint ordering'; END IF;
     sequences := array_append(sequences,n);
     IF problem = target THEN result := array_append(result,target); END IF;
   END LOOP;
 END LOOP;
 IF basis IS NOT NULL AND basis <> 'null'::jsonb THEN
   IF NOT pg_temp.exact_object(basis,ARRAY['sequence','observation','hintLevelsExposedBeforeCheckpoint']) THEN RAISE EXCEPTION 'Invalid legacy basis'; END IF;
   reconstructed := basis || jsonb_build_object('problemId',source,'solutionExposedBeforeCheckpoint',false);
   IF NOT pg_temp.valid_checkpoint_fact(reconstructed,'latestCorrectWithoutHints',source)
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

CREATE FUNCTION pg_temp.valid_adaptive_episode(mode text, facts jsonb)
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


CREATE TEMP TABLE adaptive_usage_candidates (
 learner_id uuid NOT NULL, problem_id text NOT NULL, source_session_id uuid, receipt_created_at timestamptz
) ON COMMIT DROP;
INSERT INTO adaptive_usage_candidates(learner_id,problem_id)
 SELECT id,'brothers-ages-products' FROM learners WHERE brothers_ages_attempted OR brothers_ages_solution_exposed
 UNION ALL SELECT id,'parrots-guaranteed-colors' FROM learners WHERE parrots_attempted OR parrots_solution_exposed
 UNION ALL SELECT id,'pages-without-digit-one' FROM learners WHERE pages_attempted OR pages_solution_exposed;

DO $$ DECLARE learner record; target text; BEGIN
 FOR learner IN SELECT id,guarantee_evidence,impossibility_evidence,enumeration_evidence FROM learners LOOP
   FOREACH target IN ARRAY (pg_temp.validate_evidence(learner.guarantee_evidence,'guarantee') || pg_temp.validate_evidence(learner.impossibility_evidence,'impossibility') || pg_temp.validate_evidence(learner.enumeration_evidence,'enumeration')) LOOP
     INSERT INTO adaptive_usage_candidates(learner_id,problem_id) VALUES(learner.id,target);
   END LOOP;
 END LOOP;
END $$;
INSERT INTO adaptive_usage_candidates
 SELECT receipt.learner_id,pg_temp.valid_adaptive_episode(episode.mode,episode.episode_facts),receipt.session_id,receipt.created_at
 FROM practice_finish_receipts receipt JOIN practice_completed_episodes episode
 ON receipt.learner_id = episode.learner_id AND receipt.session_id = episode.session_id
 WHERE (receipt.episode_mode IS NULL OR receipt.episode_mode = episode.mode)
 AND pg_temp.valid_adaptive_episode(episode.mode,episode.episode_facts) IS NOT NULL;

INSERT INTO practice_adaptive_target_usage(learner_id,problem_id,source_session_id)
 SELECT DISTINCT ON (learner_id,problem_id) learner_id,problem_id,source_session_id
 FROM adaptive_usage_candidates
 ORDER BY learner_id,problem_id,receipt_created_at ASC NULLS LAST,source_session_id ASC NULLS LAST;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM adaptive_usage_candidates c WHERE NOT EXISTS (
 SELECT 1 FROM practice_adaptive_target_usage u WHERE u.learner_id = c.learner_id AND u.problem_id = c.problem_id))
 THEN RAISE EXCEPTION 'Adaptive legacy closure coverage failed'; END IF;
 IF EXISTS (SELECT 1 FROM practice_adaptive_target_usage u WHERE NOT EXISTS (
 SELECT 1 FROM adaptive_usage_candidates c WHERE u.learner_id = c.learner_id AND u.problem_id = c.problem_id))
 THEN RAISE EXCEPTION 'Unproven adaptive closure'; END IF;
END $$;
ALTER TABLE learners
 DROP COLUMN brothers_ages_attempted, DROP COLUMN brothers_ages_solution_exposed,
 DROP COLUMN parrots_attempted, DROP COLUMN parrots_solution_exposed,
 DROP COLUMN pages_attempted, DROP COLUMN pages_solution_exposed;
DROP FUNCTION pg_temp.valid_adaptive_episode(text,jsonb);
DROP FUNCTION pg_temp.validate_evidence(jsonb,text);
DROP FUNCTION pg_temp.valid_checkpoint_fact(jsonb,text,text);
DROP FUNCTION pg_temp.safe_sequence(jsonb);
DROP FUNCTION pg_temp.exact_object(jsonb,text[]);

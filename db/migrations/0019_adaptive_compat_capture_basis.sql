-- Forward repair of 0016; a frozen source basis may legitimately include hints.
-- Canonical answer, shape, hint-prefix, sequence and contradiction checks remain strict.
CREATE OR REPLACE FUNCTION ot_compat_validate_evidence(v jsonb, bucket text) RETURNS text[] LANGUAGE plpgsql AS $$
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
   IF NOT ot_compat_valid_checkpoint_fact(reconstructed,CASE WHEN basis->'hintLevelsExposedBeforeCheckpoint' = '[]'::jsonb THEN 'latestCorrectWithoutHints' ELSE 'latestCorrectWithHints' END,source)
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

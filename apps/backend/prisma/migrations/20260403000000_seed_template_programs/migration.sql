DO $$
DECLARE
  v_partner_id TEXT;
  v_program_id TEXT;
BEGIN
  SELECT id INTO v_partner_id FROM partners LIMIT 1;
  IF v_partner_id IS NULL THEN RETURN; END IF;

  FOREACH v_program_id IN ARRAY ARRAY['DEFAULT', 'TEMPLATE'] LOOP
    IF NOT EXISTS (SELECT 1 FROM programs WHERE name = v_program_id AND "partnerId" = v_partner_id) THEN
      INSERT INTO programs (id, "createdAt", "updatedAt", name, "isTemplate", "partnerId", description)
      VALUES (gen_random_uuid(), NOW(), NOW(), v_program_id, TRUE, v_partner_id,
              v_program_id || ' template program. Clone this to create a new program.')
      RETURNING id INTO v_program_id;

      INSERT INTO "_CheckpointNameToProgram" ("A", "B")
      SELECT 'Month 5', v_program_id WHERE EXISTS (SELECT 1 FROM "CheckpointName" WHERE name = 'Month 5')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

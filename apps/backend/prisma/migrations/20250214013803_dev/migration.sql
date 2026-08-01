-- Step 1: Add a new column for the single role (temporary as TEXT)
ALTER TABLE users ADD COLUMN role TEXT;

-- Step 2: Update users who had "United_Way_Staff" to "Administrator"
UPDATE users
SET role = 'Administrator'
WHERE 'United_Way_Staff' = ANY(roles::TEXT[]);

-- Step 3: Assign the highest role based on existing roles array
UPDATE users
SET role = CASE
             WHEN roles IS NULL OR array_length(roles, 1) = 0 THEN NULL
             WHEN 'Administrator' = ANY(roles::TEXT[]) THEN 'Administrator'
             WHEN 'Partner_Staff' = ANY(roles::TEXT[]) THEN 'Partner_Staff'
             ELSE NULL
  END
WHERE roles IS NOT NULL;

-- Step 4: Remove the old roles array column
ALTER TABLE users DROP COLUMN roles;

-- Step 5: Rename the old enum type (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
ALTER TYPE "Role" RENAME TO "Role_old";
END IF;
END $$;

-- Step 6: Create the new enum without "United_Way_Staff"
CREATE TYPE "Role" AS ENUM ('Administrator', 'Partner_Staff');

-- Step 7: Update the column to use the new enum type
ALTER TABLE users ALTER COLUMN role TYPE "Role" USING role::"Role";

-- Step 8: Drop the old enum type
DROP TYPE IF EXISTS "Role_old";

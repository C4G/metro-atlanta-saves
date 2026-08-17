-- Update existing homepage content when it still matches the inaccessible defaults.
UPDATE "Introduction"
SET "title" = 'Financial wellbeing programs for Atlanta communities'
WHERE "title" IN ('FINANCIAL WELLBEING ALLIANCE', 'BUILDING RESILIENT PROFESSIONALS');

UPDATE "Introduction"
SET "imageText" = 'Financial Wellbeing Alliance participants pose together in front of graduation decorations'
WHERE "imageText" = 'Atlanta Cohort Graduates';

UPDATE "Description"
SET "title" = 'Financial Wellbeing Alliance programs'
WHERE "title" = 'FINANCIAL WELLBEING ALLIANCE';

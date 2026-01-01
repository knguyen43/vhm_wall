-- Add indexes to speed up dateOfDeath filtering
CREATE INDEX IF NOT EXISTS idx_persons_date_of_death
  ON "persons" ("dateOfDeath");

CREATE INDEX IF NOT EXISTS idx_persons_date_of_death_month
  ON "persons" (EXTRACT(MONTH FROM "dateOfDeath"));

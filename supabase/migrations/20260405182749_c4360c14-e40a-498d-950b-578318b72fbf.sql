
-- Normalize all plate_numbers in transactions (remove spaces, uppercase)
UPDATE public.transactions
SET plate_number = UPPER(REPLACE(plate_number, ' ', ''))
WHERE plate_number ~ '\s';

-- Merge duplicate customers: for each normalized plate, keep the one with most visits,
-- sum visits/loyalty_points, keep latest last_visit
WITH normalized AS (
  SELECT
    id,
    UPPER(REPLACE(plate_number, ' ', '')) AS clean_plate,
    plate_number,
    visits,
    loyalty_points,
    last_visit,
    name,
    phone,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY UPPER(REPLACE(plate_number, ' ', ''))
      ORDER BY visits DESC, created_at ASC
    ) AS rn
  FROM public.customers
),
duplicates AS (
  SELECT clean_plate
  FROM normalized
  GROUP BY clean_plate
  HAVING COUNT(*) > 1
),
merge_data AS (
  SELECT
    clean_plate,
    SUM(visits) AS total_visits,
    SUM(loyalty_points) AS total_points,
    MAX(last_visit) AS latest_visit
  FROM normalized
  WHERE clean_plate IN (SELECT clean_plate FROM duplicates)
  GROUP BY clean_plate
),
keeper AS (
  SELECT n.id, m.total_visits, m.total_points, m.latest_visit, n.clean_plate
  FROM normalized n
  JOIN merge_data m ON n.clean_plate = m.clean_plate
  WHERE n.rn = 1
)
-- Update the keeper records with merged data
UPDATE public.customers c
SET
  visits = k.total_visits,
  loyalty_points = k.total_points,
  last_visit = k.latest_visit,
  plate_number = k.clean_plate
FROM keeper k
WHERE c.id = k.id;

-- Delete the duplicate (non-keeper) records
DELETE FROM public.customers
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY UPPER(REPLACE(plate_number, ' ', ''))
        ORDER BY visits DESC, created_at ASC
      ) AS rn
    FROM public.customers
  ) sub
  WHERE rn > 1
);

-- Normalize remaining customers that had spaces but no duplicates
UPDATE public.customers
SET plate_number = UPPER(REPLACE(plate_number, ' ', ''))
WHERE plate_number ~ '\s';

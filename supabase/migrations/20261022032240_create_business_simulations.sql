/*
# Create business simulations table

1. New Tables
- `business_simulations`
- `id` (uuid, primary key): unique analysis identifier.
- `business_name` (text): name supplied for the business.
- `industry` (text): business category or industry.
- `currency` (text): currency code used in the analysis.
- `input_data` (jsonb): initial investment, operating assumptions, products, and costs.
- `results` (jsonb): calculated yearly cash flows and performance indicators.
- `created_at` (timestamptz): time the analysis was saved.

2. Security
- Enable RLS on `business_simulations`.
- Allow anonymous and authenticated visitors to create and view shared analyses because this app has no sign-in screen.
- Allow anonymous and authenticated visitors to update and delete shared analyses.

3. Important Notes
- The table stores the calculator inputs and generated report so an analysis can be retained after the page is refreshed.
- No personally identifying information or account ownership is required for this first version.
*/

CREATE TABLE IF NOT EXISTS business_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  industry text NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  input_data jsonb NOT NULL,
  results jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_business_simulations" ON business_simulations;
CREATE POLICY "public_read_business_simulations"
ON business_simulations FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "public_insert_business_simulations" ON business_simulations;
CREATE POLICY "public_insert_business_simulations"
ON business_simulations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_business_simulations" ON business_simulations;
CREATE POLICY "public_update_business_simulations"
ON business_simulations FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_business_simulations" ON business_simulations;
CREATE POLICY "public_delete_business_simulations"
ON business_simulations FOR DELETE
TO anon, authenticated
USING (true);
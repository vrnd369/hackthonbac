/*
  # Add payment fields to hackathon_registrations table

  1. New Columns
    - `payment_status` (text) - Track payment status (pending, completed, failed)
    - `payment_intent_id` (text) - Store Stripe payment intent ID
    - `stripe_customer_id` (text) - Store Stripe customer ID for future reference
    - `amount_paid` (decimal) - Store the amount paid

  2. Updates
    - Add check constraint for payment_status
    - Add index on payment_intent_id for faster lookups
*/

-- Add payment-related columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hackathon_registrations' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE hackathon_registrations ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hackathon_registrations' AND column_name = 'payment_intent_id'
  ) THEN
    ALTER TABLE hackathon_registrations ADD COLUMN payment_intent_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hackathon_registrations' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE hackathon_registrations ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hackathon_registrations' AND column_name = 'amount_paid'
  ) THEN
    ALTER TABLE hackathon_registrations ADD COLUMN amount_paid decimal(10,2) DEFAULT 0.00;
  END IF;
END $$;

-- Add check constraint for payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'hackathon_registrations_payment_status_check'
  ) THEN
    ALTER TABLE hackathon_registrations 
    ADD CONSTRAINT hackathon_registrations_payment_status_check 
    CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled'));
  END IF;
END $$;

-- Create index on payment_intent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_hackathon_registrations_payment_intent 
  ON hackathon_registrations(payment_intent_id);

-- Create index on payment_status for analytics
CREATE INDEX IF NOT EXISTS idx_hackathon_registrations_payment_status 
  ON hackathon_registrations(payment_status);
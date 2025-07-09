/*
  # Create hackathon registrations table

  1. New Tables
    - `hackathon_registrations`
      - `id` (uuid, primary key)
      - `name` (text, required) - Full name of participant
      - `email` (text, required, unique) - Email address
      - `phone` (text, optional) - Phone number
      - `experience_level` (text, required) - Experience level (beginner, intermediate, advanced, expert)
      - `motivation` (text, optional) - Why they want to join
      - `tracks_interested` (text array, optional) - Array of track names they're interested in
      - `registration_type` (text, required) - Either 'free' or 'premium'
      - `created_at` (timestamp) - Registration timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Security
    - Enable RLS on `hackathon_registrations` table
    - Add policy for public insert (registration)
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS hackathon_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  experience_level text NOT NULL CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  motivation text,
  tracks_interested text[] DEFAULT '{}',
  registration_type text NOT NULL CHECK (registration_type IN ('free', 'premium')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE hackathon_registrations ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to register (insert)
CREATE POLICY "Anyone can register"
  ON hackathon_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy to allow users to read their own registration data
CREATE POLICY "Users can read own registration"
  ON hackathon_registrations
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_hackathon_registrations_email 
  ON hackathon_registrations(email);

-- Create an index on registration_type for analytics
CREATE INDEX IF NOT EXISTS idx_hackathon_registrations_type 
  ON hackathon_registrations(registration_type);

-- Create an index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_hackathon_registrations_created_at 
  ON hackathon_registrations(created_at);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_hackathon_registrations_updated_at
  BEFORE UPDATE ON hackathon_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
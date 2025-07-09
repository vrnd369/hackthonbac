/*
  # Create user profiles table for post-payment onboarding

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, foreign key to hackathon_registrations)
      - `user_id` (uuid, references auth.users if using Supabase auth)
      - `first_name` (text, required)
      - `last_name` (text, required)
      - `date_of_birth` (date, optional)
      - `gender` (text, optional)
      - `phone_number` (text, optional)
      - `country` (text, required)
      - `city` (text, required)
      - `field_of_study` (text, required)
      - `school_or_company` (text, required)
      - `current_position` (text, optional)
      - `how_heard_about_us` (text, required)
      - `profile_picture_url` (text, optional)
      - `bio` (text, optional)
      - `linkedin_url` (text, optional)
      - `github_url` (text, optional)
      - `portfolio_url` (text, optional)
      - `skills` (text array, optional)
      - `interests` (text array, optional)
      - `profile_completed` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for users to manage their own profile
    - Add policy for authenticated users to read other profiles (for networking)
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid REFERENCES hackathon_registrations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say', 'other')),
  phone_number text,
  country text NOT NULL,
  city text NOT NULL,
  field_of_study text NOT NULL,
  school_or_company text NOT NULL,
  current_position text,
  how_heard_about_us text NOT NULL CHECK (how_heard_about_us IN (
    'social-media', 'friend-referral', 'google-search', 'university', 
    'company', 'tech-community', 'newsletter', 'advertisement', 'other'
  )),
  profile_picture_url text,
  bio text,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  skills text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  profile_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to manage their own profile
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to read other profiles (for networking)
CREATE POLICY "Users can read other profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (profile_completed = true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_registration_id 
  ON user_profiles(registration_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
  ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_field_of_study 
  ON user_profiles(field_of_study);

CREATE INDEX IF NOT EXISTS idx_user_profiles_country 
  ON user_profiles(country);

CREATE INDEX IF NOT EXISTS idx_user_profiles_completed 
  ON user_profiles(profile_completed);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add profile_completed column to hackathon_registrations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hackathon_registrations' AND column_name = 'profile_completed'
  ) THEN
    ALTER TABLE hackathon_registrations ADD COLUMN profile_completed boolean DEFAULT false;
  END IF;
END $$;
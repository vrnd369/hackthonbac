/*
  # Create Teams Schema for Hackathon

  1. New Tables
    - `teams`
      - `id` (uuid, primary key)
      - `name` (text, unique, required) - Team name
      - `description` (text, optional) - Team description
      - `leader_user_profile_id` (uuid, foreign key) - Team leader reference
      - `max_members` (integer, default 4) - Maximum team size
      - `is_open` (boolean, default true) - Whether team accepts new members
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Updates
    - Add `team_id` column to `user_profiles` table
    - Add constraint to ensure team size limits

  3. Security
    - Enable RLS on `teams` table
    - Add policies for team creation, viewing, and management
    - Add policies for team membership management

  4. Indexes
    - Add indexes for performance optimization
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  leader_user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  max_members integer DEFAULT 4 CHECK (max_members >= 1 AND max_members <= 6),
  is_open boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add team_id column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable Row Level Security on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policies for teams table

-- Policy: Authenticated users can view all teams
CREATE POLICY "Authenticated users can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create teams (if they don't already have one)
CREATE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND profile_completed = true 
      AND team_id IS NULL
    )
  );

-- Policy: Team leaders can update their team
CREATE POLICY "Team leaders can update their team"
  ON teams
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND id = leader_user_profile_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND id = leader_user_profile_id
    )
  );

-- Policy: Team leaders can delete their team (only if no other members)
CREATE POLICY "Team leaders can delete empty teams"
  ON teams
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND id = leader_user_profile_id
    ) AND
    (
      SELECT COUNT(*) FROM user_profiles 
      WHERE team_id = teams.id
    ) <= 1
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_leader 
  ON teams(leader_user_profile_id);

CREATE INDEX IF NOT EXISTS idx_teams_name 
  ON teams(name);

CREATE INDEX IF NOT EXISTS idx_teams_open 
  ON teams(is_open);

CREATE INDEX IF NOT EXISTS idx_user_profiles_team_id 
  ON user_profiles(team_id);

-- Function to check team size constraints
CREATE OR REPLACE FUNCTION check_team_size_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if team would exceed max_members
  IF NEW.team_id IS NOT NULL THEN
    DECLARE
      current_members integer;
      max_allowed integer;
    BEGIN
      SELECT COUNT(*), t.max_members 
      INTO current_members, max_allowed
      FROM user_profiles up
      JOIN teams t ON t.id = NEW.team_id
      WHERE up.team_id = NEW.team_id
      GROUP BY t.max_members;
      
      IF current_members >= max_allowed THEN
        RAISE EXCEPTION 'Team has reached maximum capacity of % members', max_allowed;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce team size limits
CREATE TRIGGER enforce_team_size_limit
  BEFORE UPDATE OF team_id ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION check_team_size_limit();

-- Function to automatically set team leader's team_id when team is created
CREATE OR REPLACE FUNCTION set_leader_team_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the leader's profile to set their team_id
  UPDATE user_profiles 
  SET team_id = NEW.id, updated_at = now()
  WHERE id = NEW.leader_user_profile_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set leader's team_id after team creation
CREATE TRIGGER set_leader_team_id_trigger
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION set_leader_team_id();

-- Function to handle team leadership transfer when leader leaves
CREATE OR REPLACE FUNCTION handle_leader_departure()
RETURNS TRIGGER AS $$
BEGIN
  -- If the departing user was a team leader
  IF OLD.team_id IS NOT NULL AND NEW.team_id IS NULL THEN
    DECLARE
      team_record RECORD;
      new_leader_id uuid;
    BEGIN
      -- Get team information
      SELECT * INTO team_record FROM teams WHERE id = OLD.team_id;
      
      -- If this user was the leader
      IF team_record.leader_user_profile_id = OLD.id THEN
        -- Find another team member to become leader
        SELECT id INTO new_leader_id 
        FROM user_profiles 
        WHERE team_id = OLD.team_id 
        AND id != OLD.id 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        IF new_leader_id IS NOT NULL THEN
          -- Transfer leadership
          UPDATE teams 
          SET leader_user_profile_id = new_leader_id, updated_at = now()
          WHERE id = OLD.team_id;
        ELSE
          -- No other members, delete the team
          DELETE FROM teams WHERE id = OLD.team_id;
        END IF;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to handle leadership changes when members leave
CREATE TRIGGER handle_leader_departure_trigger
  AFTER UPDATE OF team_id ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_leader_departure();

-- Trigger to automatically update updated_at for teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view for team details with member information
CREATE OR REPLACE VIEW team_details AS
SELECT 
  t.id,
  t.name,
  t.description,
  t.max_members,
  t.is_open,
  t.created_at,
  t.updated_at,
  leader.first_name || ' ' || leader.last_name AS leader_name,
  leader.id AS leader_profile_id,
  leader.profile_picture_url AS leader_avatar,
  COUNT(members.id) AS current_members,
  ARRAY_AGG(
    CASE 
      WHEN members.id IS NOT NULL 
      THEN json_build_object(
        'id', members.id,
        'name', members.first_name || ' ' || members.last_name,
        'avatar', members.profile_picture_url,
        'field_of_study', members.field_of_study,
        'school_or_company', members.school_or_company,
        'skills', members.skills,
        'is_leader', members.id = t.leader_user_profile_id
      )
      ELSE NULL
    END
  ) FILTER (WHERE members.id IS NOT NULL) AS members
FROM teams t
JOIN user_profiles leader ON leader.id = t.leader_user_profile_id
LEFT JOIN user_profiles members ON members.team_id = t.id
GROUP BY 
  t.id, t.name, t.description, t.max_members, t.is_open, 
  t.created_at, t.updated_at, leader.first_name, leader.last_name, 
  leader.id, leader.profile_picture_url;

-- Grant necessary permissions for the view
GRANT SELECT ON team_details TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Authenticated users can view team details"
  ON team_details
  FOR SELECT
  TO authenticated
  USING (true);
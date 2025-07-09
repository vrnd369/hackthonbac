/*
  # Team Submissions System

  1. New Tables
    - `team_submissions`
      - `id` (uuid, primary key)
      - `team_id` (uuid, foreign key to teams)
      - `submitted_by_user_profile_id` (uuid, foreign key to user_profiles)
      - `executive_summary_url` (text, nullable)
      - `presentation_slides_url` (text, nullable)
      - `python_code_url` (text, nullable)
      - `video_presentation_url` (text, nullable)
      - `submission_status` (text, default 'draft')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `team_submissions` table
    - Add policies for team members to manage their submissions
    - Add indexes for performance

  3. Features
    - Each team can have only one submission record
    - Team members can view and update their team's submission
    - Automatic timestamp management
    - Submission status tracking
*/

-- Create team_submissions table
CREATE TABLE IF NOT EXISTS team_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  submitted_by_user_profile_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  executive_summary_url text,
  presentation_slides_url text,
  python_code_url text,
  video_presentation_url text,
  submission_status text DEFAULT 'draft' CHECK (submission_status IN ('draft', 'submitted', 'reviewed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure each team has only one submission record
  CONSTRAINT unique_team_submission UNIQUE (team_id)
);

-- Enable Row Level Security
ALTER TABLE team_submissions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_submissions_team_id 
  ON team_submissions(team_id);

CREATE INDEX IF NOT EXISTS idx_team_submissions_status 
  ON team_submissions(submission_status);

CREATE INDEX IF NOT EXISTS idx_team_submissions_submitted_by 
  ON team_submissions(submitted_by_user_profile_id);

-- RLS Policies

-- Policy: Team members can view their team's submission
CREATE POLICY "Team members can view their submission"
  ON team_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND team_id = team_submissions.team_id
    )
  );

-- Policy: Team members can create their team's submission
CREATE POLICY "Team members can create submission"
  ON team_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND team_id = team_submissions.team_id
      AND profile_completed = true
    )
  );

-- Policy: Team members can update their team's submission
CREATE POLICY "Team members can update submission"
  ON team_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND team_id = team_submissions.team_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND team_id = team_submissions.team_id
    )
  );

-- Policy: Team leaders can delete their team's submission
CREATE POLICY "Team leaders can delete submission"
  ON team_submissions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN teams t ON t.id = up.team_id
      WHERE up.user_id = auth.uid() 
      AND t.id = team_submissions.team_id
      AND t.leader_user_profile_id = up.id
    )
  );

-- Trigger to automatically update updated_at column
CREATE TRIGGER update_team_submissions_updated_at
  BEFORE UPDATE ON team_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate file URLs
CREATE OR REPLACE FUNCTION validate_submission_urls()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure at least one file is provided when status is 'submitted'
  IF NEW.submission_status = 'submitted' THEN
    IF NEW.executive_summary_url IS NULL AND 
       NEW.presentation_slides_url IS NULL AND 
       NEW.python_code_url IS NULL AND 
       NEW.video_presentation_url IS NULL THEN
      RAISE EXCEPTION 'At least one file must be uploaded before submitting';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate submission before insert/update
CREATE TRIGGER validate_submission_urls_trigger
  BEFORE INSERT OR UPDATE ON team_submissions
  FOR EACH ROW
  EXECUTE FUNCTION validate_submission_urls();

-- Create a view for submission details with team information
CREATE OR REPLACE VIEW submission_details AS
SELECT 
  ts.id,
  ts.team_id,
  ts.executive_summary_url,
  ts.presentation_slides_url,
  ts.python_code_url,
  ts.video_presentation_url,
  ts.submission_status,
  ts.created_at,
  ts.updated_at,
  t.name AS team_name,
  submitter.first_name || ' ' || submitter.last_name AS submitted_by_name,
  submitter.id AS submitted_by_profile_id,
  COUNT(members.id) AS team_member_count,
  ARRAY_AGG(
    CASE 
      WHEN members.id IS NOT NULL 
      THEN json_build_object(
        'id', members.id,
        'name', members.first_name || ' ' || members.last_name,
        'avatar', members.profile_picture_url
      )
      ELSE NULL
    END
  ) FILTER (WHERE members.id IS NOT NULL) AS team_members
FROM team_submissions ts
JOIN teams t ON t.id = ts.team_id
JOIN user_profiles submitter ON submitter.id = ts.submitted_by_user_profile_id
LEFT JOIN user_profiles members ON members.team_id = ts.team_id
GROUP BY 
  ts.id, ts.team_id, ts.executive_summary_url, ts.presentation_slides_url,
  ts.python_code_url, ts.video_presentation_url, ts.submission_status,
  ts.created_at, ts.updated_at, t.name, submitter.first_name, 
  submitter.last_name, submitter.id;

-- Grant permissions for the view
GRANT SELECT ON submission_details TO authenticated;

-- Add submission tracking to teams table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'has_submission'
  ) THEN
    ALTER TABLE teams ADD COLUMN has_submission boolean DEFAULT false;
  END IF;
END $$;

-- Function to update team submission status
CREATE OR REPLACE FUNCTION update_team_submission_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update team's has_submission flag
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE teams 
    SET has_submission = true, updated_at = now()
    WHERE id = NEW.team_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE teams 
    SET has_submission = false, updated_at = now()
    WHERE id = OLD.team_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update team submission status
CREATE TRIGGER update_team_submission_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON team_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_team_submission_status();

-- Create index on teams.has_submission for filtering
CREATE INDEX IF NOT EXISTS idx_teams_has_submission 
  ON teams(has_submission);
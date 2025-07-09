import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { team_name, description, max_members = 4 } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, team_id, profile_completed, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('User profile not found')
    }

    // Validate user can create a team
    if (!userProfile.profile_completed) {
      throw new Error('Profile must be completed before creating a team')
    }

    if (userProfile.team_id) {
      throw new Error('User is already in a team')
    }

    // Validate team name
    if (!team_name || team_name.trim().length < 3) {
      throw new Error('Team name must be at least 3 characters long')
    }

    if (team_name.length > 50) {
      throw new Error('Team name must be less than 50 characters')
    }

    // Validate max_members
    if (max_members < 1 || max_members > 6) {
      throw new Error('Team size must be between 1 and 6 members')
    }

    // Check if team name is already taken
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('id')
      .eq('name', team_name.trim())
      .single()

    if (existingTeam) {
      throw new Error('Team name is already taken')
    }

    // Create the team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert([{
        name: team_name.trim(),
        description: description?.trim() || null,
        leader_user_profile_id: userProfile.id,
        max_members: max_members,
        is_open: true,
      }])
      .select()
      .single()

    if (teamError) {
      throw teamError
    }

    // Get the complete team details
    const { data: teamDetails, error: detailsError } = await supabase
      .from('team_details')
      .select('*')
      .eq('id', team.id)
      .single()

    if (detailsError) {
      console.error('Error fetching team details:', detailsError)
      // Don't throw here, team was created successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        team: teamDetails || team,
        message: `Team "${team_name}" created successfully!`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating team:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
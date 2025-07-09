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
    const { team_id, team_name } = await req.json()

    if (!team_id && !team_name) {
      throw new Error('Either team_id or team_name is required')
    }

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

    // Validate user can join a team
    if (!userProfile.profile_completed) {
      throw new Error('Profile must be completed before joining a team')
    }

    if (userProfile.team_id) {
      throw new Error('User is already in a team')
    }

    // Find the team
    let teamQuery = supabase
      .from('teams')
      .select('id, name, max_members, is_open, leader_user_profile_id')

    if (team_id) {
      teamQuery = teamQuery.eq('id', team_id)
    } else {
      teamQuery = teamQuery.eq('name', team_name)
    }

    const { data: team, error: teamError } = await teamQuery.single()

    if (teamError || !team) {
      throw new Error('Team not found')
    }

    // Check if team is open for new members
    if (!team.is_open) {
      throw new Error('Team is not accepting new members')
    }

    // Check if user is trying to join their own team (shouldn't happen, but safety check)
    if (team.leader_user_profile_id === userProfile.id) {
      throw new Error('You are already the leader of this team')
    }

    // Check current team size
    const { data: currentMembers, error: membersError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('team_id', team.id)

    if (membersError) {
      throw new Error('Error checking team capacity')
    }

    if (currentMembers.length >= team.max_members) {
      throw new Error('Team has reached maximum capacity')
    }

    // Join the team
    const { error: joinError } = await supabase
      .from('user_profiles')
      .update({ 
        team_id: team.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id)

    if (joinError) {
      throw joinError
    }

    // Get updated team details
    const { data: teamDetails, error: detailsError } = await supabase
      .from('team_details')
      .select('*')
      .eq('id', team.id)
      .single()

    if (detailsError) {
      console.error('Error fetching team details:', detailsError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        team: teamDetails,
        message: `Successfully joined team "${team.name}"!`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error joining team:', error)
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
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

    // Get user profile with team information
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id, 
        team_id, 
        first_name, 
        last_name,
        teams!inner(
          id,
          name,
          leader_user_profile_id
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('User profile not found')
    }

    if (!userProfile.team_id) {
      throw new Error('User is not in a team')
    }

    const team = userProfile.teams
    const isLeader = team.leader_user_profile_id === userProfile.id

    // Remove user from team
    const { error: leaveError } = await supabase
      .from('user_profiles')
      .update({ 
        team_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userProfile.id)

    if (leaveError) {
      throw leaveError
    }

    let message = `Successfully left team "${team.name}"`

    // If user was the leader, the trigger will handle leadership transfer or team deletion
    if (isLeader) {
      // Check if team still exists (might have been deleted if no other members)
      const { data: remainingTeam } = await supabase
        .from('teams')
        .select('id, leader_user_profile_id')
        .eq('id', team.id)
        .single()

      if (remainingTeam) {
        message += '. Leadership has been transferred to another member.'
      } else {
        message += '. Team has been disbanded as there were no other members.'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: message,
        was_leader: isLeader,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error leaving team:', error)
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
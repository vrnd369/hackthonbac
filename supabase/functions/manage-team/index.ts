import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, team_id, member_id, updates } = await req.json()

    if (!action) {
      throw new Error('Action is required')
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

    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, team_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('User profile not found')
    }

    // Verify user is team leader for management actions
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('id, name, leader_user_profile_id')
      .eq('id', team_id || userProfile.team_id)
      .single()

    if (teamError || !team) {
      throw new Error('Team not found')
    }

    const isLeader = team.leader_user_profile_id === userProfile.id

    switch (action) {
      case 'update_team':
        if (!isLeader) {
          throw new Error('Only team leaders can update team details')
        }

        const { error: updateError } = await supabase
          .from('teams')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', team.id)

        if (updateError) {
          throw updateError
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Team updated successfully',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'remove_member':
        if (!isLeader) {
          throw new Error('Only team leaders can remove members')
        }

        if (!member_id) {
          throw new Error('Member ID is required')
        }

        if (member_id === userProfile.id) {
          throw new Error('Leaders cannot remove themselves. Use leave team instead.')
        }

        // Verify member is in the team
        const { data: member, error: memberError } = await supabase
          .from('user_profiles')
          .select('id, team_id, first_name, last_name')
          .eq('id', member_id)
          .eq('team_id', team.id)
          .single()

        if (memberError || !member) {
          throw new Error('Member not found in team')
        }

        // Remove member from team
        const { error: removeError } = await supabase
          .from('user_profiles')
          .update({ 
            team_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', member_id)

        if (removeError) {
          throw removeError
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `${member.first_name} ${member.last_name} has been removed from the team`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'transfer_leadership':
        if (!isLeader) {
          throw new Error('Only team leaders can transfer leadership')
        }

        if (!member_id) {
          throw new Error('New leader ID is required')
        }

        // Verify new leader is in the team
        const { data: newLeader, error: newLeaderError } = await supabase
          .from('user_profiles')
          .select('id, team_id, first_name, last_name')
          .eq('id', member_id)
          .eq('team_id', team.id)
          .single()

        if (newLeaderError || !newLeader) {
          throw new Error('New leader not found in team')
        }

        // Transfer leadership
        const { error: transferError } = await supabase
          .from('teams')
          .update({ 
            leader_user_profile_id: member_id,
            updated_at: new Date().toISOString()
          })
          .eq('id', team.id)

        if (transferError) {
          throw transferError
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Leadership transferred to ${newLeader.first_name} ${newLeader.last_name}`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      case 'disband_team':
        if (!isLeader) {
          throw new Error('Only team leaders can disband teams')
        }

        // Remove all members from team first
        const { error: removeMembersError } = await supabase
          .from('user_profiles')
          .update({ 
            team_id: null,
            updated_at: new Date().toISOString()
          })
          .eq('team_id', team.id)

        if (removeMembersError) {
          throw removeMembersError
        }

        // Delete the team
        const { error: deleteError } = await supabase
          .from('teams')
          .delete()
          .eq('id', team.id)

        if (deleteError) {
          throw deleteError
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `Team "${team.name}" has been disbanded`,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error managing team:', error)
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
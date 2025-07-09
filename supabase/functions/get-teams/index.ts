import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search')
    const openOnly = url.searchParams.get('open_only') === 'true'
    const hasSpace = url.searchParams.get('has_space') === 'true'

    let query = supabase
      .from('team_details')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (openOnly) {
      query = query.eq('is_open', true)
    }

    if (hasSpace) {
      query = query.lt('current_members', 'max_members')
    }

    const { data: teams, error } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('teams')
      .select('*', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`)
    }
    if (openOnly) {
      countQuery = countQuery.eq('is_open', true)
    }

    const { count: totalCount } = await countQuery

    // Get team statistics
    const { data: allTeams } = await supabase
      .from('team_details')
      .select('current_members, max_members, is_open')

    const stats = {
      total_teams: allTeams?.length || 0,
      open_teams: allTeams?.filter(t => t.is_open).length || 0,
      full_teams: allTeams?.filter(t => t.current_members >= t.max_members).length || 0,
      average_team_size: allTeams?.length ? 
        (allTeams.reduce((sum, t) => sum + t.current_members, 0) / allTeams.length).toFixed(1) : 0,
    }

    return new Response(
      JSON.stringify({
        teams,
        total: totalCount,
        limit,
        offset,
        statistics: stats,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching teams:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
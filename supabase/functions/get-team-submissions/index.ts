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
    const teamId = url.searchParams.get('team_id')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const status = url.searchParams.get('status')

    let query = supabase
      .from('submission_details')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    if (status) {
      query = query.eq('submission_status', status)
    }

    const { data: submissions, error } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('team_submissions')
      .select('*', { count: 'exact', head: true })

    if (teamId) {
      countQuery = countQuery.eq('team_id', teamId)
    }
    if (status) {
      countQuery = countQuery.eq('submission_status', status)
    }

    const { count: totalCount } = await countQuery

    // Get submission statistics
    const { data: allSubmissions } = await supabase
      .from('team_submissions')
      .select('submission_status, created_at')

    const stats = {
      total_submissions: allSubmissions?.length || 0,
      draft_submissions: allSubmissions?.filter(s => s.submission_status === 'draft').length || 0,
      submitted_submissions: allSubmissions?.filter(s => s.submission_status === 'submitted').length || 0,
      reviewed_submissions: allSubmissions?.filter(s => s.submission_status === 'reviewed').length || 0,
    }

    // Calculate submission timeline (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    const dailySubmissions = last7Days.reduce((acc, date) => {
      acc[date] = allSubmissions?.filter(s => 
        s.created_at && s.created_at.startsWith(date)
      ).length || 0
      return acc
    }, {} as Record<string, number>)

    return new Response(
      JSON.stringify({
        submissions,
        total: totalCount,
        limit,
        offset,
        statistics: {
          ...stats,
          daily_submissions: dailySubmissions,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching team submissions:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
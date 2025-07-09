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
    const field = url.searchParams.get('field')
    const country = url.searchParams.get('country')
    const skills = url.searchParams.get('skills')

    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        first_name,
        last_name,
        country,
        city,
        field_of_study,
        school_or_company,
        current_position,
        profile_picture_url,
        bio,
        linkedin_url,
        github_url,
        portfolio_url,
        skills,
        interests,
        created_at,
        hackathon_registrations!inner(
          registration_type,
          tracks_interested
        )
      `)
      .eq('profile_completed', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,school_or_company.ilike.%${search}%`)
    }

    if (field) {
      query = query.eq('field_of_study', field)
    }

    if (country) {
      query = query.eq('country', country)
    }

    if (skills) {
      const skillsArray = skills.split(',')
      query = query.overlaps('skills', skillsArray)
    }

    const { data: profiles, error } = await query

    if (error) {
      throw error
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('profile_completed', true)

    // Apply same filters for count
    if (search) {
      countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,school_or_company.ilike.%${search}%`)
    }
    if (field) {
      countQuery = countQuery.eq('field_of_study', field)
    }
    if (country) {
      countQuery = countQuery.eq('country', country)
    }
    if (skills) {
      const skillsArray = skills.split(',')
      countQuery = countQuery.overlaps('skills', skillsArray)
    }

    const { count: totalCount } = await countQuery

    // Get aggregated statistics
    const { data: stats } = await supabase
      .from('user_profiles')
      .select('field_of_study, country, skills')
      .eq('profile_completed', true)

    const fieldStats = stats?.reduce((acc, profile) => {
      acc[profile.field_of_study] = (acc[profile.field_of_study] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const countryStats = stats?.reduce((acc, profile) => {
      acc[profile.country] = (acc[profile.country] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const skillStats = stats?.flatMap(profile => profile.skills || [])
      .reduce((acc, skill) => {
        acc[skill] = (acc[skill] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}

    return new Response(
      JSON.stringify({
        profiles,
        total: totalCount,
        limit,
        offset,
        statistics: {
          fields: fieldStats,
          countries: countryStats,
          skills: skillStats,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching user profiles:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
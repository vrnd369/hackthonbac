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
    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get registration statistics
    const { data: registrations, error } = await supabase
      .from('hackathon_registrations')
      .select('registration_type, payment_status, experience_level, tracks_interested, created_at')

    if (error) {
      throw error
    }

    // Calculate analytics
    const analytics = {
      total_registrations: registrations.length,
      free_registrations: registrations.filter(r => r.registration_type === 'free').length,
      premium_registrations: registrations.filter(r => r.registration_type === 'premium').length,
      completed_payments: registrations.filter(r => r.payment_status === 'completed').length,
      pending_payments: registrations.filter(r => r.payment_status === 'pending').length,
      failed_payments: registrations.filter(r => r.payment_status === 'failed').length,
      
      // Experience level breakdown
      experience_breakdown: {
        beginner: registrations.filter(r => r.experience_level === 'beginner').length,
        intermediate: registrations.filter(r => r.experience_level === 'intermediate').length,
        advanced: registrations.filter(r => r.experience_level === 'advanced').length,
        expert: registrations.filter(r => r.experience_level === 'expert').length,
      },
      
      // Track popularity
      track_popularity: {},
      
      // Revenue calculation
      total_revenue: registrations
        .filter(r => r.registration_type === 'premium' && r.payment_status === 'completed')
        .length * 10,
      
      // Registration timeline (last 7 days)
      daily_registrations: {},
    }

    // Calculate track popularity
    const allTracks = registrations.flatMap(r => r.tracks_interested || [])
    const trackCounts = allTracks.reduce((acc, track) => {
      acc[track] = (acc[track] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    analytics.track_popularity = trackCounts

    // Calculate daily registrations for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split('T')[0]
    }).reverse()

    analytics.daily_registrations = last7Days.reduce((acc, date) => {
      acc[date] = registrations.filter(r => 
        r.created_at && r.created_at.startsWith(date)
      ).length
      return acc
    }, {} as Record<string, number>)

    return new Response(
      JSON.stringify(analytics),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
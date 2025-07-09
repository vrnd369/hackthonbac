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

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const fileType = formData.get('file_type') as string
    const teamId = formData.get('team_id') as string

    if (!file) {
      throw new Error('No file provided')
    }

    if (!fileType) {
      throw new Error('File type is required')
    }

    if (!teamId) {
      throw new Error('Team ID is required')
    }

    // Validate file type
    const validFileTypes = ['executive_summary', 'presentation_slides', 'python_code', 'video_presentation']
    if (!validFileTypes.includes(fileType)) {
      throw new Error('Invalid file type')
    }

    // Get user profile and verify team membership
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, team_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw new Error('User profile not found')
    }

    if (userProfile.team_id !== teamId) {
      throw new Error('User is not a member of this team')
    }

    // Validate file based on type
    const fileValidation = validateFile(file, fileType)
    if (!fileValidation.valid) {
      throw new Error(fileValidation.error)
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${fileType}_${timestamp}.${fileExt}`
    const filePath = `${teamId}/${fileName}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-submissions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-submissions')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file')
    }

    // Update or create team submission record
    const updateData: any = {
      [`${fileType}_url`]: urlData.publicUrl,
      updated_at: new Date().toISOString()
    }

    // Check if submission record exists
    const { data: existingSubmission, error: fetchError } = await supabase
      .from('team_submissions')
      .select('id')
      .eq('team_id', teamId)
      .single()

    let submissionData

    if (existingSubmission) {
      // Update existing submission
      const { data, error } = await supabase
        .from('team_submissions')
        .update(updateData)
        .eq('team_id', teamId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update submission: ${error.message}`)
      }
      submissionData = data
    } else {
      // Create new submission
      const { data, error } = await supabase
        .from('team_submissions')
        .insert([{
          team_id: teamId,
          submitted_by_user_profile_id: userProfile.id,
          ...updateData
        }])
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create submission: ${error.message}`)
      }
      submissionData = data
    }

    return new Response(
      JSON.stringify({
        success: true,
        file_url: urlData.publicUrl,
        file_path: filePath,
        file_type: fileType,
        submission: submissionData,
        message: `${getFileTypeDisplayName(fileType)} uploaded successfully`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error uploading project file:', error)
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

// File validation function
function validateFile(file: File, fileType: string): { valid: boolean; error?: string } {
  const maxSize = 100 * 1024 * 1024 // 100MB
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large. Maximum size is 100MB.' }
  }

  const allowedTypes: Record<string, string[]> = {
    executive_summary: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    presentation_slides: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    python_code: ['text/plain', 'text/x-python', 'application/x-python-code', 'text/x-script.python'],
    video_presentation: ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/webm']
  }

  const validMimeTypes = allowedTypes[fileType]
  if (!validMimeTypes) {
    return { valid: false, error: 'Invalid file type specified' }
  }

  // Check file extension as backup
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  const validExtensions: Record<string, string[]> = {
    executive_summary: ['pdf', 'doc', 'docx'],
    presentation_slides: ['pdf', 'ppt', 'pptx'],
    python_code: ['py', 'ipynb', 'txt'],
    video_presentation: ['mp4', 'avi', 'mov', 'webm']
  }

  const allowedExtensions = validExtensions[fileType]
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    return { 
      valid: false, 
      error: `Invalid file extension. Allowed extensions for ${getFileTypeDisplayName(fileType)}: ${allowedExtensions.join(', ')}` 
    }
  }

  // Additional size limits for specific file types
  if (fileType === 'video_presentation' && file.size > 500 * 1024 * 1024) { // 500MB for videos
    return { valid: false, error: 'Video files must be under 500MB' }
  }

  if (fileType === 'python_code' && file.size > 10 * 1024 * 1024) { // 10MB for code
    return { valid: false, error: 'Code files must be under 10MB' }
  }

  return { valid: true }
}

// Helper function to get display name for file types
function getFileTypeDisplayName(fileType: string): string {
  const displayNames: Record<string, string> = {
    executive_summary: 'Executive Summary',
    presentation_slides: 'Presentation Slides',
    python_code: 'Python Code',
    video_presentation: 'Video Presentation'
  }
  return displayNames[fileType] || fileType
}
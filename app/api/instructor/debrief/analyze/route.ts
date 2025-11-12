import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeDebriefTranscription, transcribeAudioBase64, DebriefAnalysisRequest } from '@/lib/openai-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for OpenAI response

/**
 * POST /api/instructor/debrief/analyze
 * Analyze a debrief transcription or transcribe audio and analyze
 * Body: { 
 *   transcription?: string, 
 *   audioBase64?: string,
 *   missionId: string,
 *   studentId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(await cookies())
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an instructor
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)

    const isInstructor = userRoles?.some((ur: any) => 
      ['instructor', 'admin'].includes(ur.role?.name)
    )

    if (!isInstructor) {
      return NextResponse.json({ error: 'Instructor access required' }, { status: 403 })
    }

    const body = await request.json()
    const { transcription, audioBase64, missionId, studentId } = body

    if (!missionId || !studentId) {
      return NextResponse.json({ 
        error: 'Missing required fields: missionId, studentId' 
      }, { status: 400 })
    }

    if (!transcription && !audioBase64) {
      return NextResponse.json({ 
        error: 'Must provide either transcription or audioBase64' 
      }, { status: 400 })
    }

    // Fetch mission details
    const { data: mission, error: missionError } = await supabase
      .from('missions')
      .select(`
        *,
        plan_of_action:plans_of_action(*),
        student:profiles!student_id(first_name, last_name)
      `)
      .eq('id', missionId)
      .single()

    if (missionError || !mission) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    // Verify instructor owns this mission
    if (mission.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized for this mission' }, { status: 403 })
    }

    // Step 1: Get transcription (either provided or transcribe audio)
    let finalTranscription = transcription

    if (!finalTranscription && audioBase64) {
      try {
        console.log('Transcribing audio with Whisper...')
        finalTranscription = await transcribeAudioBase64(audioBase64)
        console.log('Transcription complete:', finalTranscription.substring(0, 100) + '...')
      } catch (error) {
        console.error('Error transcribing audio:', error)
        return NextResponse.json({ 
          error: 'Failed to transcribe audio. Please try again or provide text.' 
        }, { status: 500 })
      }
    }

    if (!finalTranscription || finalTranscription.trim().length === 0) {
      return NextResponse.json({ 
        error: 'No transcription available' 
      }, { status: 400 })
    }

    // Step 2: Extract planned objectives from POA
    const plannedObjectives = mission.plan_of_action?.objectives || []

    // Step 3: Analyze debrief with AI
    const analysisRequest: DebriefAnalysisRequest = {
      transcription: finalTranscription,
      missionType: mission.mission_type,
      plannedObjectives,
      studentName: `${mission.student.first_name} ${mission.student.last_name}`,
    }

    const analysis = await analyzeDebriefTranscription(analysisRequest)

    return NextResponse.json({ 
      success: true,
      transcription: finalTranscription,
      analysis 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error analyzing debrief:', error)
    
    if (error.message.includes('API key')) {
      return NextResponse.json({ 
        error: 'OpenAI API is not configured. Please contact support.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to analyze debrief' 
    }, { status: 500 })
  }
}

/**
 * POST /api/instructor/debrief/transcribe
 * Transcribe audio only (without analysis)
 * Body: { audioBase64: string }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient(await cookies())
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is an instructor
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', user.id)

    const isInstructor = userRoles?.some((ur: any) => 
      ['instructor', 'admin'].includes(ur.role?.name)
    )

    if (!isInstructor) {
      return NextResponse.json({ error: 'Instructor access required' }, { status: 403 })
    }

    const body = await request.json()
    const { audioBase64 } = body

    if (!audioBase64) {
      return NextResponse.json({ 
        error: 'Missing required field: audioBase64' 
      }, { status: 400 })
    }

    try {
      const transcription = await transcribeAudioBase64(audioBase64)
      return NextResponse.json({ 
        success: true,
        transcription 
      }, { status: 200 })
    } catch (error) {
      console.error('Error transcribing audio:', error)
      return NextResponse.json({ 
        error: 'Failed to transcribe audio' 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error in transcription endpoint:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}



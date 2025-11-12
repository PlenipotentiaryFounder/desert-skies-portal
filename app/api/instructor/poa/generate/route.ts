import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { generatePlanOfAction, POAGenerationRequest } from '@/lib/openai-service'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for OpenAI response

/**
 * POST /api/instructor/poa/generate
 * Generate a Plan of Action using AI based on mission details
 * Body: POAGenerationRequest
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
    
    // Validate required fields
    if (!body.missionType || !body.lessonTitle || !body.studentName || !body.studentLevel) {
      return NextResponse.json({ 
        error: 'Missing required fields: missionType, lessonTitle, studentName, studentLevel' 
      }, { status: 400 })
    }

    // Optional: Fetch additional context from database (e.g., student's previous lessons)
    if (body.studentId) {
      try {
        // Get student's recent lessons
        const { data: recentMissions } = await supabase
          .from('missions')
          .select('lesson_template:lesson_templates(title)')
          .eq('student_id', body.studentId)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(5)

        if (recentMissions && recentMissions.length > 0) {
          body.previousLessons = recentMissions
            .map((m: any) => m.lesson_template?.title)
            .filter(Boolean)
        }

        // Get student's areas needing improvement from recent debriefs
        const { data: recentDebriefs } = await supabase
          .from('debriefs')
          .select('areas_for_improvement')
          .eq('student_id', body.studentId)
          .order('created_at', { ascending: false })
          .limit(3)

        if (recentDebriefs && recentDebriefs.length > 0) {
          const allAreas: string[] = []
          recentDebriefs.forEach((d: any) => {
            if (d.areas_for_improvement && Array.isArray(d.areas_for_improvement)) {
              allAreas.push(...d.areas_for_improvement)
            }
          })
          if (allAreas.length > 0) {
            body.studentWeaknesses = [...new Set(allAreas)] // Remove duplicates
          }
        }
      } catch (dbError) {
        console.error('Error fetching student context:', dbError)
        // Continue without context if DB query fails
      }
    }

    // Generate POA using OpenAI
    const poaRequest: POAGenerationRequest = {
      missionType: body.missionType,
      lessonTitle: body.lessonTitle,
      lessonDescription: body.lessonDescription,
      acsStandards: body.acsStandards,
      studentName: body.studentName,
      studentLevel: body.studentLevel,
      previousLessons: body.previousLessons,
      studentWeaknesses: body.studentWeaknesses,
      aircraftType: body.aircraftType,
      weather: body.weather,
      additionalContext: body.additionalContext,
    }

    const poa = await generatePlanOfAction(poaRequest)

    return NextResponse.json({ 
      success: true,
      poa 
    }, { status: 200 })

  } catch (error: any) {
    console.error('Error generating POA:', error)
    
    if (error.message.includes('API key')) {
      return NextResponse.json({ 
        error: 'OpenAI API is not configured. Please contact support.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      error: error.message || 'Failed to generate Plan of Action' 
    }, { status: 500 })
  }
}



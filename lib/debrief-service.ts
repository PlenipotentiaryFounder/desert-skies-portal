"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// ============================================================================
// TYPES
// ============================================================================

export interface Debrief {
  id: string
  mission_id: string
  student_id: string
  instructor_id: string
  flight_number: number | null
  maneuvers_covered: string[] | null // UUIDs
  maneuver_details: ManeuverDetail[] | null
  far_references: FARReference[] | null
  acs_tasks_covered: string[] | null // UUIDs
  acs_task_details: ACSTaskDetail[] | null
  general_overview: string | null
  key_takeaways: KeyTakeaway[] | null
  next_lesson_plan: string | null
  raw_transcript: string | null
  transcript_duration_seconds: number | null
  ai_formatted: boolean
  ai_model_used: string | null
  ai_confidence_score: number | null
  ai_processing_time_ms: number | null
  created_at: string
  updated_at: string
  
  // Populated fields
  mission?: {
    id: string
    mission_code: string
    mission_type: string
    scheduled_date: string
  }
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  instructor?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export interface ManeuverDetail {
  maneuver_id: string
  maneuver_name: string
  acs_task_code: string | null
  score: number // 1-4
  performance_level: "unsatisfactory" | "progressing" | "proficient" | "exceptional"
  notes: string
  far_references: string[]
  strengths: string[]
  areas_for_improvement: string[]
  acs_standard_met: boolean
}

export interface FARReference {
  reference: string // e.g., "§61.107(b)(1)(iv)"
  description: string
  context: string // How it was discussed in the debrief
}

export interface ACSTaskDetail {
  acs_task_id: string
  task_code: string // e.g., "PA.V.B"
  task_title: string
  proficiency_level: "unsatisfactory" | "progressing" | "proficient" | "exceptional"
  notes: string
}

export interface KeyTakeaway {
  category: "strength" | "improvement" | "correction"
  observation: string
  evidence: string // What was observed
  coaching: string // Instructor guidance
  priority: "high" | "medium" | "low"
}

export interface DebriefFormData {
  mission_id: string
  student_id: string
  instructor_id: string
  flight_number?: number
  general_overview?: string
  key_takeaways?: KeyTakeaway[]
  maneuver_details?: ManeuverDetail[]
  far_references?: FARReference[]
  acs_task_details?: ACSTaskDetail[]
  next_lesson_plan?: string
  raw_transcript?: string
  transcript_duration_seconds?: number
}

export interface AIFormatRequest {
  raw_transcript: string
  mission_id: string
  maneuvers_practiced?: string[] // Maneuver UUIDs
  acs_tasks_covered?: string[] // ACS task UUIDs
}

export interface AIFormattedDebrief {
  general_overview: string
  key_takeaways: KeyTakeaway[]
  maneuver_details: ManeuverDetail[]
  far_references: FARReference[]
  acs_task_details: ACSTaskDetail[]
  next_lesson_plan: string
  formatting_metadata: {
    model: string
    processing_time_ms: number
    confidence_score: number
    warnings: string[]
  }
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a debrief
 */
export async function createDebrief(
  formData: DebriefFormData
): Promise<{ success: boolean; data?: Debrief; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    // Extract maneuver IDs from maneuver_details
    const maneuversCovered = formData.maneuver_details?.map(m => m.maneuver_id) || []
    const acsTasksCovered = formData.acs_task_details?.map(a => a.acs_task_id) || []

    const debriefData = {
      ...formData,
      maneuvers_covered: maneuversCovered,
      acs_tasks_covered: acsTasksCovered,
      ai_formatted: false,
    }

    const { data, error } = await supabase
      .from("debriefs")
      .insert(debriefData)
      .select()
      .single()

    if (error) {
      console.error("Error creating debrief:", error)
      return { success: false, error: error.message }
    }

    // Update mission with debrief reference
    await supabase
      .from("missions")
      .update({ debrief_id: data.id })
      .eq("id", formData.mission_id)

    // Update student maneuver progress
    if (formData.maneuver_details && formData.maneuver_details.length > 0) {
      await updateStudentManeuverProgress(
        formData.student_id,
        formData.mission_id,
        formData.maneuver_details
      )
    }

    revalidatePath(`/instructor/missions/${formData.mission_id}`)
    revalidatePath(`/student/missions/${formData.mission_id}`)

    return { success: true, data: data as Debrief }
  } catch (error) {
    console.error("Error in createDebrief:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get debrief by ID
 */
export async function getDebriefById(
  debriefId: string
): Promise<Debrief | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("debriefs")
      .select(`
        *,
        mission:mission_id (
          id,
          mission_code,
          mission_type,
          scheduled_date
        ),
        student:student_id (
          id,
          first_name,
          last_name,
          email
        ),
        instructor:instructor_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("id", debriefId)
      .single()

    if (error) {
      console.error("Error fetching debrief:", error)
      return null
    }

    return data as Debrief
  } catch (error) {
    console.error("Error in getDebriefById:", error)
    return null
  }
}

/**
 * Get debrief by mission ID
 */
export async function getDebriefByMissionId(
  missionId: string
): Promise<Debrief | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("debriefs")
      .select(`
        *,
        mission:mission_id (
          id,
          mission_code,
          mission_type,
          scheduled_date
        ),
        student:student_id (
          id,
          first_name,
          last_name,
          email
        ),
        instructor:instructor_id (
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("mission_id", missionId)
      .single()

    if (error) {
      console.error("Error fetching debrief:", error)
      return null
    }

    return data as Debrief
  } catch (error) {
    console.error("Error in getDebriefByMissionId:", error)
    return null
  }
}

/**
 * Update a debrief
 */
export async function updateDebrief(
  debriefId: string,
  updates: Partial<Debrief>
): Promise<{ success: boolean; data?: Debrief; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("debriefs")
      .update(updates)
      .eq("id", debriefId)
      .select()
      .single()

    if (error) {
      console.error("Error updating debrief:", error)
      return { success: false, error: error.message }
    }

    const debrief = data as Debrief
    revalidatePath(`/instructor/missions/${debrief.mission_id}`)
    revalidatePath(`/student/missions/${debrief.mission_id}`)

    return { success: true, data: debrief }
  } catch (error) {
    console.error("Error in updateDebrief:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get student's debrief history
 */
export async function getStudentDebriefHistory(
  studentId: string,
  limit: number = 10
): Promise<Debrief[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("debriefs")
      .select(`
        *,
        mission:mission_id (
          id,
          mission_code,
          mission_type,
          scheduled_date
        ),
        instructor:instructor_id (
          id,
          first_name,
          last_name
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching debrief history:", error)
      return []
    }

    return data as Debrief[]
  } catch (error) {
    console.error("Error in getStudentDebriefHistory:", error)
    return []
  }
}

// ============================================================================
// AI FORMATTING
// ============================================================================

/**
 * Get maneuver details from database
 */
async function getManeuverDetails(
  maneuverIds: string[]
): Promise<Map<string, { name: string; category: string; acs_code: string }>> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: maneuvers } = await supabase
      .from("maneuvers")
      .select("id, name, category, primary_acs_task_code")
      .in("id", maneuverIds)

    const maneuverMap = new Map()
    
    if (maneuvers) {
      for (const m of maneuvers) {
        maneuverMap.set(m.id, {
          name: m.name,
          category: m.category,
          acs_code: m.primary_acs_task_code,
        })
      }
    }

    return maneuverMap
  } catch (error) {
    console.error("Error getting maneuver details:", error)
    return new Map()
  }
}

/**
 * Get ACS task details from database
 */
async function getACSTaskDetails(
  taskIds: string[]
): Promise<Map<string, { code: string; title: string }>> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: tasks } = await supabase
      .from("acs_tasks")
      .select("id, code, title")
      .in("id", taskIds)

    const taskMap = new Map()
    
    if (tasks) {
      for (const t of tasks) {
        taskMap.set(t.id, {
          code: t.code,
          title: t.title,
        })
      }
    }

    return taskMap
  } catch (error) {
    console.error("Error getting ACS task details:", error)
    return new Map()
  }
}

/**
 * Format debrief using AI (placeholder - will be implemented with actual AI)
 */
export async function formatDebriefWithAI(
  request: AIFormatRequest
): Promise<{ success: boolean; data?: AIFormattedDebrief; error?: string }> {
  try {
    const startTime = Date.now()

    // Get maneuver and ACS task details
    const maneuverMap = request.maneuvers_practiced
      ? await getManeuverDetails(request.maneuvers_practiced)
      : new Map()

    const acsTaskMap = request.acs_tasks_covered
      ? await getACSTaskDetails(request.acs_tasks_covered)
      : new Map()

    // ========================================================================
    // AI FORMATTING PLACEHOLDER
    // ========================================================================
    // In a real implementation, this would call OpenAI/Claude API with:
    // - Raw transcript
    // - Mission context
    // - Maneuvers practiced
    // - ACS tasks covered
    // 
    // The AI would:
    // 1. Extract key observations and insights
    // 2. Identify maneuver performance levels
    // 3. Extract FAR references mentioned
    // 4. Categorize feedback (strengths/improvements)
    // 5. Generate structured next steps
    // 
    // For now, we'll generate a structured template
    // ========================================================================

    // Parse transcript for basic insights
    const transcript = request.raw_transcript.toLowerCase()

    // Generate general overview
    const generalOverview = request.raw_transcript.split('\n')[0] || 
      "Flight debrief covering maneuvers and procedures as discussed."

    // Generate key takeaways (placeholder)
    const keyTakeaways: KeyTakeaway[] = [
      {
        category: "strength",
        observation: "Demonstrated good situational awareness",
        evidence: "Maintained awareness of traffic and airspace",
        coaching: "Continue this level of awareness in future flights",
        priority: "medium",
      },
      {
        category: "improvement",
        observation: "Altitude control during maneuvers",
        evidence: "Altitude deviations exceeded ACS standards",
        coaching: "Focus on trim and power management",
        priority: "high",
      },
    ]

    // Generate maneuver details
    const maneuverDetails: ManeuverDetail[] = []
    for (const [id, details] of maneuverMap) {
      maneuverDetails.push({
        maneuver_id: id,
        maneuver_name: details.name,
        acs_task_code: details.acs_code,
        score: 3, // Default to proficient
        performance_level: "proficient",
        notes: `Performed ${details.name} with good technique`,
        far_references: [],
        strengths: ["Good coordination", "Proper entry technique"],
        areas_for_improvement: ["Maintain altitude tolerance"],
        acs_standard_met: true,
      })
    }

    // Generate FAR references (placeholder)
    const farReferences: FARReference[] = [
      {
        reference: "§61.107(b)(1)",
        description: "Private pilot aeronautical knowledge areas",
        context: "Discussed during ground portion of debrief",
      },
    ]

    // Generate ACS task details
    const acsTaskDetails: ACSTaskDetail[] = []
    for (const [id, details] of acsTaskMap) {
      acsTaskDetails.push({
        acs_task_id: id,
        task_code: details.code,
        task_title: details.title,
        proficiency_level: "proficient",
        notes: `Demonstrated proficiency in ${details.title}`,
      })
    }

    // Generate next lesson plan
    const nextLessonPlan = 
      "Continue building proficiency in core maneuvers. " +
      "Focus on altitude control and ACS tolerances. " +
      "Prepare for stage check on next flight."

    const processingTimeMs = Date.now() - startTime

    const formattedDebrief: AIFormattedDebrief = {
      general_overview: generalOverview,
      key_takeaways: keyTakeaways,
      maneuver_details: maneuverDetails,
      far_references: farReferences,
      acs_task_details: acsTaskDetails,
      next_lesson_plan: nextLessonPlan,
      formatting_metadata: {
        model: "template-based-v1", // Will be "gpt-4" or "claude-3-opus"
        processing_time_ms: processingTimeMs,
        confidence_score: 0.82,
        warnings: [],
      },
    }

    return { success: true, data: formattedDebrief }
  } catch (error) {
    console.error("Error formatting debrief with AI:", error)
    return { success: false, error: "Failed to format debrief" }
  }
}

/**
 * Create debrief from voice transcript using AI
 */
export async function createDebriefFromTranscript(
  missionId: string,
  studentId: string,
  instructorId: string,
  rawTranscript: string,
  transcriptDurationSeconds: number,
  maneuversPracticed?: string[],
  acsTasksCovered?: string[]
): Promise<{ success: boolean; data?: Debrief; error?: string }> {
  try {
    // Format with AI
    const formatResult = await formatDebriefWithAI({
      raw_transcript: rawTranscript,
      mission_id: missionId,
      maneuvers_practiced: maneuversPracticed,
      acs_tasks_covered: acsTasksCovered,
    })

    if (!formatResult.success || !formatResult.data) {
      return {
        success: false,
        error: formatResult.error || "Failed to format debrief",
      }
    }

    const aiDebrief = formatResult.data

    // Create debrief record
    const formData: DebriefFormData = {
      mission_id: missionId,
      student_id: studentId,
      instructor_id: instructorId,
      general_overview: aiDebrief.general_overview,
      key_takeaways: aiDebrief.key_takeaways,
      maneuver_details: aiDebrief.maneuver_details,
      far_references: aiDebrief.far_references,
      acs_task_details: aiDebrief.acs_task_details,
      next_lesson_plan: aiDebrief.next_lesson_plan,
      raw_transcript: rawTranscript,
      transcript_duration_seconds: transcriptDurationSeconds,
    }

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const maneuversCovered = aiDebrief.maneuver_details.map(m => m.maneuver_id)
    const acsTasksCoveredIds = aiDebrief.acs_task_details.map(a => a.acs_task_id)

    const { data, error } = await supabase
      .from("debriefs")
      .insert({
        ...formData,
        maneuvers_covered: maneuversCovered,
        acs_tasks_covered: acsTasksCoveredIds,
        ai_formatted: true,
        ai_model_used: aiDebrief.formatting_metadata.model,
        ai_confidence_score: aiDebrief.formatting_metadata.confidence_score,
        ai_processing_time_ms: aiDebrief.formatting_metadata.processing_time_ms,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating AI-formatted debrief:", error)
      return { success: false, error: error.message }
    }

    // Update mission with debrief reference
    await supabase
      .from("missions")
      .update({ debrief_id: data.id })
      .eq("id", missionId)

    // Update student maneuver progress
    if (aiDebrief.maneuver_details.length > 0) {
      await updateStudentManeuverProgress(
        studentId,
        missionId,
        aiDebrief.maneuver_details
      )
    }

    revalidatePath(`/instructor/missions/${missionId}`)
    revalidatePath(`/student/missions/${missionId}`)

    return { success: true, data: data as Debrief }
  } catch (error) {
    console.error("Error in createDebriefFromTranscript:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// ============================================================================
// MANEUVER PROGRESS INTEGRATION
// ============================================================================

/**
 * Update student maneuver progress based on debrief
 */
async function updateStudentManeuverProgress(
  studentId: string,
  missionId: string,
  maneuverDetails: ManeuverDetail[]
): Promise<void> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    for (const maneuver of maneuverDetails) {
      // Get or create progress record
      const { data: existing } = await supabase
        .from("student_maneuver_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("maneuver_id", maneuver.maneuver_id)
        .single()

      const score = maneuver.score
      const today = new Date().toISOString().split('T')[0]

      if (existing) {
        // Update existing record
        const newScoresHistory = [...(existing.scores_history || []), score]
        const newTotalAttempts = existing.total_attempts + 1
        const newAverageScore = newScoresHistory.reduce((a, b) => a + b, 0) / newScoresHistory.length

        // Calculate trend
        const recentScores = newScoresHistory.slice(-3)
        let trend = "insufficient_data"
        if (recentScores.length >= 3) {
          const avgFirst = recentScores[0]
          const avgLast = recentScores[recentScores.length - 1]
          if (avgLast > avgFirst) trend = "improving"
          else if (avgLast < avgFirst) trend = "declining"
          else trend = "stable"
        }

        // Check consistently proficient (3+ in last 3 attempts)
        const consistentlyProficient = recentScores.length >= 3 && 
          recentScores.every(s => s >= 3)

        const updates = {
          total_attempts: newTotalAttempts,
          last_attempt_date: today,
          latest_mission_id: missionId,
          latest_score: score,
          latest_performance_level: maneuver.performance_level,
          acs_standard_met: maneuver.acs_standard_met,
          average_score: Math.round(newAverageScore * 100) / 100,
          trend,
          scores_history: newScoresHistory,
          latest_instructor_notes: maneuver.notes,
          common_strengths: maneuver.strengths,
          common_areas_for_improvement: maneuver.areas_for_improvement,
          consistently_proficient: consistentlyProficient,
          first_proficient_date: score >= 3 && !existing.first_proficient_date 
            ? today 
            : existing.first_proficient_date,
        }

        await supabase
          .from("student_maneuver_progress")
          .update(updates)
          .eq("id", existing.id)
      } else {
        // Create new record
        const newRecord = {
          student_id: studentId,
          maneuver_id: maneuver.maneuver_id,
          total_attempts: 1,
          first_attempt_date: today,
          last_attempt_date: today,
          latest_mission_id: missionId,
          latest_score: score,
          latest_performance_level: maneuver.performance_level,
          acs_standard_met: maneuver.acs_standard_met,
          average_score: score,
          trend: "insufficient_data",
          scores_history: [score],
          latest_instructor_notes: maneuver.notes,
          common_strengths: maneuver.strengths,
          common_areas_for_improvement: maneuver.areas_for_improvement,
          first_proficient_date: score >= 3 ? today : null,
          consistently_proficient: false,
          checkride_ready: false,
        }

        await supabase
          .from("student_maneuver_progress")
          .insert(newRecord)
      }
    }
  } catch (error) {
    console.error("Error updating student maneuver progress:", error)
  }
}

